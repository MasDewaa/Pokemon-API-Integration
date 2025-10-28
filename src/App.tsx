import { useCallback, useEffect, useMemo, useState } from "react";

import { PokemonCard } from "@/components/pokemon/pokemon-card";
import { PokemonDetailDialog } from "@/components/pokemon/pokemon-detail-dialog";
import { PokemonHero } from "@/components/pokemon/pokemon-hero";
import { PokemonArcadeStats } from "@/components/pokemon/pokemon-arcade-stats";
import { PokemonMetrics } from "@/components/pokemon/pokemon-metrics";
import { PokemonSkeletonGrid } from "@/components/pokemon/pokemon-skeleton-grid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { fetchPokemonBatch, fetchPokemonTypes } from "@/lib/pokeapi";
import type { PokemonData } from "@/types/pokemon";

const PAGE_SIZE = 24;
const THEME_STORAGE_KEY = "pokedex-theme";

const sortOptions = [
  { value: "id-asc", label: "PokeDewa ID ↑" },
  { value: "id-desc", label: "PokeDewa ID ↓" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "weight-desc", label: "Weight Heavy-Light" },
  { value: "weight-asc", label: "Weight Light-Heavy" },
];

type Theme = "light" | "dark";

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored) return stored;
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });
  const [pokemonPages, setPokemonPages] = useState<Record<number, PokemonData[]>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [types, setTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [sortMode, setSortMode] = useState("id-asc");

  const [selectedPokemon, setSelectedPokemon] = useState<PokemonData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    fetchPokemonTypes()
      .then(setTypes)
      .catch(() => setTypes([]));
  }, []);

  const fetchPageData = useCallback(
    async (targetPage: number) => {
      if (pokemonPages[targetPage]) {
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const offset = (targetPage - 1) * PAGE_SIZE;
        const { results, totalCount: total } = await fetchPokemonBatch(offset, PAGE_SIZE);
        setPokemonPages((prev) => ({
          ...prev,
          [targetPage]: results,
        }));
        setTotalCount(total);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [pokemonPages]
  );

  useEffect(() => {
    fetchPageData(page);
  }, [page, fetchPageData]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedType, sortMode]);

  const aggregatedPokemon = useMemo(() => {
    return Object.keys(pokemonPages)
      .map(Number)
      .sort((a, b) => a - b)
      .flatMap((pageNumber) => pokemonPages[pageNumber] ?? []);
  }, [pokemonPages]);

  const filteredPokemon = useMemo(() => {
    const query = search.trim().toLowerCase();

    let result = [...aggregatedPokemon];

    if (query) {
      result = result.filter((pokemon) => {
        const matchesName = pokemon.name.toLowerCase().includes(query);
        const matchesId = pokemon.id.toString() === query;
        return matchesName || matchesId;
      });
    }

    if (selectedType) {
      result = result.filter((pokemon) => pokemon.types.includes(selectedType));
    }

    result.sort((a, b) => sortPokemon(a, b, sortMode));

    return result;
  }, [aggregatedPokemon, search, selectedType, sortMode]);

  const totalFilteredPages = Math.max(1, Math.ceil(filteredPokemon.length / PAGE_SIZE));
  const totalPagesFromApi = useMemo(() => {
    if (totalCount) {
      return Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    }
    const loadedPages = Object.keys(pokemonPages).length;
    return Math.max(1, loadedPages || 1);
  }, [totalCount, pokemonPages]);

  useEffect(() => {
    if (page > totalPagesFromApi) {
      setPage(totalPagesFromApi);
    }
  }, [page, totalPagesFromApi]);

  const currentPageIndex = Math.max(0, Math.min(page, totalFilteredPages) - 1);
  const paginatedPokemon = useMemo(() => {
    const start = currentPageIndex * PAGE_SIZE;
    return filteredPokemon.slice(start, start + PAGE_SIZE);
  }, [filteredPokemon, currentPageIndex]);

  const uniqueTypeCount = useMemo(() => {
    return new Set(filteredPokemon.flatMap((pokemon) => pokemon.types)).size;
  }, [filteredPokemon]);

  const averageBaseExperience = useMemo(() => {
    if (!paginatedPokemon.length) return 0;
    const total = paginatedPokemon.reduce((sum, pokemon) => sum + pokemon.baseExperience, 0);
    return total / paginatedPokemon.length;
  }, [paginatedPokemon]);

  const roster = paginatedPokemon.length ? paginatedPokemon : filteredPokemon;

  const arcadeData = useMemo(() => {
    if (!roster.length) {
      return {
        featured: null as PokemonData | null,
        averagePower: 0,
        heroCategories: [] as Array<{ label: string; value: string }>,
        highlights: [] as Array<{ title: string; statLabel: string; pokemon: PokemonData; metric: string }>,
        summary: [] as Array<{ label: string; value: string }>,
      };
    }

    const sortedByPower = [...roster].sort((a, b) => b.totalStats - a.totalStats);
    const featured = sortedByPower[0] ?? null;
    const averagePower = roster.reduce((sum, pokemon) => sum + pokemon.totalStats, 0) / roster.length;

    const findStatLeader = (statName: string) => {
      let leader: PokemonData | null = null;
      let value = -Infinity;
      for (const pokemon of roster) {
        const stat = pokemon.stats.find((entry) => entry.name === statName);
        if (stat && stat.base > value) {
          leader = pokemon;
          value = stat.base;
        }
      }
      if (!leader || value === -Infinity) return null;
      return { pokemon: leader, value };
    };

    const attackLeader = findStatLeader("Attack");
    const speedLeader = findStatLeader("Speed");
    const specialLeader = findStatLeader("Sp. Atk");

    const heaviest = roster.reduce((prev, current) => (current.weight > prev.weight ? current : prev));
    const tallest = roster.reduce((prev, current) => (current.height > prev.height ? current : prev));
    const baseExpLeader = roster.reduce((prev, current) =>
      current.baseExperience > prev.baseExperience ? current : prev
    );

    const highlights = [
      featured && {
        title: "Power Core",
        statLabel: `Total Stats ${featured.totalStats}`,
        pokemon: featured,
        metric: "PWR",
      },
      attackLeader && {
        title: "Critical Hit",
        statLabel: `Attack ${attackLeader.value}`,
        pokemon: attackLeader.pokemon,
        metric: "ATK",
      },
      speedLeader && {
        title: "Hyper Speed",
        statLabel: `Speed ${speedLeader.value}`,
        pokemon: speedLeader.pokemon,
        metric: "SPD",
      },
    ].filter(Boolean) as Array<{ title: string; statLabel: string; pokemon: PokemonData; metric: string }>;

    const heroCategories = [
      attackLeader && {
        label: "Top Attack",
        value: `${attackLeader.pokemon.name} (${attackLeader.value})`,
      },
      speedLeader && {
        label: "Speedster",
        value: `${speedLeader.pokemon.name} (${speedLeader.value})`,
      },
      specialLeader && {
        label: "Arcane Power",
        value: `${specialLeader.pokemon.name} (${specialLeader.value})`,
      },
      {
        label: "Juggernaut",
        value: `${heaviest.name} (${heaviest.weight.toFixed(1)} kg)`,
      },
      {
        label: "XP Leader",
        value: `${baseExpLeader.name} (${baseExpLeader.baseExperience})`,
      },
    ]
      .filter(Boolean)
      .slice(0, 3) as Array<{ label: string; value: string }>;

    const summary = [
      {
        label: "Heaviest",
        value: `${heaviest.name} (${heaviest.weight.toFixed(1)} kg)`,
      },
      {
        label: "Tallest",
        value: `${tallest.name} (${tallest.height.toFixed(1)} m)`,
      },
      {
        label: "Max Base EXP",
        value: `${baseExpLeader.name} (${baseExpLeader.baseExperience})`,
      },
      {
        label: "Avg Weight",
        value: `${(
          roster.reduce((sum, pokemon) => sum + pokemon.weight, 0) / roster.length
        ).toFixed(1)} kg`,
      },
    ];

    return {
      featured,
      averagePower,
      heroCategories,
      highlights,
      summary,
    };
  }, [roster]);

  const { featured, averagePower, heroCategories, highlights, summary } = arcadeData;

  function handleRetry() {
    fetchPageData(page);
  }

  function handleSelectPokemon(pokemon: PokemonData) {
    setSelectedPokemon(pokemon);
    setIsDialogOpen(true);
  }

  function handleDialogChange(open: boolean) {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedPokemon(null);
    }
  }

  const showSkeletons = isLoading && !(pokemonPages[page]?.length);
  const displayTotalPages = search || selectedType ? totalFilteredPages : totalPagesFromApi;
  const canGoPrev = page > 1;
  const canGoNext = page < displayTotalPages;
  const [pageInput, setPageInput] = useState<string>(String(page));

  useEffect(() => {
    setPageInput(String(Math.min(page, displayTotalPages)));
  }, [page, displayTotalPages]);

  const handlePageSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number(pageInput);
    if (!Number.isFinite(parsed)) {
      return;
    }
    const clamped = Math.min(Math.max(1, Math.floor(parsed)), displayTotalPages);
    setPage(clamped);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background/80 to-background">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_hsla(221,83%,60%,0.14),_transparent_55%),_radial-gradient(circle_at_bottom,_hsla(349,85%,60%,0.14),_transparent_45%)]" />
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pb-20 pt-10 md:px-10">
        <header className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-card/95 p-8 shadow-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                PokeAPI
              </span>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
                PokeDewa Explorer
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground">
                Explore richly detailed Pokemon profiles, filter by elemental types, and surface battle-ready insights with an elevated interface powered by shadcn/ui.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
              <Label htmlFor="theme-toggle" className="text-sm font-medium text-muted-foreground">
                Dark mode
              </Label>
              <Switch
                id="theme-toggle"
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </div>
          <Card className="border-border/50 bg-card/90 p-6 shadow-lg">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="w-full max-w-xl space-y-2">
                <Label htmlFor="pokemon-search" className="text-sm font-semibold text-muted-foreground">
                  Search Pokemon
                </Label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Input
                    id="pokemon-search"
                    placeholder="Search by name or PokeDewa ID"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-12 flex-1 rounded-2xl border-border/60 bg-background/80 text-base shadow-inner"
                  />
                  {search && (
                    <Button variant="outline" className="h-11 rounded-2xl" onClick={() => setSearch("")}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex w-full flex-col gap-4 sm:flex-row">
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Type</Label>
                  <Select
                    value={selectedType || "all"}
                    onValueChange={(value) => setSelectedType(value === "all" ? "" : value)}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-border/60 bg-background/80">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/50">
                      <SelectItem value="all">All Types</SelectItem>
                      {types.map((type) => (
                        <SelectItem key={type} value={type} className="capitalize">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Sort by</Label>
                  <Select value={sortMode} onValueChange={setSortMode}>
                    <SelectTrigger className="h-12 rounded-2xl border-border/60 bg-background/80">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/50">
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>
        </header>

        <PokemonHero
          featured={featured}
          totalLoaded={filteredPokemon.length}
          averagePower={averagePower}
          topCategories={heroCategories}
        />

        {highlights.length ? (
          <PokemonArcadeStats highlights={highlights} summary={summary} />
        ) : null}

        <PokemonMetrics
          loadedCount={filteredPokemon.length}
          uniqueTypes={uniqueTypeCount}
          averageBaseExperience={averageBaseExperience}
        />

        <section className="space-y-6">
          {error ? (
            <Card className="flex flex-col items-center gap-4 border-destructive/30 bg-destructive/10 p-8 text-center">
              <div>
                <h3 className="text-xl font-semibold text-destructive">Something went wrong</h3>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
              <Button onClick={handleRetry} className="rounded-2xl">
                Retry
              </Button>
            </Card>
          ) : showSkeletons ? (
            <PokemonSkeletonGrid count={9} />
          ) : paginatedPokemon.length ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedPokemon.map((pokemon) => (
                <PokemonCard key={pokemon.id} pokemon={pokemon} onSelect={handleSelectPokemon} />
              ))}
            </div>
          ) : (
            <Card className="border-border/60 bg-card/80 p-10 text-center shadow-lg">
              <h3 className="text-xl font-semibold text-foreground">No Pokemon found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Adjust your search or filters to discover more Pokemon.
              </p>
            </Card>
          )}

          <div className="flex flex-col items-center justify-end gap-4 sm:flex-row">
            <form
              onSubmit={handlePageSubmit}
              className="flex flex-wrap items-center justify-center gap-3 sm:justify-start"
            >
              <Button
                type="button"
                variant="default"
                onClick={() => setPage(1)}
                disabled={page === 1 || isLoading}
                className="rounded-full px-4"
              >
                «
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={!canGoPrev || isLoading}
                className="rounded-full px-4"
              >
                ‹
              </Button>
              <label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <span>Page</span>
                <input
                  value={pageInput}
                  onChange={(event) => setPageInput(event.target.value.replace(/[^0-9]/g, ""))}
                  className="h-10 w-16 rounded-xl border border-border/100 bg-background/80 text-center text-base font-semibold text-foreground shadow-inner"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <span className="whitespace-nowrap">of {displayTotalPages}</span>
              </label>
              <Button
                type="button"
                variant="default"
                onClick={() => setPage((prev) => Math.min(displayTotalPages, prev + 1))}
                disabled={!canGoNext || isLoading}
                className="rounded-full px-4"
              >
                ›
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={() => setPage(displayTotalPages)}
                disabled={page === displayTotalPages || isLoading}
                className="rounded-full px-4"
              >
                »
              </Button>
            </form>
          </div>
        </section>
      </div>

      <PokemonDetailDialog pokemon={selectedPokemon} open={isDialogOpen} onOpenChange={handleDialogChange} />
    </div>
  );
}

function sortPokemon(a: PokemonData, b: PokemonData, mode: string) {
  switch (mode) {
    case "id-desc":
      return b.id - a.id;
    case "name-asc":
      return a.name.localeCompare(b.name);
    case "name-desc":
      return b.name.localeCompare(a.name);
    case "weight-asc":
      return a.weight - b.weight;
    case "weight-desc":
      return b.weight - a.weight;
    default:
      return a.id - b.id;
  }
}
