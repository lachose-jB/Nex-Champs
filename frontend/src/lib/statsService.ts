import { apiClient } from "./apiClient";

export interface MeetingStats {
  total_participants: number;
  total_tokens_distributed: number;
  total_tokens_used: number;
  phase_distribution: Record<string, number>;
}

export interface AuditTrail {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

class StatsService {
  async getMeetingStats(meetingId: string): Promise<MeetingStats> {
    const response = await apiClient.getClient().get<MeetingStats>(
      `/stats/meetings/${meetingId}/stats`
    );
    return response.data;
  }

  async getAuditTrail(meetingId: string): Promise<AuditTrail[]> {
    const response = await apiClient.getClient().get<AuditTrail[]>(
      `/stats/meetings/${meetingId}/audit`
    );
    return response.data;
  }
}

export const statsService = new StatsService();
