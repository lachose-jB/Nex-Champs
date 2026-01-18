import { apiClient } from "./apiClient";

export interface Annotation {
  id: string;
  meeting_id: string;
  participant_id: string;
  annotation_type: string;
  content: string;
  timestamp_ms: number;
  created_at?: string;
}

export interface CreateAnnotationRequest {
  participant_id: string;
  annotation_type: string;
  content: string;
  timestamp_ms: number;
}

class AnnotationService {
  async createAnnotation(
    meetingId: string,
    data: CreateAnnotationRequest
  ): Promise<Annotation> {
    const response = await apiClient.getClient().post<Annotation>(
      `/annotations/meetings/${meetingId}`,
      data
    );
    return response.data;
  }

  async listAnnotations(meetingId: string): Promise<Annotation[]> {
    const response = await apiClient.getClient().get<Annotation[]>(
      `/annotations/meetings/${meetingId}`
    );
    return response.data;
  }
}

export const annotationService = new AnnotationService();
