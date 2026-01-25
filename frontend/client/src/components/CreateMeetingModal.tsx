import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";

interface CreateMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMeetingCreated?: () => void;
  onSubmit: (data: { name: string; description?: string; scheduled_at?: string }) => Promise<void>;
  isLoading?: boolean;
}

export default function CreateMeetingModal({
  open,
  onOpenChange,
  onMeetingCreated,
  onSubmit,
  isLoading = false,
}: CreateMeetingModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error(t("meetings.nameRequired") || "Meeting name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        scheduled_at: scheduledAt || undefined,
      });
      
      toast.success(t("meetings.createdSuccess") || "Meeting created successfully");
      setName("");
      setDescription("");
      setScheduledAt("");
      onOpenChange(false);
      onMeetingCreated?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("meetings.createNew") || "Create New Meeting"}</DialogTitle>
          <DialogDescription>
            {t("meetings.createDescription") || "Create a new meeting or schedule one for later"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Meeting Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t("meetings.name") || "Meeting Name"}</Label>
            <Input
              id="name"
              placeholder={t("meetings.namePlaceholder") || "Enter meeting name..."}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting || isLoading}
              className="w-full"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t("meetings.description") || "Description"}</Label>
            <Textarea
              id="description"
              placeholder={t("meetings.descriptionPlaceholder") || "Enter meeting description (optional)..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting || isLoading}
              className="w-full min-h-[100px] resize-none"
            />
          </div>

          {/* Scheduled Date/Time */}
          <div className="space-y-2">
            <Label htmlFor="scheduled_at" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t("meetings.schedule") || "Schedule (Optional)"}
            </Label>
            <Input
              id="scheduled_at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              disabled={isSubmitting || isLoading}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              {t("meetings.scheduleHint") || "Leave empty to create immediately"}
            </p>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setName("");
                setDescription("");
                setScheduledAt("");
              }}
              disabled={isSubmitting || isLoading}
            >
              {t("meetings.cancel") || "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading || !name.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("meetings.creating") || "Creating..."}
                </>
              ) : (
                t("meetings.create") || "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
