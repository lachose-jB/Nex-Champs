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
// ============================================
// Generic fetch wrapper with auto token handling
// ============================================

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getValidToken(); // <-- Toujours utiliser le token valide

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
    credentials: 'include',
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
      // fallback
    }
    throw new ApiError(response.status, errorMessage);
  }

  if (response.status === 204) return undefined as T;

  return response.json();
}


// ============================================
// AUTH ENDPOINTS
// ============================================

export interface LoginResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role?: string;
  is_verified?: boolean;
  created_at?: string;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface SignupResponse {
  access_token(arg0: string, access_token: any): unknown;
  id: number;
  username: string;
  email: string;
  message: string;
}

export const authAPI = {
  /**
   * Register a new user
   * POST /auth/signup
   */
  signup: async (data: SignupData): Promise<SignupResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMessage = 'Signup failed';
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
  },

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
      let errorMessage = 'Login failed';
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : 'Invalid credentials';
        }
      } catch (e) {
        // Use default error message
      }
      throw new ApiError(response.status, errorMessage);
    }

    return response.json();
  },

  /**
   * Get current user information
   * GET /auth/users/me/
   */
  getCurrentUser: async (): Promise<User> => {
    return apiCall<User>('/auth/users/me/');
  },

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    return apiCall<LoginResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },

  /**
   * Request password reset
   * POST /auth/password-reset/request
   */
  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    return apiCall<{ message: string }>('/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Reset password with token
   * POST /auth/password-reset/confirm
   */
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    return apiCall<{ message: string }>('/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  },

  /**
   * Verify email address
   * POST /auth/verify-email
   */
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    return apiCall<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  /**
   * Logout (clear token)
   */
  logout: async (): Promise<void> => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  },
};

// ============================================
// MEETING ENDPOINTS
// ============================================

export interface Meeting {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  current_phase?: string;
  creator_id?: number;
  scheduled_at?: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
  participants?: Participant[];
}

export interface Participant {
  id: number;
  user_id: string;
  name: string;
  role: 'participant' | 'facilitator' | 'observer';
  is_active: boolean;
  meeting_id: number;
}

export const meetingsAPI = {
  /**
   * Create a new meeting
   * POST /meetings/
   */
  create: async (data: { name: string; description?: string; scheduled_at?: string }): Promise<Meeting> => {
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
   * Get user's created meetings
   * GET /meetings/me/created
   */
  getUserCreatedMeetings: async (): Promise<Meeting[]> => {
    return apiCall<Meeting[]>('/meetings/me/created');
  },

  /**
   * Get meeting details
   * GET /meetings/{id}
   */
  getById: async (meetingId: number): Promise<Meeting> => {
    return apiCall<Meeting>(`/meetings/${meetingId}`);
  },

  /**
   * Update meeting details
   * PUT /meetings/{id}
   */
  update: async (meetingId: number, data: { name?: string; description?: string; status?: string }): Promise<Meeting> => {
    return apiCall<Meeting>(`/meetings/${meetingId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a meeting
   * DELETE /meetings/{id}
   */
  delete: async (meetingId: number): Promise<void> => {
    return apiCall<void>(`/meetings/${meetingId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Join an existing meeting
   * POST /meetings/{id}/join
   */
  join: async (meetingId: number, data: { name: string; role?: string }): Promise<{ message: string; meeting_id: number; participant_id: number }> => {
    return apiCall<{ message: string; meeting_id: number; participant_id: number }>(`/meetings/${meetingId}/join`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get participants for a meeting
   * GET /meetings/{id}/participants
   */
  getParticipants: async (meetingId: number): Promise<Participant[]> => {
    return apiCall<Participant[]>(`/meetings/${meetingId}/participants`);
  },

  /**
   * Leave a meeting
   * POST /meetings/{id}/leave
   */
  leave: async (meetingId: number): Promise<{ message: string; meeting_id: number }> => {
    return apiCall<{ message: string; meeting_id: number }>(`/meetings/${meetingId}/leave`, {
      method: 'POST',
    });
  },

  /**
   * Invite a participant to a meeting
   * POST /meetings/{id}/invite
   */
  invite: async (meetingId: number, data: { name: string; role?: string; email?: string }): Promise<{ message: string; invitation_id: number }> => {
    return apiCall<{ message: string; invitation_id: number }>(`/meetings/${meetingId}/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Start a meeting
   * POST /meetings/{id}/start
   */
  start: async (meetingId: number): Promise<{ message: string; meeting_id: number }> => {
    return apiCall<{ message: string; meeting_id: number }>(`/meetings/${meetingId}/start`, {
      method: 'POST',
    });
  },

  /**
   * End a meeting
   * POST /meetings/{id}/end
   */
  end: async (meetingId: number): Promise<{ message: string; meeting_id: number }> => {
    return apiCall<{ message: string; meeting_id: number }>(`/meetings/${meetingId}/end`, {
      method: 'POST',
    });
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

export interface TokenStatus {
  meeting_id: number;
  current_holder?: {
    participant_id: number;
    participant_name: string;
    claimed_at: string;
  };
  is_available: boolean;
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
   * Get current token status
   * GET /tokens/meetings/{meeting_id}/status
   */
  getStatus: async (meetingId: number): Promise<TokenStatus> => {
    return apiCall<TokenStatus>(`/tokens/meetings/${meetingId}/status`);
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

export interface PhaseStatus {
  meeting_id: number;
  current_phase: string;
  started_at: string;
  started_by: number;
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

  /**
   * Get current phase status
   * GET /phases/meetings/{meeting_id}/current
   */
  getCurrent: async (meetingId: number): Promise<PhaseStatus> => {
    return apiCall<PhaseStatus>(`/phases/meetings/${meetingId}/current`);
  },

  /**
   * Get phase history
   * GET /phases/meetings/{meeting_id}/history
   */
  getHistory: async (meetingId: number): Promise<PhaseEvent[]> => {
    return apiCall<PhaseEvent[]>(`/phases/meetings/${meetingId}/history`);
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
  list: async (meetingId: number, filters?: { annotation_type?: string; participant_id?: number }): Promise<Annotation[]> => {
    const params = new URLSearchParams();
    if (filters?.annotation_type) params.append('annotation_type', filters.annotation_type);
    if (filters?.participant_id) params.append('participant_id', filters.participant_id.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/annotations/meetings/${meetingId}?${queryString}` : `/annotations/meetings/${meetingId}`;
    
    return apiCall<Annotation[]>(endpoint);
  },

  /**
   * Delete an annotation
   * DELETE /annotations/{annotation_id}
   */
  delete: async (annotationId: number): Promise<void> => {
    return apiCall<void>(`/annotations/${annotationId}`, {
      method: 'DELETE',
    });
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

  /**
   * Get a specific decision
   * GET /decisions/{decision_id}
   */
  getById: async (decisionId: number): Promise<Decision> => {
    return apiCall<Decision>(`/decisions/${decisionId}`);
  },

  /**
   * Update a decision
   * PUT /decisions/{decision_id}
   */
  update: async (decisionId: number, data: { title?: string; description?: string }): Promise<Decision> => {
    return apiCall<Decision>(`/decisions/${decisionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a decision
   * DELETE /decisions/{decision_id}
   */
  delete: async (decisionId: number): Promise<void> => {
    return apiCall<void>(`/decisions/${decisionId}`, {
      method: 'DELETE',
    });
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
  total_duration_ms?: number;
  phases_count?: number;
  annotations_count?: number;
  decisions_count?: number;
  participant_stats?: Array<{
    participant_id: number;
    participant_name: string;
    speaking_time_ms: number;
    token_claims: number;
    annotations_count: number;
  }>;
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

  /**
   * Export meeting data
   * GET /stats/meetings/{meeting_id}/export
   */
  exportData: async (meetingId: number, format: 'json' | 'csv' = 'json'): Promise<Blob> => {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/stats/meetings/${meetingId}/export?format=${format}`, {
      headers,
    });

    if (!response.ok) {
      throw new ApiError(response.status, 'Export failed');
    }

    return response.blob();
  },
};

// ============================================
// USERS API
// ============================================

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  language_preference: string;
  is_active: boolean;
}

export interface UserUpdateData {
  full_name?: string;
  email?: string;
  avatar_url?: string;
  language_preference?: string;
  password?: string;
}

export const usersAPI = {
  /**
   * Get current user profile
   * GET /users/me
   */
  getProfile: async (): Promise<UserProfile> => {
    return apiCall<UserProfile>('/users/me');
  },

  /**
   * Update user profile
   * PUT /users/me
   */
  updateProfile: async (data: UserUpdateData): Promise<UserProfile> => {
    return apiCall<UserProfile>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete user account (GDPR)
   * DELETE /users/me
   */
  deleteAccount: async (password: string): Promise<void> => {
    return apiCall<void>('/users/me', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  },
};

// ============================================
// WEBSOCKET HELPER
// ============================================

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp?: string;
}

export class MeetingWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, Set<(payload: any) => void>> = new Map();

  constructor(private meetingId: number) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('auth_token');
      const wsUrl = `ws://localhost:8000/ws/meetings/${this.meetingId}${token ? `?token=${token}` : ''}`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onerror = (error) => {
        reject(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        this.attemptReconnect();
      };
    });
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message.payload));
    }
  }

  on(messageType: string, handler: (payload: any) => void): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set());
    }
    this.messageHandlers.get(messageType)!.add(handler);
  }

  off(messageType: string, handler: (payload: any) => void): void {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
  }
}

/**
 * Helper function to save authentication tokens
 */
export const saveAuthTokens = (tokens: LoginResponse): void => {
  localStorage.setItem('auth_token', tokens.access_token);
  if (tokens.refresh_token) {
    localStorage.setItem('refresh_token', tokens.refresh_token);
  }
  if (tokens.expires_in) {
    const expiresAt = Date.now() + tokens.expires_in * 1000;
    localStorage.setItem('token_expires_at', expiresAt.toString());
  }
};

/**
 * Helper function to check if token is expired
 */
export const isTokenExpired = (): boolean => {
  const expiresAt = localStorage.getItem('token_expires_at');
  if (!expiresAt) return false;
  return Date.now() > parseInt(expiresAt);
};

/**
 * Helper function to get valid token (refresh if needed)
 */
export const getValidToken = async (): Promise<string | null> => {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;
  
  if (isTokenExpired()) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      authAPI.logout();
      return null;
    }
    
    try {
      const newTokens = await authAPI.refreshToken(refreshToken);
      saveAuthTokens(newTokens);
      return newTokens.access_token;
    } catch (error) {
      authAPI.logout();
      return null;
    }
  }
  
  return token;
};

// ============================================
// EXPORT ALL APIs
// ============================================

export const api = {
  auth: authAPI,
  users: usersAPI,
  meetings: meetingsAPI,
  tokens: tokensAPI,
  phases: phasesAPI,
  annotations: annotationsAPI,
  decisions: decisionsAPI,
  stats: statsAPI,
};

export default api;