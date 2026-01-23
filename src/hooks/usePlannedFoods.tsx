import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface PlannedFood {
  id: string;
  user_id: string;
  meal_plan_id: string;
  food_name: string;
  quantity_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
}

export function usePlannedFoods(mealPlanId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = mealPlanId 
    ? ['planned_foods', user?.id, mealPlanId]
    : ['planned_foods', user?.id];

  const { data: plannedFoods = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return [];
      
      const url = mealPlanId 
        ? `/planned-foods?meal_plan_id=${mealPlanId}`
        : '/planned-foods';
      
      const { data, error } = await api.get<PlannedFood[]>(url);

      if (error) throw new Error(error);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const addPlannedFood = useMutation({
    mutationFn: async (food: {
      meal_plan_id: string;
      food_name: string;
      quantity_grams: number;
      calories: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await api.post<PlannedFood>('/planned-foods', food);

      if (error) throw new Error(error);
      return data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_foods'] });
      queryClient.invalidateQueries({ queryKey: ['meal_plans'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Alimento adicionado ao plano!' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const updatePlannedFood = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PlannedFood> & { id: string }) => {
      const { data, error } = await api.put<PlannedFood>('/planned-foods', { id, ...updates });

      if (error) throw new Error(error);
      return data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_foods'] });
      queryClient.invalidateQueries({ queryKey: ['meal_plans'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Alimento atualizado!' });
    },
  });

  const deletePlannedFood = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.delete(`/planned-foods?id=${id}`);

      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_foods'] });
      queryClient.invalidateQueries({ queryKey: ['meal_plans'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Alimento removido do plano!' });
    },
  });

  return {
    plannedFoods,
    isLoading,
    addPlannedFood: addPlannedFood.mutate,
    updatePlannedFood: updatePlannedFood.mutate,
    deletePlannedFood: deletePlannedFood.mutate,
    isAdding: addPlannedFood.isPending,
  };
}
