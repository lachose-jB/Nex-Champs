import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Home, Mail } from "lucide-react";
import { toast } from "sonner";

interface HeaderProps {
  title?: string;
  participantCount?: number;
}

export function Header({ title, participantCount }: HeaderProps) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/login");
      toast.success(t("common.logout"));
    } catch (error) {
      toast.error(t("errors.logout"));
    }
  };

  const handleNavigate = (path: string) => {
    setLocation(path);
  };

  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {title || t("meeting.title")}
          </h1>
          {participantCount !== undefined && (
            <p className="text-sm text-gray-600 mt-1">
              {participantCount} {t("meeting.participants")}
            </p>
          )}
        </div>

          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full p-0"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {getUserInitials(user?.username)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.username}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleNavigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>{t("menu.profile")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigate("/meetings")}>
              <Home className="mr-2 h-4 w-4" />
              <span>{t("menu.myMeetings")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigate("/invitations")}>
              <Mail className="mr-2 h-4 w-4" />
              <span>{t("menu.invitations")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t("common.logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
