import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Invitation {
  id: number;
  email: string;
  role: string;
  status: "pending" | "accepted" | "declined";
  sentAt: string;
}

interface InviteParticipantsProps {
  meetingId: number;
  invitations?: Invitation[];
  onSendInvitation?: (email: string, role: string) => void;
}

export function InviteParticipants({
  meetingId,
  invitations = [],
  onSendInvitation,
}: InviteParticipantsProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("participant");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleSendInvitation = () => {
    if (!email.trim()) {
      toast.error(t("errors.emailRequired"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t("errors.invalidEmail"));
      return;
    }

    if (onSendInvitation) {
      onSendInvitation(email, role);
    }

    toast.success(t("meeting.invitationSent"));
    setEmail("");
    setRole("participant");
    setIsDialogOpen(false);
  };

  const copyToClipboard = (text: string, invitationId: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(invitationId);
    toast.success(t("common.copiedToClipboard"));
    setTimeout(() => setCopiedId(null), 2000);
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            {t("meeting.inviteParticipants")}
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">{t("common.send")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("meeting.inviteParticipants")}</DialogTitle>
                <DialogDescription>
                  {t("meeting.requestDescription")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("common.email")}
                  </label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendInvitation()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("meeting.role")}
                  </label>
                  <Select value={role} onValueChange={setRole}>
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
                <Button
                  className="w-full"
                  onClick={handleSendInvitation}
                >
                  {t("meeting.sendInvitation")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <p className="text-sm text-gray-500">{t("meeting.noInvitations")}</p>
        ) : (
          <div className="space-y-2">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-3 rounded border border-gray-200 hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{invitation.email}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(invitation.sentAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(invitation.status)}>
                    {getStatusLabel(invitation.status)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin}/meeting/${meetingId}`,
                        invitation.id
                      )
                    }
                  >
                    {copiedId === invitation.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
