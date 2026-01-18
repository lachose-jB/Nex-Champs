import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download } from "lucide-react";

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
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExport = async () => {
    if (!videoBlob) {
      alert("Aucune vidéo à exporter");
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Create audit JSON
      const auditData = {
        meetingId,
        exportedAt: new Date().toISOString(),
        annotations: annotations,
        totalAnnotations: annotations.length,
      };

      // For now, create a simple export with the video and audit JSON
      // In production, ffmpeg.wasm would merge video and annotations
      const auditBlob = new Blob([JSON.stringify(auditData, null, 2)], {
        type: "application/json",
      });

      // Download video
      const videoUrl = URL.createObjectURL(videoBlob);
      const videoLink = document.createElement("a");
      videoLink.href = videoUrl;
      videoLink.download = `meeting-${meetingId}-recording.webm`;
      document.body.appendChild(videoLink);
      videoLink.click();
      document.body.removeChild(videoLink);
      URL.revokeObjectURL(videoUrl);

      setExportProgress(50);

      // Download audit JSON
      const auditUrl = URL.createObjectURL(auditBlob);
      const auditLink = document.createElement("a");
      auditLink.href = auditUrl;
      auditLink.download = `meeting-${meetingId}-audit.json`;
      document.body.appendChild(auditLink);
      auditLink.click();
      document.body.removeChild(auditLink);
      URL.revokeObjectURL(auditUrl);

      setExportProgress(100);
      onExportComplete?.(videoBlob);

      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Erreur lors de l'export");
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Export annoté</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {videoBlob ? (
          <>
            <div className="text-sm text-gray-600">
              <p>Vidéo: {(videoBlob.size / 1024 / 1024).toFixed(2)} MB</p>
              <p>Annotations: {annotations.length}</p>
            </div>

            {isExporting && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${exportProgress}%` } as React.CSSProperties}
                  />
                </div>
                <p className="text-xs text-gray-600 text-center">{exportProgress}%</p>
              </div>
            )}

            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter la vidéo
                </>
              )}
            </Button>
          </>
        ) : (
          <p className="text-sm text-gray-500 text-center">
            Enregistrez une vidéo pour l'exporter
          </p>
        )}
      </CardContent>
    </Card>
  );
};
