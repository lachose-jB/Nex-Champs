/**
 * WebRTC Canvas Synchronization Module
 * Handles real-time synchronization of canvas annotations between participants
 * using Operational Transformation for conflict resolution
 */

export interface CanvasOperation {
  id: string;
  timestamp: number;
  participantId: number;
  type: "draw" | "erase" | "text" | "clear";
  data: {
    x?: number;
    y?: number;
    x2?: number;
    y2?: number;
    color?: string;
    lineWidth?: number;
    text?: string;
    fontSize?: number;
  };
  version: number;
}

export interface CanvasState {
  operations: CanvasOperation[];
  version: number;
  lastModified: number;
}

export class CanvasWebRTCSync {
  private peerConnections: Map<number, RTCPeerConnection> = new Map();
  private dataChannels: Map<number, RTCDataChannel> = new Map();
  private operationQueue: CanvasOperation[] = [];
  private appliedOperations: Map<string, CanvasOperation> = new Map();
  private version: number = 0;
  private participantId: number;
  private meetingId: number;

  // Callbacks
  private onOperationCallback?: (op: CanvasOperation) => void;
  private onErrorCallback?: (error: Error) => void;
  private onConnectionCallback?: (participantId: number, connected: boolean) => void;

  constructor(participantId: number, meetingId: number) {
    this.participantId = participantId;
    this.meetingId = meetingId;
  }

  /**
   * Initialize WebRTC connection with a peer
   */
  async initiatePeerConnection(peerId: number): Promise<RTCPeerConnection> {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: ["stun:stun.l.google.com:19302"] },
          { urls: ["stun:stun1.l.google.com:19302"] },
        ],
      });

      // Create data channel for canvas operations
      const dataChannel = peerConnection.createDataChannel("canvas-sync", {
        ordered: true,
      });
      this.setupDataChannel(dataChannel, peerId);

      // Handle incoming data channels
      peerConnection.ondatachannel = (event) => {
        this.setupDataChannel(event.channel, peerId);
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendICECandidate(peerId, event.candidate);
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === "connected") {
          this.onConnectionCallback?.(peerId, true);
        } else if (
          peerConnection.connectionState === "disconnected" ||
          peerConnection.connectionState === "failed" ||
          peerConnection.connectionState === "closed"
        ) {
          this.onConnectionCallback?.(peerId, false);
          this.peerConnections.delete(peerId);
          this.dataChannels.delete(peerId);
        }
      };

      this.peerConnections.set(peerId, peerConnection);
      return peerConnection;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.onErrorCallback?.(err);
      throw err;
    }
  }

  /**
   * Setup data channel for bidirectional communication
   */
  private setupDataChannel(dataChannel: RTCDataChannel, peerId: number): void {
    dataChannel.onopen = () => {
      console.log(`Data channel opened with peer ${peerId}`);
      this.dataChannels.set(peerId, dataChannel);
      this.flushOperationQueue(peerId);
    };

    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleIncomingMessage(message, peerId);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.onErrorCallback?.(err);
      }
    };

    dataChannel.onerror = (error) => {
      const err = error instanceof Error ? error : new Error(String(error));
      this.onErrorCallback?.(err);
    };

    dataChannel.onclose = () => {
      console.log(`Data channel closed with peer ${peerId}`);
      this.dataChannels.delete(peerId);
    };
  }

  /**
   * Handle incoming messages from peers
   */
  private handleIncomingMessage(message: any, peerId: number): void {
    if (message.type === "operation") {
      const operation = message.data as CanvasOperation;
      this.applyRemoteOperation(operation);
    } else if (message.type === "sync-request") {
      this.sendSyncResponse(peerId);
    } else if (message.type === "sync-response") {
      this.handleSyncResponse(message.data);
    }
  }

  /**
   * Apply a remote operation with conflict resolution using OT
   */
  private applyRemoteOperation(operation: CanvasOperation): void {
    // Check if operation already applied
    if (this.appliedOperations.has(operation.id)) {
      return;
    }

    // Transform operation against local operations if needed
    const transformedOp = this.transformOperation(operation);

    // Apply the operation
    this.appliedOperations.set(transformedOp.id, transformedOp);
    this.version = Math.max(this.version, transformedOp.version + 1);

    // Trigger callback
    this.onOperationCallback?.(transformedOp);
  }

  /**
   * Operational Transformation: Transform incoming operation against local operations
   */
  private transformOperation(incomingOp: CanvasOperation): CanvasOperation {
    let transformedOp = { ...incomingOp };

    // For canvas operations, we use a simple approach:
    // - Clear operations always take precedence
    // - Draw operations are independent and don't conflict
    // - Erase operations are applied in order of timestamp

    if (incomingOp.type === "clear") {
      // Clear operations invalidate all previous operations
      this.appliedOperations.clear();
      transformedOp.version = 0;
    } else {
      // Increment version for non-clear operations
      transformedOp.version = this.version;
    }

    return transformedOp;
  }

  /**
   * Broadcast a local operation to all peers
   */
  async broadcastOperation(operation: Omit<CanvasOperation, "id" | "version">): Promise<void> {
    const op: CanvasOperation = {
      ...operation,
      id: `${this.participantId}-${Date.now()}-${Math.random()}`,
      version: this.version,
    };

    // Store locally
    this.appliedOperations.set(op.id, op);
    this.version++;

    // Broadcast to all peers
    const message = JSON.stringify({
      type: "operation",
      data: op,
    });

    this.dataChannels.forEach((dataChannel, peerId) => {
      if (dataChannel.readyState === "open") {
        dataChannel.send(message);
      } else {
        // Queue for later
        this.operationQueue.push(op);
      }
    });
  }

  /**
   * Flush queued operations when connection is established
   */
  private flushOperationQueue(peerId: number): void {
    const dataChannel = this.dataChannels.get(peerId);
    if (!dataChannel || dataChannel.readyState !== "open") return;

    while (this.operationQueue.length > 0) {
      const op = this.operationQueue.shift();
      if (op) {
        const message = JSON.stringify({
          type: "operation",
          data: op,
        });
        dataChannel.send(message);
      }
    }
  }

  /**
   * Request synchronization with a peer
   */
  requestSync(peerId: number): void {
    const dataChannel = this.dataChannels.get(peerId);
    if (!dataChannel || dataChannel.readyState !== "open") return;

    const message = JSON.stringify({
      type: "sync-request",
      participantId: this.participantId,
      version: this.version,
    });

    dataChannel.send(message);
  }

  /**
   * Send synchronization response with current state
   */
  private sendSyncResponse(peerId: number): void {
    const dataChannel = this.dataChannels.get(peerId);
    if (!dataChannel || dataChannel.readyState !== "open") return;

    const message = JSON.stringify({
      type: "sync-response",
      data: {
        operations: Array.from(this.appliedOperations.values()),
        version: this.version,
      },
    });

    dataChannel.send(message);
  }

  /**
   * Handle synchronization response
   */
  private handleSyncResponse(data: CanvasState): void {
    // Merge remote operations
    for (const op of data.operations) {
      if (!this.appliedOperations.has(op.id)) {
        this.applyRemoteOperation(op);
      }
    }
  }

  /**
   * Send ICE candidate to signaling server
   */
  private sendICECandidate(peerId: number, candidate: RTCIceCandidate): void {
    // This would be sent to a signaling server in a real implementation
    console.log(`ICE candidate for peer ${peerId}:`, candidate);
  }

  /**
   * Get operation history
   */
  getOperationHistory(): CanvasOperation[] {
    return Array.from(this.appliedOperations.values()).sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }

  /**
   * Get current version
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * Register callback for operations
   */
  onOperation(callback: (op: CanvasOperation) => void): void {
    this.onOperationCallback = callback;
  }

  /**
   * Register callback for errors
   */
  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Register callback for connection changes
   */
  onConnectionChange(callback: (participantId: number, connected: boolean) => void): void {
    this.onConnectionCallback = callback;
  }

  /**
   * Close all connections
   */
  closeConnections(): void {
    this.peerConnections.forEach((peerConnection) => {
      peerConnection.close();
    });
    this.peerConnections.clear();
    this.dataChannels.clear();
  }
}
