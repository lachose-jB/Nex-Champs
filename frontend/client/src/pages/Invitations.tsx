import React, { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Invitation {
  id: number;
  meetingId: number;
  meetingTitle: string;
  senderName: string;
  role: string;
  status: "pending" | "accepted" | "declined";
  sentAt: string;
}

export default function Invitations() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    fetchInvitations();
  }, [user]);

  const fetchInvitations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/v1/invitations", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch invitations");

      const data = await response.json();
      setInvitations(data.invitations || []);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast.error(t("errors.loadingFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (invitationId: number, meetingId: number) => {
    try {
      const response = await fetch(
        `/api/v1/meetings/${meetingId}/invitations/${invitationId}/accept`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to accept invitation");

      toast.success(t("meeting.invitationAccepted"));
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === invitationId ? { ...inv, status: "accepted" } : inv
        )
      );
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error(t("errors.acceptFailed"));
    }
  };

  const handleDecline = async (invitationId: number, meetingId: number) => {
    try {
      const response = await fetch(
        `/api/v1/meetings/${meetingId}/invitations/${invitationId}/decline`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to decline invitation");

      toast.success(t("meeting.invitationDeclined"));
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === invitationId ? { ...inv, status: "declined" } : inv
        )
      );
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast.error(t("errors.declineFailed"));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return t("invitation.pending");
      case "accepted":
        return t("invitation.accepted");
      case "declined":
        return t("invitation.declined");
      default:
        return status;
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

  const pendingInvitations = invitations.filter((inv) => inv.status === "pending");
  const respondedInvitations = invitations.filter((inv) => inv.status !== "pending");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={t("meeting.invitations")} />

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/meetings")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-bold">{t("meeting.invitations")}</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">{t("common.loading")}</p>
          </div>
        ) : invitations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500 text-center">
                {t("meeting.noInvitationsDescription")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {pendingInvitations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  {t("meeting.pendingRequests")}
                </h3>
                <div className="space-y-2">
                  {pendingInvitations.map((invitation) => (
                    <Card key={invitation.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">
                            {invitation.meetingTitle}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {t("meeting.inviteParticipants")} {invitation.senderName}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">
                              {getRoleLabel(invitation.role)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(invitation.sentAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleAccept(invitation.id, invitation.meetingId)
                            }
                          >
                            {t("common.accept")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDecline(invitation.id, invitation.meetingId)
                            }
                          >
                            {t("common.decline")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {respondedInvitations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  {t("meeting.invitations")}
                </h3>
                <div className="space-y-2">
                  {respondedInvitations.map((invitation) => (
                    <Card key={invitation.id} className="opacity-75">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">
                            {invitation.meetingTitle}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            From {invitation.senderName}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">
                              {getRoleLabel(invitation.role)}
                            </Badge>
                            <Badge
                              className={getStatusColor(invitation.status)}
                            >
                              {getStatusLabel(invitation.status)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
