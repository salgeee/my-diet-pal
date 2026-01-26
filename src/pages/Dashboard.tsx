import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CalorieSummary } from '@/components/dashboard/CalorieSummary';
import { MealCard } from '@/components/dashboard/MealCard';
import { AddFoodDialog } from '@/components/dashboard/AddFoodDialog';
import { QuickAddFood } from '@/components/dashboard/QuickAddFood';
import { useMealPlans } from '@/hooks/useMealPlans';
import { useDailyLog } from '@/hooks/useDailyLog';
import { usePlannedFoods } from '@/hooks/usePlannedFoods';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const { mealPlans, isLoading: isLoadingMeals, createDefaultMeals, isCreatingDefaults } = useMealPlans();
  const { foodEntries, addFoodEntry, deleteFoodEntry, isLoading: isLoadingEntries } = useDailyLog();
  const { plannedFoods, isLoading: isLoadingPlanned } = usePlannedFoods();
  const { toast } = useToast();
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);

  // Create default meals if none exist
  useEffect(() => {
    if (!isLoadingMeals && mealPlans.length === 0 && !isCreatingDefaults) {
      createDefaultMeals();
    }
  }, [isLoadingMeals, mealPlans.length, createDefaultMeals, isCreatingDefaults]);

  const getEntriesForMeal = (mealId: string) => {
    return foodEntries.filter(entry => entry.meal_plan_id === mealId);
  };

  const getPlannedForMeal = (mealId: string) => {
    return plannedFoods.filter(food => food.meal_plan_id === mealId);
  };

  const handleAddFood = (mealId: string) => {
    setSelectedMealId(mealId);
  };

  const handleFollowPlan = async (mealId: string) => {
    const plannedForMeal = getPlannedForMeal(mealId);
    
    if (plannedForMeal.length === 0) {
      toast({
        title: 'Sem alimentos planejados',
        description: 'Configure os alimentos desta refeição na aba "Dieta" primeiro.',
        variant: 'destructive',
      });
      return;
    }

    // Adicionar todos os alimentos planejados
    let addedCount = 0;
    for (const food of plannedForMeal) {
      try {
        await new Promise<void>((resolve) => {
          addFoodEntry({
            food_name: food.food_name,
            quantity_grams: food.quantity_grams,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            meal_plan_id: mealId,
          });
          // Pequeno delay para não sobrecarregar
          setTimeout(() => resolve(), 100);
        });
        addedCount++;
      } catch (error) {
        console.error('Erro ao adicionar alimento:', error);
      }
    }

    if (addedCount > 0) {
      toast({
        title: 'Alimentos adicionados!',
        description: `${addedCount} alimento(s) da dieta foram registrados.`,
      });
    }
  };

  const isLoading = isLoadingMeals || isLoadingEntries || isLoadingPlanned;
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold capitalize">{today}</h1>
          <p className="text-muted-foreground">Acompanhe suas calorias do dia</p>
        </div>

        <CalorieSummary />

        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Refeições</h2>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <>
              {mealPlans.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  entries={getEntriesForMeal(meal.id)}
                  plannedFoods={getPlannedForMeal(meal.id)}
                  onAddFood={handleAddFood}
                  onDeleteEntry={deleteFoodEntry}
                  onFollowPlan={handleFollowPlan}
                />
              ))}
              <QuickAddFood />
            </>
          )}
        </div>

        <AddFoodDialog
          open={!!selectedMealId}
          onClose={() => setSelectedMealId(null)}
          onAdd={(food) => addFoodEntry({ ...food, meal_plan_id: selectedMealId || undefined })}
          mealPlanId={selectedMealId || undefined}
        />
      </div>
    </AppLayout>
  );
}
