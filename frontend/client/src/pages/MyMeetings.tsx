import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserMeetings, useDeleteMeeting } from "@/lib/hooks";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Trash2, LogIn, Edit2, ArrowLeft, Calendar, Users } from "lucide-react";
import { toast } from "sonner";

export default function MyMeetings() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  // API Hooks
  const { data: meetings = [], isLoading, refetch } = useUserMeetings();
  const deleteMeetingMutation = useDeleteMeeting();

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter meetings by search query
  const filteredMeetings = meetings.filter((meeting: any) =>
    meeting.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (meeting.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleDeleteMeeting = async () => {
    if (!meetingToDelete) return;

    setIsDeleting(true);
    try {
      await deleteMeetingMutation.mutateAsync(meetingToDelete);
      toast.success(t("meetings.deletedSuccess") || "Meeting deleted successfully");
      setShowDeleteDialog(false);
      setMeetingToDelete(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete meeting");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleJoinMeeting = (meetingId: number) => {
    setLocation(`/meeting/${meetingId}`);
  };

  const handleEditMeeting = (meetingId: number) => {
    // For now, just navigate to the meeting
    // In the future, could open an edit modal
    setLocation(`/meeting/${meetingId}`);
  };

  const handleCreateMeeting = () => {
    setLocation("/");
  };

  if (isLoading) {
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">{t("meetings.myMeetings") || "My Meetings"}</h1>
          </div>
          <Button
            onClick={handleCreateMeeting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            {t("meetings.createNew") || "Create New"}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Input
            type="search"
            placeholder={t("meetings.searchPlaceholder") || "Search meetings..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredMeetings.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto" />
              <div>
                <p className="text-lg font-semibold text-gray-700">
                  {searchQuery
                    ? t("meetings.noResults") || "No meetings found"
                    : t("meetings.noMeetings") || "No meetings yet"}
                </p>
                {!searchQuery && (
                  <p className="text-gray-500 text-sm mt-1">
                    {t("meetings.startByCreating") || "Start by creating a new meeting"}
                  </p>
                )}
              </div>
              {!searchQuery && (
                <Button
                  onClick={handleCreateMeeting}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  {t("meetings.createNew") || "Create New Meeting"}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeetings.map((meeting: any) => (
              <Card key={meeting.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">{meeting.name}</CardTitle>
                    <Badge
                      variant={meeting.is_active ? "default" : "secondary"}
                      className={meeting.is_active ? "bg-green-100 text-green-800" : ""}
                    >
                      {meeting.is_active ? t("meetings.active") || "Active" : t("meetings.inactive") || "Inactive"}
                    </Badge>
                  </div>
                  {meeting.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mt-2">{meeting.description}</p>
                  )}
                </CardHeader>

                <CardContent className="flex-1 pb-3 space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-gray-600">
                      <span>{t("meetings.phase") || "Current Phase"}:</span>
                      <Badge variant="outline" className="capitalize">
                        {t(`phases.${meeting.current_phase || "ideation"}`) || meeting.current_phase}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {t("meetings.participants") || "Participants"}:
                      </span>
                      <span className="font-medium">{meeting.participants?.length || 0}</span>
                    </div>
                    {meeting.created_at && (
                      <div className="flex items-center justify-between text-gray-600">
                        <span>{t("meetings.created") || "Created"}:</span>
                        <span className="text-xs">
                          {new Date(meeting.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <div className="border-t pt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleJoinMeeting(meeting.id)}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    {t("meetings.join") || "Join"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditMeeting(meeting.id)}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    {t("meetings.edit") || "Edit"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMeetingToDelete(meeting.id);
                      setShowDeleteDialog(true);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Meeting Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("meetings.confirmDelete") || "Delete Meeting"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("meetings.deleteWarning") || "This action cannot be undone. The meeting and all associated data will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>{t("meetings.cancel") || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMeeting}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("meetings.deleting") || "Deleting..."}
                </>
              ) : (
                t("meetings.delete") || "Delete"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
