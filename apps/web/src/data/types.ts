/** Contratos observados nos arquivos preservados; não são uma API de resultados ao vivo. */
export type Votes = Record<string, number>;
export interface ElectionCount {
  secoes: number;
  totalizadas: number;
  eleitorado: number;
  apurado: number;
  comparecimento: number;
  brancos: number;
  nulos: number;
  votos: Votes;
  situacao?: string;
  definido?: number;
  anulados?: Votes;
}
export interface CurrentFeed {
  versao: number;
  seq: number;
  gerado: number;
  t: number;
  turno: number;
  presidente: { br: ElectionCount; uf: Record<string, ElectionCount> };
  governador: { uf: Record<string, ElectionCount> };
  senado: { uf: Record<string, ElectionCount> };
  recarregar?: string | number;
}
export type DeputyOffice = "f" | "e";
/** Ordem exata do índice busca.json; sq permanece string. */
export type DeputySearchRow = [
  number,
  string,
  string,
  string,
  DeputyOffice,
  number,
  number,
  string,
];
export type DeputyStateRow = [number, string, string, number, number, string];
export type DeputyNationalRow = [
  number,
  string,
  string,
  number,
  number,
  string,
  string,
];
export interface DeputySearchFeed {
  versao: number;
  t: number;
  itens: DeputySearchRow[];
}
export interface Deputy {
  number: number;
  name: string;
  party: string;
  state: string;
  office: DeputyOffice;
  votes: number;
  elected: boolean;
  sequence: string;
}
export interface StateMunicipalityFeed {
  versao: number;
  seq: number;
  uf: string;
  ibge: number[];
  secoes: number[];
  totalizadas: number[];
  eleitorado: number[];
  apurado: number[];
  comparecimento: number[];
  brancos: number[];
  nulos: number[];
  votos: Record<string, number[]>;
}
export interface MunicipalityResult extends ElectionCount {
  ibge: number;
  uf: string;
}
export interface HistoryPoint {
  t: number;
  totalizadas: number;
  secoes: number;
  votos: Votes;
  situacao?: string;
}
export interface HistoryFeed {
  versao: number;
  seq: number;
  pontos: HistoryPoint[];
}
