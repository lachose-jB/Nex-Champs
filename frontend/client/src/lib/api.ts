/**
 * API Client for Backend Communication
 * Base URL: http://localhost:8000/api/v1
 */

const API_BASE_URL = 'http://localhost:8000/api/v1';

interface ApiErrorResponse {
  detail?: string | { msg: string }[];
  message?: string;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    try {
      const errorData: ApiErrorResponse = await response.json();
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail.map(d => d.msg).join(', ');
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      // Use default error message
    }
    throw new ApiError(response.status, errorMessage);
  }

  return response.json();
}

// ============================================
// AUTH ENDPOINTS
// ============================================

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
  full_name?: string;
}

export interface SignupResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authAPI = {
  /**
   * Login with username and password
   * POST /auth/token
   */
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new ApiError(response.status, 'Login failed');
    }

    return response.json();
  },

  /**
   * Get current user information
   * GET /auth/users/me
   */
  getCurrentUser: async (): Promise<User> => {
    return apiCall<User>('/auth/users/me');
  },

  /**
   * Signup with email, password, and full name
   * POST /auth/signup
   */
  signup: async (email: string, password: string, fullName: string): Promise<SignupResponse> => {
    return apiCall<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
  },

  /**
   * Logout (clear token)
   */
  logout: async (): Promise<void> => {
    localStorage.removeItem('auth_token');
  },
};

// ============================================
// MEETING ENDPOINTS
// ============================================

export interface Meeting {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
}

export const meetingsAPI = {
  /**
   * Create a new meeting
   * POST /meetings/
   */
  create: async (data: { name: string; description?: string }): Promise<Meeting> => {
    return apiCall<Meeting>('/meetings/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * List all meetings
   * GET /meetings/
   */
  list: async (): Promise<Meeting[]> => {
    return apiCall<Meeting[]>('/meetings/');
  },

  /**
   * Get meeting details
   * GET /meetings/{id}
   */
  getById: async (meetingId: number): Promise<Meeting> => {
    return apiCall<Meeting>(`/meetings/${meetingId}`);
  },
};

// ============================================
// TOKEN ENDPOINTS
// ============================================

export interface TokenEvent {
  id: number;
  meeting_id: number;
  participant_id: number;
  event_type: 'claim' | 'release';
  timestamp?: string;
}

export const tokensAPI = {
  /**
   * Claim token for a participant
   * POST /tokens/meetings/{meeting_id}/claim
   */
  claim: async (
    meetingId: number,
    participantId: number,
  ): Promise<TokenEvent> => {
    return apiCall<TokenEvent>(
      `/tokens/meetings/${meetingId}/claim`,
      {
        method: 'POST',
        body: JSON.stringify({ participant_id: participantId, event_type: 'claim' }),
      },
    );
  },

  /**
   * Release token
   * POST /tokens/meetings/{meeting_id}/release
   */
  release: async (
    meetingId: number,
    participantId: number,
  ): Promise<TokenEvent> => {
    return apiCall<TokenEvent>(
      `/tokens/meetings/${meetingId}/release`,
      {
        method: 'POST',
        body: JSON.stringify({ participant_id: participantId, event_type: 'release' }),
      },
    );
  },

  /**
   * Get token events for a meeting
   * GET /tokens/meetings/{meeting_id}/events
   */
  getEvents: async (meetingId: number): Promise<TokenEvent[]> => {
    return apiCall<TokenEvent[]>(`/tokens/meetings/${meetingId}/events`);
  },
};

// ============================================
// PHASES ENDPOINTS
// ============================================

export interface PhaseEvent {
  id: number;
  meeting_id: number;
  phase_name: string;
  started_by: number;
  timestamp?: string;
}

export const phasesAPI = {
  /**
   * Change meeting phase
   * POST /phases/meetings/{meeting_id}/change
   */
  change: async (
    meetingId: number,
    phaseName: string,
    startedBy: number,
  ): Promise<PhaseEvent> => {
    return apiCall<PhaseEvent>(
      `/phases/meetings/${meetingId}/change`,
      {
        method: 'POST',
        body: JSON.stringify({
          phase_name: phaseName,
          started_by: startedBy,
        }),
      },
    );
  },
};

// ============================================
// ANNOTATIONS ENDPOINTS
// ============================================

export interface Annotation {
  id: number;
  meeting_id: number;
  participant_id: number;
  annotation_type: string;
  content: string;
  timestamp_ms: number;
  created_at?: string;
}

export const annotationsAPI = {
  /**
   * Create annotation
   * POST /annotations/meetings/{meeting_id}
   */
  create: async (
    meetingId: number,
    data: {
      participant_id: number;
      annotation_type: string;
      content: string;
      timestamp_ms: number;
    },
  ): Promise<Annotation> => {
    return apiCall<Annotation>(
      `/annotations/meetings/${meetingId}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
  },

  /**
   * List annotations for a meeting
   * GET /annotations/meetings/{meeting_id}
   */
  list: async (meetingId: number): Promise<Annotation[]> => {
    return apiCall<Annotation[]>(`/annotations/meetings/${meetingId}`);
  },
};

// ============================================
// DECISIONS ENDPOINTS
// ============================================

export interface Decision {
  id: number;
  meeting_id: number;
  title: string;
  description: string;
  decided_by: number;
  phase: string;
  created_at?: string;
}

export const decisionsAPI = {
  /**
   * Create decision
   * POST /decisions/meetings/{meeting_id}
   */
  create: async (
    meetingId: number,
    data: {
      title: string;
      description: string;
      decided_by: number;
      phase: string;
    },
  ): Promise<Decision> => {
    return apiCall<Decision>(
      `/decisions/meetings/${meetingId}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
  },

  /**
   * List decisions for a meeting
   * GET /decisions/meetings/{meeting_id}
   */
  list: async (meetingId: number): Promise<Decision[]> => {
    return apiCall<Decision[]>(`/decisions/meetings/${meetingId}`);
  },
};

// ============================================
// STATISTICS ENDPOINTS
// ============================================

export interface MeetingStats {
  meeting_id: number;
  total_participants: number;
  average_speaking_time: number;
  token_claims: number;
  [key: string]: any;
}

export interface AuditTrail {
  id: number;
  meeting_id: number;
  action: string;
  user_id: number;
  timestamp: string;
  details: string;
}

export const statsAPI = {
  /**
   * Get meeting statistics
   * GET /stats/meetings/{meeting_id}/stats
   */
  getStats: async (meetingId: number): Promise<MeetingStats> => {
    return apiCall<MeetingStats>(`/stats/meetings/${meetingId}/stats`);
  },

  /**
   * Get audit trail
   * GET /stats/meetings/{meeting_id}/audit
   */
  getAudit: async (meetingId: number): Promise<AuditTrail[]> => {
    return apiCall<AuditTrail[]>(`/stats/meetings/${meetingId}/audit`);
  },
};

// ============================================
// EXPORT ALL APIs
// ============================================

export const api = {
  auth: authAPI,
  meetings: meetingsAPI,
  tokens: tokensAPI,
  phases: phasesAPI,
  annotations: annotationsAPI,
  decisions: decisionsAPI,
  stats: statsAPI,
};
