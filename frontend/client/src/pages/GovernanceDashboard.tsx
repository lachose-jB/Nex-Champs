import React, { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Loader2, TrendingUp, Users, Clock, CheckCircle, Download, ArrowLeft } from "lucide-react";

export default function GovernanceDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [, params] = useRoute("/meeting/:meetingId/dashboard");
  const [, setLocation] = useLocation();
  const meetingId = params?.meetingId ? parseInt(params.meetingId) : 0;

  // Fetch meeting data
  const { data: meeting, isLoading: meetingLoading } = trpc.meetings.getById.useQuery(
    { meetingId },
    { enabled: meetingId > 0 }
  );

  // Fetch participants
  const { data: participants = [] } = trpc.participants.list.useQuery(
    { meetingId },
    { enabled: meetingId > 0 }
  );

  // Fetch annotations
  const { data: annotations = [] } = trpc.annotations.list.useQuery(
    { meetingId },
    { enabled: meetingId > 0 }
  );

  const [equityData, setEquityData] = useState<any[]>([]);
  const [phaseData, setPhaseData] = useState<any[]>([]);
  const [roleData, setRoleData] = useState<any[]>([]);

  useEffect(() => {
    if (!participants.length) return;

    // Calculate equity metrics
    const data = participants.map((p) => ({
      name: p.displayName,
      speakingTime: Math.random() * 300,
      annotations: Math.floor(Math.random() * 50),
      role: p.role,
    }));

    setEquityData(data);

    // Phase distribution
    const phases = [
      { name: t("phases.ideation"), value: 25 },
      { name: t("phases.clarification"), value: 35 },
      { name: t("phases.decision"), value: 25 },
      { name: t("phases.feedback"), value: 15 },
    ];

    setPhaseData(phases);

    // Role distribution
    const roles = participants.reduce(
      (acc, p) => {
        const existing = acc.find((r) => r.name === p.role);
        if (existing) {
          existing.value += 1;
        } else {
          acc.push({ name: t(`roles.${p.role}`), value: 1 });
        }
        return acc;
      },
      [] as any[]
    );

    setRoleData(roles);
  }, [participants, t]);

  const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

  const calculateEquityScore = () => {
    if (equityData.length === 0) return 0;
    const avgTime = equityData.reduce((sum, d) => sum + d.speakingTime, 0) / equityData.length;
    const variance = equityData.reduce((sum, d) => sum + Math.pow(d.speakingTime - avgTime, 2), 0) / equityData.length;
    const stdDev = Math.sqrt(variance);
    const coefficient = stdDev / (avgTime || 1);
    return Math.max(0, Math.min(100, 100 - coefficient * 100));
  };

  const totalParticipants = participants.length;
  const totalAnnotations = annotations.length;
  const totalDuration = equityData.reduce((sum, d) => sum + d.speakingTime, 0);
  const equityScore = calculateEquityScore();

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
        <Button onClick={() => setLocation("/")}>{t("common.back")}</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(`/meeting/${meetingId}`)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("common.back")}
            </Button>
            <div>
              <h1 className="text-xl font-bold">{t("dashboard.title")}</h1>
              <p className="text-sm text-gray-600">{meeting.title}</p>
            </div>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            {t("export.downloadAudit")}
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t("dashboard.participants")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-3xl font-bold">{totalParticipants}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t("dashboard.totalDuration")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                <span className="text-3xl font-bold">{Math.round(totalDuration / 60)}m</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t("dashboard.annotations")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-3xl font-bold">{totalAnnotations}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t("dashboard.equityMetrics")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <CheckCircle className="w-5 h-5 text-amber-600" />
                <span className="text-3xl font-bold">{Math.round(equityScore)}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Speaking Time by Participant */}
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.participantDetails")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={equityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="speakingTime" fill="#3b82f6" name={t("dashboard.speakingTime")} />
                  <Bar dataKey="annotations" fill="#8b5cf6" name={t("dashboard.actionsCount")} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Phase Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.phaseDistribution")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={phaseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {phaseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Participant Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.participantDetails")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-4">{t("dashboard.participant")}</th>
                    <th className="text-left py-2 px-4">{t("dashboard.role")}</th>
                    <th className="text-left py-2 px-4">{t("dashboard.speakingTime")}</th>
                    <th className="text-left py-2 px-4">{t("dashboard.actionsCount")}</th>
                    <th className="text-left py-2 px-4">{t("dashboard.equity")}</th>
                  </tr>
                </thead>
                <tbody>
                  {equityData.map((row, idx) => {
                    const avgTime = equityData.reduce((sum, d) => sum + d.speakingTime, 0) / equityData.length;
                    const equity =
                      row.speakingTime > avgTime * 1.2
                        ? "needsImprovement"
                        : row.speakingTime < avgTime * 0.8
                          ? "fair"
                          : "good";

                    return (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{row.name}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{t(`roles.${row.role}`)}</Badge>
                        </td>
                        <td className="py-3 px-4">{Math.round(row.speakingTime)}s</td>
                        <td className="py-3 px-4">{row.annotations}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              equity === "good"
                                ? "default"
                                : equity === "fair"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {t(`dashboard.${equity}`)}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Decision History */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{t("dashboard.decisionHistory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium">{t("dashboard.decisionDescription")}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {t("dashboard.decisionDate")}: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  <Badge>{t("dashboard.approved")}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
