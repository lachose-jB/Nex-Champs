import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { Meeting, User } from './api';

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
    mutationFn: (data: { name: string; description?: string }) =>
      api.meetings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
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
