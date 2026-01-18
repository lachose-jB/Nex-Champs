import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserProfile, useUpdateUserProfile, useDeleteUserAccount } from "@/lib/hooks";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [, setLocation] = useLocation();

  // API Hooks
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const updateProfileMutation = useUpdateUserProfile();
  const deleteAccountMutation = useDeleteUserAccount();

  // Form state
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when profile loads
  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setEmail(profile.email || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updateData: any = {
        full_name: fullName,
        email,
        avatar_url: avatarUrl,
      };

      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error(t("profile.passwordMismatch") || "Passwords do not match");
          setIsSubmitting(false);
          return;
        }
        updateData.password = newPassword;
      }

      await updateProfileMutation.mutateAsync(updateData);
      toast.success(t("profile.updateSuccess") || "Profile updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsSubmitting(true);
    try {
      await deleteAccountMutation.mutateAsync(deletePassword);
      toast.success(t("profile.accountDeleted") || "Account deleted successfully");
      logout();
      setLocation("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
      setDeletePassword("");
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{t("profile.title") || "Profil"}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">{t("profile.general") || "General"}</TabsTrigger>
            <TabsTrigger value="preferences">{t("profile.preferences") || "Preferences"}</TabsTrigger>
            <TabsTrigger value="security">{t("profile.security") || "Security"}</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.personalInfo") || "Personal Information"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">{t("profile.username") || "Username"}</Label>
                      <Input
                        id="username"
                        value={profile?.username || ""}
                        disabled
                        className="bg-gray-100 text-gray-600"
                      />
                      <p className="text-xs text-gray-500">{t("profile.usernameInfo") || "Cannot be changed"}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">{t("profile.email") || "Email"}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="fullName">{t("profile.fullName") || "Full Name"}</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="avatar">{t("profile.avatarUrl") || "Avatar URL"}</Label>
                      <Input
                        id="avatar"
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                      />
                      {avatarUrl && (
                        <div className="mt-2">
                          <img
                            src={avatarUrl}
                            alt="Avatar preview"
                            className="w-20 h-20 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || updateProfileMutation.isPending}
                    className="w-full"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("profile.saving") || "Saving..."}
                      </>
                    ) : (
                      t("profile.save") || "Save Changes"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.preferences") || "Preferences"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">{t("profile.language") || "Language"}</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    {t("profile.languageInfo") || "Choose your preferred interface language"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.password") || "Password"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t("profile.newPassword") || "New Password"}</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t("profile.confirmPassword") || "Confirm Password"}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!newPassword || isSubmitting || updateProfileMutation.isPending}
                    className="w-full"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("profile.saving") || "Saving..."}
                      </>
                    ) : (
                      t("profile.updatePassword") || "Update Password"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-900">{t("profile.dangerZone") || "Danger Zone"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  {t("profile.deleteWarning") || "Once you delete your account, there is no going back. Please be certain."}
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {t("profile.deleteAccount") || "Delete Account"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("profile.confirmDelete") || "Confirm Account Deletion"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("profile.deleteWarning") || "This action cannot be undone. All your data will be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <Label htmlFor="deletePassword">{t("profile.enterPassword") || "Enter your password to confirm"}</Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>{t("profile.cancel") || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={!deletePassword || isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("profile.deleting") || "Deleting..."}
                </>
              ) : (
                t("profile.delete") || "Delete"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
