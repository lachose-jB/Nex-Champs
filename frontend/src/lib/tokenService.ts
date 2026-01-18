import { apiClient } from "./apiClient";

export interface Token {
  id: string;
  meeting_id: string;
  participant_id: string;
  available: number;
  used: number;
}

export interface TokenEvent {
  participant_id: string;
  event_type: "claim" | "release";
}

class TokenService {
  async claimToken(meetingId: string, data: TokenEvent): Promise<Token> {
    const response = await apiClient.getClient().post<Token>(
      `/tokens/meetings/${meetingId}/claim`,
      data
    );
    return response.data;
  }

  async releaseToken(meetingId: string, data: TokenEvent): Promise<Token> {
    const response = await apiClient.getClient().post<Token>(
      `/tokens/meetings/${meetingId}/release`,
      data
    );
    return response.data;
  }
}

export const tokenService = new TokenService();
