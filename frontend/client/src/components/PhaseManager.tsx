import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Lightbulb, HelpCircle, CheckCircle, MessageCircle } from "lucide-react";

export type MeetingPhase = "ideation" | "clarification" | "decision" | "feedback";

interface PhaseManagerProps {
  currentPhase: MeetingPhase;
  onPhaseChange?: (phase: MeetingPhase) => void;
  isFacilitator?: boolean;
  meetingId: number;
}

const PHASES: Array<{ id: MeetingPhase; icon: React.ReactNode; color: string }> = [
  {
    id: "ideation",
    icon: <Lightbulb className="w-5 h-5" />,
    color: "from-yellow-100 to-amber-100",
  },
  {
    id: "clarification",
    icon: <HelpCircle className="w-5 h-5" />,
    color: "from-blue-100 to-cyan-100",
  },
  {
    id: "decision",
    icon: <CheckCircle className="w-5 h-5" />,
    color: "from-green-100 to-emerald-100",
  },
  {
    id: "feedback",
    icon: <MessageCircle className="w-5 h-5" />,
    color: "from-purple-100 to-pink-100",
  },
];

export default function PhaseManager({
  currentPhase,
  onPhaseChange,
  isFacilitator = false,
  meetingId,
}: PhaseManagerProps) {
  const { t } = useLanguage();

  const currentPhaseIndex = PHASES.findIndex((p) => p.id === currentPhase);
  const getPhaseTranslation = (phase: MeetingPhase) => {
    return t(phase) || phase.charAt(0).toUpperCase() + phase.slice(1);
  };

  const getPhaseDescription = (phase: MeetingPhase) => {
    return t(`${phase}Desc`) || "";
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          {t("meeting.phases") || "Meeting Phases"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Phase Progress */}
        <div className="relative">
          <div className="flex gap-1">
            {PHASES.map((phase, index) => (
              <React.Fragment key={phase.id}>
                {/* Phase Button */}
                <button
                  onClick={() => isFacilitator && onPhaseChange?.(phase.id)}
                  disabled={!isFacilitator}
                  className={`flex-1 transition-all ${
                    index <= currentPhaseIndex
                      ? `bg-gradient-to-br ${phase.color}`
                      : "bg-gray-100"
                  } ${
                    index === currentPhaseIndex
                      ? "ring-2 ring-offset-2 ring-blue-500"
                      : ""
                  } ${isFacilitator ? "cursor-pointer hover:shadow-md" : ""} rounded-lg p-3 text-center`}
                >
                  <div className="flex flex-col items-center gap-1">
                    {phase.icon}
                    <span className="text-xs font-semibold">
                      {getPhaseTranslation(phase.id)}
                    </span>
                  </div>
                </button>

                {/* Arrow between phases */}
                {index < PHASES.length - 1 && (
                  <div className="flex items-center">
                    <ChevronRight
                      className={`w-5 h-5 ${
                        index < currentPhaseIndex
                          ? "text-green-500"
                          : "text-gray-300"
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Current Phase Description */}
        <div
          className={`rounded-lg p-4 bg-gradient-to-br ${
            PHASES[currentPhaseIndex].color
          }`}
        >
          <p className="font-semibold text-gray-900 mb-1">
            {getPhaseTranslation(currentPhase)}
          </p>
          <p className="text-sm text-gray-700">
            {getPhaseDescription(currentPhase)}
          </p>
        </div>

        {/* Facilitator Controls */}
        {isFacilitator && currentPhaseIndex < PHASES.length - 1 && (
          <Button
            onClick={() =>
              onPhaseChange?.(PHASES[currentPhaseIndex + 1].id)
            }
            className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            {t("meeting.nextPhase") || "Next Phase"}
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}

        {isFacilitator && currentPhaseIndex === PHASES.length - 1 && (
          <div className="p-3 rounded-lg bg-green-100 border border-green-300 text-center">
            <p className="text-green-900 font-semibold text-sm">
              {t("meeting.meetingComplete") || "All phases completed"}
            </p>
          </div>
        )}

        {!isFacilitator && (
          <p className="text-xs text-gray-500 text-center">
            {t("meeting.facilitatorControlsPhases") ||
              "Only facilitators can change phases"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
