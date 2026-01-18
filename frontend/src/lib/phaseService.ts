import { apiClient } from "./apiClient";

export interface PhaseChangeRequest {
  phase_name: string;
  started_by: string;
}

class PhaseService {
  async changePhase(
    meetingId: string,
    data: PhaseChangeRequest
  ): Promise<{ success: boolean }> {
    const response = await apiClient.getClient().post<{ success: boolean }>(
      `/phases/meetings/${meetingId}/change`,
      data
    );
    return response.data;
  }
}

export const phaseService = new PhaseService();
