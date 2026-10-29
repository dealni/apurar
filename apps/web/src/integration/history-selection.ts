import type { HistoryPoint } from "../feeds";
import { minuteOf } from "./adapter";

// O cursor tem resolução de minuto; revisões nesse minuto usam a última fonte.
// A amostragem pode deixar lacunas: nunca buscar a observação seguinte.
export function historyAtMinute(history: HistoryPoint[], minute: number) {
  if (!Number.isFinite(minute)) return null;
  let selected: HistoryPoint | null = null;
  for (const point of history) {
    const time = Date.parse(point.as_of);
    if (
      Math.floor(minuteOf(time)) <= Math.floor(minute) &&
      (!selected || time >= Date.parse(selected.as_of))
    )
      selected = point;
  }
  return selected;
}
