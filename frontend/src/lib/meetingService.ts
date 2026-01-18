import { apiClient } from "./apiClient";

export interface Meeting {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateMeetingRequest {
  name: string;
  description?: string;
}

class MeetingService {
  async createMeeting(data: CreateMeetingRequest): Promise<Meeting> {
    const response = await apiClient.getClient().post<Meeting>(
      "/meetings/",
      data
    );
    return response.data;
  }

  async listMeetings(): Promise<Meeting[]> {
    const response = await apiClient.getClient().get<Meeting[]>("/meetings/");
    return response.data;
  }

  async getMeeting(id: string): Promise<Meeting> {
    const response = await apiClient.getClient().get<Meeting>(
      `/meetings/${id}`
    );
    return response.data;
  }
}

export const meetingService = new MeetingService();
