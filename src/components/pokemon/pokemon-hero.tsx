import { TypeBadge } from "@/components/pokemon/type-badge";
import { Card } from "@/components/ui/card";
import type { PokemonData } from "@/types/pokemon";

interface PokemonHeroProps {
  featured?: PokemonData | null;
  totalLoaded: number;
  averagePower: number;
  topCategories: Array<{ label: string; value: string }>;
}

export function PokemonHero({ featured, totalLoaded, averagePower, topCategories }: PokemonHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-10 shadow-2xl sm:px-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute inset-0 animate-spin-gradient bg-[conic-gradient(at_50%_50%,_rgba(96,165,250,0.15)_0deg,_transparent_120deg,_rgba(244,114,182,0.18)_240deg)]" />
      </div>

      <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            Arcade Mode
          </div>
          <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Build the ultimate battle squad
          </h2>
          <p className="max-w-xl text-base text-muted-foreground">
            Analyze live power metrics, scout the most elite Pokemon, and dive into a cinematic PokeDewa experience inspired by arcade battle terminals.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border border-primary/30 bg-background/70 p-4 text-center">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.4em] text-primary">
                Roster Loaded
              </p>
              <p className="text-2xl font-bold text-foreground">{totalLoaded.toLocaleString()}</p>
            </Card>
            <Card className="border border-indigo-400/30 bg-background/70 p-4 text-center">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.4em] text-indigo-400">
                Avg Power Rating
              </p>
              <p className="text-2xl font-bold text-foreground">{Math.round(averagePower)}</p>
            </Card>
            <Card className="border border-fuchsia-400/30 bg-background/70 p-4 text-center">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.4em] text-fuchsia-400">
                Featured Awards
              </p>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                {topCategories.map((category) => (
                  <span key={category.label} className="truncate">
                    <strong className="text-foreground">{category.label}:</strong> {category.value}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div className="relative flex flex-col items-center justify-center gap-4">
          <div className="absolute -top-6 h-48 w-48 rounded-full bg-primary/20 blur-[80px]" />
          <div className="relative flex h-64 w-64 items-center justify-center rounded-full border border-primary/40 bg-card/70 shadow-[0_0_45px_rgba(59,130,246,0.35)]">
            <div className="absolute inset-0 animate-pulse-glow rounded-full border border-primary/30" />
            {featured ? (
              <img
                src={featured.animatedSprite ?? featured.image}
                alt={featured.name}
                className="animate-floaty h-44 w-44 object-contain drop-shadow-[0_25px_40px_rgba(59,130,246,0.45)]"
              />
            ) : (
              <div className="text-center text-sm text-muted-foreground">Loading champion...</div>
            )}
          </div>
          {featured && (
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                Featured Champion
              </p>
              <h3 className="text-2xl font-bold text-foreground">{featured.name}</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {featured.types.map((type) => (
                  <TypeBadge key={type} type={type} className="shadow-sm" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Total Power Index: <span className="font-semibold text-primary">{featured.totalStats}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
