import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CalorieSummary } from '@/components/dashboard/CalorieSummary';
import { MealCard } from '@/components/dashboard/MealCard';
import { AddFoodDialog } from '@/components/dashboard/AddFoodDialog';
import { QuickAddFood } from '@/components/dashboard/QuickAddFood';
import { useMealPlans } from '@/hooks/useMealPlans';
import { useDailyLog } from '@/hooks/useDailyLog';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const { mealPlans, isLoading: isLoadingMeals, createDefaultMeals, isCreatingDefaults } = useMealPlans();
  const { foodEntries, addFoodEntry, deleteFoodEntry, isLoading: isLoadingEntries } = useDailyLog();
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

  const handleAddFood = (mealId: string) => {
    setSelectedMealId(mealId);
  };

  const isLoading = isLoadingMeals || isLoadingEntries;
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
                  onAddFood={handleAddFood}
                  onDeleteEntry={deleteFoodEntry}
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
