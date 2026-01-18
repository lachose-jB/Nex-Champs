import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, BarChart3, Download, Search } from "lucide-react";
import { toast } from "sonner";

interface Decision {
  id: number;
  title: string;
  description?: string;
  phase: string;
  votingMethod: "consensus" | "majority" | "unanimous" | "decider";
  result: "approved" | "rejected" | "pending";
  votesFor: number;
  votesAgainst: number;
  abstentions: number;
  decidedBy: string;
  decidedAt: number;
  participants: string[];
}

export default function DecisionHistory() {
  const { t } = useLanguage();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [filteredDecisions, setFilteredDecisions] = useState<Decision[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterResult, setFilterResult] = useState<"all" | "approved" | "rejected" | "pending">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDecisions();
  }, []);

  useEffect(() => {
    filterDecisions();
  }, [decisions, searchQuery, filterResult]);

  const loadDecisions = async () => {
    setLoading(true);
    try {
      // In production: const decisions = await trpc.meeting.getDecisions.useQuery(meetingId);
      setDecisions([
        {
          id: 1,
          title: "Approuver le budget Q1",
          description: "Allocation budgétaire pour le premier trimestre",
          phase: "decision",
          votingMethod: "majority",
          result: "approved",
          votesFor: 8,
          votesAgainst: 2,
          abstentions: 1,
          decidedBy: "Alice Johnson",
          decidedAt: Date.now() - 3600000,
          participants: ["Alice Johnson", "Bob Smith", "Carol White"],
        },
        {
          id: 2,
          title: "Lancer le nouveau projet",
          description: "Démarrage du projet innovation 2024",
          phase: "decision",
          votingMethod: "consensus",
          result: "approved",
          votesFor: 11,
          votesAgainst: 0,
          abstentions: 0,
          decidedBy: "Carol White",
          decidedAt: Date.now() - 7200000,
          participants: ["Alice Johnson", "Bob Smith", "Carol White", "David Lee"],
        },
        {
          id: 3,
          title: "Reporter la réunion stratégique",
          description: "Reprogrammer la réunion du 15 mars",
          phase: "decision",
          votingMethod: "majority",
          result: "rejected",
          votesFor: 3,
          votesAgainst: 8,
          abstentions: 0,
          decidedBy: "Bob Smith",
          decidedAt: Date.now() - 10800000,
          participants: ["Alice Johnson", "Bob Smith", "Carol White"],
        },
      ]);
    } catch (error) {
      toast.error(t("admin.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const filterDecisions = () => {
    let filtered = decisions;

    if (searchQuery) {
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterResult !== "all") {
      filtered = filtered.filter((d) => d.result === filterResult);
    }

    setFilteredDecisions(filtered);
  };

  const handleExportHistory = () => {
    try {
      const csv = [
        ["Title", "Phase", "Voting Method", "Result", "For", "Against", "Abstentions", "Decided By", "Date"],
        ...filteredDecisions.map((d) => [
          d.title,
          d.phase,
          d.votingMethod,
          d.result,
          d.votesFor,
          d.votesAgainst,
          d.abstentions,
          d.decidedBy,
          new Date(d.decidedAt).toLocaleString(),
        ]),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `decision-history-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("admin.exportSuccess"));
    } catch (error) {
      toast.error(t("admin.exportFailed"));
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case "approved":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateConsensusPercentage = (decision: Decision) => {
    const total = decision.votesFor + decision.votesAgainst + decision.abstentions;
    return total > 0 ? Math.round((decision.votesFor / total) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            {t("decisions.history")}
          </h1>
          <p className="text-gray-600 mt-2">{t("decisions.historyDescription")}</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              placeholder={t("admin.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="all">{t("decisions.allResults")}</option>
            <option value="approved">{t("decisions.approved")}</option>
            <option value="rejected">{t("decisions.rejected")}</option>
            <option value="pending">{t("decisions.pending")}</option>
          </select>
          <Button onClick={handleExportHistory} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            {t("admin.export")}
          </Button>
        </div>

        {/* Decisions List */}
        <div className="space-y-4">
          {filteredDecisions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600">{t("decisions.noDecisions")}</p>
              </CardContent>
            </Card>
          ) : (
            filteredDecisions.map((decision) => (
              <Card key={decision.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getResultIcon(decision.result)}
                        <h3 className="text-lg font-semibold text-gray-900">{decision.title}</h3>
                        <Badge className={getResultColor(decision.result)}>
                          {t(`decisions.${decision.result}`)}
                        </Badge>
                      </div>
                      {decision.description && (
                        <p className="text-gray-600 mb-3">{decision.description}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p>{new Date(decision.decidedAt).toLocaleString()}</p>
                      <p className="font-semibold text-gray-900">{t(`decisions.by`)} {decision.decidedBy}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">{t("decisions.votingMethod")}</p>
                      <p className="font-semibold text-gray-900">{decision.votingMethod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t("decisions.consensus")}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${calculateConsensusPercentage(decision)}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {calculateConsensusPercentage(decision)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">{t("decisions.votesFor")}</p>
                      <p className="text-2xl font-bold text-green-600">{decision.votesFor}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">{t("decisions.votesAgainst")}</p>
                      <p className="text-2xl font-bold text-red-600">{decision.votesAgainst}</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">{t("decisions.abstentions")}</p>
                      <p className="text-2xl font-bold text-yellow-600">{decision.abstentions}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">{t("decisions.participants")}</p>
                      <p className="text-2xl font-bold text-blue-600">{decision.participants.length}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">{t("decisions.participants")}</p>
                    <div className="flex flex-wrap gap-2">
                      {decision.participants.map((participant, index) => (
                        <Badge key={index} variant="outline">
                          {participant}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
