import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useMealPlans, MealPlan } from '@/hooks/useMealPlans';
import { usePlannedFoods, PlannedFood } from '@/hooks/usePlannedFoods';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useFoodSearch, FoodItem } from '@/hooks/useFoodSearch';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit2, Utensils, Target, Check, AlertCircle, Cookie, Search, ChevronDown, ChevronUp, PenLine, Loader2 } from 'lucide-react';
import { formatCalories } from '@/lib/calories';
import { cn } from '@/lib/utils';

export default function Meals() {
  const { mealPlans, isLoading: isLoadingMeals, addMealPlan, updateMealPlan, deleteMealPlan } = useMealPlans();
  const { plannedFoods, addPlannedFood, deletePlannedFood, isLoading: isLoadingPlanned } = usePlannedFoods();
  const { foodEntries } = useDailyLog();
  const { profile, updateProfile } = useProfile();
  
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealPlan | null>(null);
  const [newMeal, setNewMeal] = useState({ name: '' });
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());
  
  // Estado para adicionar alimento ao plano
  const [addingFoodToMeal, setAddingFoodToMeal] = useState<string | null>(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('search');
  const { foods: searchResults, isLoading: isSearching, setSearchQuery } = useFoodSearch(foodSearchQuery);
  
  // Estado para alimento selecionado (para ajustar quantidade)
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(100);
  
  const [customFood, setCustomFood] = useState({
    name: '',
    quantity_grams: 100,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  // Calcular e atualizar metas de macros automaticamente baseado na dieta planejada
  useEffect(() => {
    if (!profile || isLoadingPlanned || plannedFoods.length === 0) return;

    // Calcular totais dos alimentos planejados
    const totalProtein = Math.round(plannedFoods.reduce((sum, food) => sum + (food.protein || 0), 0));
    const totalCarbs = Math.round(plannedFoods.reduce((sum, food) => sum + (food.carbs || 0), 0));
    const totalFat = Math.round(plannedFoods.reduce((sum, food) => sum + (food.fat || 0), 0));

    // Atualizar apenas se houver mudança significativa (diferença de pelo menos 1g)
    const hasChanged = 
      Math.abs((profile.protein_goal || 0) - totalProtein) >= 1 ||
      Math.abs((profile.carbs_goal || 0) - totalCarbs) >= 1 ||
      Math.abs((profile.fat_goal || 0) - totalFat) >= 1;

    if (hasChanged) {
      updateProfile({
        protein_goal: totalProtein,
        carbs_goal: totalCarbs,
        fat_goal: totalFat,
      });
    }
  }, [plannedFoods, profile, isLoadingPlanned, updateProfile]);

  // Filtrar alimentos planejados por refeição
  const getPlannedForMeal = (mealId: string) => {
    return plannedFoods.filter(food => food.meal_plan_id === mealId);
  };

  // Calcular consumo por refeição
  const getConsumedForMeal = (mealId: string) => {
    return foodEntries.filter(entry => entry.meal_plan_id === mealId);
  };

  // Calcular totais
  const totalPlannedCalories = plannedFoods.reduce((sum, food) => sum + food.calories, 0);
  const totalConsumedCalories = foodEntries.reduce((sum, entry) => sum + Number(entry.calories), 0);
  const caloriesDifference = totalPlannedCalories - totalConsumedCalories;

  const toggleExpanded = (mealId: string) => {
    const newExpanded = new Set(expandedMeals);
    if (newExpanded.has(mealId)) {
      newExpanded.delete(mealId);
    } else {
      newExpanded.add(mealId);
    }
    setExpandedMeals(newExpanded);
  };

  const handleAddMeal = () => {
    if (newMeal.name.trim()) {
      addMealPlan({ name: newMeal.name, target_calories: 0 });
      setNewMeal({ name: '' });
      setIsAddMealOpen(false);
    }
  };

  const handleUpdateMeal = () => {
    if (editingMeal) {
      updateMealPlan({
        id: editingMeal.id,
        name: editingMeal.name,
      });
      setEditingMeal(null);
    }
  };

  const handleSearchChange = (query: string) => {
    setFoodSearchQuery(query);
    setSearchQuery(query);
  };

  // Selecionar alimento para ajustar quantidade
  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setSelectedQuantity(100);
  };

  // Confirmar adição do alimento com a quantidade escolhida
  const handleConfirmAddFood = () => {
    if (!addingFoodToMeal || !selectedFood) return;
    
    const multiplier = selectedQuantity / 100;
    
    addPlannedFood({
      meal_plan_id: addingFoodToMeal,
      food_name: selectedFood.description,
      quantity_grams: selectedQuantity,
      calories: Math.round(selectedFood.calories * multiplier),
      protein: Math.round(selectedFood.protein * multiplier * 10) / 10,
      carbs: Math.round(selectedFood.carbs * multiplier * 10) / 10,
      fat: Math.round(selectedFood.fat * multiplier * 10) / 10,
    });
    
    // Resetar estados
    setSelectedFood(null);
    setSelectedQuantity(100);
    setAddingFoodToMeal(null);
    setFoodSearchQuery('');
  };

  // Voltar para busca
  const handleBackToSearch = () => {
    setSelectedFood(null);
    setSelectedQuantity(100);
  };

  const handleAddCustomFood = () => {
    if (!addingFoodToMeal || !customFood.name.trim() || customFood.calories <= 0) return;
    
    addPlannedFood({
      meal_plan_id: addingFoodToMeal,
      food_name: customFood.name,
      quantity_grams: customFood.quantity_grams,
      calories: customFood.calories,
      protein: customFood.protein,
      carbs: customFood.carbs,
      fat: customFood.fat,
    });
    
    setCustomFood({
      name: '',
      quantity_grams: 100,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
    setAddingFoodToMeal(null);
    setActiveTab('search');
  };

  const isLoading = isLoadingMeals || isLoadingPlanned;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Minha Dieta</h1>
            <p className="text-muted-foreground">Configure o plano do nutricionista</p>
          </div>
          <Dialog open={isAddMealOpen} onOpenChange={setIsAddMealOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova refeição
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar refeição</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meal-name">Nome da refeição</Label>
                  <Input
                    id="meal-name"
                    placeholder="Ex: Lanche da tarde"
                    value={newMeal.name}
                    onChange={(e) => setNewMeal({ name: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddMeal} className="w-full">
                  Adicionar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary card */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="py-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-primary">{formatCalories(totalPlannedCalories)}</p>
                <p className="text-xs text-muted-foreground">Planejado</p>
              </div>
              <div>
                <Utensils className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold text-orange-500">{formatCalories(totalConsumedCalories)}</p>
                <p className="text-xs text-muted-foreground">Consumido</p>
              </div>
              <div>
                {caloriesDifference >= 0 ? (
                  <>
                    <Cookie className="w-6 h-6 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold text-green-500">{formatCalories(caloriesDifference)}</p>
                    <p className="text-xs text-muted-foreground">Disponível</p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
                    <p className="text-2xl font-bold text-red-500">+{formatCalories(Math.abs(caloriesDifference))}</p>
                    <p className="text-xs text-muted-foreground">Excedido</p>
                  </>
                )}
              </div>
            </div>
            
            {caloriesDifference > 0 && totalPlannedCalories > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-600 dark:text-green-400 text-center">
                  🍪 Você ainda pode comer algo com até <strong>{formatCalories(caloriesDifference)} kcal</strong>!
                </p>
              </div>
            )}
            
            {caloriesDifference < 0 && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-600 dark:text-red-400 text-center">
                  ⚠️ Você excedeu <strong>{formatCalories(Math.abs(caloriesDifference))} kcal</strong> do planejado
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meals list */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg">Refeições do Plano</h2>
          
          {mealPlans.map((meal, index) => {
            const plannedForMeal = getPlannedForMeal(meal.id);
            const consumedForMeal = getConsumedForMeal(meal.id);
            const plannedCalories = plannedForMeal.reduce((sum, f) => sum + f.calories, 0);
            const consumedCalories = consumedForMeal.reduce((sum, e) => sum + Number(e.calories), 0);
            const remaining = plannedCalories - consumedCalories;
            const percentConsumed = plannedCalories > 0 ? Math.min((consumedCalories / plannedCalories) * 100, 100) : 0;
            const isComplete = consumedCalories >= plannedCalories && plannedCalories > 0;
            const isOver = consumedCalories > plannedCalories && plannedCalories > 0;
            const isExpanded = expandedMeals.has(meal.id);

            return (
              <Card key={meal.id} className={cn(
                "group transition-all",
                isComplete && !isOver && "border-green-500/50 bg-green-500/5",
                isOver && "border-orange-500/50 bg-orange-500/5"
              )}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      isComplete && !isOver ? "bg-green-500 text-white" : 
                      isOver ? "bg-orange-500 text-white" : 
                      "bg-secondary text-muted-foreground"
                    )}>
                      {isComplete ? <Check className="w-5 h-5" /> : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{meal.name}</h3>
                        <span className="text-xs text-muted-foreground">
                          ({plannedForMeal.length} alimentos)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress 
                          value={percentConsumed} 
                          className={cn(
                            "h-2 flex-1",
                            isOver && "[&>div]:bg-orange-500",
                            isComplete && !isOver && "[&>div]:bg-green-500"
                          )}
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatCalories(consumedCalories)}/{formatCalories(plannedCalories)} kcal
                        </span>
                      </div>
                      {remaining > 0 && consumedCalories > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Faltam {formatCalories(remaining)} kcal
                        </p>
                      )}
                      {remaining < 0 && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          Excedeu {formatCalories(Math.abs(remaining))} kcal
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleExpanded(meal.id)}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setEditingMeal(meal)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteMealPlan(meal.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded content - Alimentos planejados */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-muted-foreground">Alimentos do Plano</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAddingFoodToMeal(meal.id)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Adicionar
                        </Button>
                      </div>

                      {plannedForMeal.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum alimento configurado. Adicione o que seu nutricionista passou!
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {plannedForMeal.map((food) => {
                            // Verificar quanto foi consumido desse alimento
                            const consumed = consumedForMeal
                              .filter(e => e.food_name.toLowerCase().includes(food.food_name.toLowerCase().split(' ')[0]))
                              .reduce((sum, e) => sum + Number(e.quantity_grams), 0);
                            const consumedCaloriesFood = consumedForMeal
                              .filter(e => e.food_name.toLowerCase().includes(food.food_name.toLowerCase().split(' ')[0]))
                              .reduce((sum, e) => sum + Number(e.calories), 0);
                            
                            return (
                              <div
                                key={food.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{food.food_name}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <span>Meta: {food.quantity_grams}g</span>
                                    <span>•</span>
                                    <span>{formatCalories(food.calories)} kcal</span>
                                  </div>
                                  {consumed > 0 && (
                                    <p className="text-xs mt-1 text-primary">
                                      ✓ Consumido: {consumed}g ({formatCalories(consumedCaloriesFood)} kcal)
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive shrink-0"
                                  onClick={() => deletePlannedFood(food.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* O que foi consumido */}
                      {consumedForMeal.length > 0 && (
                        <div className="pt-3 border-t">
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Consumido Hoje</h4>
                          <div className="space-y-1">
                            {consumedForMeal.map((entry) => (
                              <div
                                key={entry.id}
                                className="flex items-center justify-between p-2 rounded-md bg-primary/5"
                              >
                                <span className="text-sm">{entry.food_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {entry.quantity_grams}g • {formatCalories(Number(entry.calories))} kcal
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {mealPlans.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Utensils className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma refeição configurada</p>
              <p className="text-sm text-muted-foreground">
                Adicione as refeições do seu plano nutricional
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dica */}
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="py-4">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              💡 <strong>Como usar:</strong> Adicione os alimentos que seu nutricionista passou para cada refeição. 
              Na aba "Hoje", registre o que você realmente comeu. O sistema compara automaticamente!
            </p>
          </CardContent>
        </Card>

        {/* Edit meal dialog */}
        <Dialog open={!!editingMeal} onOpenChange={() => setEditingMeal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar refeição</DialogTitle>
            </DialogHeader>
            {editingMeal && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-meal-name">Nome da refeição</Label>
                  <Input
                    id="edit-meal-name"
                    value={editingMeal.name}
                    onChange={(e) => setEditingMeal({ ...editingMeal, name: e.target.value })}
                  />
                </div>
                <Button onClick={handleUpdateMeal} className="w-full">
                  Salvar alterações
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add food to meal dialog */}
        <Dialog open={!!addingFoodToMeal} onOpenChange={() => {
          setAddingFoodToMeal(null);
          setFoodSearchQuery('');
          setActiveTab('search');
          setSelectedFood(null);
          setSelectedQuantity(100);
        }}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Adicionar ao plano</DialogTitle>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="search" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Buscar
                </TabsTrigger>
                <TabsTrigger value="custom" className="flex items-center gap-2">
                  <PenLine className="w-4 h-4" />
                  Manual
                </TabsTrigger>
              </TabsList>

              {/* Tab de Busca */}
              <TabsContent value="search" className="flex-1 overflow-hidden flex flex-col mt-4">
                {!selectedFood ? (
                  // Tela de busca
                  <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar alimento..."
                        value={foodSearchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-9"
                        autoFocus
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1">
                      {isSearching && (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      )}

                      {!isSearching && foodSearchQuery.length >= 2 && searchResults.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-2">
                            Nenhum alimento encontrado
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setActiveTab('custom');
                              setCustomFood(prev => ({ ...prev, name: foodSearchQuery }));
                            }}
                          >
                            <PenLine className="w-4 h-4 mr-2" />
                            Cadastrar manualmente
                          </Button>
                        </div>
                      )}

                      {!isSearching && foodSearchQuery.length < 2 && (
                        <p className="text-center text-muted-foreground py-8">
                          Digite ao menos 2 caracteres
                        </p>
                      )}

                      {searchResults.map((food) => (
                        <button
                          key={food.fdcId}
                          className="w-full text-left p-3 rounded-lg transition-colors hover:bg-secondary border border-transparent hover:border-border"
                          onClick={() => handleSelectFood(food)}
                        >
                          <p className="font-medium text-sm line-clamp-2">{food.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatCalories(food.calories)} kcal/100g • 
                            P: {formatCalories(food.protein)}g • 
                            C: {formatCalories(food.carbs)}g • 
                            G: {formatCalories(food.fat)}g
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Tela de ajuste de quantidade
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <p className="font-medium">{selectedFood.description}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Valores por 100g: {formatCalories(selectedFood.calories)} kcal
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantidade (gramas)</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={selectedQuantity}
                        onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                        min={1}
                        max={5000}
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground">
                        Ex: Se o nutricionista passou 170g, digite 170
                      </p>
                    </div>

                    {/* Preview calculado */}
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Para {selectedQuantity}g:</span>
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        {formatCalories(Math.round(selectedFood.calories * selectedQuantity / 100))} kcal
                      </p>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">P:</span>{' '}
                          <span className="font-medium">{formatCalories(Math.round(selectedFood.protein * selectedQuantity / 100 * 10) / 10)}g</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">C:</span>{' '}
                          <span className="font-medium">{formatCalories(Math.round(selectedFood.carbs * selectedQuantity / 100 * 10) / 10)}g</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">G:</span>{' '}
                          <span className="font-medium">{formatCalories(Math.round(selectedFood.fat * selectedQuantity / 100 * 10) / 10)}g</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleBackToSearch} className="flex-1">
                        Voltar
                      </Button>
                      <Button onClick={handleConfirmAddFood} className="flex-1">
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Tab Manual */}
              <TabsContent value="custom" className="flex-1 overflow-y-auto mt-4">
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      💡 Adicione o alimento que seu nutricionista passou
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom-name">
                      Nome do alimento <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="custom-name"
                      placeholder="Ex: Arroz branco"
                      value={customFood.name}
                      onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="custom-quantity">
                        Quantidade (g) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="custom-quantity"
                        type="number"
                        placeholder="Ex: 170"
                        value={customFood.quantity_grams || ''}
                        onChange={(e) => setCustomFood({ ...customFood, quantity_grams: Number(e.target.value) })}
                        min={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="custom-calories">
                        Calorias (kcal) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="custom-calories"
                        type="number"
                        placeholder="Ex: 218"
                        value={customFood.calories || ''}
                        onChange={(e) => setCustomFood({ ...customFood, calories: Number(e.target.value) })}
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="custom-protein">Proteína (g)</Label>
                      <Input
                        id="custom-protein"
                        type="number"
                        placeholder="0"
                        value={customFood.protein || ''}
                        onChange={(e) => setCustomFood({ ...customFood, protein: Number(e.target.value) })}
                        min={0}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="custom-carbs">Carbo (g)</Label>
                      <Input
                        id="custom-carbs"
                        type="number"
                        placeholder="0"
                        value={customFood.carbs || ''}
                        onChange={(e) => setCustomFood({ ...customFood, carbs: Number(e.target.value) })}
                        min={0}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="custom-fat">Gordura (g)</Label>
                      <Input
                        id="custom-fat"
                        type="number"
                        placeholder="0"
                        value={customFood.fat || ''}
                        onChange={(e) => setCustomFood({ ...customFood, fat: Number(e.target.value) })}
                        min={0}
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  {customFood.name && customFood.calories > 0 && customFood.quantity_grams > 0 && (
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="font-medium">{customFood.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {customFood.quantity_grams}g • {formatCalories(customFood.calories)} kcal
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={handleAddCustomFood} 
                    className="w-full"
                    disabled={!customFood.name.trim() || customFood.calories <= 0 || customFood.quantity_grams <= 0}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar ao plano
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
