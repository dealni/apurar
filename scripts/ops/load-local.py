"""Mede somente API local; não estima audiência ou custo de produção."""

import argparse
import concurrent.futures
import ipaddress
import json
import math
import time
import urllib.error
import urllib.parse
import urllib.request


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, response, code, message, headers, newurl):
        return None


def request(url, expected):
    started = time.perf_counter()
    # Ignora proxies do ambiente e recusa redirecionamento para destinos externos.
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    try:
        with opener.open(url, timeout=5) as response:
            response.read(8_000_001)
            code = response.status
    except urllib.error.HTTPError as error:
        code = error.code
    except (OSError, ValueError):
        code = 0
    return {"status": code, "ok": code == expected,
            "milliseconds": 1000 * (time.perf_counter() - started)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url")
    parser.add_argument("--requests", type=int, required=True)
    parser.add_argument("--concurrency", type=int, required=True)
    parser.add_argument("--expected-status", type=int, default=200)
    parser.add_argument("--max-p95-ms", type=float, required=True)
    args = parser.parse_args()
    parsed = urllib.parse.urlsplit(args.url)
    try:
        loopback = ipaddress.ip_address(parsed.hostname or "").is_loopback
    except ValueError:
        loopback = False
    if (not loopback or parsed.scheme != "http" or parsed.username or parsed.password
            or not 1 <= args.requests <= 5000 or not 1 <= args.concurrency <= 32
            or args.max_p95_ms <= 0):
        parser.error("Exige HTTP IP loopback, 1–5000 requisições, 1–32 workers e p95 positivo")
    started = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as pool:
        samples = list(pool.map(lambda _: request(args.url, args.expected_status), range(args.requests)))
    elapsed = time.perf_counter() - started
    times = sorted(sample["milliseconds"] for sample in samples)
    p95 = times[math.ceil(len(times) * .95) - 1]
    failures = sum(not sample["ok"] for sample in samples)
    statuses = {str(status): sum(sample["status"] == status for sample in samples)
                for status in {sample["status"] for sample in samples}}
    result = {"ok": failures == 0 and p95 <= args.max_p95_ms, "requests": len(samples),
              "failures": failures, "statuses": statuses, "seconds": elapsed,
              "requests_per_second": len(samples) / elapsed, "p95_ms": p95,
              "limits": "Ensaio local; não comprova capacidade, cache, limites ou custo Cloudflare."}
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
