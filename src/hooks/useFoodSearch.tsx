import { useState, useMemo } from 'react';
import { tacoFoods } from '@/data/taco-foods';

export interface FoodItem {
  fdcId: number;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: number;
  category?: string;
}

// Dados da Tabela TACO - Tabela Brasileira de Composição de Alimentos (UNICAMP)
// Valores por 100g - dados incluídos localmente para melhor performance

export function useFoodSearch(searchQuery: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Filtra os alimentos baseado na busca
  const foods = useMemo(() => {
    if (debouncedQuery.length < 2) return [];
    
    const query = debouncedQuery.toLowerCase();
    
    return tacoFoods
      .filter((food) => 
        food.name.toLowerCase().includes(query) ||
        food.category.toLowerCase().includes(query)
      )
      .slice(0, 20) // Limita a 20 resultados
      .map((food) => ({
        fdcId: food.id,
        description: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        servingSize: 100,
        category: food.category,
      }));
  }, [debouncedQuery]);

  return {
    foods,
    isLoading: false,
    error: null,
    setSearchQuery: setDebouncedQuery,
  };
}
