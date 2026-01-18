import { useEffect, useRef, useState } from "react";
import { CanvasWebRTCSync, CanvasOperation } from "@/lib/webrtc-canvas";
// Canvas operations are handled directly via WebRTC P2P
// To persist operations, integrate with the backend API

interface UseCanvasWebRTCOptions {
  participantId: number;
  meetingId: number;
  onOperation?: (operation: CanvasOperation) => void;
  onError?: (error: Error) => void;
}

export const useCanvasWebRTC = (options: UseCanvasWebRTCOptions) => {
  const { participantId, meetingId, onOperation, onError } = options;
  const syncRef = useRef<CanvasWebRTCSync | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedPeers, setConnectedPeers] = useState<Set<number>>(new Set());
  const [operationHistory, setOperationHistory] = useState<CanvasOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Canvas state management
  // To persist operations to backend, use the API client:
  // import { api } from '@/lib/api';
  // await api.annotations.create(meetingId, { ... });

  // Initialize WebRTC sync and load persisted operations
  useEffect(() => {
    const initializeSync = async () => {
      setIsSyncing(true);
      try {
        // Initialize WebRTC sync
        const sync = new CanvasWebRTCSync(participantId, meetingId);

        // Load persisted operations from backend if needed
        // For now, start with an empty operation history
        // To load from backend: const annotations = await api.annotations.list(meetingId);
        setOperationHistory([]);

        // Register callbacks
        sync.onOperation((op) => {
          setOperationHistory((prev) => [...prev, op]);
          onOperation?.(op);

          // Save operation to backend for persistence if needed
          // Uncomment when you have the annotation API endpoint ready
          // await api.annotations.create(meetingId, {
          //   participant_id: participantId,
          //   annotation_type: op.type,
          //   content: JSON.stringify(op.data),
          //   timestamp_ms: op.timestamp
          // });
        });

        sync.onError((error) => {
          console.error("WebRTC Canvas Error:", error);
          onError?.(error);
        });

        sync.onConnectionChange((peerId, connected) => {
          setConnectedPeers((prev) => {
            const newSet = new Set(prev);
            if (connected) {
              newSet.add(peerId);
            } else {
              newSet.delete(peerId);
            }
            setIsConnected(newSet.size > 0);
            return newSet;
          });
        });

        syncRef.current = sync;
        setIsSyncing(false);
      } catch (error) {
        console.error("Failed to initialize Canvas sync:", error);
        onError?.(error instanceof Error ? error : new Error(String(error)));
        setIsSyncing(false);
      }
    };

    initializeSync();

    return () => {
      syncRef.current?.closeConnections();
    };
  }, [meetingId, participantId, onOperation, onError]);

  const addOperation = (operation: CanvasOperation) => {
    if (syncRef.current) {
      syncRef.current.broadcastOperation(operation);
    }
  };

  const requestSync = (peerId: number) => {
    if (syncRef.current) {
      syncRef.current.requestSync(peerId);
    }
  };

  const clear = () => {
    if (syncRef.current) {
      syncRef.current.broadcastOperation({
        timestamp: Date.now(),
        participantId,
        type: "clear",
        data: {},
      });
    }
  };

  return {
    isConnected,
    connectedPeers: Array.from(connectedPeers),
    operationHistory,
    isSyncing,
    addOperation,
    requestSync,
    clear,
  };
};
