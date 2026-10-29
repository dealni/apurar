// Metadados visuais da referência; não definem candidaturas nem resultados.
import partidos from "../../data/generated/candidates/partidos.json" with { type: "json" };
import bandeiras from "../../data/generated/candidates/bandeiras.json" with { type: "json" };
import retratos from "../../data/generated/candidates/retratos.json" with { type: "json" };
window.PARTIDOS = partidos;
window.BANDEIRAS = bandeiras;
window.RETRATOS = retratos;

// Cadastro usado exclusivamente para a geometria e nomes; sem resultados atuais.
import exterior from "../../data/generated/candidates/exterior.json" with { type: "json" };
window.EXTERIOR = exterior;
