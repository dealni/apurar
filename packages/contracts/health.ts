import { timing, milliseconds } from "./timing";
import type { Snapshot } from "./snapshot";
import { isTimestamp } from "./validation";

export interface CollectorHealth {
  schema_version: 1;
  election: "6258";
  checked_at: string;
  last_success_at: string | null;
  status: string;
  cycle_seconds: number;
  pending_units: number;
  supplemental?: {
    status: "ok" | "error";
    pending: number;
    errors: number;
    zones_pending: number;
    last_updated_at: string | null;
  };
  tracking_failed_states?: string[];
  last_tracking_success_at?: string | null;
}
const statuses = [
  "live",
  "collecting",
  "finished",
  "awaiting",
  "backoff",
  "error",
  "invalid",
  "publishing",
  "degraded",
];
export function parseHealth(input: unknown): CollectorHealth {
  if (!input || typeof input !== "object") throw new Error("Saúde inválida.");
  const value = input as CollectorHealth;
  if (
    value.schema_version !== 1 ||
    value.election !== "6258" ||
    !statuses.includes(value.status)
  )
    throw new Error("Saúde incompatível.");
  for (const stamp of [value.checked_at, value.last_success_at]) {
    if (stamp !== null && !isTimestamp(stamp))
      throw new Error("Horário de saúde inválido.");
  }
  if (
    typeof value.checked_at !== "string" ||
    !Number.isFinite(value.cycle_seconds) ||
    value.cycle_seconds < 0 ||
    !Number.isSafeInteger(value.pending_units) ||
    value.pending_units < 0
  )
    throw new Error("Métricas de saúde inválidas.");
  validateTracking(value);
  validateSupplemental(value.supplemental);
  return value;
}
function validateTracking(value: CollectorHealth) {
  if (
    value.tracking_failed_states !== undefined &&
    (!Array.isArray(value.tracking_failed_states) ||
      value.tracking_failed_states.some(
        (uf) => typeof uf !== "string" || !/^[a-z]{2}$/.test(uf),
      ))
  )
    throw new Error("UFs de saúde inválidas.");
  if (
    value.last_tracking_success_at !== undefined &&
    value.last_tracking_success_at !== null &&
    !isTimestamp(value.last_tracking_success_at)
  )
    throw new Error("Horário da varredura inválido.");
}
function validateSupplemental(value: CollectorHealth["supplemental"]) {
  if (value === undefined) return;
  if (!value || !["ok", "error"].includes(value.status))
    throw new Error("Saúde suplementar inválida.");
  for (const count of [value.pending, value.errors, value.zones_pending])
    if (!Number.isSafeInteger(count) || count < 0)
      throw new Error("Fila suplementar inválida.");
  if (value.last_updated_at !== null && !isTimestamp(value.last_updated_at))
    throw new Error("Horário suplementar inválido.");
}
export function collectionStatus(
  snapshot: Snapshot | null,
  health: CollectorHealth | null = null,
  now = Date.now(),
) {
  if (!snapshot) return { warning: false, label: "Aguardando dados oficiais" };
  if (snapshot.mode === "demo")
    return { warning: false, label: "DEMONSTRAÇÃO · dados fictícios" };
  if (!health) return { warning: true, label: "Saúde do coletor indisponível" };
  const issue = operationalStatus(health, now);
  if (issue) return issue;
  if (
    health.status === "awaiting" ||
    (snapshot.sections.counted === 0 &&
      snapshot.candidates.every((candidate) => candidate.votes === 0))
  )
    return {
      warning: false,
      label: "Aguardando divulgação dos votos pelo TSE",
    };
  const successAge = health.last_success_at
    ? now - Date.parse(health.last_success_at)
    : Infinity;
  if (
    successAge < -60000 ||
    successAge > milliseconds(timing.healthStaleSeconds)
  )
    return { warning: true, label: "Sem consulta recente bem-sucedida ao TSE" };
  if (
    now - Date.parse(snapshot.source.as_of) >
    milliseconds(timing.sourceQuietSeconds)
  )
    return {
      warning: false,
      label: "Coleta ativa · aguardando nova publicação do TSE",
    };
  return { warning: false, label: "Dados oficiais recebidos · coleta ativa" };
}

function operationalStatus(health: CollectorHealth, now: number) {
  const age = now - Date.parse(health.checked_at);
  const tolerance =
    health.status === "finished"
      ? timing.finishedSeconds + timing.hiddenSeconds
      : timing.healthStaleSeconds;
  const healthy = age >= -60000 && age <= milliseconds(tolerance);
  if (!healthy)
    return { warning: true, label: "Coletor sem atualização recente" };
  if (health.status === "backoff")
    return { warning: true, label: "Coleta em espera após bloqueio do TSE" };
  if (["error", "invalid"].includes(health.status))
    return {
      warning: true,
      label: "Falha na coleta · último resultado preservado",
    };
  if (health.status === "degraded" || health.tracking_failed_states?.length)
    return {
      warning: true,
      label: "Coleta municipal parcial · totais nacionais preservados",
    };
  if (
    health.supplemental?.status === "error" ||
    (health.supplemental?.errors ?? 0) > 0
  )
    return {
      warning: true,
      label: "Falha no detalhamento adicional · placar presidencial preservado",
    };
  if (health.status === "finished")
    return {
      warning: false,
      label: "Totalização concluída · acompanhando correções",
    };
  if (health.status === "publishing")
    return {
      warning: true,
      label: "Publicação recuperada · aguardando consulta ao TSE",
    };
  return null;
}
