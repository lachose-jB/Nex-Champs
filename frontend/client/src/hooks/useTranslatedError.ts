import { useLanguage } from "@/contexts/LanguageContext";
import { ApiError } from "@/lib/api";

export const useTranslatedError = () => {
  const { t } = useLanguage();

  const translateError = (error: unknown): string => {
    if (error instanceof ApiError) {
      // Map des erreurs API HTTP vers les clés de traduction
      const errorMap: Record<number, string> = {
        400: "errors.serverError",
        401: "errors.unauthorized",
        403: "errors.permissionDenied",
        404: "errors.meetingNotFound",
        409: "errors.tokenAlreadyHeld",
        412: "errors.invalidPhaseTransition",
        413: "errors.serverError",
        500: "errors.serverError",
      };

      // Chercher une traduction basée sur le code de statut HTTP
      if (errorMap[error.statusCode]) {
        return t(errorMap[error.statusCode]);
      }

      return error.message || t("errors.unknownError");
    }

    if (error instanceof Error) {
      // Map des erreurs par keywords
      if (error.message.includes("Token")) {
        return t("errors.tokenError");
      }
      if (error.message.includes("annotation")) {
        return t("errors.annotationError");
      }
      if (error.message.includes("recording")) {
        return t("errors.recordingError");
      }
      if (error.message.includes("phase")) {
        return t("errors.phaseTransitionError");
      }
      if (error.message.includes("permission")) {
        return t("errors.permissionDenied");
      }
      return error.message;
    }

    return t("errors.unknownError");
  };

  return { translateError };
};
