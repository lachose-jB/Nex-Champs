import React, { useRef, useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";

interface VideoRecorderProps {
  meetingId: number;
  isTokenHolder: boolean;
  onRecordingComplete?: (blob: Blob) => void;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({
  meetingId,
  isTokenHolder,
  onRecordingComplete,
}) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!isRecording || isPaused) return;

    const interval = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const initializeCamera = async () => {
    setIsInitializing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setHasPermission(true);
      toast.success(t("videoRecorder.recordingStarted"));
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          toast.error(t("videoRecorder.cameraError"));
        } else if (error.name === "NotFoundError") {
          toast.error(t("videoRecorder.cameraError"));
        }
      }
      setHasPermission(false);
    } finally {
      setIsInitializing(false);
    }
  };

  const startRecording = async () => {
    if (!hasPermission) {
      await initializeCamera();
      return;
    }

    if (!streamRef.current) {
      toast.error(t("videoRecorder.cameraError"));
      return;
    }

    try {
      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: "video/webm;codecs=vp9",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setRecordedBlob(blob);
        if (onRecordingComplete) {
          onRecordingComplete(blob);
        }
        toast.success(t("videoRecorder.recordingStopped"));
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      toast.success(t("videoRecorder.recordingStarted"));
    } catch (error) {
      toast.error(t("videoRecorder.recordingError"));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      toast.success(t("videoRecorder.recordingPaused"));
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      toast.success(t("videoRecorder.recordingResumed"));
    }
  };

  const downloadRecording = () => {
    if (!recordedBlob) return;

    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting-${meetingId}-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t("export.downloadVideo"));
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {/* Video Preview */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-full h-full object-cover"
        />
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            {t("videoRecorder.recording")} - {formatTime(recordingTime)}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        {!hasPermission ? (
          <Button
            onClick={initializeCamera}
            disabled={isInitializing}
            className="gap-2 flex-1"
          >
            {isInitializing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("videoRecorder.initializing")}
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                {t("videoRecorder.enableCamera")}
              </>
            )}
          </Button>
        ) : (
          <>
            {!isRecording ? (
              <Button onClick={startRecording} className="gap-2 flex-1">
                <Video className="w-4 h-4" />
                {t("videoRecorder.start")}
              </Button>
            ) : (
              <>
                {!isPaused ? (
                  <Button
                    variant="outline"
                    onClick={pauseRecording}
                    className="gap-2 flex-1"
                  >
                    {t("videoRecorder.pause")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={resumeRecording}
                    className="gap-2 flex-1"
                  >
                    {t("videoRecorder.resume")}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={stopRecording}
                  className="gap-2 flex-1"
                >
                  <VideoOff className="w-4 h-4" />
                  {t("videoRecorder.stop")}
                </Button>
              </>
            )}
          </>
        )}
      </div>

      {/* Download Button */}
      {recordedBlob && (
        <Button
          onClick={downloadRecording}
          variant="outline"
          className="w-full gap-2"
        >
          <Download className="w-4 h-4" />
          {t("export.downloadVideo")}
        </Button>
      )}

      {/* File Size Info */}
      {recordedBlob && (
        <div className="text-sm text-gray-600 text-center">
          {(recordedBlob.size / 1024 / 1024).toFixed(2)} {t("export.mb")}
        </div>
      )}
    </div>
  );
};
