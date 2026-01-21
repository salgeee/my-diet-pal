import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface FoodItem {
  fdcId: number;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: number;
}

// Using USDA FoodData Central API (free, no key required for basic searches)
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const USDA_API_KEY = 'DEMO_KEY'; // Free demo key

export function useFoodSearch(searchQuery: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  const { data: foods = [], isLoading, error } = useQuery({
    queryKey: ['food_search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      const response = await fetch(
        `${USDA_API_URL}?api_key=${USDA_API_KEY}&query=${encodeURIComponent(debouncedQuery)}&pageSize=15&dataType=Foundation,SR Legacy`
      );

      if (!response.ok) throw new Error('Failed to fetch foods');

      const data = await response.json();
      
      return (data.foods || []).map((food: any) => {
        const nutrients = food.foodNutrients || [];
        
        const getCalories = () => {
          const energy = nutrients.find((n: any) => 
            n.nutrientName?.toLowerCase().includes('energy') && 
            n.unitName?.toLowerCase() === 'kcal'
          );
          return energy?.value || 0;
        };

        const getProtein = () => {
          const protein = nutrients.find((n: any) => 
            n.nutrientName?.toLowerCase().includes('protein')
          );
          return protein?.value || 0;
        };

        const getCarbs = () => {
          const carbs = nutrients.find((n: any) => 
            n.nutrientName?.toLowerCase().includes('carbohydrate')
          );
          return carbs?.value || 0;
        };

        const getFat = () => {
          const fat = nutrients.find((n: any) => 
            n.nutrientName?.toLowerCase().includes('total lipid') ||
            n.nutrientName?.toLowerCase() === 'fat'
          );
          return fat?.value || 0;
        };

        return {
          fdcId: food.fdcId,
          description: food.description,
          calories: getCalories(),
          protein: getProtein(),
          carbs: getCarbs(),
          fat: getFat(),
          servingSize: 100, // USDA data is per 100g
        };
      });
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return {
    foods,
    isLoading,
    error,
    setSearchQuery: setDebouncedQuery,
  };
}
