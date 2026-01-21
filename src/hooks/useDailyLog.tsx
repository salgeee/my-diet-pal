import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export interface FoodEntry {
  id: string;
  user_id: string;
  daily_log_id: string;
  meal_plan_id: string | null;
  food_name: string;
  quantity_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string;
  weight: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useDailyLog(date: Date = new Date()) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const dateStr = format(date, 'yyyy-MM-dd');

  const { data: dailyLog, isLoading: isLoadingLog } = useQuery({
    queryKey: ['daily_log', user?.id, dateStr],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', dateStr)
        .maybeSingle();

      if (error) throw error;
      return data as DailyLog | null;
    },
    enabled: !!user?.id,
  });

  const { data: foodEntries = [], isLoading: isLoadingEntries } = useQuery({
    queryKey: ['food_entries', dailyLog?.id],
    queryFn: async () => {
      if (!dailyLog?.id) return [];
      
      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .eq('daily_log_id', dailyLog.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as FoodEntry[];
    },
    enabled: !!dailyLog?.id,
  });

  const createOrGetLog = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      // First try to get existing log
      const { data: existing } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', dateStr)
        .maybeSingle();

      if (existing) return existing;

      // Create new log
      const { data, error } = await supabase
        .from('daily_logs')
        .insert({ user_id: user.id, log_date: dateStr })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_log', user?.id, dateStr] });
    },
  });

  const addFoodEntry = useMutation({
    mutationFn: async (entry: {
      food_name: string;
      quantity_grams: number;
      calories: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      meal_plan_id?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Ensure daily log exists
      let logId = dailyLog?.id;
      if (!logId) {
        const log = await createOrGetLog.mutateAsync();
        logId = log.id;
      }

      const { data, error } = await supabase
        .from('food_entries')
        .insert({
          ...entry,
          user_id: user.id,
          daily_log_id: logId,
          protein: entry.protein || 0,
          carbs: entry.carbs || 0,
          fat: entry.fat || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food_entries', dailyLog?.id] });
      queryClient.invalidateQueries({ queryKey: ['daily_log', user?.id, dateStr] });
      toast({ title: 'Alimento adicionado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const deleteFoodEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food_entries', dailyLog?.id] });
      toast({ title: 'Alimento removido!' });
    },
  });

  const totalCalories = foodEntries.reduce((sum, entry) => sum + Number(entry.calories), 0);
  const totalProtein = foodEntries.reduce((sum, entry) => sum + Number(entry.protein), 0);
  const totalCarbs = foodEntries.reduce((sum, entry) => sum + Number(entry.carbs), 0);
  const totalFat = foodEntries.reduce((sum, entry) => sum + Number(entry.fat), 0);

  return {
    dailyLog,
    foodEntries,
    isLoading: isLoadingLog || isLoadingEntries,
    addFoodEntry: addFoodEntry.mutate,
    deleteFoodEntry: deleteFoodEntry.mutate,
    isAdding: addFoodEntry.isPending,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
  };
}
