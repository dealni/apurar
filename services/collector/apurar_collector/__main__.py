"""CLI offline por padrão; rede e publicação remota exigem flags explícitas."""

import argparse
import json
import logging
import os
import signal
import threading
import time
from pathlib import Path

from .core.config import TIMING
from .health import report

from .dataset import ROOT, bootstrap, export_bundle, import_bundle, load
from .demo import fixture
from .publisher import Publisher, R2Bucket
from .runtime import LiveSession, Runtime, exclusive
from .scheduling import next_delay
from .snapshot import now
from .supplemental import SupplementalCollector
from .supplemental_publication import SupplementalPublication


def parser():
    result = argparse.ArgumentParser(description=__doc__)
    modes = result.add_mutually_exclusive_group()
    modes.add_argument(
        "--live",
        action="store_true",
        help="Consulta o TSE; habilita rede explicitamente",
    )
    modes.add_argument(
        "--demo", action="store_true", help="Demonstração sintética offline (padrão)"
    )
    modes.add_argument(
        "--fixture",
        type=Path,
        help="Envelope local collection/prior; sempre demonstração",
    )
    result.add_argument(
        "--bootstrap",
        type=Path,
        metavar="ORIGEM_DATA",
        help="Importa base local verificada e encerra",
    )
    result.add_argument(
        "--export-dataset", type=Path, help="Exporta ZIP mínimo verificável e encerra"
    )
    result.add_argument(
        "--import-dataset", type=Path, help="Importa ZIP mínimo sem rede e encerra"
    )
    result.add_argument(
        "--data-dir",
        type=Path,
        help="Base explícita; omitida usa dados locais ou recursos incorporados",
    )
    result.add_argument("--state-dir", type=Path, default=ROOT / ".artifacts/state")
    result.add_argument("--output", type=Path, default=ROOT / ".artifacts/bucket")
    result.add_argument(
        "--save-fixture", type=Path, help="Salva envelope offline antes de processar"
    )
    result.add_argument(
        "--publish-r2", action="store_true", help="Publica remotamente; exige --live"
    )
    result.add_argument(
        "--once", action="store_true", help="Um único ciclo, inclusive no modo live"
    )
    result.add_argument(
        "--disable-projection", action="store_true",
        default=os.environ.get("APURAR_PROJECTION_ENABLED", "true").lower() in ("0", "false", "no"),
        help="Suspende somente a projeção; mantém publicação oficial",
    )
    result.add_argument(
        "--projection-reason", default=os.environ.get("APURAR_PROJECTION_REASON"),
        help="Motivo público da suspensão da projeção",
    )
    result.add_argument("--without-supplemental", action="store_true", help="Executa somente o núcleo presidencial")
    result.add_argument("--supplemental-budget", type=int, default=128, help="Máximo de detalhes adicionais por ciclo")
    return result


def main(argv=None):
    args = parser().parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    if args.export_dataset or args.import_dataset:
        if (
            args.live
            or args.publish_r2
            or args.bootstrap
            or (args.export_dataset and args.import_dataset)
        ):
            parser().error("Transporte de base é local; escolha uma única operação")
        result = (
            export_bundle(args.data_dir, args.export_dataset)
            if args.export_dataset
            else import_bundle(args.import_dataset, args.data_dir or ROOT / "data")
        )
        print(json.dumps(result, ensure_ascii=False))
        return 0
    if args.bootstrap:
        if args.live or args.publish_r2:
            parser().error("Bootstrap é local; não combine com rede/publicação")
        print(
            json.dumps(
                bootstrap(args.bootstrap, args.data_dir or ROOT / "data"),
                ensure_ascii=False,
            )
        )
        return 0
    if args.publish_r2 and not args.live:
        parser().error(
            "Publicação remota exige --live; demo/fixture nunca são publicados no R2"
        )
    with exclusive(args.state_dir):
        if not args.live:
            envelope = json.loads(args.fixture.read_text()) if args.fixture else None
            collection, prior = (
                (envelope["collection"], envelope["prior"])
                if envelope
                else fixture(now())
            )
            if args.save_fixture:
                from .runtime import atomic

                atomic(args.save_fixture, {"collection": collection, "prior": prior})
            runtime = Runtime(prior, args.state_dir, args.output,
                              projection_enabled=not args.disable_projection,
                              projection_reason=args.projection_reason)
            snapshot, pointer = runtime.emit(collection, mode="demo")
            print(
                json.dumps(
                    {
                        "mode": "demo",
                        "snapshot_id": snapshot["snapshot_id"],
                        "local_key": pointer["key"],
                    },
                    ensure_ascii=False,
                )
            )
            return 0
        _, prior = load(args.data_dir)
        remote = (
            Publisher(R2Bucket.from_environment(), remote=True)
            if args.publish_r2
            else None
        )
        runtime = Runtime(prior, args.state_dir, args.output, remote,
                          projection_enabled=not args.disable_projection,
                          projection_reason=args.projection_reason)
        session = LiveSession(args.state_dir)
        supplemental = None
        supplemental_publication = SupplementalPublication(args.state_dir, runtime.local, runtime.remote)
        stopped = threading.Event()

        def stop(signum, frame):
            session.collector.stop()
            stopped.set()

        previous_handlers = {}
        try:
            for signum in (signal.SIGTERM, signal.SIGINT):
                previous_handlers[signum] = signal.signal(signum, stop)
            while not stopped.is_set():
                started = time.monotonic()
                status = {}
                failed = False
                try:
                    retried = runtime.retry_pending(mode="live")
                    if retried:
                        snapshot, pointer = retried
                        collection = True
                        status = {"next_poll_seconds": TIMING["collectingSeconds"]}
                    else:
                        collection, status = session.cycle()
                        if collection:
                            snapshot, pointer = runtime.emit(collection, mode="live")
                    if collection:
                        print(
                            json.dumps(
                                {
                                    "mode": "live",
                                    "snapshot_id": snapshot["snapshot_id"],
                                    "key": pointer["key"],
                                    "remote": bool(remote),
                                    "retried": bool(retried),
                                }
                            ),
                            flush=True,
                        )
                except Exception as exc:
                    logging.error(
                        "Ciclo interrompido (%s); último snapshot preservado",
                        type(exc).__name__,
                    )
                    failed = True
                    status = {**status, "next_poll_seconds": TIMING["errorSeconds"]}
                if (not args.without_supplemental and not failed and not retried
                        and status.get("status") in ("live", "collecting", "degraded", "finished", "awaiting")):
                    try:
                        if supplemental is None:
                            supplemental = SupplementalCollector(session.collector.client, args.state_dir)
                        payload = supplemental.step(
                            budget=min(128, max(0, args.supplemental_budget)),
                            stop_event=session.collector.stop_event,
                            max_seconds=15,
                        )
                        supplemental_publication.publish(payload)
                        coverage = payload["coverage"]
                        status["supplemental"] = {
                            "status": "ok", "pending": coverage["pending"],
                            "errors": coverage["errors"],
                            "next_poll_seconds": coverage.get("next_poll_seconds", TIMING["liveSeconds"]),
                            "backoff_seconds": coverage.get("backoff_seconds", 0),
                            "zones_pending": 0,
                            "last_updated_at": payload["updated_at"],
                        }
                    except Exception as exc:
                        status["supplemental"] = {"status": "error", "pending": 0, "errors": 1, "zones_pending": 0, "last_updated_at": None}
                        logging.warning("Suplemento indisponível (%s); placar presidencial preservado", type(exc).__name__)
                if args.without_supplemental:
                    # None desativa explicitamente a recuperação da saúde anterior.
                    status["supplemental"] = None
                report(runtime, status, time.monotonic() - started, failed=failed)
                if failed and args.once:
                    return 1
                if args.once:
                    return 0 if collection else 1
                stopped.wait(next_delay(status))
        finally:
            try:
                session.close()
            finally:
                for signum, handler in previous_handlers.items():
                    signal.signal(signum, handler)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
