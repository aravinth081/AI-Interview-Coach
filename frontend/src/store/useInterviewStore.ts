import { create } from 'zustand';
import api from '@/services/api';

interface Interview {
  id: string;
  title: string;
  interview_type: string;
  status: string;
}

interface InterviewState {
  currentInterview: Interview | null;
  loading: boolean;
  error: string | null;
  startInterview: (data: { title: string; interview_type: string }) => Promise<string | null>;
}

export const useInterviewStore = create<InterviewState>((set) => ({
  currentInterview: null,
  loading: false,
  error: null,
  startInterview: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/interviews/', data);
      set({ currentInterview: response.data, loading: false });
      return response.data.id;
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Failed to start interview', loading: false });
      return null;
    }
  },
}));
