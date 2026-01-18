import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";

/**
 * WebRTC Signaling Server
 * Manages peer-to-peer connections by facilitating SDP offer/answer exchange
 * and ICE candidate distribution
 */

interface SignalingMessage {
  type: "offer" | "answer" | "ice-candidate";
  from: number;
  to: number;
  data: any;
  meetingId: number;
}

interface MeetingRoom {
  meetingId: number;
  participants: Map<number, Socket>;
}

class SignalingServer {
  private io: SocketIOServer;
  private rooms: Map<number, MeetingRoom> = new Map();
  private userSockets: Map<number, Socket> = new Map();
  private pendingOffers: Map<string, SignalingMessage> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.VITE_FRONTEND_URL || "*",
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
    });

    this.setupEventHandlers();
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupEventHandlers(): void {
    this.io.on("connection", (socket: Socket) => {
      console.log(`[Signaling] User connected: ${socket.id}`);

      // Join meeting room
      socket.on("join-meeting", (data: { meetingId: number; participantId: number }) => {
        this.handleJoinMeeting(socket, data);
      });

      // Handle SDP offer
      socket.on("webrtc-offer", (message: SignalingMessage) => {
        this.handleWebRTCOffer(socket, message);
      });

      // Handle SDP answer
      socket.on("webrtc-answer", (message: SignalingMessage) => {
        this.handleWebRTCAnswer(socket, message);
      });

      // Handle ICE candidate
      socket.on("ice-candidate", (message: SignalingMessage) => {
        this.handleICECandidate(socket, message);
      });

      // Request peer list
      socket.on("get-peers", (data: { meetingId: number }) => {
        this.handleGetPeers(socket, data);
      });

      // Leave meeting
      socket.on("leave-meeting", (data: { meetingId: number }) => {
        this.handleLeaveMeeting(socket, data);
      });

      // Disconnect
      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });

      // Error handling
      socket.on("error", (error: Error) => {
        console.error(`[Signaling] Socket error: ${error.message}`);
      });
    });
  }

  /**
   * Handle user joining a meeting room
   */
  private handleJoinMeeting(
    socket: Socket,
    data: { meetingId: number; participantId: number }
  ): void {
    const { meetingId, participantId } = data;
    const roomName = `meeting-${meetingId}`;

    // Join Socket.io room
    socket.join(roomName);

    // Store socket reference
    this.userSockets.set(participantId, socket);

    // Get or create meeting room
    if (!this.rooms.has(meetingId)) {
      this.rooms.set(meetingId, {
        meetingId,
        participants: new Map(),
      });
    }

    const room = this.rooms.get(meetingId)!;
    room.participants.set(participantId, socket);

    console.log(
      `[Signaling] Participant ${participantId} joined meeting ${meetingId}. Total: ${room.participants.size}`
    );

    // Notify others in the room
    socket.to(roomName).emit("participant-joined", {
      participantId,
      totalParticipants: room.participants.size,
    });

    // Send current participants to the new user
    const participants = Array.from(room.participants.keys()).filter((id) => id !== participantId);
    socket.emit("current-participants", { participants });
  }

  /**
   * Handle WebRTC SDP offer
   */
  private handleWebRTCOffer(socket: Socket, message: SignalingMessage): void {
    const { from, to, meetingId, data: offer } = message;
    const roomName = `meeting-${meetingId}`;

    console.log(`[Signaling] Offer from ${from} to ${to} in meeting ${meetingId}`);

    // Forward offer to target peer
    this.io.to(roomName).emit("webrtc-offer", {
      from,
      to,
      data: offer,
    });

    // Store offer for potential resend
    this.pendingOffers.set(`${from}-${to}`, message);
  }

  /**
   * Handle WebRTC SDP answer
   */
  private handleWebRTCAnswer(socket: Socket, message: SignalingMessage): void {
    const { from, to, meetingId, data: answer } = message;
    const roomName = `meeting-${meetingId}`;

    console.log(`[Signaling] Answer from ${from} to ${to} in meeting ${meetingId}`);

    // Forward answer to target peer
    this.io.to(roomName).emit("webrtc-answer", {
      from,
      to,
      data: answer,
    });

    // Clear pending offer
    this.pendingOffers.delete(`${to}-${from}`);
  }

  /**
   * Handle ICE candidate
   */
  private handleICECandidate(socket: Socket, message: SignalingMessage): void {
    const { from, to, meetingId, data: candidate } = message;
    const roomName = `meeting-${meetingId}`;

    console.log(`[Signaling] ICE candidate from ${from} to ${to}`);

    // Forward ICE candidate to target peer
    this.io.to(roomName).emit("ice-candidate", {
      from,
      to,
      data: candidate,
    });
  }

  /**
   * Get list of peers in a meeting
   */
  private handleGetPeers(socket: Socket, data: { meetingId: number }): void {
    const { meetingId } = data;
    const room = this.rooms.get(meetingId);

    if (!room) {
      socket.emit("peers-list", { peers: [] });
      return;
    }

    const peers = Array.from(room.participants.keys());
    socket.emit("peers-list", { peers });
  }

  /**
   * Handle user leaving a meeting
   */
  private handleLeaveMeeting(socket: Socket, data: { meetingId: number }): void {
    const { meetingId } = data;
    const roomName = `meeting-${meetingId}`;

    // Find participant ID
    let participantId: number | null = null;
    this.userSockets.forEach((s, id) => {
      if (s === socket) {
        participantId = id;
      }
    });

    if (participantId !== null) {
      const room = this.rooms.get(meetingId);
      if (room) {
        room.participants.delete(participantId);

        console.log(
          `[Signaling] Participant ${participantId} left meeting ${meetingId}. Remaining: ${room.participants.size}`
        );

        // Notify others
        socket.to(roomName).emit("participant-left", {
          participantId,
          totalParticipants: room.participants.size,
        });

        // Clean up empty rooms
        if (room.participants.size === 0) {
          this.rooms.delete(meetingId);
        }
      }

      this.userSockets.delete(participantId);
    }

    socket.leave(roomName);
  }

  /**
   * Handle socket disconnect
   */
  private handleDisconnect(socket: Socket): void {
    console.log(`[Signaling] User disconnected: ${socket.id}`);

    // Find and remove participant from all rooms
    let participantId: number | null = null;
    this.userSockets.forEach((s, id) => {
      if (s === socket) {
        participantId = id;
      }
    });

    if (participantId !== null) {
      // Notify all rooms about disconnect
      const roomsToDelete: number[] = [];
      const pId = participantId;
      this.rooms.forEach((room, meetingId) => {
        if (room.participants.has(pId)) {
          room.participants.delete(pId);
          const roomName = `meeting-${meetingId}`;

          this.io.to(roomName).emit("participant-left", {
            participantId,
            totalParticipants: room.participants.size,
          });

          if (room.participants.size === 0) {
            roomsToDelete.push(meetingId);
          }
        }
      });

      roomsToDelete.forEach((meetingId) => this.rooms.delete(meetingId));
      this.userSockets.delete(participantId);
    }
  }

  /**
   * Get statistics about active connections
   */
  getStats(): {
    activeRooms: number;
    totalParticipants: number;
    roomDetails: Array<{ meetingId: number; participantCount: number }>;
  } {
    let totalParticipants = 0;
    const roomDetails: Array<{ meetingId: number; participantCount: number }> = [];

    this.rooms.forEach((room, meetingId) => {
      const count = room.participants.size;
      totalParticipants += count;
      roomDetails.push({ meetingId, participantCount: count });
    });

    return {
      activeRooms: this.rooms.size,
      totalParticipants,
      roomDetails,
    };
  }

  /**
   * Broadcast a message to all participants in a meeting
   */
  broadcastToMeeting(meetingId: number, event: string, data: any): void {
    const roomName = `meeting-${meetingId}`;
    this.io.to(roomName).emit(event, data);
  }

  /**
   * Send a message to a specific participant
   */
  sendToParticipant(participantId: number, event: string, data: any): void {
    const socket = this.userSockets.get(participantId);
    if (socket) {
      socket.emit(event, data);
    }
  }
}

export { SignalingServer, SignalingMessage, MeetingRoom };
