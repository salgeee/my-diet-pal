import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
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

  const { data: logData, isLoading: isLoadingLog } = useQuery({
    queryKey: ['daily_log', user?.id, dateStr],
    queryFn: async () => {
      if (!user?.id) return { dailyLog: null, foodEntries: [] };
      
      const { data, error } = await api.get<{ dailyLog: DailyLog | null; foodEntries: FoodEntry[] }>(
        `/daily-log?date=${dateStr}`
      );

      if (error) throw new Error(error);
      return data || { dailyLog: null, foodEntries: [] };
    },
    enabled: !!user?.id,
  });

  const dailyLog = logData?.dailyLog || null;
  const foodEntries = logData?.foodEntries || [];
  const isLoadingEntries = false;

  const createOrGetLog = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await api.post<DailyLog>('/daily-log', {
        action: 'create',
      });

      if (error) throw new Error(error);
      return data!;
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

      const { data, error } = await api.post<FoodEntry>('/daily-log', {
        action: 'addFood',
        date: dateStr, // Passar a data explicitamente
        ...entry,
        protein: entry.protein || 0,
        carbs: entry.carbs || 0,
        fat: entry.fat || 0,
      });

      if (error) throw new Error(error);
      return data!;
    },
    onSuccess: () => {
      // Invalidar e refetch imediatamente
      queryClient.invalidateQueries({ queryKey: ['daily_log', user?.id, dateStr] });
      queryClient.refetchQueries({ queryKey: ['daily_log', user?.id, dateStr] });
      toast({ title: 'Alimento adicionado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const deleteFoodEntry = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await api.delete(`/daily-log?foodEntryId=${id}`);

      if (error) throw new Error(error);
    },
    onSuccess: () => {
      // Invalidar e refetch imediatamente
      queryClient.invalidateQueries({ queryKey: ['daily_log', user?.id, dateStr] });
      queryClient.refetchQueries({ queryKey: ['daily_log', user?.id, dateStr] });
      toast({ title: 'Alimento removido!' });
    },
    onError: (error) => {
      toast({ 
        title: 'Erro ao remover', 
        description: error.message || 'Não foi possível remover o alimento',
        variant: 'destructive' 
      });
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
