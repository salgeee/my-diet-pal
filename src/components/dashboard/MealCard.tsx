import { useState } from 'react';
import { MealPlan } from '@/hooks/useMealPlans';
import { FoodEntry } from '@/hooks/useDailyLog';
import { PlannedFood } from '@/hooks/usePlannedFoods';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, ChevronDown, ChevronUp, Utensils, CheckCheck } from 'lucide-react';
import { formatCalories } from '@/lib/calories';
import { cn } from '@/lib/utils';

interface MealCardProps {
  meal: MealPlan;
  entries: FoodEntry[];
  plannedFoods?: PlannedFood[];
  onAddFood: (mealId: string) => void;
  onDeleteEntry: (id: string) => void;
  onFollowPlan?: (mealId: string) => void;
}

export function MealCard({ meal, entries, plannedFoods = [], onAddFood, onDeleteEntry, onFollowPlan }: MealCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const consumed = entries.reduce((sum, e) => sum + Number(e.calories), 0);
  const target = Number(meal.target_calories);
  const remaining = target - consumed;
  const percentConsumed = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
  
  const hasPlannedFoods = plannedFoods.length > 0;

  const getStatusColor = () => {
    if (remaining >= 0) return 'bg-success';
    if (remaining >= -100) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader 
        className="pb-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Utensils className="w-4 h-4 text-primary" />
            {meal.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {formatCalories(consumed)}/{formatCalories(target)} kcal
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
        <Progress 
          value={percentConsumed} 
          className={cn("h-1.5 mt-2", consumed > target && "[&>div]:bg-warning")}
        />
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-2 space-y-2">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Nenhum alimento registrado
            </p>
          ) : (
            <div className="space-y-1">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2 rounded-md bg-secondary/50 hover:bg-secondary transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.food_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.quantity_grams}g • {formatCalories(Number(entry.calories))} kcal
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEntry(entry.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddFood(meal.id)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
            
            {hasPlannedFoods && onFollowPlan && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onFollowPlan(meal.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Segui o plano
              </Button>
            )}
          </div>

          {remaining < 0 && (
            <p className="text-xs text-warning text-center">
              Você excedeu {formatCalories(Math.abs(remaining))} kcal nesta refeição
            </p>
          )}
          {remaining > 0 && consumed > 0 && (
            <p className="text-xs text-success text-center">
              Ainda pode consumir {formatCalories(remaining)} kcal
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
