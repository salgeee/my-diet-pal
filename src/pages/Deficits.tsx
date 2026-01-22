import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMealPlans } from '@/hooks/useMealPlans';
import { usePlannedFoods } from '@/hooks/usePlannedFoods';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingDown, TrendingUp, Scale, Flame, Target, ChevronLeft, ChevronRight, Calendar, Award, AlertTriangle } from 'lucide-react';
import { formatCalories } from '@/lib/calories';
import { cn } from '@/lib/utils';

interface DayLog {
  date: string;
  totalCalories: number;
  targetCalories: number;
  deficit: number;
  entries: any[];
}

export default function Deficits() {
  const { user } = useAuth();
  const { plannedFoods } = usePlannedFoods();
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [weekOffset, setWeekOffset] = useState(0);

  // Calcular meta diária total baseada nos alimentos planejados
  const dailyTarget = plannedFoods.reduce((sum, food) => sum + food.calories, 0);

  // Buscar histórico dos últimos 60 dias
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await api.get<DayLog[]>('/daily-log?action=history&days=60');
      
      if (error) throw new Error(error);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Calcular data base considerando offset
  const baseDate = useMemo(() => {
    return subDays(new Date(), weekOffset * 7);
  }, [weekOffset]);

  // Dias da semana/mês atual
  const periodDays = useMemo(() => {
    if (viewMode === 'week') {
      const weekStart = startOfWeek(baseDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ 
        start: weekStart, 
        end: endOfWeek(baseDate, { weekStartsOn: 0 }) 
      });
    } else {
      const monthStart = startOfMonth(baseDate);
      return eachDayOfInterval({ 
        start: monthStart, 
        end: endOfMonth(baseDate)
      });
    }
  }, [baseDate, viewMode]);

  // Estatísticas do período
  const periodStats = useMemo(() => {
    if (!historyData) return { 
      totalDeficit: 0, 
      avgCalories: 0, 
      daysOnTrack: 0,
      daysWithData: 0,
      bestStreak: 0,
      currentStreak: 0,
      totalConsumed: 0,
      totalTarget: 0,
    };

    let totalConsumed = 0;
    let totalTarget = 0;
    let daysWithData = 0;
    let daysOnTrack = 0;
    let bestStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;

    periodDays.forEach((day, index) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayData = historyData.find(d => d.date === dayStr);
      
      if (dayData && dayData.totalCalories > 0) {
        totalConsumed += dayData.totalCalories;
        totalTarget += dailyTarget;
        daysWithData++;
        
        if (dayData.totalCalories <= dailyTarget) {
          daysOnTrack++;
          tempStreak++;
          if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
          }
        } else {
          tempStreak = 0;
        }
      } else {
        tempStreak = 0;
      }
    });

    // Calcular streak atual (últimos dias consecutivos na meta)
    for (let i = periodDays.length - 1; i >= 0; i--) {
      const dayStr = format(periodDays[i], 'yyyy-MM-dd');
      const dayData = historyData.find(d => d.date === dayStr);
      
      if (dayData && dayData.totalCalories > 0 && dayData.totalCalories <= dailyTarget) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      totalDeficit: totalTarget - totalConsumed,
      avgCalories: daysWithData > 0 ? Math.round(totalConsumed / daysWithData) : 0,
      daysOnTrack,
      daysWithData,
      bestStreak,
      currentStreak,
      totalConsumed,
      totalTarget,
    };
  }, [historyData, periodDays, dailyTarget]);

  // Dados diários para o gráfico
  const dailyData = useMemo(() => {
    return periodDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayData = historyData?.find(d => d.date === dayStr);
      
      return {
        date: day,
        dateStr: dayStr,
        consumed: dayData?.totalCalories || 0,
        target: dailyTarget,
        deficit: dailyTarget - (dayData?.totalCalories || 0),
        hasData: !!dayData && dayData.totalCalories > 0,
      };
    });
  }, [periodDays, historyData, dailyTarget]);

  const navigatePeriod = (direction: 'prev' | 'next') => {
    setWeekOffset(prev => direction === 'prev' ? prev + 1 : prev - 1);
  };

  const getPeriodTitle = () => {
    if (viewMode === 'week') {
      const weekStart = startOfWeek(baseDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(baseDate, { weekStartsOn: 0 });
      return `${format(weekStart, "d MMM", { locale: ptBR })} - ${format(weekEnd, "d MMM", { locale: ptBR })}`;
    } else {
      return format(baseDate, "MMMM 'de' yyyy", { locale: ptBR });
    }
  };

  // Estimativa de perda de peso baseada no déficit
  const estimatedWeightLoss = (periodStats.totalDeficit / 7700).toFixed(2); // 7700 kcal ≈ 1kg de gordura

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Déficits</h1>
          <p className="text-muted-foreground">Acompanhe seu progresso de déficit calórico</p>
        </div>

        {/* Seletor de período */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Semana
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Mês
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigatePeriod('prev')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center capitalize">
              {getPeriodTitle()}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigatePeriod('next')}
              disabled={weekOffset <= 0}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 gap-3">
          <Card className={cn(
            "border-2",
            periodStats.totalDeficit >= 0 ? "border-green-500/50 bg-green-500/5" : "border-red-500/50 bg-red-500/5"
          )}>
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-2">
                {periodStats.totalDeficit >= 0 ? (
                  <TrendingDown className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm text-muted-foreground">
                  {periodStats.totalDeficit >= 0 ? 'Déficit' : 'Excesso'}
                </span>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                periodStats.totalDeficit >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {periodStats.totalDeficit >= 0 ? '-' : '+'}{formatCalories(Math.abs(periodStats.totalDeficit))}
              </p>
              <p className="text-xs text-muted-foreground">kcal no período</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Estimativa</span>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                Number(estimatedWeightLoss) > 0 ? "text-green-500" : "text-red-500"
              )}>
                {Number(estimatedWeightLoss) > 0 ? '-' : '+'}{Math.abs(Number(estimatedWeightLoss))} kg
              </p>
              <p className="text-xs text-muted-foreground">de gordura</p>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas extras */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="py-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                <p className="text-lg font-bold">{formatCalories(periodStats.avgCalories)}</p>
                <p className="text-[10px] text-muted-foreground">Média diária</p>
              </div>
              <div>
                <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{formatCalories(dailyTarget)}</p>
                <p className="text-[10px] text-muted-foreground">Meta diária</p>
              </div>
              <div>
                <Award className="w-5 h-5 mx-auto mb-1 text-green-500" />
                <p className="text-lg font-bold">{periodStats.daysOnTrack}/{periodStats.daysWithData}</p>
                <p className="text-[10px] text-muted-foreground">Dias na meta</p>
              </div>
              <div>
                <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                <p className="text-lg font-bold">{periodStats.currentStreak}</p>
                <p className="text-[10px] text-muted-foreground">Sequência atual</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de barras visual */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Consumo Diário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dailyData.map((day, index) => {
                const percentOfTarget = dailyTarget > 0 ? (day.consumed / dailyTarget) * 100 : 0;
                const isOverTarget = day.consumed > dailyTarget;
                const isToday = format(day.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                
                return (
                  <div key={day.dateStr} className={cn(
                    "flex items-center gap-3",
                    isToday && "bg-primary/5 -mx-2 px-2 py-1 rounded-lg"
                  )}>
                    <div className="w-12 text-right">
                      <span className={cn(
                        "text-xs",
                        isToday ? "font-bold text-primary" : "text-muted-foreground"
                      )}>
                        {format(day.date, viewMode === 'week' ? 'EEE' : 'd', { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden relative">
                      {day.hasData ? (
                        <>
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all",
                              isOverTarget ? "bg-red-500" : "bg-green-500"
                            )}
                            style={{ width: `${Math.min(percentOfTarget, 100)}%` }}
                          />
                          {isOverTarget && (
                            <div 
                              className="absolute top-0 right-0 h-full bg-red-500/30"
                              style={{ width: `${percentOfTarget - 100}%` }}
                            />
                          )}
                        </>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <span className="text-[10px] text-muted-foreground">Sem dados</span>
                        </div>
                      )}
                    </div>
                    <div className="w-20 text-right">
                      {day.hasData ? (
                        <span className={cn(
                          "text-xs font-medium",
                          isOverTarget ? "text-red-500" : "text-green-500"
                        )}>
                          {day.deficit >= 0 ? '-' : '+'}{formatCalories(Math.abs(day.deficit))}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">Dentro da meta</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-muted-foreground">Acima da meta</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dica sobre déficit */}
        {dailyTarget > 0 && (
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="py-4">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                💡 <strong>Sobre o déficit:</strong> Um déficit de ~7.700 kcal resulta em perda de aproximadamente 1kg de gordura. 
                Com déficit de 500 kcal/dia, você perde ~0,5kg por semana de forma saudável.
              </p>
            </CardContent>
          </Card>
        )}

        {dailyTarget === 0 && (
          <Card className="bg-orange-500/5 border-orange-500/20">
            <CardContent className="py-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                  Configure seu plano alimentar
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Vá para a aba "Dieta" e adicione os alimentos que seu nutricionista passou para cada refeição.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
