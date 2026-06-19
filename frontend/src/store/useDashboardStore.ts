import { create } from 'zustand';
import api from '@/services/api';

interface DashboardStats {
  total_interviews: number;
  total_practice_minutes: number;
  avg_overall_score: number;
  avg_content_score: number;
  avg_communication_score: number;
  avg_confidence_score: number;
  score_trend: { date: string; score: number }[];
  common_weaknesses: string[];
  recent_interviews: any[];
}

interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  fetchDashboardData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  loading: false,
  error: null,
  fetchDashboardData: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/analytics/overview');
      set({ stats: response.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Failed to fetch dashboard data', loading: false });
    }
  },
}));
