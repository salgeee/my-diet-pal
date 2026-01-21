import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useMealPlans, MealPlan } from '@/hooks/useMealPlans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Edit2, Utensils, GripVertical } from 'lucide-react';
import { formatCalories } from '@/lib/calories';

export default function Meals() {
  const { mealPlans, isLoading, addMealPlan, updateMealPlan, deleteMealPlan } = useMealPlans();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealPlan | null>(null);
  const [newMeal, setNewMeal] = useState({ name: '', target_calories: 300 });

  const totalCalories = mealPlans.reduce((sum, meal) => sum + Number(meal.target_calories), 0);

  const handleAdd = () => {
    if (newMeal.name.trim()) {
      addMealPlan(newMeal);
      setNewMeal({ name: '', target_calories: 300 });
      setIsAddOpen(false);
    }
  };

  const handleUpdate = () => {
    if (editingMeal) {
      updateMealPlan({
        id: editingMeal.id,
        name: editingMeal.name,
        target_calories: editingMeal.target_calories,
      });
      setEditingMeal(null);
    }
  };

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
            <h1 className="text-2xl font-bold">Minhas Refeições</h1>
            <p className="text-muted-foreground">Configure suas refeições e metas</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
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
                    placeholder="Ex: Lanche da manhã"
                    value={newMeal.name}
                    onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meal-calories">Meta de calorias</Label>
                  <Input
                    id="meal-calories"
                    type="number"
                    value={newMeal.target_calories}
                    onChange={(e) => setNewMeal({ ...newMeal, target_calories: Number(e.target.value) })}
                    min={0}
                    max={3000}
                  />
                </div>
                <Button onClick={handleAdd} className="w-full">
                  Adicionar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary card */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total planejado</p>
                <p className="text-3xl font-bold text-primary">{formatCalories(totalCalories)} kcal</p>
              </div>
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
                <Utensils className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meals list */}
        <div className="space-y-3">
          {mealPlans.map((meal, index) => (
            <Card key={meal.id} className="group">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="text-muted-foreground cursor-grab">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                        {index + 1}
                      </span>
                      <h3 className="font-medium truncate">{meal.name}</h3>
                      {meal.is_default && (
                        <span className="text-xs text-primary">Padrão</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatCalories(Number(meal.target_calories))} kcal
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingMeal(meal)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteMealPlan(meal.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {mealPlans.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Utensils className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma refeição configurada</p>
              <p className="text-sm text-muted-foreground">
                Adicione suas refeições para começar a planejar
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit dialog */}
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
                <div className="space-y-2">
                  <Label htmlFor="edit-meal-calories">Meta de calorias</Label>
                  <Input
                    id="edit-meal-calories"
                    type="number"
                    value={editingMeal.target_calories}
                    onChange={(e) => setEditingMeal({ ...editingMeal, target_calories: Number(e.target.value) })}
                    min={0}
                    max={3000}
                  />
                </div>
                <Button onClick={handleUpdate} className="w-full">
                  Salvar alterações
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
