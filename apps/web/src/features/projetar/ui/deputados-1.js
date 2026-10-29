import { implementar as implementarc1 } from "./indicador-deputados-iniciais.js";
import { implementar as implementarvc } from "./indicador-deputados-retrato.js";
export let c1, vc;
export function initialize() {
  c1 = implementarc1;
  vc = implementarvc;
}
