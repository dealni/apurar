"""Cliente público TSE 2026. Sem autenticação, proxy ou dependências externas."""

import json
import logging
import re
import threading
import time
from dataclasses import dataclass
from datetime import datetime, timedelta
from email.utils import parsedate_to_datetime
from http.client import HTTPException
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

from . import __version__
from .config import (
    TIMING,
    FIRST_ELECTION,
    TSE_BACKOFF_SECONDS,
    TSE_ORIGIN,
    TSE_MISSING_SECONDS,
    TSE_REQUESTS_PER_SECOND,
    TSE_YEAR,
    election_round,
)


def election_base(election=FIRST_ELECTION):
    election_round(election)
    return f"{TSE_ORIGIN}/oficial/ele{TSE_YEAR}/{election}"


def config_url(election=FIRST_ELECTION):
    return f"{election_base(election)}/config/mun-e{int(election):06d}-cm.json"


BASE = election_base()
CONFIG_URL = config_url()


def result_url(scope="br", election=FIRST_ELECTION):
    scope = scope.lower()
    if not re.fullmatch(r"br|zz|[a-z]{2}[0-9]{5}", scope):
        raise ValueError(
            "Abrangência inválida; município exige código TSE de cinco dígitos"
        )
    return f"{election_base(election)}/dados/{scope[:2]}/{scope}-c0001-e{int(election):06d}-u.json"


def tracking_url(uf, election=FIRST_ELECTION):
    if not re.fullmatch(r"[a-z]{2}", uf) or uf == "br":
        raise ValueError("UF inválida")
    return f"{election_base(election)}/dados/{uf}/{uf}-e{int(election):06d}-ab.json"


def validate_url(url):
    parsed = urlsplit(url)
    if (
        parsed.scheme != "https"
        or parsed.netloc != urlsplit(TSE_ORIGIN).netloc
        or parsed.query
        or parsed.fragment
        or not (
            parsed.path == "/oficial/comum/config/ele-c.json"
            or re.fullmatch(
                rf"/oficial/ele{TSE_YEAR}/(?:6257|6258|6260)/[^?#]+", parsed.path
            )
        )
        or any(part in (".", "..") for part in parsed.path.split("/"))
    ):
        raise ValueError("Somente fontes oficiais TSE 2026 autorizadas permitidas")


class SourceBackoffError(URLError):
    def __init__(self, delay):
        super().__init__("Coleta suspensa após bloqueio da fonte oficial")
        self.delay = delay


class OfficialRedirectHandler(HTTPRedirectHandler):
    def __init__(self, limiter=None):
        super().__init__()
        self.limiter = limiter

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        validate_url(newurl)
        redirected = super().redirect_request(req, fp, code, msg, headers, newurl)
        if redirected is not None and self.limiter is not None:
            delay = self.limiter.acquire()
            if delay:
                raise SourceBackoffError(delay)
        return redirected


@dataclass
class FetchResult:
    status: str
    data: dict | None = None
    changed: bool = False
    url: str = ""
    error: str | None = None
    retry_at: float = 0.0


class RateLimiter:
    """A trava serializa apenas a concessão; inclui 304 e erros na cota."""

    def __init__(
        self, rate=TSE_REQUESTS_PER_SECOND, clock=time.monotonic, sleep=time.sleep
    ):
        # Pequena margem evita 71 concessões nas extremidades de uma janela
        # fechada de um segundo, inclusive sob arredondamento do relógio.
        self.interval = 1 / min(max(rate, 0.1), TSE_REQUESTS_PER_SECOND) + 0.000001
        self.clock, self.sleep = clock, sleep
        self.lock = threading.Lock()
        self.next_request = 0.0
        self.blocked_until = 0.0

    def acquire(self):
        with self.lock:
            now = self.clock()
            if now < self.blocked_until:
                return self.blocked_until - now
            self.sleep(max(0, self.next_request - now))
            self.next_request = self.clock() + self.interval
        return 0

    def defer(self, seconds):
        """Restaura somente o saldo de uma pausa previamente registrada."""
        with self.lock:
            self.blocked_until = max(self.blocked_until, self.clock() + max(0, seconds))

    def block(self, seconds=TSE_BACKOFF_SECONDS):
        self.defer(max(TSE_BACKOFF_SECONDS, seconds))


_GLOBAL_LIMITER = RateLimiter()


class TSEClient:
    def __init__(self, timeout=TIMING["sourceTimeoutSeconds"], limiter=None, opener=None, clock=time.time, on_block=None):
        self.timeout = timeout
        self.limiter = limiter or _GLOBAL_LIMITER
        self.opener = opener or build_opener(OfficialRedirectHandler(self.limiter)).open
        self.clock = clock
        self.on_block = on_block
        self.cache = {}
        self.missing_until = {}
        self.lock = threading.Lock()
        self.url_locks = {}

    def fetch(self, url):
        validate_url(url)
        with self.lock:
            url_lock = self.url_locks.setdefault(url, threading.Lock())
        with url_lock:
            return self._fetch(url)

    def _fetch(self, url):
        validate_url(url)
        now = self.clock()
        with self.lock:
            cached = self.cache.get(url)
            missing = self.missing_until.get(url, 0)
        cached_future = bool(cached and _future_generation(cached[0], now))
        if now < missing:
            return FetchResult("awaiting", url=url, retry_at=missing)
        delay = self.limiter.acquire()
        if delay:
            return FetchResult(
                "backoff",
                url=url,
                retry_at=now + delay,
                error="Coleta suspensa após bloqueio da fonte oficial",
            )
        headers = {
            "User-Agent": f"PulsoEleitoral/{__version__}",
            "Accept": "application/json",
        }
        if cached and not cached_future:
            if cached[1]:
                headers["If-None-Match"] = cached[1]
            elif cached[2]:
                headers["If-Modified-Since"] = cached[2]
        try:
            with self.opener(
                Request(url, headers=headers), timeout=self.timeout
            ) as response:
                # Limite para evitar memória ilimitada diante de resposta defeituosa.
                body = response.read(8_000_001)
                if len(body) > 8_000_000:
                    raise ValueError("Arquivo TSE excede limite de 8 MB")
                data = json.loads(body)
                if not isinstance(data, dict):
                    raise ValueError("JSON oficial deve ser um objeto")
                # Uma geração inválida não pode prender o cache: comparações
                # posteriores usam este horário para recusar réplicas antigas.
                # EA20 sempre exige geração, inclusive antes da apuração.
                # Catálogos sem esses campos continuam permitidos, mas campos
                # presentes e vazios não podem substituir o cache válido.
                if urlsplit(url).path.endswith("-u.json") or "dg" in data or "hg" in data:
                    _stamp(data)
                if cached and data.get("dg") and cached[0].get("dg"):
                    if _stamp(data) < _stamp(cached[0]) and (
                        not cached_future or _future_generation(data, self.clock())
                    ):
                        return FetchResult(
                            "error",
                            url=url,
                            error="Versão CDN anterior ao cache; ignorada",
                        )
                with self.lock:
                    self.cache[url] = (
                        data,
                        response.headers.get("ETag"),
                        response.headers.get("Last-Modified"),
                    )
                    self.missing_until.pop(url, None)
                return FetchResult(
                    "ok", data, data != cached[0] if cached else True, url
                )
        except HTTPError as exc:
            exc.close()
            if exc.code == 304 and cached and not cached_future:
                return FetchResult("ok", cached[0], False, url)
            if exc.code in (403, 429):
                seconds = self._retry_after(exc.headers.get("Retry-After"))
                self.limiter.block(seconds)
                retry_at = self.clock() + seconds
                if self.on_block is not None:
                    try:
                        self.on_block(retry_at)
                    except Exception:
                        # A pausa em memória já está ativa; nunca liberar a fonte
                        # por falha de persistência nem registrar dados sensíveis.
                        logging.getLogger(__name__).warning("Falha ao registrar pausa da fonte TSE")
                return FetchResult(
                    "backoff",
                    url=url,
                    error=f"TSE HTTP {exc.code}",
                    retry_at=retry_at,
                )
            if exc.code == 404:
                until = self.clock() + TSE_MISSING_SECONDS
                with self.lock:
                    self.missing_until[url] = until
                return FetchResult(
                    "awaiting",
                    url=url,
                    error="Arquivo ainda não disponível (HTTP 404)",
                    retry_at=until,
                )
            return FetchResult("error", url=url, error=f"TSE HTTP {exc.code}")
        except SourceBackoffError as exc:
            return FetchResult(
                "backoff", url=url, retry_at=self.clock() + exc.delay,
                error="Coleta suspensa após bloqueio da fonte oficial",
            )
        except (URLError, OSError, ValueError, HTTPException) as exc:
            return FetchResult(
                "error", url=url, error=f"Falha ao consultar TSE: {type(exc).__name__}"
            )

    def _retry_after(self, value):
        try:
            return max(TSE_BACKOFF_SECONDS, int(value))
        except (TypeError, ValueError):
            try:
                return max(
                    TSE_BACKOFF_SECONDS,
                    parsedate_to_datetime(value).timestamp() - self.clock(),
                )
            except (TypeError, ValueError, AttributeError):
                return TSE_BACKOFF_SECONDS


def _integer(value):
    if isinstance(value, bool):
        raise ValueError("Contagem inválida")
    number = int(str(value))
    if number < 0:
        raise ValueError("Contagem negativa")
    return number


def _object(value):
    if not isinstance(value, dict):
        raise ValueError("Estrutura oficial deve ser um objeto")
    return value


def _objects(value):
    if not isinstance(value, list):
        raise ValueError("Estrutura oficial deve ser uma lista")
    return [_object(item) for item in value]


def _stamp(data, day="dg", hour="hg"):
    if not all(isinstance(data.get(key), str) and data[key] for key in (day, hour)):
        raise ValueError("Arquivo sem data e hora oficiais")
    value = datetime.strptime(data[day] + " " + data[hour], "%d/%m/%Y %H:%M:%S")
    return value.isoformat() + "-03:00"


def totalization_stamp(data, scope):
    value = datetime.fromisoformat(_stamp(data, "dt", "ht"))
    # Fernando de Noronha totaliza em UTC-02; normalizar para Brasília.
    if scope == "pe30015":
        value -= timedelta(hours=1)
    return value.isoformat()


def _future_generation(data, now):
    """Um cache no futuro não pode prender a recuperação ao seu ETag/horário."""
    if not data.get("dg") or not data.get("hg"):
        return False
    try:
        return datetime.fromisoformat(_stamp(data)).timestamp() > now + 60
    except (TypeError, ValueError):
        return False


def parse_result(raw, expected_scope=None, election=FIRST_ELECTION):
    """EA20 presidencial do turno solicitado; IDG é opaco, nunca ordenado."""
    raw = _object(raw)
    election = str(election)
    round_number = election_round(election)
    if (
        str(raw.get("ele")) != election
        or str(raw.get("t")) != str(round_number)
        or raw.get("f") != "o"
    ):
        raise ValueError("Eleição, turno ou ambiente diferente do autorizado")
    tp, code = raw.get("tpabr"), str(raw.get("cdabr", "")).lower()
    if tp == "br" and code == "br":
        scope = "br"
    elif tp == "uf" and code == "zz":
        scope = "zz"
    elif tp in ("mu", "mun") and re.fullmatch(r"[0-9]{5}", code) and expected_scope:
        scope = expected_scope.lower()
        if not re.fullmatch(r"[a-z]{2}" + code, scope):
            raise ValueError("Município não corresponde à URL")
    else:
        raise ValueError("Abrangência EA20 inesperada")
    if expected_scope and scope != expected_scope.lower():
        raise ValueError("Abrangência não corresponde à URL")
    sections, electors, totals = (_object(raw[key]) for key in ("s", "e", "v"))
    total, counted, missing = (_integer(sections[k]) for k in ("ts", "st", "snt"))
    if counted > total or counted + missing != total:
        raise ValueError("Contagem de seções inconsistente")
    cargos = [item for item in _objects(raw["carg"]) if str(item.get("cd")) == "1"]
    if len(cargos) != 1:
        raise ValueError("Arquivo sem cargo único de presidente")
    votes, candidates = {}, []
    for alliance in _objects(cargos[0].get("agr", [])):
        for party in _objects(alliance.get("par", [])):
            for candidate in _objects(party.get("cand", [])):
                cid = str(candidate["n"])
                if cid in votes:
                    raise ValueError("Candidato duplicado")
                votes[cid] = _integer(candidate["vap"])
                candidates.append(
                    {
                        "id": cid,
                        "name": candidate.get("nmu") or candidate["nm"],
                        "party": party["sg"],
                        "status": candidate.get("st", ""),
                        "validity": candidate.get("dvt", ""),
                    }
                )
    valid = _integer(totals["vv"])
    # EA20: vap são votos computados; vv exclui anulados e sub judice.
    # Preservamos ambos. A elegibilidade do modelo é avaliada separadamente.
    totalized_at = None
    if raw.get("dt") or raw.get("ht"):
        totalized_at = totalization_stamp(raw, scope)
    elif (
        counted
        or valid
        or _integer(electors["c"])
        or _integer(totals["vb"])
        or _integer(totals["tvn"])
    ):
        raise ValueError("Votação iniciada sem data e hora da totalização")
    generated_at = _stamp(raw)
    if totalized_at is not None and totalized_at > generated_at:
        raise ValueError("Totalização posterior à geração oficial")
    return {
        "election": election,
        "round": round_number,
        "scope": scope,
        "divulgation_allowed": raw.get("dv") == "s",
        "official_totalization_final": raw.get("tf") == "s",
        "generated_at": generated_at,
        "totalized_at": totalized_at,
        "idg": str(raw["idg"]),
        "source_url": result_url(scope, election),
        "sections_total": total,
        "sections_counted": counted,
        "votes": votes,
        "candidates": candidates,
        "valid_votes": valid,
        "computed_votes": _integer(totals["vvc"]) if "vvc" in totals else None,
        "annulled_votes": _integer(totals["van"]) if "van" in totals else None,
        "sub_judice_votes": _integer(totals["vansj"]) if "vansj" in totals else None,
        "total_votes": _integer(totals["tv"]) if "tv" in totals else None,
        "blank_votes": _integer(totals["vb"]),
        "null_votes": _integer(totals["tvn"]),
        "turnout": _integer(electors["c"]),
        "electorate": _integer(electors["te"]),
        "electorate_totalized": _integer(electors["est"])
        if electors.get("est") is not None
        else None,
        "electorate_installed": _integer(electors["esi"])
        if electors.get("esi") is not None
        else None,
        "abstention": _integer(electors["a"])
        if electors.get("a") is not None
        else None,
        "official_final": raw.get("and") == "f"
        and total > 0
        and missing == 0
        and counted == total,
    }


def parse_catalog(raw, election=FIRST_ELECTION):
    raw = _object(raw)
    election_round(election)
    if raw.get("f") != "o":
        raise ValueError("Catálogo não oficial")
    units = []
    for state in _objects(raw["abr"]):
        uf = state["cd"].lower()
        if uf == "zz":
            continue
        for city in _objects(state["mu"]):
            code = str(city["cd"]).zfill(5)
            scope = uf + code
            result_url(scope, election)
            units.append(
                {
                    "scope": scope,
                    "uf": uf.upper(),
                    "name": city["nm"],
                    "tse_code": code,
                    "ibge_code": city.get("cdi"),
                    "source_url": result_url(scope, election),
                }
            )
    if not units:
        raise ValueError("Catálogo oficial sem municípios brasileiros")
    units.append(
        {
            "scope": "zz",
            "uf": "ZZ",
            "name": "Exterior",
            "source_url": result_url("zz", election),
        }
    )
    if len({unit["scope"] for unit in units}) != len(units):
        raise ValueError("Municípios duplicados no catálogo")
    return units
