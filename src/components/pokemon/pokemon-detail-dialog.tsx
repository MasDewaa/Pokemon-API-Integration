import { useEffect, useMemo, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { SpeakerLoudIcon } from "@radix-ui/react-icons";
import type { PokemonData, PokemonEvolutionStage } from "@/types/pokemon";
import { TypeBadge } from "./type-badge";
import { fetchEvolutionChain } from "@/lib/pokeapi";

interface PokemonDetailDialogProps {
  pokemon: PokemonData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PokemonDetailDialog({ pokemon, open, onOpenChange }: PokemonDetailDialogProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [evolutions, setEvolutions] = useState<PokemonEvolutionStage[]>([]);
  const [isEvolutionLoading, setIsEvolutionLoading] = useState(false);
  const [evolutionError, setEvolutionError] = useState<string | null>(null);

  const cryUrl = useMemo(() => pokemon?.cryUrl ?? null, [pokemon?.cryUrl]);

  useEffect(() => {
    if (cryUrl && typeof Audio !== "undefined") {
      const audio = new Audio(cryUrl);
      audioRef.current = audio;
      const handleEnded = () => setIsPlaying(false);
      audio.addEventListener("ended", handleEnded);
      setIsPlaying(false);
      return () => {
        audio.pause();
        audio.removeEventListener("ended", handleEnded);
        audioRef.current = null;
      };
    }

    audioRef.current = null;
    setIsPlaying(false);
    return undefined;
  }, [cryUrl]);

  useEffect(() => {
    if (!open && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [open]);

  const handlePlayCry = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    const playPromise = audioRef.current.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    let ignore = false;

    if (!pokemon) {
      setEvolutions([]);
      setEvolutionError(null);
      setIsEvolutionLoading(false);
      return () => {
        ignore = true;
      };
    }

    setIsEvolutionLoading(true);
    setEvolutionError(null);
    setEvolutions([]);

    fetchEvolutionChain(pokemon.id)
      .then((stages) => {
        if (!ignore) {
          setEvolutions(stages);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setEvolutionError((err as Error).message);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsEvolutionLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [pokemon?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden border-border/60 bg-card/95 p-0 sm:max-w-5xl">
        {pokemon && (
          <ScrollArea className="max-h-[90vh]">
            <div className="grid gap-8 p-6 sm:p-10">
              <DialogHeader className="space-y-2 text-left">
                <DialogTitle className="text-3xl font-bold text-foreground">
                  {pokemon.name}
                </DialogTitle>
                <DialogDescription className="text-base font-semibold text-muted-foreground">
                  #{String(pokemon.id).padStart(3, "0")} • Base EXP {pokemon.baseExperience}
                </DialogDescription>
                <div className="flex flex-wrap gap-2">
                  {pokemon.types.map((type) => (
                    <TypeBadge key={type} type={type} />
                  ))}
                </div>
                {cryUrl ? (
                  <Button
                    type="button"
                    onClick={handlePlayCry}
                    variant="outline"
                    className="mt-2 flex w-fit items-center gap-2 rounded-full border-primary/40 bg-primary/10 px-4 py-1 text-sm text-primary hover:bg-primary/20"
                  >
                    <SpeakerLoudIcon className="h-4 w-4" />
                    {isPlaying ? "Playing cry…" : "Play battle cry"}
                  </Button>
                ) : null}
              </DialogHeader>
              <div className="flex flex-col gap-8 lg:flex-row">
                <div className="flex flex-1 flex-col items-center gap-4">
                  <div className="relative flex h-48 w-48 items-center justify-center">
                    <div className="absolute inset-6 rounded-[40%] bg-primary/10 blur-2xl" />
                    <img
                      src={pokemon.animatedSprite ?? pokemon.image}
                      alt={pokemon.name}
                      className="relative h-44 w-44 object-contain drop-shadow-2xl"
                    />
                  </div>
                  <div className="grid w-full grid-cols-3 gap-3 text-center text-sm font-semibold text-muted-foreground">
                    <div className="rounded-2xl bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground/70">Height</p>
                      <p className="text-foreground">{pokemon.height.toFixed(1)} m</p>
                    </div>
                    <div className="rounded-2xl bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground/70">Weight</p>
                      <p className="text-foreground">{pokemon.weight.toFixed(1)} kg</p>
                    </div>
                    <div className="rounded-2xl bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground/70">Types</p>
                      <p className="text-foreground">{pokemon.types.join(", ")}</p>
                    </div>
                  </div>
                  <section className="w-full space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">Evolution Line</h3>
                      {isEvolutionLoading ? (
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                          Loading…
                        </span>
                      ) : null}
                    </div>
                    {evolutionError ? (
                      <p className="text-sm text-destructive">{evolutionError}</p>
                    ) : evolutions.length > 1 ? (
                      <div className="flex flex-wrap items-center justify-center gap-4">
                        {evolutions.map((stage, index) => (
                          <div key={stage.id} className="flex items-center gap-4">
                            <div className="flex flex-col items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 shadow-sm">
                              <div className="h-20 w-20 overflow-hidden rounded-xl bg-background/70 shadow-inner">
                                <img
                                  src={stage.image}
                                  alt={stage.name}
                                  className="h-full w-full object-contain"
                                  loading="lazy"
                                />
                              </div>
                              <span className="text-sm font-semibold text-foreground">{stage.name}</span>
                              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-primary/70">
                                Stage {index + 1}
                              </span>
                            </div>
                            {index < evolutions.length - 1 ? (
                              <span className="text-primary/70">→</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">No further evolutions.</p>
                    )}
                  </section>
                </div>
                <div className="flex-1 space-y-8">
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Primary Stats</h3>
                    <div className="space-y-3">
                      {pokemon.stats.map((stat) => {
                        const percentage = Math.min(100, Math.round((stat.base / 220) * 100));
                        return (
                          <div key={stat.name} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
                              <span>{stat.name}</span>
                              <span>{stat.base}</span>
                            </div>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-muted/50">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-primary/90 to-primary"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                  <section className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-foreground">Abilities</h3>
                      <div className="flex flex-wrap gap-2">
                        {pokemon.abilities.map((ability) => (
                          <Badge key={ability} variant="outline" className="rounded-full bg-muted/40 py-2">
                            {ability}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-foreground">Signature Moves</h3>
                      <div className="flex flex-wrap gap-2">
                        {pokemon.moves.length ? (
                          pokemon.moves.map((move) => (
                            <Badge key={move} variant="secondary" className="rounded-full bg-primary/10 text-primary">
                              {move}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No moves recorded.</p>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
