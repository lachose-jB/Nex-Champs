import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, LogOut, Plus } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const utils = trpc.useUtils();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setLocation("/");
    },
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">{t("common.loading")}</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="mb-4">{t("auth.notAuthenticated")}</p>
          <Button onClick={() => setLocation("/login")} variant="default">
            {t("auth.login")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-amber-600" />
            <h1 className="text-2xl font-bold text-white">Orchestra-sec</h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="text-sm text-gray-400">
              {t("common.welcome")}, <span className="font-semibold text-white">{user?.name}</span>
            </div>
            <Button
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              {logoutMutation.isPending ? t("common.loading") : t("auth.logout")}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Welcome Card */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">{t("common.welcome")}, {user?.name}!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 mb-6">
                {t("home.subtitle")}
              </p>
              <Button
                onClick={() => setLocation("/")}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                {t("meetings.createNew")}
              </Button>
            </CardContent>
          </Card>

          {/* Features Overview */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-sm text-orange-400">Expression Token</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 text-sm">
                Fair speech management with RBAC applied to communication
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-sm text-blue-400">4 Structured Phases</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 text-sm">
                Ideation, Clarification, Decision, Feedback for effective meetings
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-sm text-purple-400">Equity Statistics</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 text-sm">
                Speaking time, annotations, and equity metrics in real-time
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-sm text-amber-400">Complete Traceability</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 text-sm">
                Immutable audit with annotated video and timestamped metadata
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
