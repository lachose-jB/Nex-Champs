import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInviteParticipant } from "@/lib/hooks";
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
import { X, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface InviteParticipantModalProps {
  meetingId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InviteParticipantModal({
  meetingId,
  onClose,
  onSuccess,
}: InviteParticipantModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("participant");
  const [inviteMethod, setInviteMethod] = useState<"email" | "username">("email");

  const inviteMutation = useInviteParticipant();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    if (inviteMethod === "email" && !email.trim()) {
      toast.error("L'email est requis");
      return;
    }

    if (inviteMethod === "username" && !username.trim()) {
      toast.error("Le username est requis");
      return;
    }

    try {
      const data = {
        name: name.trim(),
        role,
        ...(inviteMethod === "email" ? { email: email.trim() } : { username: username.trim() }),
      };

      await inviteMutation.mutateAsync({
        meetingId,
        data,
      });

      toast.success(`${name} a été invité à la réunion`);
      setName("");
      setEmail("");
      setUsername("");
      setRole("participant");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      const errorMsg = error?.message || "Erreur lors de l'invitation";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Inviter un participant
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={inviteMutation.isPending}
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <Input
                type="text"
                placeholder="Jean Dupont"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={inviteMutation.isPending}
                required
              />
            </div>

            {/* Invite Method Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Méthode d'invitation
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={inviteMethod === "email" ? "default" : "outline"}
                  onClick={() => setInviteMethod("email")}
                  className="flex-1"
                  disabled={inviteMutation.isPending}
                >
                  Par Email
                </Button>
                <Button
                  type="button"
                  variant={inviteMethod === "username" ? "default" : "outline"}
                  onClick={() => setInviteMethod("username")}
                  className="flex-1"
                  disabled={inviteMutation.isPending}
                >
                  Par Username
                </Button>
              </div>
            </div>

            {/* Email or Username Field */}
            {inviteMethod === "email" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  placeholder="jean.dupont@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={inviteMutation.isPending}
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <Input
                  type="text"
                  placeholder="jean.dupont"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={inviteMutation.isPending}
                  required
                />
              </div>
            )}

            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rôle
              </label>
              <Select value={role} onValueChange={setRole} disabled={inviteMutation.isPending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facilitator">
                    Facilitator (Admin)
                  </SelectItem>
                  <SelectItem value="participant">
                    Participant
                  </SelectItem>
                  <SelectItem value="observer">
                    Observer (Lecture seule)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={inviteMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Invitation...
                  </>
                ) : (
                  "Inviter"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={inviteMutation.isPending}
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
