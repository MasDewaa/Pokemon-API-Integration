import type {
  PokemonBatchResponse,
  PokemonData,
  PokemonEvolutionStage,
} from "@/types/pokemon";

const API_BASE = "https://pokeapi.co/api/v2";

export async function fetchPokemonBatch(
  offset: number,
  limit: number
): Promise<PokemonBatchResponse> {
  const listResponse = await fetch(`${API_BASE}/pokemon?offset=${offset}&limit=${limit}`);

  if (!listResponse.ok) {
    throw new Error("Failed to fetch Pokémon list");
  }

  const listData = (await listResponse.json()) as {
    results: { name: string; url: string }[];
    next: string | null;
    count: number;
  };

  const detailedPokemon: PokemonData[] = await Promise.all(
    listData.results.map(async (entry) => {
      const detailResponse = await fetch(entry.url);
      if (!detailResponse.ok) {
        throw new Error("Failed to fetch Pokémon detail");
      }
      const detail = await detailResponse.json();
      return simplifyPokemon(detail);
    })
  );

  return {
    results: detailedPokemon,
    nextOffset: offset + listData.results.length,
    hasMore: Boolean(listData.next),
  };
}

export async function fetchPokemonTypes(): Promise<string[]> {
  const response = await fetch(`${API_BASE}/type`);

  if (!response.ok) {
    throw new Error("Failed to fetch Pokémon types");
  }

  const data = (await response.json()) as {
    results: { name: string }[];
  };

  return data.results
    .map((type) => type.name)
    .filter((name) => name !== "shadow" && name !== "unknown")
    .sort((a, b) => a.localeCompare(b));
}

function simplifyPokemon(detail: any): PokemonData {
  const stats = detail.stats as Array<{
    base_stat: number;
    stat: { name: string };
  }>;

  const abilities = detail.abilities as Array<{
    ability: { name: string };
    is_hidden: boolean;
  }>;

  const moves = detail.moves as Array<{
    move: { name: string };
    version_group_details: Array<{ level_learned_at: number }>;
  }>;

  return {
    id: detail.id,
    name: capitalize(detail.name),
    image:
      detail.sprites?.other?.["official-artwork"]?.front_default ??
      detail.sprites?.other?.home?.front_default ??
      detail.sprites?.front_default ??
      "",
    animatedSprite:
      detail.sprites?.versions?.["generation-v"]?.["black-white"]?.animated?.front_default ??
      detail.sprites?.other?.showdown?.front_default ??
      undefined,
    cryUrl: detail.cries?.latest ?? detail.cries?.legacy ?? undefined,
    types: (detail.types as Array<{ type: { name: string } }>).map((type) => type.type.name),
    weight: detail.weight / 10,
    height: detail.height / 10,
    baseExperience: detail.base_experience ?? 0,
    stats: stats.map((stat) => ({
      name: normalizeStatName(stat.stat.name),
      base: stat.base_stat,
    })),
    totalStats: stats.reduce((sum, stat) => sum + stat.base_stat, 0),
    abilities: abilities.map(({ ability, is_hidden }) =>
      `${capitalize(ability.name)}${is_hidden ? " (Hidden)" : ""}`
    ),
    moves: moves
      .sort((a, b) => (a.version_group_details?.[0]?.level_learned_at ?? 999) - (b.version_group_details?.[0]?.level_learned_at ?? 999))
      .slice(0, 6)
      .map((move) => capitalize(move.move.name)),
  };
}

export async function fetchEvolutionChain(pokemonId: number): Promise<PokemonEvolutionStage[]> {
  const speciesResponse = await fetch(`${API_BASE}/pokemon-species/${pokemonId}`);
  if (!speciesResponse.ok) {
    throw new Error("Failed to fetch Pokémon species");
  }

  const speciesData = await speciesResponse.json();
  const chainUrl: string | undefined = speciesData?.evolution_chain?.url;
  if (!chainUrl) {
    return [];
  }

  const chainResponse = await fetch(chainUrl);
  if (!chainResponse.ok) {
    throw new Error("Failed to fetch evolution chain");
  }

  const chainData = await chainResponse.json();

  const stages: PokemonEvolutionStage[] = [];
  const visit = (node: any) => {
    if (!node?.species?.url) {
      return;
    }

    const id = extractIdFromUrl(node.species.url);
    if (!id) {
      return;
    }

    if (!stages.some((stage) => stage.id === id)) {
      stages.push({
        id,
        name: capitalize(node.species.name),
        image: getOfficialArtworkUrl(id),
      });
    }

    if (Array.isArray(node.evolves_to)) {
      node.evolves_to.forEach(visit);
    }
  };

  visit(chainData?.chain);

  return stages;
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function normalizeStatName(name: string): string {
  if (name === "special-attack") return "Sp. Atk";
  if (name === "special-defense") return "Sp. Def";
  if (name === "hp") return "HP";
  return capitalize(name.replace("-", " "));
}

function extractIdFromUrl(url: string): number | null {
  const segments = url.split("/").filter(Boolean);
  const idSegment = segments[segments.length - 1];
  const parsed = Number(idSegment);
  return Number.isFinite(parsed) ? parsed : null;
}

function getOfficialArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}
