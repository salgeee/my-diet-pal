import { useProfile } from '@/hooks/useProfile';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useMealPlans } from '@/hooks/useMealPlans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { calculateTMB, calculateGET, formatCalories, getDeficitStatus } from '@/lib/calories';
import { Flame, Target, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CalorieSummary() {
  const { profile } = useProfile();
  const { totalCalories, totalProtein, totalCarbs, totalFat } = useDailyLog();
  const { mealPlans } = useMealPlans();

  if (!profile) return null;

  const tmb = calculateTMB(profile.weight, profile.height, profile.age, profile.sex as 'male' | 'female');
  const get = calculateGET(tmb, profile.activity_level);
  const goal = Number(profile.calorie_goal) || get - 500;
  
  const plannedCalories = mealPlans.reduce((sum, meal) => sum + Number(meal.target_calories), 0);
  const consumed = totalCalories;
  const remaining = goal - consumed;
  const percentConsumed = Math.min((consumed / goal) * 100, 100);
  
  const deficitStatus = getDeficitStatus(remaining);
  const realDeficit = get - consumed;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-success';
      case 'warning': return 'text-warning';
      case 'danger': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = () => {
    if (remaining >= 0) return <TrendingDown className="w-5 h-5" />;
    if (remaining >= -200) return <Minus className="w-5 h-5" />;
    return <TrendingUp className="w-5 h-5" />;
  };

  return (
    <div className="space-y-4">
      {/* Main calorie card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="w-5 h-5 text-primary" />
            Resumo do Dia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <div className="relative">
              <p className="text-5xl font-bold text-primary">{formatCalories(consumed)}</p>
              <p className="text-muted-foreground">de {formatCalories(goal)} kcal</p>
            </div>
            <Progress 
              value={percentConsumed} 
              className="h-3"
            />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <p className={cn("text-xl font-bold", getStatusColor(deficitStatus))}>
                {formatCalories(Math.abs(remaining))}
              </p>
              <p className="text-xs text-muted-foreground">
                {remaining >= 0 ? 'Restantes' : 'Excedido'}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <p className="text-xl font-bold text-accent">{formatCalories(get)}</p>
              <p className="text-xs text-muted-foreground">GET</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/50 flex flex-col items-center justify-center">
              <div className={cn("flex items-center gap-1", getStatusColor(getDeficitStatus(realDeficit)))}>
                {getStatusIcon()}
                <p className="text-xl font-bold">{formatCalories(Math.abs(realDeficit))}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {realDeficit >= 0 ? 'Déficit real' : 'Superávit'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Macronutrientes */}
      {(profile.protein_goal || profile.carbs_goal || profile.fat_goal) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Macronutrientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.protein_goal > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Proteína</span>
                  <span className="font-semibold">
                    {totalProtein.toFixed(0)}g / {profile.protein_goal}g
                  </span>
                </div>
                <Progress 
                  value={Math.min((totalProtein / profile.protein_goal) * 100, 100)} 
                  className="h-2"
                />
              </div>
            )}
            {profile.carbs_goal > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Carboidratos</span>
                  <span className="font-semibold">
                    {totalCarbs.toFixed(0)}g / {profile.carbs_goal}g
                  </span>
                </div>
                <Progress 
                  value={Math.min((totalCarbs / profile.carbs_goal) * 100, 100)} 
                  className="h-2"
                />
              </div>
            )}
            {profile.fat_goal > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gordura</span>
                  <span className="font-semibold">
                    {totalFat.toFixed(0)}g / {profile.fat_goal}g
                  </span>
                </div>
                <Progress 
                  value={Math.min((totalFat / profile.fat_goal) * 100, 100)} 
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick stats */}
      {plannedCalories > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Planejado nas refeições</span>
              </div>
              <span className="font-semibold">{formatCalories(plannedCalories)} kcal</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
