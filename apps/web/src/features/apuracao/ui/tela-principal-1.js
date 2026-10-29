import { useEstadoInicial } from './shell-principal-estado.js';
import { useReproducaoDoHistorico } from './shell-principal-historico.js';
import { useNavegacaoECamera } from './shell-principal-navegacao.js';
import { useModoTV } from './shell-principal-tv.js';
import { usePerfilEAtalhos } from './shell-principal-perfil.js';
import { renderizarPrincipal } from './shell-principal-conteudo.js';

export let _d;
export function initialize() {
  _d = renderizarTelaPrincipal;
}

function renderizarTelaPrincipal() {
  const estado = useEstadoInicial();
  Object.assign(estado, useReproducaoDoHistorico(estado));
  Object.assign(estado, useNavegacaoECamera(estado));
  Object.assign(estado, useModoTV(estado));
  Object.assign(estado, usePerfilEAtalhos(estado));
  return renderizarPrincipal(estado);
}
