import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { Meeting, User, Participant } from './api';

// Meetings Hooks
export function useMeetings() {
  return useQuery({
    queryKey: ['meetings'],
    queryFn: () => api.meetings.list(),
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}

export function useMeetingById(meetingId: number) {
  return useQuery({
    queryKey: ['meetings', meetingId],
    queryFn: () => api.meetings.getById(meetingId),
    enabled: meetingId > 0,
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; scheduled_at?: string }) =>
      api.meetings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['meetings', 'user', 'created'] });
    },
  });
}

export function useJoinMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, data }: { meetingId: number; data: { name: string; role?: string } }) =>
      api.meetings.join(meetingId, data),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: ['meetings', meetingId, 'participants'] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}

export function useMeetingParticipants(meetingId: number) {
  return useQuery({
    queryKey: ['meetings', meetingId, 'participants'],
    queryFn: () => api.meetings.getParticipants(meetingId),
    enabled: meetingId > 0,
    refetchInterval: 3000, // Refetch every 3 seconds
  });
}

export function useLeaveMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: number) =>
      api.meetings.leave(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}

export function useInviteParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, data }: { meetingId: number; data: { name: string; role?: string; email?: string } }) =>
      api.meetings.invite(meetingId, data),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: ['meetings', meetingId, 'participants'] });
    },
  });
}

// Token Hooks
export function useClaimToken(meetingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (participantId: number) =>
      api.tokens.claim(meetingId, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens', meetingId] });
    },
  });
}

export function useReleaseToken(meetingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (participantId: number) =>
      api.tokens.release(meetingId, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens', meetingId] });
    },
  });
}

export function useTokenEvents(meetingId: number) {
  return useQuery({
    queryKey: ['tokens', meetingId],
    queryFn: () => api.tokens.getEvents(meetingId),
    enabled: meetingId > 0,
    refetchInterval: 1000, // Refetch every second for token state
  });
}

// Phases Hooks
export function useChangePhase(meetingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { phaseName: string; startedBy: number }) =>
      api.phases.change(meetingId, data.phaseName, data.startedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases', meetingId] });
    },
  });
}

// Annotations Hooks
export function useAnnotations(meetingId: number) {
  return useQuery({
    queryKey: ['annotations', meetingId],
    queryFn: () => api.annotations.list(meetingId),
    enabled: meetingId > 0,
  });
}

export function useCreateAnnotation(meetingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      participant_id: number;
      annotation_type: string;
      content: string;
      timestamp_ms: number;
    }) => api.annotations.create(meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', meetingId] });
    },
  });
}

// Decisions Hooks
export function useDecisions(meetingId: number) {
  return useQuery({
    queryKey: ['decisions', meetingId],
    queryFn: () => api.decisions.list(meetingId),
    enabled: meetingId > 0,
  });
}

export function useCreateDecision(meetingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      decided_by: number;
      phase: string;
    }) => api.decisions.create(meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions', meetingId] });
    },
  });
}

// Statistics Hooks
export function useMeetingStats(meetingId: number) {
  return useQuery({
    queryKey: ['stats', meetingId],
    queryFn: () => api.stats.getStats(meetingId),
    enabled: meetingId > 0,
  });
}

export function useAuditTrail(meetingId: number) {
  return useQuery({
    queryKey: ['audit', meetingId],
    queryFn: () => api.stats.getAudit(meetingId),
    enabled: meetingId > 0,
  });
}
// User Hooks
export function useUserProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => api.users.getProfile(),
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.users.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}

export function useDeleteUserAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => api.users.deleteAccount(password),
    onSuccess: () => {
      // Clear all user data on successful deletion
      queryClient.clear();
      localStorage.removeItem('auth_token');
    },
  });
}

export function useUserMeetings() {
  return useQuery({
    queryKey: ['meetings', 'user', 'created'],
    queryFn: () => api.meetings.getUserCreatedMeetings?.(),
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, data }: { meetingId: number; data: any }) =>
      api.meetings.update?.(meetingId, data),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['meetings', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['meetings', 'user', 'created'] });
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: number) => api.meetings.delete?.(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['meetings', 'user', 'created'] });
    },
  });
}