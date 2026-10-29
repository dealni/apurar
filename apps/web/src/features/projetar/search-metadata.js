import { normalizeMainMapUrl } from "../../navigation/panel-navigation.ts";

const current = new URL(location.href);
const normalized = normalizeMainMapUrl(current);
if (normalized.href !== current.href)
  history.replaceState(history.state, "", normalized);
