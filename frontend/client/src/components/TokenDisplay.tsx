import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Clock } from "lucide-react";

interface TokenDisplayProps {
  tokenHolderId: number | null;
  tokenHolderName?: string;
  tokenStartTime?: number;
  currentPhase: string;
  participants: Array<{ id: number; displayName: string; role: string }>;
}

export const TokenDisplay: React.FC<TokenDisplayProps> = ({
  tokenHolderId,
  tokenHolderName,
  tokenStartTime,
  currentPhase,
  participants,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!tokenStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - tokenStartTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [tokenStartTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const phaseColors: Record<string, string> = {
    ideation: "bg-blue-100 text-blue-800",
    clarification: "bg-purple-100 text-purple-800",
    decision: "bg-green-100 text-green-800",
    feedback: "bg-orange-100 text-orange-800",
    none: "bg-gray-100 text-gray-800",
  };

  const phaseLabels: Record<string, string> = {
    ideation: "Idéation",
    clarification: "Clarification",
    decision: "Décision",
    feedback: "Retours",
    none: "Non démarrée",
  };

  const tokenHolder = participants.find((p) => p.id === tokenHolderId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* Current Phase */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Phase actuelle</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge className={`${phaseColors[currentPhase]} text-lg px-4 py-2`}>
            {phaseLabels[currentPhase]}
          </Badge>
        </CardContent>
      </Card>

      {/* Token Holder */}
      <Card className={tokenHolderId ? "border-2 border-amber-400" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Détenteur du Token
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tokenHolder ? (
            <div className="space-y-2">
              <div className="text-lg font-bold text-amber-600">{tokenHolder.displayName}</div>
              <div className="text-xs text-gray-600">Rôle: {tokenHolder.role}</div>
              {tokenStartTime && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="w-4 h-4" />
                  <span>Temps de parole: {formatTime(elapsedTime)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 italic">Aucun détenteur</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
