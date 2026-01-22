import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface MealPlan {
  id: string;
  user_id: string;
  name: string;
  target_calories: number;
  meal_order: number;
  is_default: boolean;
  created_at: string;
}

const DEFAULT_MEALS = [
  { name: 'Café da manhã', target_calories: 400, meal_order: 1 },
  { name: 'Almoço', target_calories: 600, meal_order: 2 },
  { name: 'Lanche', target_calories: 200, meal_order: 3 },
  { name: 'Jantar', target_calories: 500, meal_order: 4 },
];

export function useMealPlans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mealPlans = [], isLoading } = useQuery({
    queryKey: ['meal_plans', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await api.get<MealPlan[]>('/meal-plans');

      if (error) throw new Error(error);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createDefaultMeals = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await api.post<MealPlan[]>('/meal-plans', {
        action: 'createDefaults',
      });

      if (error) throw new Error(error);
      return data || [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal_plans', user?.id] });
    },
  });

  const addMealPlan = useMutation({
    mutationFn: async (meal: { name: string; target_calories: number }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await api.post<MealPlan>('/meal-plans', {
        action: 'create',
        ...meal,
      });

      if (error) throw new Error(error);
      return data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal_plans', user?.id] });
      toast({ title: 'Refeição adicionada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const updateMealPlan = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MealPlan> & { id: string }) => {
      const { data, error } = await api.put<MealPlan>('/meal-plans', { id, ...updates });

      if (error) throw new Error(error);
      return data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal_plans', user?.id] });
      toast({ title: 'Refeição atualizada!' });
    },
  });

  const deleteMealPlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.delete(`/meal-plans?id=${id}`);

      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal_plans', user?.id] });
      toast({ title: 'Refeição removida!' });
    },
  });

  return {
    mealPlans,
    isLoading,
    createDefaultMeals: createDefaultMeals.mutate,
    addMealPlan: addMealPlan.mutate,
    updateMealPlan: updateMealPlan.mutate,
    deleteMealPlan: deleteMealPlan.mutate,
    isCreatingDefaults: createDefaultMeals.isPending,
  };
}
