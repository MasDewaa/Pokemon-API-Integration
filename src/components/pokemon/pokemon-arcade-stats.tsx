import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TypeBadge } from "@/components/pokemon/type-badge";
import type { PokemonData } from "@/types/pokemon";

interface HighlightEntry {
  title: string;
  statLabel: string;
  pokemon: PokemonData;
  metric: string;
}

interface PokemonArcadeStatsProps {
  highlights: HighlightEntry[];
  summary: Array<{ label: string; value: string }>;
}

export function PokemonArcadeStats({ highlights, summary }: PokemonArcadeStatsProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="border border-border/70 bg-card/90 shadow-2xl">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/80">Battle Hall</p>
            <CardTitle className="text-2xl font-bold">Elite Rankings</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Dynamic leaders calculated from the current roster.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {highlights.map(({ title, statLabel, pokemon, metric }) => (
            <div
              key={title}
              className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background/80 to-background p-4 shadow-lg"
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.35em] text-primary/80">
                <span>{title}</span>
                <span className="text-[0.6rem] text-primary/60">{metric}</span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-xl bg-background/70 shadow-inner">
                  <img
                    src={pokemon.animatedSprite ?? pokemon.image}
                    alt={pokemon.name}
                    className="animate-floaty h-16 w-16 object-contain drop-shadow-[0_12px_20px_rgba(59,130,246,0.35)]"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-foreground">{pokemon.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pokemon.types.map((type) => (
                      <TypeBadge key={type} type={type} className="px-2 py-0.5 text-[10px]" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                {statLabel}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border border-indigo-400/40 bg-gradient-to-br from-indigo-500/15 via-background to-transparent shadow-xl">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-300">Season Stats</p>
          <CardTitle className="text-xl font-bold text-foreground">Global Telemetry</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {summary.map((entry) => (
            <div
              key={entry.label}
              className="flex items-baseline justify-between rounded-xl border border-indigo-200/40 bg-background/70 px-4 py-3 shadow-sm"
            >
              <span className="text-sm font-semibold text-muted-foreground">{entry.label}</span>
              <span className="text-lg font-bold text-foreground">{entry.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
