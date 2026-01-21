// Mifflin-St Jeor Formula for BMR (Basal Metabolic Rate) / TMB
export function calculateTMB(weight: number, height: number, age: number, sex: 'male' | 'female'): number {
  if (sex === 'male') {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  }
  return (10 * weight) + (6.25 * height) - (5 * age) - 161;
}

// Activity level multipliers for TDEE (Total Daily Energy Expenditure) / GET
const activityMultipliers: Record<string, number> = {
  sedentary: 1.2,      // Little or no exercise
  light: 1.375,        // Light exercise 1-3 days/week
  moderate: 1.55,      // Moderate exercise 3-5 days/week
  active: 1.725,       // Hard exercise 6-7 days/week
  very_active: 1.9,    // Very hard exercise & physical job
};

export function calculateGET(tmb: number, activityLevel: string): number {
  const multiplier = activityMultipliers[activityLevel] || 1.55;
  return tmb * multiplier;
}

export function getActivityLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    sedentary: 'Sedentário (pouco ou nenhum exercício)',
    light: 'Leve (exercício 1-3 dias/semana)',
    moderate: 'Moderado (exercício 3-5 dias/semana)',
    active: 'Ativo (exercício 6-7 dias/semana)',
    very_active: 'Muito ativo (exercício intenso diário)',
  };
  return labels[level] || level;
}

export function formatCalories(value: number): string {
  return Math.round(value).toLocaleString('pt-BR');
}

export function calculateDeficit(consumed: number, target: number): number {
  return target - consumed;
}

export function getDeficitStatus(deficit: number): 'success' | 'warning' | 'danger' {
  if (deficit >= 0) return 'success';
  if (deficit >= -200) return 'warning';
  return 'danger';
}
