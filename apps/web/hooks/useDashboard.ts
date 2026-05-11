"use client";
import { useQuery } from "@tanstack/react-query";
import { dashboard, checkins, profile } from "@/lib/api";

export function useDashboard() {
  const dash = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboard.get(),
    refetchInterval: 30000,
  });

  const checkIn = useQuery({
    queryKey: ["checkin-next"],
    queryFn: () => checkins.next(),
  });

  const prof = useQuery({
    queryKey: ["profile"],
    queryFn: () => profile.get(),
  });

  return {
    recommendation: dash.data?.recommendation,
    weightChart: dash.data?.weightChart || [],
    calorieChart: dash.data?.calorieChart || [],
    pastRecommendations: dash.data?.pastRecommendations || [],
    checkIn: checkIn.data?.checkIn,
    profile: prof.data?.profile,
    isLoading: dash.isLoading,
    error: dash.error,
    refetch: dash.refetch,
    refetchCheckIn: checkIn.refetch,
  };
}
