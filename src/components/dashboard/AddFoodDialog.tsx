import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useFoodSearch, FoodItem } from '@/hooks/useFoodSearch';
import { useCustomFoods } from '@/hooks/useCustomFoods';
import { Search, Loader2, Plus, PenLine, Star } from 'lucide-react';
import { formatCalories } from '@/lib/calories';
import { cn } from '@/lib/utils';

interface AddFoodDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (food: {
    food_name: string;
    quantity_grams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    meal_plan_id?: string;
  }) => void;
  mealPlanId?: string;
}

export function AddFoodDialog({ open, onClose, onAdd, mealPlanId }: AddFoodDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [activeTab, setActiveTab] = useState('search');
  const { foods, isLoading, setSearchQuery: debouncedSearch } = useFoodSearch(searchQuery);
  const { customFoods, addCustomFood, isLoading: isLoadingCustom } = useCustomFoods(searchQuery);
  const [saveForLater, setSaveForLater] = useState(false);

  // Estado para alimento personalizado
  const [customFood, setCustomFood] = useState({
    name: '',
    quantity_grams: 100,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearch]);

  const handleSelect = (food: FoodItem) => {
    setSelectedFood(food);
    setQuantity(100);
  };

  const handleAdd = () => {
    if (!selectedFood) return;

    const multiplier = quantity / 100;
    onAdd({
      food_name: selectedFood.description,
      quantity_grams: quantity,
      calories: selectedFood.calories * multiplier,
      protein: selectedFood.protein * multiplier,
      carbs: selectedFood.carbs * multiplier,
      fat: selectedFood.fat * multiplier,
      meal_plan_id: mealPlanId,
    });

    resetAndClose();
  };

  const handleAddCustom = () => {
    if (!customFood.name.trim() || customFood.calories <= 0) return;

    // Calcular valores por 100g para salvar
    const multiplier = 100 / customFood.quantity_grams;

    // Salvar alimento para uso futuro se marcado
    if (saveForLater) {
      addCustomFood({
        food_name: customFood.name,
        calories_per_100g: customFood.calories * multiplier,
        protein_per_100g: customFood.protein * multiplier,
        carbs_per_100g: customFood.carbs * multiplier,
        fat_per_100g: customFood.fat * multiplier,
      });
    }

    onAdd({
      food_name: customFood.name,
      quantity_grams: customFood.quantity_grams,
      calories: customFood.calories,
      protein: customFood.protein,
      carbs: customFood.carbs,
      fat: customFood.fat,
      meal_plan_id: mealPlanId,
    });

    resetAndClose();
  };

  // Selecionar alimento personalizado salvo
  const handleSelectCustomFood = (food: typeof customFoods[0]) => {
    setSelectedFood({
      fdcId: food.id,
      description: food.food_name,
      calories: food.calories_per_100g,
      protein: food.protein_per_100g,
      carbs: food.carbs_per_100g,
      fat: food.fat_per_100g,
    });
    setQuantity(100);
  };

  const resetAndClose = () => {
    setSearchQuery('');
    setSelectedFood(null);
    setQuantity(100);
    setActiveTab('search');
    setSaveForLater(false);
    setCustomFood({
      name: '',
      quantity_grams: 100,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
    onClose();
  };

  const calculatedCalories = selectedFood ? (selectedFood.calories * quantity) / 100 : 0;

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar alimento</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Buscar
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <PenLine className="w-4 h-4" />
              Personalizado
            </TabsTrigger>
          </TabsList>

          {/* Tab de Busca */}
          <TabsContent value="search" className="flex-1 overflow-hidden flex flex-col mt-4">
            {!selectedFood ? (
              <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar alimento..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-1">
                  {isLoading && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  )}

                  {/* Mostrar alimentos personalizados do usuário primeiro */}
                  {!isLoading && searchQuery.length >= 2 && customFoods.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        Seus alimentos salvos
                      </p>
                      {customFoods.map((food) => (
                        <button
                          key={food.id}
                          className={cn(
                            "w-full text-left p-3 rounded-lg transition-colors",
                            "hover:bg-secondary border border-yellow-500/30 bg-yellow-500/5 mb-1"
                          )}
                          onClick={() => handleSelectCustomFood(food)}
                        >
                          <p className="font-medium text-sm line-clamp-2 flex items-center gap-2">
                            <Star className="w-3 h-3 text-yellow-500" />
                            {food.food_name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatCalories(food.calories_per_100g)} kcal/100g • 
                            P: {formatCalories(food.protein_per_100g)}g • 
                            C: {formatCalories(food.carbs_per_100g)}g • 
                            G: {formatCalories(food.fat_per_100g)}g
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {!isLoading && searchQuery.length >= 2 && foods.length === 0 && customFoods.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-2">
                        Nenhum alimento encontrado
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setActiveTab('custom');
                          setCustomFood(prev => ({ ...prev, name: searchQuery }));
                        }}
                      >
                        <PenLine className="w-4 h-4 mr-2" />
                        Cadastrar "{searchQuery}"
                      </Button>
                    </div>
                  )}

                  {!isLoading && searchQuery.length < 2 && (
                    <p className="text-center text-muted-foreground py-8">
                      Digite ao menos 2 caracteres para buscar
                    </p>
                  )}

                  {foods.map((food) => (
                    <button
                      key={food.fdcId}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-colors",
                        "hover:bg-secondary border border-transparent hover:border-border"
                      )}
                      onClick={() => handleSelect(food)}
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
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="font-medium">{selectedFood.description}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatCalories(selectedFood.calories)} kcal/100g
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade (gramas)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min={1}
                    max={5000}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {formatCalories(calculatedCalories)}
                    </p>
                    <p className="text-xs text-muted-foreground">kcal total</p>
                  </div>
                  <div className="text-right text-sm space-y-1">
                    <p>P: {formatCalories((selectedFood.protein * quantity) / 100)}g</p>
                    <p>C: {formatCalories((selectedFood.carbs * quantity) / 100)}g</p>
                    <p>G: {formatCalories((selectedFood.fat * quantity) / 100)}g</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedFood(null)} className="flex-1">
                    Voltar
                  </Button>
                  <Button onClick={handleAdd} className="flex-1">
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab de Alimento Personalizado */}
          <TabsContent value="custom" className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  💡 Não achou o alimento? Cadastre manualmente! Só nome e calorias são obrigatórios.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-name">
                  Nome do alimento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="custom-name"
                  placeholder="Ex: Pão de forma marca Y"
                  value={customFood.name}
                  onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="custom-calories">
                    Calorias (kcal) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="custom-calories"
                    type="number"
                    placeholder="Ex: 55"
                    value={customFood.calories || ''}
                    onChange={(e) => setCustomFood({ ...customFood, calories: Number(e.target.value) })}
                    min={0}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-quantity">Quantidade (g)</Label>
                  <Input
                    id="custom-quantity"
                    type="number"
                    value={customFood.quantity_grams}
                    onChange={(e) => setCustomFood({ ...customFood, quantity_grams: Number(e.target.value) })}
                    min={1}
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
                  <Label htmlFor="custom-carbs">Carboidrato (g)</Label>
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
              {customFood.name && customFood.calories > 0 && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="font-medium">{customFood.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {customFood.quantity_grams}g • {formatCalories(customFood.calories)} kcal
                  </p>
                  {(customFood.protein > 0 || customFood.carbs > 0 || customFood.fat > 0) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      P: {formatCalories(customFood.protein)}g • 
                      C: {formatCalories(customFood.carbs)}g • 
                      G: {formatCalories(customFood.fat)}g
                    </p>
                  )}
                </div>
              )}

              {/* Opção de salvar para uso futuro */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="save-for-later" 
                  checked={saveForLater}
                  onCheckedChange={(checked) => setSaveForLater(checked === true)}
                />
                <label
                  htmlFor="save-for-later"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Salvar para usar novamente
                </label>
              </div>

              <Button 
                onClick={handleAddCustom} 
                className="w-full"
                disabled={!customFood.name.trim() || customFood.calories <= 0}
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar alimento
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
