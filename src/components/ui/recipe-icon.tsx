import { Utensils } from 'lucide-react';

export function RecipeIcon({ className = "w-full h-full" }: { className?: string }) {
  return (
    <div className={`bg-muted flex items-center justify-center ${className}`}>
      <Utensils className="w-1/3 h-1/3 text-muted-foreground" />
    </div>
  );
} 