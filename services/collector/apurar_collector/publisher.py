"""Publicação em lote: objetos imutáveis verificados antes de mover latest."""

import hashlib
import json
import os
import re
from pathlib import Path
from .snapshot import aware_datetime, encode

MAX_OBJECT_BYTES = 8_000_000


class LocalBucket:
    """Mesmo protocolo do R2, somente disco; útil para ensaio sem credenciais."""

    def __init__(self, root):
        self.root = Path(root)

    def _path(self, key):
        if not re.fullmatch(
            r"(?:live|demo)/6258/(?:latest.json|health.json|supplemental-latest.json|archive-latest.json|(?:snapshots|municipalities|history|supplemental|archive)/[a-f0-9]{64}.json)",
            key,
        ):
            raise ValueError("Chave de publicação inválida")
        return self.root / key

    def get(self, key):
        path = self._path(key)
        return path.read_bytes() if path.exists() else None

    def put(self, key, body, cache_control):
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_suffix(".tmp")
        temporary.write_bytes(body)
        temporary.replace(path)


class R2Bucket:
    def __init__(self, client, name):
        self.client, self.name = client, name

    @classmethod
    def from_environment(cls):
        account = os.environ.get("R2_ACCOUNT_ID", "")
        bucket = os.environ.get("R2_BUCKET", "")
        access = os.environ.get("R2_ACCESS_KEY_ID", "")
        secret = os.environ.get("R2_SECRET_ACCESS_KEY", "")
        if (
            not re.fullmatch(r"[a-f0-9]{32}", account)
            or not bucket
            or not access
            or not secret
        ):
            raise ValueError(
                "Configure R2_ACCOUNT_ID, R2_BUCKET e credenciais R2 restritas"
            )
        try:
            import boto3
            from botocore.config import Config
        except ImportError as exc:
            raise RuntimeError(
                "Instale requirements-r2.txt para publicar no R2"
            ) from exc
        client = boto3.client(
            "s3",
            endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
            region_name="auto",
            aws_access_key_id=access,
            aws_secret_access_key=secret,
            config=Config(
                connect_timeout=10,
                read_timeout=20,
                retries={"max_attempts": 3, "mode": "standard"},
                request_checksum_calculation="when_required",
                response_checksum_validation="when_required",
            ),
        )
        return cls(client, bucket)

    def get(self, key):
        try:
            response = self.client.get_object(Bucket=self.name, Key=key)
        except Exception as exc:
            if getattr(exc, "response", {}).get("Error", {}).get("Code") in (
                "NoSuchKey",
                "404",
            ):
                return None
            raise
        body = response["Body"]
        try:
            value = body.read(MAX_OBJECT_BYTES + 1)
        finally:
            body.close()
        if len(value) > MAX_OBJECT_BYTES:
            raise ValueError("Objeto remoto excede limite")
        return value

    def put(self, key, body, cache_control):
        self.client.put_object(
            Bucket=self.name,
            Key=key,
            Body=body,
            ContentType="application/json; charset=utf-8",
            CacheControl=cache_control,
        )


class Publisher:
    def __init__(self, bucket, *, remote=False):
        self.bucket, self.remote = bucket, remote

    def _immutable(self, prefix, kind, value):
        body = encode(value)
        if len(body) > MAX_OBJECT_BYTES:
            raise ValueError("Snapshot excede limite de publicação")
        sha = hashlib.sha256(body).hexdigest()
        key = f"{prefix}/{kind}/{sha}.json"
        existing = self.bucket.get(key)
        if existing is not None and existing != body:
            raise ValueError("Objeto imutável divergente; publicação interrompida")
        if existing is None:
            self.bucket.put(key, body, "public, max-age=31536000, immutable")
        if self.bucket.get(key) != body:
            raise ValueError("Verificação de leitura falhou; latest preservado")
        return {"key": key, "sha256": sha}

    def publish(self, snapshot, municipalities, history):
        mode = snapshot["mode"]
        if mode not in ("live", "demo") or (self.remote and mode != "live"):
            raise ValueError("Demonstração nunca pode publicar no feed remoto")
        election = snapshot.get("election", {})
        if election != {"id": "6258", "year": 2026, "round": 2, "office": "Presidente"}:
            raise ValueError("Eleição incompatível com a publicação")
        published_at = aware_datetime(snapshot["published_at"])
        for extra in (municipalities, history):
            if extra.get("schema_version") != 1 or extra.get("election") != "6258":
                raise ValueError("Envelope incompatível com a publicação")
            if extra["snapshot_id"] != snapshot["snapshot_id"]:
                raise ValueError("Objetos pertencem a lotes diferentes")
        prefix = f"{mode}/6258"
        pointer_key = prefix + "/latest.json"
        previous_bytes = self.bucket.get(pointer_key)
        if previous_bytes:
            previous = json.loads(previous_bytes)
            if previous.get("published_at") and aware_datetime(
                previous["published_at"]
            ) > published_at:
                raise ValueError(
                    "Publicação anterior ao ponteiro atual; verificar único escritor"
                )
        national = self._immutable(prefix, "snapshots", snapshot)
        pointer = {
            "schema_version": 1,
            "key": national["key"],
            "sha256": national["sha256"],
            "snapshot_id": snapshot["snapshot_id"],
            "published_at": snapshot["published_at"],
            "municipalities": self._immutable(prefix, "municipalities", municipalities),
            "history": self._immutable(prefix, "history", history),
        }
        body = encode(pointer)
        self.bucket.put(pointer_key, body, "no-store")
        if self.bucket.get(pointer_key) != body:
            raise ValueError("Não foi possível confirmar a troca do ponteiro")
        return pointer
