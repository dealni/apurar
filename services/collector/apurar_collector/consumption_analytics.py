"""Analytics somente leitura; totais operacionais não são a fatura Cloudflare."""

import datetime as dt
import json
import math
import urllib.error
import urllib.request

ENDPOINT = "https://api.cloudflare.com/client/v4/graphql"
LIMIT = 10000
CLASS_A = set("ListBuckets PutBucket ListObjects PutObject CopyObject CompleteMultipartUpload CreateMultipartUpload LifecycleStorageTierTransition ListMultipartUploads UploadPart UploadPartCopy ListParts PutBucketEncryption PutBucketCors PutBucketLifecycleConfiguration".split())
CLASS_B = set("HeadBucket HeadObject GetObject UsageSummary GetBucketEncryption GetBucketLocation GetBucketCors GetBucketLifecycleConfiguration".split())
FREE = {"DeleteObject", "DeleteBucket", "AbortMultipartUpload"}


class AnalyticsUnavailable(ValueError):
    """Falha sem corpo, URL ou credenciais do provedor."""

    def __init__(self, message, *, reason="analytics_unavailable"):
        super().__init__(message)
        self.reason = reason


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise AnalyticsUnavailable("Redirecionamento Analytics recusado", reason="redirect_refused")


def safe_open(request, *, timeout):
    # Nunca encaminhar Authorization para um destino indicado por redirecionamento.
    return urllib.request.build_opener(NoRedirect()).open(request, timeout=timeout)


def window_end(now):
    return int((now - 300) // 300) * 300


def timestamp(value):
    return dt.datetime.fromtimestamp(value, dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def query(account, script, bucket, end):
    fields = []
    for label, stop in (("current", end), ("previous", end - 600)):
        bounds = f'datetime_geq:{json.dumps(timestamp(stop - 600))},datetime_lt:{json.dumps(timestamp(stop))}'
        fields.append(f'{label}Workers:workersInvocationsAdaptive(limit:{LIMIT},filter:{{{bounds},scriptName:{json.dumps(script)}}}){{sum{{requests errors cpuTimeUs}}}}')
        fields.append(f'{label}R2:r2OperationsAdaptiveGroups(limit:{LIMIT},filter:{{{bounds},bucketName:{json.dumps(bucket)}}}){{sum{{requests}} dimensions{{actionType}}}}')
    return 'query {viewer {accounts(filter:{accountTag:' + json.dumps(account) + '}) {' + ' '.join(fields) + '}}}'


def read_analytics(token, account, script, bucket, end, *, opener=safe_open):
    request = urllib.request.Request(ENDPOINT, data=json.dumps({"query": query(account, script, bucket, end)}).encode(),
                                     headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"}, method="POST")
    try:
        with opener(request, timeout=20) as response:
            raw = response.read(2_000_001)
        if len(raw) > 2_000_000:
            raise AnalyticsUnavailable("Resposta Analytics excedeu o limite", reason="response_too_large")
        return parse(json.loads(raw))
    except AnalyticsUnavailable:
        raise
    except urllib.error.HTTPError as error:
        raise AnalyticsUnavailable("Analytics indisponível por resposta HTTP", reason=f"http_{error.code}") from None
    except (TimeoutError, urllib.error.URLError):
        raise AnalyticsUnavailable("Analytics indisponível por falha de transporte", reason="transport_failed") from None
    except json.JSONDecodeError:
        raise AnalyticsUnavailable("Analytics indisponível por JSON inválido", reason="invalid_json") from None
    except Exception:
        raise AnalyticsUnavailable("Analytics indisponível ou resposta incompleta", reason="response_incomplete") from None


def number(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
        raise AnalyticsUnavailable("Métrica ausente ou inválida", reason="invalid_metric")
    return value


def groups(account, name):
    rows = account[name]
    if not isinstance(rows, list) or len(rows) >= LIMIT:
        raise AnalyticsUnavailable("Amostra ausente ou truncada", reason="invalid_groups")
    return rows


def summarize(account, label, *, allow_empty=False):
    result = {"requests": 0, "cpu_ms": 0, "errors": 0, "r2_a": 0, "r2_b": 0, "r2_free": 0, "r2_unknown": 0}
    workers, r2 = groups(account, label + "Workers"), groups(account, label + "R2")
    # Lista vazia pode representar zero; uma série irmã válida comprova resposta.
    # Base vazia não é zero: os limites absolutos atuais continuam avaliáveis,
    # mas crescimento e sua recuperação exigem comparação conhecida.
    if not workers and not r2:
        if allow_empty:
            return None
        raise AnalyticsUnavailable("Janela atual sem amostra de telemetria", reason="empty_current_window")
    for row in workers:
        values = row["sum"]
        result["requests"] += number(values["requests"])
        result["errors"] += number(values["errors"])
        result["cpu_ms"] += number(values["cpuTimeUs"]) / 1000
    for row in r2:
        action = row["dimensions"]["actionType"]
        if not isinstance(action, str):
            raise AnalyticsUnavailable("Operação R2 inválida", reason="invalid_operation")
        category = "r2_a" if action in CLASS_A else "r2_b" if action in CLASS_B else "r2_free" if action in FREE else "r2_unknown"
        result[category] += number(row["sum"]["requests"])
    result["r2_requests"] = sum(result[key] for key in ("r2_a", "r2_b", "r2_free", "r2_unknown"))
    result["usd_hour"] = 6 * (result["requests"] * .30 + result["cpu_ms"] * .02 + result["r2_a"] * 4.50 + result["r2_b"] * .36) / 1_000_000
    return finite_totals(result)


def finite_totals(result):
    for value in result.values():
        number(value)
    number(result["usd_hour"] * 24)
    return result


def parse(payload):
    try:
        if not isinstance(payload, dict) or payload.get("errors"):
            raise AnalyticsUnavailable("Resposta GraphQL com erros", reason="graphql_error")
        accounts = payload["data"]["viewer"]["accounts"]
        if len(accounts) != 1:
            raise AnalyticsUnavailable("Conta ausente ou ambígua", reason="account_unavailable")
        return {"current": summarize(accounts[0], "current"),
                "previous": summarize(accounts[0], "previous", allow_empty=True)}
    except (KeyError, TypeError, IndexError):
        raise AnalyticsUnavailable("Resposta GraphQL incompleta", reason="response_incomplete") from None
