import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
      
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('meal_order', { ascending: true });

      if (error) throw error;
      return data as MealPlan[];
    },
    enabled: !!user?.id,
  });

  const createDefaultMeals = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const mealsToInsert = DEFAULT_MEALS.map(meal => ({
        ...meal,
        user_id: user.id,
        is_default: true,
      }));

      const { data, error } = await supabase
        .from('meal_plans')
        .insert(mealsToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal_plans', user?.id] });
    },
  });

  const addMealPlan = useMutation({
    mutationFn: async (meal: { name: string; target_calories: number }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const maxOrder = Math.max(...mealPlans.map(m => m.meal_order), 0);

      const { data, error } = await supabase
        .from('meal_plans')
        .insert({
          ...meal,
          user_id: user.id,
          meal_order: maxOrder + 1,
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from('meal_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal_plans', user?.id] });
      toast({ title: 'Refeição atualizada!' });
    },
  });

  const deleteMealPlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
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
