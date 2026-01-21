import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddFoodDialog } from './AddFoodDialog';
import { useDailyLog } from '@/hooks/useDailyLog';

export function QuickAddFood() {
  const [isOpen, setIsOpen] = useState(false);
  const { addFoodEntry } = useDailyLog();

  return (
    <>
      <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="flex items-center justify-center py-6">
          <Button variant="ghost" className="gap-2">
            <Plus className="w-5 h-5" />
            Adicionar alimento rápido
          </Button>
        </CardContent>
      </Card>

      <AddFoodDialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onAdd={(food) => addFoodEntry(food)}
      />
    </>
  );
}
