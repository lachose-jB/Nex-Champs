import { apiClient } from "./apiClient";

export interface Decision {
  id: string;
  meeting_id: string;
  title: string;
  description?: string;
  decided_by: string;
  phase: string;
  created_at?: string;
}

export interface CreateDecisionRequest {
  title: string;
  description?: string;
  decided_by: string;
  phase: string;
}

class DecisionService {
  async createDecision(
    meetingId: string,
    data: CreateDecisionRequest
  ): Promise<Decision> {
    const response = await apiClient.getClient().post<Decision>(
      `/decisions/meetings/${meetingId}`,
      data
    );
    return response.data;
  }

  async listDecisions(meetingId: string): Promise<Decision[]> {
    const response = await apiClient.getClient().get<Decision[]>(
      `/decisions/meetings/${meetingId}`
    );
    return response.data;
  }
}

export const decisionService = new DecisionService();
