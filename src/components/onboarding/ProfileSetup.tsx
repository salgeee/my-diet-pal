import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Scale, Ruler, Calendar, Activity, Target } from 'lucide-react';
import { calculateTMB, calculateGET, getActivityLevelLabel, formatCalories } from '@/lib/calories';

export function ProfileSetup() {
  const { updateProfile, isUpdating } = useProfile();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    weight: 70,
    height: 170,
    age: 25,
    sex: 'male' as 'male' | 'female',
    activity_level: 'moderate',
    calorie_goal: 0,
  });

  const tmb = calculateTMB(formData.weight, formData.height, formData.age, formData.sex);
  const get = calculateGET(tmb, formData.activity_level);

  const handleSubmit = () => {
    updateProfile({
      ...formData,
      calorie_goal: formData.calorie_goal || get - 500, // Default 500 kcal deficit
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary/20 to-background">
      <Card className="w-full max-w-lg shadow-xl border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Configure seu perfil</CardTitle>
          <CardDescription>
            {step === 1 && 'Precisamos de algumas informações para calcular suas metas'}
            {step === 2 && 'Qual seu nível de atividade física?'}
            {step === 3 && 'Defina sua meta de calorias diárias'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
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

              <Button onClick={() => setStep(2)} className="w-full">
                Continuar
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
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

              <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
                <p className="text-sm text-muted-foreground">Seus cálculos:</p>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{formatCalories(tmb)}</p>
                    <p className="text-xs text-muted-foreground">TMB (kcal/dia)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">{formatCalories(get)}</p>
                    <p className="text-xs text-muted-foreground">GET (kcal/dia)</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Voltar
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1">
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="calorie_goal" className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Meta de calorias diárias
                </Label>
                <Input
                  id="calorie_goal"
                  type="number"
                  value={formData.calorie_goal || Math.round(get - 500)}
                  onChange={(e) => setFormData({ ...formData, calorie_goal: Number(e.target.value) })}
                  min={1000}
                  max={5000}
                />
                <p className="text-sm text-muted-foreground">
                  Sugerimos {formatCalories(get - 500)} kcal para um déficit de 500 kcal/dia
                </p>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm font-medium text-primary">
                  Com essa meta, você terá um déficit de {formatCalories(get - (formData.calorie_goal || get - 500))} kcal/dia
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Voltar
                </Button>
                <Button onClick={handleSubmit} className="flex-1" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Começar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
