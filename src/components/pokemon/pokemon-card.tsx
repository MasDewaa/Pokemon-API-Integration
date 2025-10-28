import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PokemonData } from "@/types/pokemon";
import { TypeBadge } from "./type-badge";

interface PokemonCardProps {
  pokemon: PokemonData;
  onSelect: (pokemon: PokemonData) => void;
}

export function PokemonCard({ pokemon, onSelect }: PokemonCardProps) {
  return (
    <Card className="group relative overflow-hidden border border-primary/25 bg-gradient-to-br from-background/95 via-background/80 to-background/60 shadow-[0_14px_45px_rgba(37,99,235,0.15)] transition-all duration-200 hover:-translate-y-2 hover:shadow-[0_24px_65px_rgba(59,130,246,0.35)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.12),transparent_55%)] opacity-70" />
      <div className="relative z-10">
        <CardHeader className="flex flex-col gap-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex-1 text-xl font-semibold text-foreground">
              {pokemon.name}
            </CardTitle>
            <span className="text-sm font-bold text-muted-foreground/70">
              #{String(pokemon.id).padStart(3, "0")}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {pokemon.types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
            <div className="absolute inset-3 rounded-full bg-primary/15 blur-2xl" />
            <img
              src={pokemon.image}
              alt={pokemon.name}
              className="relative h-32 w-32 object-contain drop-shadow-[0_20px_30px_rgba(59,130,246,0.35)] transition-transform duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_30px_40px_rgba(59,130,246,0.4)]"
              loading="lazy"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm font-semibold text-muted-foreground">
            {pokemon.stats.slice(0, 3).map((stat) => (
              <div key={stat.name} className="rounded-lg bg-muted/40 px-3 py-2 text-center">
                <p className="text-xs uppercase tracking-widest text-muted-foreground/80">
                  {stat.name}
                </p>
                <p className="text-base text-foreground">{stat.base}</p>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-border/60 pt-4 text-sm text-muted-foreground">
          <p>
            {pokemon.weight.toFixed(1)} kg • {pokemon.height.toFixed(1)} m
          </p>
          <Button
            variant="outline"
            className="rounded-full border-primary/40 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary hover:bg-primary/20"
            onClick={() => onSelect(pokemon)}
          >
            Details
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
