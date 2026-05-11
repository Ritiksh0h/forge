"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logs } from "@/lib/api";

export function useLog() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["history"] });
  };

  const weightMut = useMutation({
    mutationFn: (value: number) => logs.weight(value),
    onSuccess: invalidate,
  });

  const calorieMut = useMutation({
    mutationFn: (value: number) => logs.calories(value),
    onSuccess: invalidate,
  });

  const workoutMut = useMutation({
    mutationFn: (exercises: { name: string; weight: number; reps: number; sets: number }[]) =>
      logs.workout(exercises),
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: ({ type, id }: { type: string; id: string }) => logs.delete(type, id),
    onSuccess: invalidate,
  });

  return {
    logWeight: weightMut.mutateAsync,
    logCalories: calorieMut.mutateAsync,
    logWorkout: workoutMut.mutateAsync,
    deleteLog: deleteMut.mutateAsync,
    isLogging: weightMut.isPending || calorieMut.isPending || workoutMut.isPending,
  };
}
