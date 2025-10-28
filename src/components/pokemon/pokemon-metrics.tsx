import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PokemonMetricsProps {
  loadedCount: number;
  uniqueTypes: number;
  averageBaseExperience: number;
}

const metrics = [
  {
    id: "loaded",
    title: "Total Pokémon Loaded",
    format: (value: number) => value.toLocaleString(),
  },
  {
    id: "types",
    title: "Unique Types",
    format: (value: number) => value.toString(),
  },
  {
    id: "baseExp",
    title: "Average Base Experience",
    format: (value: number) => Math.round(value).toLocaleString(),
  },
];

export function PokemonMetrics({ loadedCount, uniqueTypes, averageBaseExperience }: PokemonMetricsProps) {
  const values: Record<string, number> = {
    loaded: loadedCount,
    types: uniqueTypes,
    baseExp: averageBaseExperience,
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.id} className="border-border/60 bg-card/95 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              {metric.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {metric.format(values[metric.id])}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
