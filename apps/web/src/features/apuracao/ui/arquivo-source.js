import { html, useLayoutEffect, useRef } from './formatacao-e-acessibilidade-1.js';
import { Yr } from './navegacao-e-patrocinio-1.js';
import { captura } from '../../../config/captura.ts';

/** Identifica a captura preservada sem atribuir o horário da consulta à fonte. */
export function ArchiveSource() {
  const bar = useRef(null);
  useLayoutEffect(() => {
    const node = bar.current;
    const resize = () => {
      const height = node.offsetHeight;
      if (Yr.h === height) return;
      Yr.h = height;
      document.documentElement.style.setProperty('--barh', `${height}px`);
      dispatchEvent(new Event('resize'));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    return () => {
      observer.disconnect();
      Yr.h = 0;
      document.documentElement.style.removeProperty('--barh');
    };
  }, []);
  return html`<aside class="archive-source" aria-label="Contexto do arquivo" ref=${bar}>
    <span>Arquivo · 1º turno de 2026</span>
    <span>Captura de ${captura.data} · sem atualização ao vivo</span>
  </aside>`;
}
