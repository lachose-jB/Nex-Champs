import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCreateMeeting, useMeetings, useJoinMeeting } from "@/lib/hooks";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Crown, Users, Zap, BarChart3 } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { language, t } = useLanguage();
  const [, setLocation] = useLocation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [joinName, setJoinName] = useState("");
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);

  const createMeetingMutation = useCreateMeeting();
  const joinMeetingMutation = useJoinMeeting();
  const meetingsQuery = useMeetings();

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const meeting = await createMeetingMutation.mutateAsync({
        name: title,
        description: description || undefined,
      });
      setLocation(`/meeting/${meeting.id}`);
    } catch (error) {
      console.error('Error creating meeting:', error);
    }
  };

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeetingId || !joinName.trim()) return;

    try {
      await joinMeetingMutation.mutateAsync({
        meetingId: selectedMeetingId,
        data: {
          name: joinName,
          role: 'participant',
        },
      });
      setLocation(`/meeting/${selectedMeetingId}`);
    } catch (error) {
      console.error('Error joining meeting:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Crown className="w-12 h-12 text-amber-600" />
              </div>
              <CardTitle className="text-3xl">Orchestra-sec</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                {t("home.subtitle")}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-gray-700">
                {t("home.description")}
              </p>
              <div className="flex justify-center">
                <LanguageSwitcher />
              </div>
              <div className="space-y-3">
                <Button 
                  onClick={() => setLocation("/login")}
                  className="w-full" 
                  size="lg"
                  variant="default"
                >
                  {t("auth.login")}
                </Button>
                <Button 
                  onClick={() => setLocation("/signup")}
                  className="w-full" 
                  size="lg"
                  variant="outline"
                >
                  {t("auth.signup")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-amber-600" />
            <h1 className="text-2xl font-bold">Orchestra-sec</h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/meetings")}
            >
              {t("meetings.myMeetings") || "My Meetings"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/profile")}
            >
              {user?.username}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-4">{t("home.title")}</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl">
            {t("home.description")}
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card>
              <CardHeader>
                <Zap className="w-6 h-6 text-blue-600 mb-2" />
                <CardTitle className="text-lg">{t("home.features.token")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {t("home.features.tokenDesc")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="w-6 h-6 text-green-600 mb-2" />
                <CardTitle className="text-lg">{t("home.features.phases")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {t("home.features.phasesDesc")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="w-6 h-6 text-purple-600 mb-2" />
                <CardTitle className="text-lg">{t("home.features.equity")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {t("home.features.equityDesc")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Crown className="w-6 h-6 text-amber-600 mb-2" />
                <CardTitle className="text-lg">{t("home.features.traceability")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {t("home.features.traceabilityDesc")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create Meeting Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h3 className="text-2xl font-bold mb-6">{t("home.createMeeting")}</h3>

          {!showCreateForm ? (
            <Button
              size="lg"
              onClick={() => setShowCreateForm(true)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {t("home.newMeeting")}
            </Button>
          ) : (
            <form onSubmit={handleCreateMeeting} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("home.meetingTitle")}
                </label>
                <Input
                  type="text"
                  placeholder={t("home.meetingTitlePlaceholder")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("home.meetingDescription")}
                </label>
                <Textarea
                  placeholder={t("home.meetingDescriptionPlaceholder")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createMeetingMutation.isPending || !title.trim()}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {createMeetingMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("home.creating")}
                    </>
                  ) : (
                    t("home.createButton")
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Join Meeting Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h3 className="text-2xl font-bold mb-6">Rejoindre une réunion</h3>

          {!showJoinForm ? (
            <Button
              size="lg"
              onClick={() => setShowJoinForm(true)}
              variant="outline"
            >
              Rejoindre une réunion
            </Button>
          ) : (
            <form onSubmit={handleJoinMeeting} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sélectionner une réunion
                </label>
                {meetingsQuery.isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : meetingsQuery.data && meetingsQuery.data.length > 0 ? (
                  <select
                    value={selectedMeetingId || ''}
                    onChange={(e) => setSelectedMeetingId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">-- Choisir une réunion --</option>
                    {meetingsQuery.data.map((meeting) => (
                      <option key={meeting.id} value={meeting.id}>
                        {meeting.name} (ID: {meeting.id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-500">Aucune réunion disponible</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Votre nom dans la réunion
                </label>
                <Input
                  type="text"
                  placeholder="Entrez votre nom"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={joinMeetingMutation.isPending || !selectedMeetingId || !joinName.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {joinMeetingMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    'Rejoindre'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowJoinForm(false);
                    setSelectedMeetingId(null);
                    setJoinName("");
                  }}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-2xl font-bold mb-6">{t("home.howItWorks")}</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "1", titleKey: "home.step1", descKey: "home.step1Desc" },
              { step: "2", titleKey: "home.step2", descKey: "home.step2Desc" },
              { step: "3", titleKey: "home.step3", descKey: "home.step3Desc" },
              { step: "4", titleKey: "home.step4", descKey: "home.step4Desc" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-600 text-white font-bold mb-4">
                  {item.step}
                </div>
                <h4 className="font-semibold mb-2">{t(item.titleKey)}</h4>
                <p className="text-sm text-gray-600">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
    );
}
