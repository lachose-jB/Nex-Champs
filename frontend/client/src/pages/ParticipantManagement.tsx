import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, UserMinus, Shield, Mail } from "lucide-react";
import { toast } from "sonner";

interface Participant {
  id: number;
  name: string;
  email: string;
  role: "proposer" | "questioner" | "clarifier" | "decider" | "observer" | "admin";
  joinedAt: number;
  status: "active" | "inactive" | "left";
  speakingTime: number;
  actionsCount: number;
}

export default function ParticipantManagement() {
  const { t } = useLanguage();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null);

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    setLoading(true);
    try {
      // In production: const participants = await trpc.meeting.getParticipants.useQuery(meetingId);
      setParticipants([
        {
          id: 1,
          name: "Alice Johnson",
          email: "alice@example.com",
          role: "proposer",
          joinedAt: Date.now() - 3600000,
          status: "active",
          speakingTime: 1200,
          actionsCount: 15,
        },
        {
          id: 2,
          name: "Bob Smith",
          email: "bob@example.com",
          role: "questioner",
          joinedAt: Date.now() - 3000000,
          status: "active",
          speakingTime: 800,
          actionsCount: 8,
        },
        {
          id: 3,
          name: "Carol White",
          email: "carol@example.com",
          role: "decider",
          joinedAt: Date.now() - 2400000,
          status: "active",
          speakingTime: 600,
          actionsCount: 5,
        },
      ]);
    } catch (error) {
      toast.error(t("admin.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const handleInviteParticipant = async () => {
    if (!inviteEmail) {
      toast.error(t("participants.emailRequired"));
      return;
    }

    try {
      // In production: await trpc.meeting.inviteParticipant.useMutation()
      toast.success(t("participants.inviteSent"));
      setInviteEmail("");
    } catch (error) {
      toast.error(t("participants.inviteFailed"));
    }
  };

  const handleChangeRole = async (participantId: number, newRole: string) => {
    try {
      // In production: await trpc.meeting.changeParticipantRole.useMutation()
      setParticipants(
        participants.map((p) =>
          p.id === participantId ? { ...p, role: newRole as Participant["role"] } : p
        )
      );
      toast.success(t("participants.roleChanged"));
    } catch (error) {
      toast.error(t("participants.roleChangeFailed"));
    }
  };

  const handleRemoveParticipant = async (participantId: number) => {
    try {
      // In production: await trpc.meeting.removeParticipant.useMutation()
      setParticipants(participants.filter((p) => p.id !== participantId));
      toast.success(t("participants.removed"));
    } catch (error) {
      toast.error(t("participants.removeFailed"));
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "proposer":
        return "bg-blue-100 text-blue-800";
      case "questioner":
        return "bg-green-100 text-green-800";
      case "clarifier":
        return "bg-yellow-100 text-yellow-800";
      case "decider":
        return "bg-red-100 text-red-800";
      case "admin":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-yellow-100 text-yellow-800";
      case "left":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            {t("participants.management")}
          </h1>
          <p className="text-gray-600 mt-2">{t("participants.managementDescription")}</p>
        </div>

        {/* Invite Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              {t("participants.inviteNew")}
            </CardTitle>
            <CardDescription>{t("participants.inviteDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                type="email"
                placeholder={t("participants.emailPlaceholder")}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleInviteParticipant} className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {t("participants.send")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Participants List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">{t("participants.current")}</h2>
          {participants.map((participant) => (
            <Card key={participant.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-800">
                          {participant.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{participant.name}</p>
                        <p className="text-sm text-gray-600">{participant.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getRoleColor(participant.role)}>
                        {t(`roles.${participant.role}`)}
                      </Badge>
                      <Badge className={getStatusColor(participant.status)}>
                        {participant.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">{t("participants.speakingTime")}</p>
                        <p className="font-semibold text-gray-900">
                          {Math.floor(participant.speakingTime / 60)}m
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t("participants.actions")}</p>
                        <p className="font-semibold text-gray-900">{participant.actionsCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t("participants.joined")}</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(participant.joinedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedParticipant(participant.id)}
                      className="flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      {t("participants.changeRole")}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveParticipant(participant.id)}
                      className="flex items-center gap-2"
                    >
                      <UserMinus className="w-4 h-4" />
                      {t("participants.remove")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
