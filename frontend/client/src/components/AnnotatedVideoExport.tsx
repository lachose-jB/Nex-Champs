import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Download, FileJson, Video } from "lucide-react";
import { toast } from "sonner";

interface AnnotatedVideoExportProps {
  meetingId: number;
  videoBlob?: Blob;
  annotations?: any[];
  onExportComplete?: (blob: Blob) => void;
}

export const AnnotatedVideoExport: React.FC<AnnotatedVideoExportProps> = ({
  meetingId,
  videoBlob,
  annotations = [],
  onExportComplete,
}) => {
  const { t } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExport = async () => {
    if (!videoBlob) {
      toast.error(t("export.noVideo"));
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Create audit JSON with comprehensive metadata
      const auditData = {
        meetingId,
        exportedAt: new Date().toISOString(),
        exportFormat: "1.0",
        annotations: annotations.map((a) => ({
          ...a,
          timestamp: new Date(a.timestamp).toISOString(),
        })),
        totalAnnotations: annotations.length,
        metadata: {
          videoSize: videoBlob.size,
          videoType: videoBlob.type,
          annotationCount: annotations.length,
        },
      };

      // Create audit JSON blob
      const auditBlob = new Blob([JSON.stringify(auditData, null, 2)], {
        type: "application/json",
      });

      // Download video
      setExportProgress(25);
      const videoUrl = URL.createObjectURL(videoBlob);
      const videoLink = document.createElement("a");
      videoLink.href = videoUrl;
      videoLink.download = `meeting-${meetingId}-${Date.now()}.webm`;
      document.body.appendChild(videoLink);
      videoLink.click();
      document.body.removeChild(videoLink);
      URL.revokeObjectURL(videoUrl);

      toast.success(t("export.downloadVideo"));
      setExportProgress(50);

      // Download audit JSON
      const auditUrl = URL.createObjectURL(auditBlob);
      const auditLink = document.createElement("a");
      auditLink.href = auditUrl;
      auditLink.download = `meeting-${meetingId}-audit-${Date.now()}.json`;
      document.body.appendChild(auditLink);
      auditLink.click();
      document.body.removeChild(auditLink);
      URL.revokeObjectURL(auditUrl);

      toast.success(t("export.downloadAudit"));
      setExportProgress(100);

      if (onExportComplete) {
        onExportComplete(videoBlob);
      }

      // Reset after a delay
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1500);
    } catch (error) {
      toast.error(t("errors.recordingError"));
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const videoSizeMB = videoBlob ? (videoBlob.size / 1024 / 1024).toFixed(2) : "0";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("export.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Info */}
        {videoBlob && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Video className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-sm">{t("export.video")}</span>
            </div>
            <p className="text-xs text-gray-600">
              {videoSizeMB} {t("export.mb")} • {videoBlob.type}
            </p>
          </div>
        )}

        {/* Annotations Info */}
        {annotations.length > 0 && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileJson className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-sm">{t("export.annotations")}</span>
            </div>
            <p className="text-xs text-gray-600">
              {annotations.length} {t("dashboard.annotations")}
            </p>
          </div>
        )}

        {/* Export Progress */}
        {isExporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t("export.exporting")}</span>
              <span>{exportProgress}%</span>
            </div>
            <Progress value={exportProgress} className="h-2" />
          </div>
        )}

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={!videoBlob || isExporting}
          className="w-full gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("export.exporting")}
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              {t("export.exportButton")}
            </>
          )}
        </Button>

        {/* Info Message */}
        {!videoBlob && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            {t("export.noVideo")}
          </div>
        )}

        {/* Export Format Info */}
        <div className="text-xs text-gray-600 space-y-1">
          <p className="font-medium">{t("export.exportFormat")}:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              {t("export.mp4")}: {t("export.downloadVideo")}
            </li>
            <li>
              {t("export.downloadAudit")}: JSON {t("common.with")} metadata
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
