import { useParams } from 'react-router-dom';
import { Layers } from 'lucide-react';

export default function PlaceholderPage() {
  const { section } = useParams();
  const label = section
    ? section.charAt(0).toUpperCase() + section.slice(1)
    : 'This';

  return (
    <div className="text-center py-20 animate-fade-in">
      <Layers className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4 animate-pulse" />
      <h3 className="text-lg font-extrabold text-foreground capitalize">{label}</h3>
      <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
        This panel screen is currently undergoing configuration and setup. Core data and options will be populated shortly.
      </p>
    </div>
  );
}
