import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateTMB, calculateGET, getActivityLevelLabel, formatCalories } from '@/lib/calories';
import { Scale, Ruler, Calendar, Activity, Target, Loader2, Save } from 'lucide-react';

export default function Profile() {
  const { profile, isLoading, updateProfile, isUpdating } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    weight: 0,
    height: 0,
    age: 0,
    sex: 'male' as 'male' | 'female',
    activity_level: 'moderate',
    calorie_goal: 0,
    protein_goal: 0,
    carbs_goal: 0,
    fat_goal: 0,
  });

  const startEditing = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        sex: profile.sex as 'male' | 'female',
        activity_level: profile.activity_level,
        calorie_goal: Number(profile.calorie_goal) || 0,
        protein_goal: Number(profile.protein_goal) || 0,
        carbs_goal: Number(profile.carbs_goal) || 0,
        fat_goal: Number(profile.fat_goal) || 0,
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) return null;

  const tmb = calculateTMB(profile.weight, profile.height, profile.age, profile.sex as 'male' | 'female');
  const get = calculateGET(tmb, profile.activity_level);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground">Gerencie suas informações</p>
          </div>
          {!isEditing && (
            <Button onClick={startEditing}>Editar</Button>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{formatCalories(tmb)}</p>
              <p className="text-xs text-muted-foreground">TMB (kcal/dia)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-accent">{formatCalories(get)}</p>
              <p className="text-xs text-muted-foreground">GET (kcal/dia)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success">
                {formatCalories(Number(profile.calorie_goal) || get - 500)}
              </p>
              <p className="text-xs text-muted-foreground">Meta diária</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-warning">
                {formatCalories(get - (Number(profile.calorie_goal) || get - 500))}
              </p>
              <p className="text-xs text-muted-foreground">Déficit alvo</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile form */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              {isEditing
                ? 'Edite suas informações abaixo'
                : 'Seus dados são usados para calcular TMB e GET'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-primary" />
                      Peso (kg)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                      min={30}
                      max={300}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height" className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-primary" />
                      Altura (cm)
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                      min={100}
                      max={250}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Idade
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                      min={15}
                      max={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sexo</Label>
                    <Select
                      value={formData.sex}
                      onValueChange={(value: 'male' | 'female') => setFormData({ ...formData, sex: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Nível de atividade
                  </Label>
                  <Select
                    value={formData.activity_level}
                    onValueChange={(value) => setFormData({ ...formData, activity_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['sedentary', 'light', 'moderate', 'active', 'very_active'].map((level) => (
                        <SelectItem key={level} value={level}>
                          {getActivityLevelLabel(level)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calorie_goal" className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Meta de calorias diárias
                  </Label>
                  <Input
                    id="calorie_goal"
                    type="number"
                    value={formData.calorie_goal}
                    onChange={(e) => setFormData({ ...formData, calorie_goal: Number(e.target.value) })}
                    min={1000}
                    max={5000}
                  />
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-muted-foreground">Metas de Macronutrientes</h3>
                    <p className="text-xs text-muted-foreground">Calculadas automaticamente da sua dieta</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="protein_goal">Proteína (g)</Label>
                      <Input
                        id="protein_goal"
                        type="number"
                        value={formData.protein_goal}
                        onChange={(e) => setFormData({ ...formData, protein_goal: Number(e.target.value) })}
                        min={0}
                        max={500}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carbs_goal">Carboidratos (g)</Label>
                      <Input
                        id="carbs_goal"
                        type="number"
                        value={formData.carbs_goal}
                        onChange={(e) => setFormData({ ...formData, carbs_goal: Number(e.target.value) })}
                        min={0}
                        max={1000}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fat_goal">Gordura (g)</Label>
                      <Input
                        id="fat_goal"
                        type="number"
                        value={formData.fat_goal}
                        onChange={(e) => setFormData({ ...formData, fat_goal: Number(e.target.value) })}
                        min={0}
                        max={300}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} className="flex-1" disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Nome</span>
                  <span className="font-medium">{profile.name || 'Não informado'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Peso</span>
                  <span className="font-medium">{profile.weight} kg</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Altura</span>
                  <span className="font-medium">{profile.height} cm</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Idade</span>
                  <span className="font-medium">{profile.age} anos</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Sexo</span>
                  <span className="font-medium">
                    {profile.sex === 'male' ? 'Masculino' : 'Feminino'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Nível de atividade</span>
                  <span className="font-medium text-right">
                    {getActivityLevelLabel(profile.activity_level)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Meta diária</span>
                  <span className="font-medium">
                    {formatCalories(Number(profile.calorie_goal) || get - 500)} kcal
                  </span>
                </div>
                {(profile.protein_goal || profile.carbs_goal || profile.fat_goal) && (
                  <>
                    <div className="pt-2">
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Metas de Macronutrientes</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 rounded-lg bg-secondary/50">
                        <p className="text-xl font-bold text-primary">{profile.protein_goal || 0}g</p>
                        <p className="text-xs text-muted-foreground">Proteína</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-secondary/50">
                        <p className="text-xl font-bold text-accent">{profile.carbs_goal || 0}g</p>
                        <p className="text-xs text-muted-foreground">Carboidratos</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-secondary/50">
                        <p className="text-xl font-bold text-warning">{profile.fat_goal || 0}g</p>
                        <p className="text-xs text-muted-foreground">Gordura</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
