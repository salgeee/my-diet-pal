import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useFoodSearch, FoodItem } from '@/hooks/useFoodSearch';
import { Search, Loader2, Plus } from 'lucide-react';
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
  const { foods, isLoading, setSearchQuery: debouncedSearch } = useFoodSearch(searchQuery);

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

    setSearchQuery('');
    setSelectedFood(null);
    setQuantity(100);
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedFood(null);
    setQuantity(100);
    onClose();
  };

  const calculatedCalories = selectedFood ? (selectedFood.calories * quantity) / 100 : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar alimento</DialogTitle>
        </DialogHeader>

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

              {!isLoading && searchQuery.length >= 2 && foods.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum alimento encontrado
                </p>
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
      </DialogContent>
    </Dialog>
  );
}
