import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mic, MicOff, Video, VideoOff, Users } from "lucide-react";
import { toast } from "sonner";

interface Participant {
  id: number;
  name: string;
  email: string;
  role: "facilitator" | "participant" | "observer";
  hasCamera?: boolean;
  hasMicrophone?: boolean;
  hasSpeakingToken?: boolean;
}

interface ParticipantsListProps {
  participants: Participant[];
  currentUserId?: number;
  isFacilitator?: boolean;
  onRoleChange?: (participantId: number, newRole: string) => void;
}

export function ParticipantsList({
  participants,
  currentUserId,
  isFacilitator = false,
  onRoleChange,
}: ParticipantsListProps) {
  const { t } = useLanguage();
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [showRoleDialog, setShowRoleDialog] = useState(false);

  const handleRoleChange = (participant: Participant) => {
    setSelectedParticipant(participant);
    setNewRole(participant.role);
    setShowRoleDialog(true);
  };

  const confirmRoleChange = () => {
    if (selectedParticipant && onRoleChange && newRole !== selectedParticipant.role) {
      onRoleChange(selectedParticipant.id, newRole);
      toast.success(t("meeting.invitationSent"));
      setShowRoleDialog(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "facilitator":
        return "bg-purple-100 text-purple-800";
      case "participant":
        return "bg-blue-100 text-blue-800";
      case "observer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "facilitator":
        return t("roles.facilitator");
      case "participant":
        return t("roles.participant");
      case "observer":
        return t("roles.observer");
      default:
        return role;
    }
  };

  if (participants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t("meeting.participants")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">{t("meeting.noParticipants")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t("meeting.participants")} ({participants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 rounded border border-gray-200 hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {participant.name}
                      {participant.id === currentUserId && (
                        <span className="text-xs text-gray-500 ml-2">
                          ({t("common.you")})
                        </span>
                      )}
                    </span>
                    <Badge className={`text-xs ${getRoleColor(participant.role)}`}>
                      {getRoleLabel(participant.role)}
                    </Badge>
                    {participant.hasSpeakingToken && (
                      <Badge variant="default" className="text-xs bg-green-600">
                        {t("meeting.hasToken")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{participant.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {participant.hasCamera && <Video className="w-4 h-4 text-green-600" />}
                  {!participant.hasCamera && participant.hasCamera !== undefined && (
                    <VideoOff className="w-4 h-4 text-gray-400" />
                  )}
                  {participant.hasMicrophone && (
                    <Mic className="w-4 h-4 text-green-600" />
                  )}
                  {!participant.hasMicrophone && participant.hasMicrophone !== undefined && (
                    <MicOff className="w-4 h-4 text-gray-400" />
                  )}
                  {isFacilitator && participant.id !== currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRoleChange(participant)}
                      className="ml-2"
                    >
                      {t("meeting.changeRole")}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("meeting.changeRoleFor")} {selectedParticipant?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="mt-4 space-y-2">
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facilitator">
                      {t("roles.facilitator")}
                    </SelectItem>
                    <SelectItem value="participant">
                      {t("roles.participant")}
                    </SelectItem>
                    <SelectItem value="observer">
                      {t("roles.observer")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={confirmRoleChange}>
            {t("common.confirm")}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
