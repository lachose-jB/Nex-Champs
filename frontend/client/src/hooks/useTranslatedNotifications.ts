import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export interface MeetingNotification {
  type:
    | "tokenReceived"
    | "tokenExpired"
    | "phaseStarted"
    | "meetingEnded"
    | "participantJoined"
    | "participantLeft"
    | "annotationAdded"
    | "decisionMade";
  data?: Record<string, string | number>;
}

export const useTranslatedNotifications = () => {
  const { t } = useLanguage();

  const notify = (notification: MeetingNotification) => {
    const { type, data } = notification;

    let message = "";
    let duration = 3000;

    switch (type) {
      case "tokenReceived":
        message = t("notifications.tokenReceived");
        duration = 5000;
        toast.success(message, { duration });
        break;

      case "tokenExpired":
        message = t("notifications.tokenExpired");
        duration = 4000;
        toast.warning(message, { duration });
        break;

      case "phaseStarted":
        message = t("notifications.phaseStarted", {
          phase: data?.phase ? t(`phases.${data.phase}`) : "unknown",
        });
        duration = 4000;
        toast.info(message, { duration });
        break;

      case "meetingEnded":
        message = t("notifications.meetingEnded");
        duration = 5000;
        toast.success(message, { duration });
        break;

      case "participantJoined":
        message = t("notifications.participantJoined", {
          name: data?.name || "Unknown",
        });
        duration = 3000;
        toast.info(message, { duration });
        break;

      case "participantLeft":
        message = t("notifications.participantLeft", {
          name: data?.name || "Unknown",
        });
        duration = 3000;
        toast.info(message, { duration });
        break;

      case "annotationAdded":
        message = t("notifications.annotationAdded");
        duration = 2000;
        toast.success(message, { duration });
        break;

      case "decisionMade":
        message = t("notifications.decisionMade");
        duration = 4000;
        toast.success(message, { duration });
        break;

      default:
        message = "Unknown notification";
        toast.info(message, { duration });
    }
  };

  return { notify };
};
