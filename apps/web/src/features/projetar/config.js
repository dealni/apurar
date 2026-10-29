import { timing } from "../../../../../packages/contracts/timing.ts";
window.APURACAO = {
  modo: "ao-vivo",
  feed: ["/api/"],
  build: "apurar-2026",
  intervalo: timing.liveSeconds,
  dia: "2026-10-25",
  turno: 2,
};
// A captura visual não é cadastro eleitoral nem fonte de resultados atuais.
window.CANDIDATOS = {
  turno: 2,
  presidente: [
    {
      n: 1,
      nome: "Aguardando candidatura",
      exib: "Candidatura A",
      partido: "",
    },
    {
      n: 2,
      nome: "Aguardando candidatura",
      exib: "Candidatura B",
      partido: "",
    },
  ],
};
window.PREVISAO = null;
window.T1MUN = null;
