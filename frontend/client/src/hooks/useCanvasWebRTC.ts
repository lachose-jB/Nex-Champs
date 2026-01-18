import { useEffect, useRef, useState } from "react";
import { CanvasWebRTCSync, CanvasOperation } from "@/lib/webrtc-canvas";
import { trpc } from "@/lib/trpc";

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

  // Fetch reconstructed Canvas state on mount
  const { data: reconstructedState, isLoading: isReconstructing } =
    trpc.canvas.reconstructState.useQuery({ meetingId });

  // Mutation to save operations to database
  const saveOperationMutation = trpc.canvas.saveOperation.useMutation();

  // Initialize WebRTC sync and load persisted operations
  useEffect(() => {
    const initializeSync = async () => {
      setIsSyncing(true);
      try {
        // Initialize WebRTC sync
        const sync = new CanvasWebRTCSync(participantId, meetingId);

        // Load persisted operations from database
        if (reconstructedState?.operations) {
          const convertedOps = reconstructedState.operations.map((op: any) => ({
            id: op.operationId,
            timestamp: op.timestamp,
            participantId: op.participantId,
            type: op.operationType,
            data: op.operationData || {},
            version: op.version,
          }));
          setOperationHistory(convertedOps);
          console.log(
            `[Canvas] Loaded ${reconstructedState.totalOperations} persisted operations`
          );
        }

        // Register callbacks
        sync.onOperation((op) => {
          setOperationHistory((prev) => [...prev, op]);
          onOperation?.(op);

          // Save operation to database for persistence
          saveOperationMutation.mutate({
            meetingId,
            participantId,
            operationType: op.type,
            operationData: op.data,
            version: op.version,
            operationId: op.id,
            timestamp: op.timestamp,
          });
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
  }, [meetingId, participantId, reconstructedState, onOperation, onError, saveOperationMutation]);

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
    isSyncing: isSyncing || isReconstructing,
    addOperation,
    requestSync,
    clear,
  };
};
