import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mic, Video, MessageSquare, Check, X } from "lucide-react";
import { toast } from "sonner";

interface PermissionRequest {
  id: number;
  participantId: number;
  participantName: string;
  type: "camera" | "microphone" | "speaking";
  status: "pending" | "approved" | "denied";
  requestedAt: string;
}

interface PermissionManagerProps {
  currentUserRole?: string;
  pendingRequests?: PermissionRequest[];
  onRequestPermission?: (type: "camera" | "microphone" | "speaking") => void;
  onApproveRequest?: (requestId: number) => void;
  onDenyRequest?: (requestId: number) => void;
}

export function PermissionManager({
  currentUserRole = "participant",
  pendingRequests = [],
  onRequestPermission,
  onApproveRequest,
  onDenyRequest,
}: PermissionManagerProps) {
  const { t } = useLanguage();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<
    "camera" | "microphone" | "speaking" | null
  >(null);

  const isFacilitator = currentUserRole === "facilitator";

  const handlePermissionSelect = (
    permission: "camera" | "microphone" | "speaking"
  ) => {
    setSelectedPermission(permission);
  };

  const handleConfirmRequest = () => {
    if (selectedPermission && onRequestPermission) {
      onRequestPermission(selectedPermission);
      toast.success(t("meeting.requestSent"));
      setShowRequestDialog(false);
      setSelectedPermission(null);
    }
  };

  const handleApprove = (requestId: number) => {
    if (onApproveRequest) {
      onApproveRequest(requestId);
      toast.success(t("errors.approveFailed"));
    }
  };

  const handleDeny = (requestId: number) => {
    if (onDenyRequest) {
      onDenyRequest(requestId);
      toast.success(t("errors.denyFailed"));
    }
  };

  const getPermissionIcon = (type: string) => {
    switch (type) {
      case "camera":
        return <Video className="w-4 h-4" />;
      case "microphone":
        return <Mic className="w-4 h-4" />;
      case "speaking":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getPermissionLabel = (type: string) => {
    switch (type) {
      case "camera":
        return t("meeting.requestType.camera");
      case "microphone":
        return t("meeting.requestType.microphone");
      case "speaking":
        return t("meeting.requestType.speaking");
      default:
        return type;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("meeting.requestPermission")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isFacilitator && (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                {t("meeting.requestDescription")}
              </p>
              <Button
                className="w-full"
                onClick={() => setShowRequestDialog(true)}
              >
                {t("meeting.requestPermission")}
              </Button>
            </div>
          )}

          {isFacilitator && pendingRequests.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">
                {t("meeting.pendingRequests")}
              </h3>
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded border border-gray-200 bg-yellow-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getPermissionIcon(request.type)}
                        <span className="text-sm font-medium">
                          {request.participantName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {t(`meeting.requestType.${request.type}`)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(request.requestedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {request.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:bg-green-100"
                            onClick={() => handleApprove(request.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-100"
                            onClick={() => handleDeny(request.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {request.status !== "pending" && (
                        <Badge
                          variant={
                            request.status === "approved" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {request.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("meeting.requestWhat")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("meeting.requestDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <Button
              variant={selectedPermission === "camera" ? "default" : "outline"}
              onClick={() => handlePermissionSelect("camera")}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Video className="w-5 h-5" />
              <span className="text-xs">{t("meeting.requestCamera")}</span>
            </Button>
            <Button
              variant={selectedPermission === "microphone" ? "default" : "outline"}
              onClick={() => handlePermissionSelect("microphone")}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Mic className="w-5 h-5" />
              <span className="text-xs">{t("meeting.requestMicrophone")}</span>
            </Button>
            <Button
              variant={selectedPermission === "speaking" ? "default" : "outline"}
              onClick={() => handlePermissionSelect("speaking")}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs">{t("meeting.requestSpeakingTime")}</span>
            </Button>
          </div>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmRequest}>
            {t("common.send")}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
