import { rt } from "./formatacao-e-acessibilidade-1.js";
export const implementar = (t) =>
  t === "S/Partido" ? "sem partido" : rt(t).sg || t;
