import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Eye, Mic, PenTool, Vote } from "lucide-react";

export type UserRole = "facilitator" | "participant" | "observer";

interface RoleInfo {
  canSpeak: boolean;
  canAnnotate: boolean;
  canVote: boolean;
  canManagePhases: boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, RoleInfo> = {
  facilitator: {
    canSpeak: true,
    canAnnotate: true,
    canVote: true,
    canManagePhases: true,
  },
  participant: {
    canSpeak: true,
    canAnnotate: true,
    canVote: true,
    canManagePhases: false,
  },
  observer: {
    canSpeak: false,
    canAnnotate: false,
    canVote: false,
    canManagePhases: false,
  },
};

interface RoleAndPermissionsProps {
  userRole: UserRole;
  userId?: number;
  userName?: string;
  hasToken?: boolean;
  isTokenWaiting?: boolean;
}

export default function RoleAndPermissions({
  userRole,
  userId,
  userName,
  hasToken = false,
  isTokenWaiting = false,
}: RoleAndPermissionsProps) {
  const { t } = useLanguage();
  const permissions = ROLE_PERMISSIONS[userRole];

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "facilitator":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "participant":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "observer":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100";
    }
  };

  const getPermissionIcon = (permission: boolean) => {
    return permission ? (
      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
        <span className="text-white text-xs">✓</span>
      </div>
    ) : (
      <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center">
        <span className="text-white text-xs">✗</span>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {t("role.roleAndPermissions") || "Role & Permissions"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Role Badge */}
        <div>
          <p className="text-xs text-gray-600 mb-2">
            {t("role.yourRole") || "Your Role"}:
          </p>
          <Badge
            className={`${getRoleColor(userRole)} border text-xs font-semibold px-3 py-1`}
          >
            {t(`roles.${userRole}`) || userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </Badge>
        </div>

        {/* Permissions Grid */}
        <div className="grid grid-cols-1 gap-2">
          {/* Can Speak */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                {t("permission.canSpeak") || "Can Speak"}
              </span>
            </div>
            {getPermissionIcon(permissions.canSpeak)}
          </div>

          {/* Can Annotate */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                {t("permission.canAnnotate") || "Can Annotate & Draw"}
              </span>
            </div>
            {getPermissionIcon(
              permissions.canAnnotate && (hasToken || userRole === "facilitator")
            )}
          </div>

          {/* Can Vote */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
            <div className="flex items-center gap-2">
              <Vote className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                {t("permission.canVote") || "Can Vote"}
              </span>
            </div>
            {getPermissionIcon(permissions.canVote)}
          </div>

          {/* Can Manage Phases */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                {t("permission.canManagePhases") || "Can Manage Phases"}
              </span>
            </div>
            {getPermissionIcon(permissions.canManagePhases)}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="pt-2 border-t space-y-2">
          {hasToken && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-green-800">
                {t("token.youHaveToken") || "You have the speaking token"}
              </span>
            </div>
          )}

          {isTokenWaiting && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
              <span className="text-sm text-yellow-800">
                {t("token.waitingForToken") || "Waiting for speaking token"}
              </span>
            </div>
          )}
        </div>

        {/* Role Description */}
        <div className="text-xs text-gray-600 bg-white rounded-lg p-2 border border-gray-200">
          <p className="font-semibold mb-1">
            {t(`roles.${userRole}`)} {t("role.description") || "Description"}:
          </p>
          <p>
            {userRole === "facilitator" &&
              (t("roleDesc.facilitator") ||
                "Manages meeting flow, controls phases, has authority over annotations")}
            {userRole === "participant" &&
              (t("roleDesc.participant") ||
                "Can speak (with token), annotate when speaking, and vote")}
            {userRole === "observer" &&
              (t("roleDesc.observer") ||
                "Can view the meeting but cannot speak or vote")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
