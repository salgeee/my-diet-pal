import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useMealPlans } from '@/hooks/useMealPlans';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, TrendingDown, TrendingUp, Minus, ChevronLeft, ChevronRight, Flame, Target, Scale } from 'lucide-react';
import { formatCalories } from '@/lib/calories';
import { cn } from '@/lib/utils';

interface DayLog {
  date: string;
  totalCalories: number;
  targetCalories: number;
  deficit: number;
  entries: any[];
}

export default function History() {
  const { user } = useAuth();
  const { mealPlans } = useMealPlans();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  // Calcular meta diária total
  const dailyTarget = mealPlans.reduce((sum, meal) => sum + Number(meal.target_calories), 0);

  // Buscar histórico dos últimos 30 dias
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await api.get<DayLog[]>('/daily-log?action=history&days=30');
      
      if (error) throw new Error(error);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Dados do dia selecionado
  const { foodEntries, totalCalories } = useDailyLog(selectedDate);

  // Calcular estatísticas da semana
  const weekStats = useMemo(() => {
    if (!historyData) return { totalDeficit: 0, avgCalories: 0, daysOnTrack: 0 };

    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
    
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    let totalConsumed = 0;
    let totalTarget = 0;
    let daysWithData = 0;
    let daysOnTrack = 0;

    weekDays.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayData = historyData.find(d => d.date === dayStr);
      
      if (dayData && dayData.totalCalories > 0) {
        totalConsumed += dayData.totalCalories;
        totalTarget += dailyTarget;
        daysWithData++;
        
        if (dayData.totalCalories <= dailyTarget) {
          daysOnTrack++;
        }
      }
    });

    return {
      totalDeficit: totalTarget - totalConsumed,
      avgCalories: daysWithData > 0 ? Math.round(totalConsumed / daysWithData) : 0,
      daysOnTrack,
      daysWithData,
    };
  }, [historyData, selectedDate, dailyTarget]);

  // Gerar dias da semana atual
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ 
      start: weekStart, 
      end: endOfWeek(selectedDate, { weekStartsOn: 0 }) 
    });
  }, [selectedDate]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const days = direction === 'prev' ? -7 : 7;
    setSelectedDate(prev => subDays(prev, -days));
  };

  const getDayStatus = (date: Date) => {
    const dayStr = format(date, 'yyyy-MM-dd');
    const dayData = historyData?.find(d => d.date === dayStr);
    
    if (!dayData || dayData.totalCalories === 0) return 'empty';
    if (dayData.totalCalories <= dailyTarget) return 'success';
    return 'over';
  };

  const selectedDayDeficit = dailyTarget - totalCalories;

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
          <h1 className="text-2xl font-bold">Histórico</h1>
          <p className="text-muted-foreground">Acompanhe seu progresso dia a dia</p>
        </div>

        {/* Resumo da Semana */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Resumo da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className={cn(
                  "text-2xl font-bold",
                  weekStats.totalDeficit >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {weekStats.totalDeficit >= 0 ? '-' : '+'}{formatCalories(Math.abs(weekStats.totalDeficit))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {weekStats.totalDeficit >= 0 ? 'Déficit' : 'Excesso'} semanal
                </p>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {formatCalories(weekStats.avgCalories)}
                </div>
                <p className="text-xs text-muted-foreground">Média diária</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">
                  {weekStats.daysOnTrack}/{weekStats.daysWithData}
                </div>
                <p className="text-xs text-muted-foreground">Dias na meta</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navegação da Semana */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {format(selectedDate, "d 'de' MMMM, yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const status = getDayStatus(day);
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const dayData = historyData?.find(d => d.date === format(day, 'yyyy-MM-dd'));

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "flex flex-col items-center p-2 rounded-lg transition-all",
                      isSelected && "ring-2 ring-primary",
                      !isSelected && "hover:bg-secondary"
                    )}
                  >
                    <span className="text-xs text-muted-foreground">
                      {format(day, 'EEE', { locale: ptBR })}
                    </span>
                    <span className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium mt-1",
                      status === 'success' && "bg-green-500/20 text-green-600",
                      status === 'over' && "bg-red-500/20 text-red-600",
                      status === 'empty' && "bg-secondary text-muted-foreground",
                      isToday && "ring-2 ring-primary ring-offset-2"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {dayData && dayData.totalCalories > 0 && (
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {formatCalories(dayData.totalCalories)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Detalhes do dia selecionado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center justify-between">
              <span className="capitalize">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </span>
              {selectedDayDeficit >= 0 ? (
                <span className="flex items-center gap-1 text-green-500 text-sm">
                  <TrendingDown className="w-4 h-4" />
                  -{formatCalories(selectedDayDeficit)} kcal
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-500 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  +{formatCalories(Math.abs(selectedDayDeficit))} kcal
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Flame className="w-4 h-4" />
                  <span className="text-xs">Consumido</span>
                </div>
                <p className="text-xl font-bold">{formatCalories(totalCalories)} kcal</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-xs">Meta</span>
                </div>
                <p className="text-xl font-bold">{formatCalories(dailyTarget)} kcal</p>
              </div>
            </div>

            {foodEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum alimento registrado neste dia</p>
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Alimentos consumidos</h4>
                {foodEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-2 rounded-md bg-secondary/30"
                  >
                    <div>
                      <p className="text-sm font-medium">{entry.food_name}</p>
                      <p className="text-xs text-muted-foreground">{entry.quantity_grams}g</p>
                    </div>
                    <p className="text-sm font-medium">{formatCalories(Number(entry.calories))} kcal</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dica sobre déficit */}
        {dailyTarget > 0 && (
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="py-4">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                💡 <strong>Sobre o déficit:</strong> Um déficit de ~500 kcal/dia resulta em perda de aproximadamente 0,5kg por semana. 
                Mantenha consistência para melhores resultados!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
