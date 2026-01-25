import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic, Hand, Clock } from "lucide-react";

interface SpeechTokenProps {
  meetingId: number;
  currentTokenHolderId?: number;
  userId?: number;
  userName?: string;
  onRequestToken?: () => void;
  isRequesting?: boolean;
  queuedParticipants?: Array<{ id: number; name: string; position: number }>;
}

export default function SpeechToken({
  currentTokenHolderId,
  userId,
  userName,
  onRequestToken,
  isRequesting = false,
  queuedParticipants = [],
}: SpeechTokenProps) {
  const { t } = useLanguage();

  const isCurrentUser = currentTokenHolderId === userId;
  const isInQueue = queuedParticipants.some((p) => p.id === userId);

  return (
    <Card className="w-full bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <Mic className="w-5 h-5" />
          {t("token.speechToken") || "Speech Token"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Token Holder */}
        <div className="bg-white rounded-lg p-3 border border-amber-200">
          <p className="text-xs text-gray-600 mb-1">
            {t("token.currentSpeaker") || "Current Speaker"}:
          </p>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-amber-900">
              {isCurrentUser ? (
                <Badge className="bg-green-500 hover:bg-green-600">
                  {t("token.youHaveToken") || "You Have Token"}
                </Badge>
              ) : currentTokenHolderId ? (
                <span>{t("token.anotherParticipant") || "Another Participant Has Token"}</span>
              ) : (
                <span className="text-gray-400">{t("token.noTokenHolder") || "No one speaking"}</span>
              )}
            </span>
            {isCurrentUser && (
              <Clock className="w-4 h-4 animate-spin text-green-500" />
            )}
          </div>
        </div>

        {/* Request Token Button */}
        {!isCurrentUser && (
          <Button
            onClick={onRequestToken}
            disabled={isInQueue || isRequesting}
            className={`w-full ${
              isInQueue
                ? "bg-gray-400"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            <Hand className="w-4 h-4 mr-2" />
            {isInQueue
              ? t("token.inQueue") || "In Queue..."
              : t("token.requestToken") || "Request to Speak"}
          </Button>
        )}

        {/* Queue Position */}
        {queuedParticipants.length > 0 && (
          <div className="bg-white rounded-lg p-3 border border-amber-200">
            <p className="text-xs text-gray-600 mb-2">
              {t("token.queue") || "Queue"}:
            </p>
            <div className="space-y-1">
              {queuedParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <Badge variant="outline" className="bg-amber-100">
                    #{participant.position}
                  </Badge>
                  <span className="text-gray-700">{participant.name}</span>
                  {participant.id === userId && (
                    <Badge className="bg-blue-500 ml-auto">
                      {t("token.you") || "You"}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-600 bg-white rounded p-2 border border-amber-100">
          <p className="font-semibold mb-1">{t("token.howWorks") || "How it works"}</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>{t("token.rule1") || "Only one person speaks at a time"}</li>
            <li>{t("token.rule2") || "Request the token to speak"}</li>
            <li>{t("token.rule3") || "When speaking, you can annotate and draw"}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
