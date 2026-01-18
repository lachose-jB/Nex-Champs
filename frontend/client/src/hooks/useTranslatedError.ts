import { useLanguage } from "@/contexts/LanguageContext";
import { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "../../../server/routers";

export const useTranslatedError = () => {
  const { t } = useLanguage();

  const translateError = (error: unknown): string => {
    if (error instanceof TRPCClientError) {
      const code = error.data?.code;
      const message = error.message;

      // Map des erreurs tRPC vers les clés de traduction
      const errorMap: Record<string, string> = {
        PARSE_ERROR: "errors.unknownError",
        BAD_REQUEST: "errors.serverError",
        INTERNAL_SERVER_ERROR: "errors.serverError",
        UNAUTHORIZED: "errors.unauthorized",
        FORBIDDEN: "errors.permissionDenied",
        NOT_FOUND: "errors.meetingNotFound",
        CONFLICT: "errors.tokenAlreadyHeld",
        PRECONDITION_FAILED: "errors.invalidPhaseTransition",
        PAYLOAD_TOO_LARGE: "errors.serverError",
        METHOD_NOT_SUPPORTED: "errors.serverError",
        CLIENT_CLOSED_REQUEST: "errors.networkError",
      };

      // Chercher une traduction basée sur le code d'erreur
      if (code && errorMap[code]) {
        return t(errorMap[code]);
      }

      // Chercher une traduction basée sur le message d'erreur
      if (message.includes("Token")) {
        return t("errors.tokenError");
      }
      if (message.includes("annotation")) {
        return t("errors.annotationError");
      }
      if (message.includes("recording")) {
        return t("errors.recordingError");
      }
      if (message.includes("phase")) {
        return t("errors.phaseTransitionError");
      }
      if (message.includes("permission")) {
        return t("errors.permissionDenied");
      }

      // Retourner le message d'erreur par défaut
      return message || t("errors.unknownError");
    }

    if (error instanceof Error) {
      return error.message;
    }

    return t("errors.unknownError");
  };

  return { translateError };
};
