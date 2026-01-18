import React, { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedError } from "@/hooks/useTranslatedError";
import { useTranslatedNotifications } from "@/hooks/useTranslatedNotifications";
import { useCanvasWebRTC } from "@/hooks/useCanvasWebRTC";
import { useRoute, useLocation } from "wouter";
import { useMeetingById, useTokenEvents, useLeaveMeeting, useMeetingParticipants } from "@/lib/hooks";
import { Canvas } from "@/components/Canvas";
import { TokenDisplay } from "@/components/TokenDisplay";
import { VideoRecorder } from "@/components/VideoRecorder";
import { InviteParticipantModal } from "@/components/InviteParticipantModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mic, MicOff, Video, VideoOff, ArrowLeft, Wifi, WifiOff, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface MeetingState {
  tokenHolderId: number | null;
  currentPhase: string;
  phaseStartTime: number;
  tokenStartTime: number;
}

export default function MeetingRoom() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { translateError } = useTranslatedError();
  const { notify } = useTranslatedNotifications();
  const [, params] = useRoute("/meeting/:meetingId");
  const [, setLocation] = useLocation();
  const meetingId = params?.meetingId ? parseInt(params.meetingId) : 0;

  const [meetingState, setMeetingState] = useState<MeetingState>({
    tokenHolderId: null,
    currentPhase: "ideation",
    phaseStartTime: Date.now(),
    tokenStartTime: Date.now(),
  });

  const [isRecording, setIsRecording] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Fetch meeting data
  const { data: meeting, isLoading: meetingLoading } = useMeetingById(meetingId);

  // Fetch token events
  const { data: tokenEvents = [] } = useTokenEvents(meetingId);

  // Fetch participants
  const { data: participants = [] } = useMeetingParticipants(meetingId);

  // Leave meeting mutation
  const leaveMeetingMutation = useLeaveMeeting();

  // WebRTC Canvas Sync
  const {
    isConnected: isCanvasConnected,
    connectedPeers,
    operationHistory,
    addOperation,
    requestSync,
    clear,
  } = useCanvasWebRTC({
    participantId: user?.id || 0,
    meetingId,
    onOperation: (op) => {
      // Operation received from peer
      console.log("Canvas operation received:", op);
    },
    onError: (error) => {
      console.error("Canvas WebRTC error:", error);
      toast.error(t("errors.recordingError"));
    },
  });

  // Pass token mutation (placeholder - would need backend implementation)
  // const passTokenMutation = (participantId: number) => {
  //   // TODO: Implement via api.tokens.passToken()
  // };

  // Release token mutation (placeholder - would need backend implementation)
  // const releaseTokenMutation = () => {
  //   // TODO: Implement via api.tokens.releaseToken()
  // };

  // Change phase mutation (placeholder - would need backend implementation)
  // const changePhaseMutation = trpc.meetings.updatePhase.useMutation({
  //   onSuccess: (data: any) => {
  //     notify({
  //       type: "phaseStarted",
  //       data: { phase: data.currentPhase },
  //     });
  //   },
  //   onError: (error: any) => {
  //     toast.error(translateError(error));
  //   },
  // });

  // Listen for token events
  useEffect(() => {
    if (!tokenEvents || tokenEvents.length === 0) return;

    // Get the latest token event
    const latestEvent = tokenEvents[tokenEvents.length - 1];

    // Determine current token holder based on latest event
    let newHolderId: number | null = null;
    if (latestEvent.event_type === 'claim') {
      newHolderId = latestEvent.participant_id;
    }

    // Notify when token holder changes
    if (newHolderId !== meetingState.tokenHolderId) {
      if (newHolderId === user?.id) {
        notify({ type: "tokenReceived" });
      } else if (meetingState.tokenHolderId === user?.id) {
        notify({ type: "tokenExpired" });
      }

      setMeetingState((prev) => ({
        ...prev,
        tokenHolderId: newHolderId,
        tokenStartTime: Date.now(),
      }));
    }
  }, [tokenEvents, meetingState.tokenHolderId, user?.id, notify]);

  // Notify when participants join/leave (placeholder for future API support)
  // useEffect(() => {
  //   // TODO: Implement when API provides participant list
  // }, [user?.id, notify]);

  const phases = ["ideation", "clarification", "decision", "feedback"];
  const currentPhaseIndex = phases.indexOf(meetingState.currentPhase);

  const handleNextPhase = () => {
    if (currentPhaseIndex < phases.length - 1) {
      const nextPhase = phases[currentPhaseIndex + 1];
      notify({
        type: "phaseStarted",
        data: { phase: nextPhase },
      });
      setMeetingState((prev) => ({
        ...prev,
        currentPhase: nextPhase,
        phaseStartTime: Date.now(),
      }));
    }
  };

  const handlePreviousPhase = () => {
    if (currentPhaseIndex > 0) {
      const prevPhase = phases[currentPhaseIndex - 1];
      notify({
        type: "phaseStarted",
        data: { phase: prevPhase },
      });
      setMeetingState((prev) => ({
        ...prev,
        currentPhase: prevPhase,
        phaseStartTime: Date.now(),
      }));
    }
  };

  const handlePassToken = (participantId: number) => {
    // TODO: Implement via api.tokens.passToken()
    console.log("Pass token to:", participantId);
  };

  const handleReleaseToken = () => {
    // TODO: Implement via api.tokens.releaseToken()
    console.log("Release token");
  };

  const handleLeaveMeeting = async () => {
    try {
      await leaveMeetingMutation.mutateAsync(meetingId);
      setLocation("/");
    } catch (error) {
      console.error('Error leaving meeting:', error);
      toast.error(t("errors.leaveMeetingError") || "Failed to leave meeting");
    }
  };

  const handleAnnotation = (annotation: any) => {
    // Add annotation to Canvas
    addOperation({
      id: `op-${Date.now()}`,
      timestamp: Date.now(),
      participantId: user?.id || 0,
      type: annotation.tool,
      data: {
        color: annotation.color,
      },
      version: 1,
    });

    notify({ type: "annotationAdded" });
  };

  if (meetingLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">{t("meeting.notFound")}</h1>
        <p className="text-gray-600">{t("meeting.notFoundDesc")}</p>
        <Button onClick={() => setLocation("/")}>{t("common.back")}</Button>
      </div>
    );
  }

  const isTokenHolder = meetingState.tokenHolderId === (user?.id || null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("common.back")}
            </Button>
            <div>
              <h1 className="text-xl font-bold">{meeting?.name}</h1>
              <p className="text-sm text-gray-600">{meeting.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Canvas Sync Status */}
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
              {isCanvasConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-600">{connectedPeers.length}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-400">0</span>
                </>
              )}
            </div>

            {/* Media Controls */}
            <Button
              variant={isMicOn ? "default" : "outline"}
              size="sm"
              onClick={() => setIsMicOn(!isMicOn)}
              className="gap-2"
            >
              {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </Button>
            <Button
              variant={isVideoOn ? "default" : "outline"}
              size="sm"
              onClick={() => setIsVideoOn(!isVideoOn)}
              className="gap-2"
            >
              {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </Button>
            <Button
              variant={isRecording ? "destructive" : "default"}
              size="sm"
              onClick={() => setIsRecording(!isRecording)}
            >
              {isRecording ? t("meeting.stopRecording") : t("meeting.startRecording")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeaveMeeting}
              disabled={leaveMeetingMutation.isPending}
              className="gap-2 text-red-600 hover:text-red-700"
            >
              {leaveMeetingMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                </>
              ) : (
                "Quitter"
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Canvas */}
            <Card>
              <CardHeader>
                <CardTitle>{t("meeting.collaborativeCanvas")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Canvas
                  meetingId={meetingId}
                  participantId={user?.id || 0}
                  isTokenHolder={isTokenHolder}
                  onAnnotation={handleAnnotation}
                />
              </CardContent>
            </Card>

            {/* Video Recorder */}
            {isRecording && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("meeting.videoRecording")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <VideoRecorder
                    meetingId={meetingId}
                    isTokenHolder={isTokenHolder}
                    onRecordingComplete={setRecordedBlob}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Token Display */}
            <TokenDisplay
              tokenHolderId={meetingState.tokenHolderId}
              tokenHolderName="TBD"
              tokenStartTime={meetingState.tokenStartTime}
              currentPhase={meetingState.currentPhase}
              participants={[]}
            />

            {/* Phase Indicator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t("meeting.currentPhase")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{t(`phases.${meetingState.currentPhase}`)}</Badge>
                  <span className="text-xs text-gray-600">
                    {Math.round((Date.now() - meetingState.phaseStartTime) / 1000)}s
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPhase}
                    disabled={currentPhaseIndex === 0 || !isTokenHolder}
                    className="flex-1"
                  >
                    {t("common.previous")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPhase}
                    disabled={currentPhaseIndex === phases.length - 1 || !isTokenHolder}
                    className="flex-1"
                  >
                    {t("common.next")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">{t("meeting.participants")}</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {t("meeting.invite")}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {participants && participants.length > 0 ? (
                    participants.map((participant: any) => (
                      <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">{participant.user_name || participant.name}</p>
                          <p className="text-xs text-gray-500">{participant.role}</p>
                        </div>
                        {participant.user_id === meetingState.tokenHolderId && (
                          <Badge className="bg-blue-100 text-blue-800">{t("meeting.hasToken")}</Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">{t("meeting.noParticipants")}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sync Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t("meeting.syncStatus")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t("meeting.connectedPeers")}:</span>
                  <span className="font-medium">{connectedPeers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("meeting.annotations")}:</span>
                  <span className="font-medium">{operationHistory.length}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast.success(t("meeting.syncRequested"));
                  }}
                  className="w-full"
                >
                  {t("meeting.requestSync")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Invite Participant Modal */}
      {showInviteModal && (
        <InviteParticipantModal
          meetingId={meetingId}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            // Participants list will be automatically refetched by React Query
          }}
        />
      )}
    </div>
  );
}
