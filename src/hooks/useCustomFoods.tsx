import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CustomFood {
  id: string;
  user_id: string;
  food_name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  brand?: string;
  created_at: string;
}

export function useCustomFoods(searchQuery?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customFoods = [], isLoading } = useQuery({
    queryKey: ['custom_foods', user?.id, searchQuery],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const url = searchQuery 
        ? `/custom-foods?search=${encodeURIComponent(searchQuery)}`
        : '/custom-foods';
      
      const { data, error } = await api.get<CustomFood[]>(url);

      if (error) throw new Error(error);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const addCustomFood = useMutation({
    mutationFn: async (food: {
      food_name: string;
      calories_per_100g: number;
      protein_per_100g?: number;
      carbs_per_100g?: number;
      fat_per_100g?: number;
      brand?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await api.post<CustomFood>('/custom-foods', food);

      if (error) throw new Error(error);
      return data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_foods'] });
      toast({ title: 'Alimento salvo!' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCustomFood = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.delete(`/custom-foods?id=${id}`);

      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_foods'] });
      toast({ title: 'Alimento removido!' });
    },
  });

  return {
    customFoods,
    isLoading,
    addCustomFood: addCustomFood.mutate,
    deleteCustomFood: deleteCustomFood.mutate,
    isAdding: addCustomFood.isPending,
  };
}
