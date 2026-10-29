import { prepararPropsPainel } from './resultado-preparar-props-painel.js';
import { criarPerfilPainel } from './resultado-criar-perfil-painel.js';
import { useAvisosEBuscaPainel } from './resultado-use-avisos-ebusca-painel.js';
import { criarExteriorPainel } from './resultado-criar-exterior-painel.js';
import { useDimensoesETabsPainel } from './resultado-use-dimensoes-etabs-painel.js';
import { useSelecaoZonaPainel } from './resultado-use-selecao-zona-painel.js';
import { useSelecaoBairroPainel } from './resultado-use-selecao-bairro-painel.js';
import { useNavegacaoLayoutPainel } from './resultado-use-navegacao-layout-painel.js';
import { renderLayoutReduzidoPainel } from './resultado-render-layout-reduzido-painel.js';
import { calcularEscalaPainel } from './resultado-calcular-escala-painel.js';
import { calcularGeometriaPainel } from './resultado-calcular-geometria-painel.js';
import { renderResumoPainel } from './resultado-render-resumo-painel.js';
import { renderDetalhesPainel } from './resultado-render-detalhes-painel.js';
import { renderDesktopPainel } from './resultado-render-desktop-painel.js';
export let yd;
export function initialize() {
  yd = PainelResultados;
}

/** Mantém a ordem dos hooks e escolhe o layout conforme o viewport. */
function PainelResultados(props) {
  const contexto = { props, ...prepararPropsPainel({ props }) };
  Object.assign(contexto, criarPerfilPainel(contexto));
  Object.assign(contexto, useAvisosEBuscaPainel(contexto));
  Object.assign(contexto, criarExteriorPainel(contexto));
  Object.assign(contexto, useDimensoesETabsPainel(contexto));
  Object.assign(contexto, useSelecaoZonaPainel(contexto));
  Object.assign(contexto, useSelecaoBairroPainel(contexto));
  Object.assign(contexto, useNavegacaoLayoutPainel(contexto));
  if (contexto.no || contexto.ko || contexto.As)
    return renderLayoutReduzidoPainel(contexto);
  Object.assign(contexto, calcularEscalaPainel(contexto));
  Object.assign(contexto, calcularGeometriaPainel(contexto));
  Object.assign(contexto, renderResumoPainel(contexto));
  Object.assign(contexto, renderDetalhesPainel(contexto));
  return renderDesktopPainel(contexto);
}
