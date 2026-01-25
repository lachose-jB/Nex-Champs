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
import { Header } from "@/components/Header";
import { ParticipantsList } from "@/components/ParticipantsList";
import { InviteParticipants } from "@/components/InviteParticipants";
import { PermissionManager } from "@/components/PermissionManager";
import SpeechToken from "@/components/SpeechToken";
import PhaseManager, { type MeetingPhase } from "@/components/PhaseManager";
import RoleAndPermissions, { type UserRole } from "@/components/RoleAndPermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mic, MicOff, Video, VideoOff, ArrowLeft, Wifi, WifiOff, UserPlus, LogOut, Users } from "lucide-react";
import { toast } from "sonner";

interface MeetingState {
  tokenHolderId: number | null;
  currentPhase: MeetingPhase;
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
  const [userRole, setUserRole] = useState<UserRole>("participant");

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

  const phases: MeetingPhase[] = ["ideation", "clarification", "decision", "feedback"];
  const currentPhaseIndex = phases.indexOf(meetingState.currentPhase);

  const handleNextPhase = () => {
    if (currentPhaseIndex < phases.length - 1) {
      const nextPhase = phases[currentPhaseIndex + 1] as MeetingPhase;
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
      const prevPhase = phases[currentPhaseIndex - 1] as MeetingPhase;
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

  const handleLeaveMeeting = async () => {
    try {
      await leaveMeetingMutation.mutateAsync(meetingId);
      // Navigate to meetings dashboard
      setLocation("/meetings");
    } catch (error) {
      console.error('Error leaving meeting:', error);
      toast.error(t("errors.leaveMeetingError") || "Failed to leave meeting");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with user menu and participant count */}
      <Header 
        title={meeting?.name || t("meeting.title")}
        participantCount={participants?.length || 0}
      />
      {/* Main Layout: Canvas + Sidebar */}
      <main className="flex-1 flex overflow-hidden bg-gray-100">
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex-1 overflow-auto p-4">
            <Card className="h-full bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {t("meeting.collaborativeCanvas")}
                    <Badge variant="outline" className="gap-2">
                      {isCanvasConnected ? (
                        <>
                          <Wifi className="w-4 h-4 text-green-600" />
                          {connectedPeers.length}
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-4 h-4 text-gray-400" />0
                        </>
                      )}
                    </Badge>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="h-[calc(100%-60px)]">
                <Canvas
                  meetingId={meetingId}
                  participantId={user?.id || 0}
                  isTokenHolder={isTokenHolder}
                  onAnnotation={handleAnnotation}
                />
              </CardContent>
            </Card>
          </div>

          {/* Media Controls Bar */}
          <div className="border-t bg-white px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant={isMicOn ? "default" : "outline"}
                size="sm"
                onClick={() => setIsMicOn(!isMicOn)}
                className="gap-2"
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                {t("common.microphone")}
              </Button>
              <Button
                variant={isVideoOn ? "default" : "outline"}
                size="sm"
                onClick={() => setIsVideoOn(!isVideoOn)}
                className="gap-2"
              >
                {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                {t("common.camera")}
              </Button>
              <Button
                variant={isRecording ? "destructive" : "default"}
                size="sm"
                onClick={() => setIsRecording(!isRecording)}
              >
                {isRecording ? t("meeting.stopRecording") : t("meeting.startRecording")}
              </Button>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLeaveMeeting}
              disabled={leaveMeetingMutation.isPending}
              className="gap-2"
            >
              {leaveMeetingMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  {t("meeting.leaveMeeting")}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 overflow-y-auto bg-gray-50 border-l space-y-4 p-4">
          {/* Phase Manager */}
          <PhaseManager
            currentPhase={meetingState.currentPhase}
            isFacilitator={
              participants?.find((p: any) => p.user_id === user?.id)?.role ===
              "facilitator"
            }
            onPhaseChange={(newPhase: MeetingPhase) => {
              setMeetingState({
                ...meetingState,
                currentPhase: newPhase,
                phaseStartTime: Date.now(),
              });
              toast.success(
                t("meeting.phaseChanged") ||
                  `Phase changed to ${newPhase}`
              );
            }}
            meetingId={meetingId}
          />

          {/* Speech Token Manager */}
          <SpeechToken
            meetingId={meetingId}
            currentTokenHolderId={meetingState.tokenHolderId ?? undefined}
            userId={user?.id}
            userName={user?.username}
            onRequestToken={() => {
              toast.success(t("token.requestSent") || "Token request sent");
            }}
            queuedParticipants={[]}
          />

          {/* Role and Permissions */}
          <RoleAndPermissions
            userRole={userRole}
            userId={user?.id}
            userName={user?.username}
            hasToken={meetingState.tokenHolderId === user?.id}
            isTokenWaiting={false}
          />

          {/* Divider */}
          <div className="border-t my-2"></div>

          {/* Token Display (Legacy) */}
          <TokenDisplay
            tokenHolderId={meetingState.tokenHolderId}
            tokenHolderName={
              participants?.find((p: any) => p.id === meetingState.tokenHolderId)
                ?.name || t("meeting.noHolder")
            }
            tokenStartTime={meetingState.tokenStartTime}
            currentPhase={meetingState.currentPhase}
            participants={participants?.map((p: any) => ({
              id: p.user_id || p.id,
              displayName: p.user_name || p.name,
              role: p.role || "participant",
            })) || []}
          />

          {/* Permission Manager */}
          <PermissionManager
            currentUserRole={
              participants?.find((p: any) => p.user_id === user?.id)?.role || "participant"
            }
            pendingRequests={[]}
            onRequestPermission={(type) => {
              console.log("Request permission:", type);
              toast.info(t("meeting.requestSent"));
            }}
          />

          {/* Invite Participants */}
          <InviteParticipants
            meetingId={meetingId}
            invitations={[]}
            onSendInvitation={(email, role) => {
              console.log("Send invitation to:", email, "as", role);
              toast.success(t("meeting.invitationSent"));
            }}
          />

          {/* Participants List */}
          <ParticipantsList
            participants={participants?.map((p: any) => ({
              id: p.user_id || p.id,
              name: p.user_name || p.name,
              email: p.email || "",
              role: p.role || "participant",
              hasCamera: false,
              hasMicrophone: false,
              hasSpeakingToken: p.user_id === meetingState.tokenHolderId,
            })) || []}
            currentUserId={user?.id}
            isFacilitator={
              participants?.find((p: any) => p.user_id === user?.id)?.role ===
              "facilitator"
            }
            onRoleChange={(participantId, newRole) => {
              console.log("Change role:", participantId, newRole);
              toast.success(t("meeting.invitationSent"));
            }}
          />
        </div>
      </main>

      {/* Invite Participant Modal (legacy) */}
      {showInviteModal && (
        <InviteParticipantModal
          meetingId={meetingId}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
          }}
        />
      )}
    </div>
  );
}
