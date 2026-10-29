/** Ponte da API recuperada para dependências oficiais fixadas no package-lock. */
import { h, render } from "preact";
import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useLayoutEffect,
  useErrorBoundary,
} from "preact/hooks";
import htm from "htm";

const runtime = {
  h,
  render,
  useState,
  useEffect,
  useRef,
  useMemo,
  useLayoutEffect,
  useErrorBoundary,
  html: htm.bind(h),
};
window.htmPreact = runtime;
window.htm = htm;
export default runtime;
