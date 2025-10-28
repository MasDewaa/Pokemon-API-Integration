export interface PokemonStat {
  name: string;
  base: number;
}

export interface PokemonData {
  id: number;
  name: string;
  image: string;
  animatedSprite?: string;
  cryUrl?: string;
  types: string[];
  weight: number;
  height: number;
  baseExperience: number;
  stats: PokemonStat[];
  abilities: string[];
  moves: string[];
  totalStats: number;
}

export interface PokemonBatchResponse {
  results: PokemonData[];
  nextOffset: number;
  hasMore: boolean;
  totalCount: number;
}

export interface PokemonEvolutionStage {
  id: number;
  name: string;
  image: string;
}
