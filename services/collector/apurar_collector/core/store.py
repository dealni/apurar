"""Persistência local de consultas, versões oficiais e correções."""

import json
import sqlite3
import threading
import time
from datetime import datetime
from pathlib import Path
from .enrichment import metadata_enrichment


class Store:
    def __init__(self, path, clock=time.time):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.lock = threading.RLock()
        self.clock = clock
        self.election = None
        self.round = None
        self.connection = sqlite3.connect(path, check_same_thread=False)
        self.connection.execute("PRAGMA journal_mode=WAL")
        self.connection.executescript("""
            CREATE TABLE IF NOT EXISTS official (
                scope TEXT PRIMARY KEY, generated_at TEXT NOT NULL, payload TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY, checked_at TEXT NOT NULL, status TEXT NOT NULL,
                message TEXT, national_idg TEXT);
            CREATE TABLE IF NOT EXISTS projections (
                id INTEGER PRIMARY KEY, time TEXT NOT NULL, signature TEXT UNIQUE,
                payload TEXT NOT NULL);
        """)
        self.connection.commit()

    def discard_incompatible(self, election, round_number):
        """Não restaura registros de outro turno, mesmo em banco copiado."""
        election = str(election)
        with self.lock, self.connection:
            self.election, self.round = election, round_number
            rows = self.connection.execute(
                "SELECT scope,payload FROM official"
            ).fetchall()
            for scope, raw in rows:
                value = json.loads(raw)
                if (
                    str(value.get("election")) != election
                    or value.get("round") != round_number
                ):
                    self.connection.execute(
                        "DELETE FROM official WHERE scope=?", (scope,)
                    )
            points = self.connection.execute(
                "SELECT id,payload FROM projections"
            ).fetchall()
            for identifier, raw in points:
                point = json.loads(raw)
                if str(point.get("election")) != election:
                    self.connection.execute(
                        "DELETE FROM projections WHERE id=?", (identifier,)
                    )

    def save_official(self, value):
        with self.lock, self.connection:
            if self.election is not None and (
                str(value.get("election")) != self.election
                or value.get("round") != self.round
            ):
                return False
            previous = self.connection.execute(
                "SELECT generated_at,payload FROM official WHERE scope=?",
                (value["scope"],),
            ).fetchone()
            previous_value = json.loads(previous[1]) if previous else None
            recovering = previous and self._recovering_future(previous_value, value)
            if previous and not recovering and (
                (
                    value["idg"] == previous_value["idg"]
                    and value != previous_value
                    and not metadata_enrichment(previous_value, value)
                )
                or value["generated_at"] < previous[0]
                or (
                    value["generated_at"] == previous[0]
                    and value["idg"] != previous_value["idg"]
                )
            ):
                return False
            self.connection.execute(
                "INSERT INTO official VALUES (?, ?, ?) "
                "ON CONFLICT(scope) DO UPDATE SET generated_at=excluded.generated_at, "
                "payload=excluded.payload",
                (
                    value["scope"],
                    value["generated_at"],
                    json.dumps(value, ensure_ascii=False),
                ),
            )
            return True

    def _recovering_future(self, previous, incoming):
        """A correção aceita na coleta precisa substituir também o estado salvo."""
        limit = self.clock() + 60
        return (
            datetime.fromisoformat(previous["generated_at"]).timestamp() > limit
            and datetime.fromisoformat(incoming["generated_at"]).timestamp() <= limit
        )

    def official(self):
        with self.lock:
            return {
                scope: json.loads(payload)
                for scope, payload in self.connection.execute(
                    "SELECT scope,payload FROM official"
                )
            }

    def event(self, checked_at, status, message, idg):
        with self.lock, self.connection:
            self.connection.execute(
                "INSERT INTO events(checked_at,status,message,national_idg) VALUES (?,?,?,?)",
                (checked_at, status, message, idg),
            )
            self.connection.execute(
                "DELETE FROM events WHERE id NOT IN "
                "(SELECT id FROM events ORDER BY id DESC LIMIT 5000)"
            )

    def projection(self, time, signature, payload):
        with self.lock, self.connection:
            if (
                self.election is not None
                and str(payload.get("election")) != self.election
            ):
                return False
            self.connection.execute(
                "INSERT OR IGNORE INTO projections(time,signature,payload) VALUES (?,?,?)",
                (time, signature, json.dumps(payload)),
            )

    def history(self, model="historical", basis=None):
        with self.lock:
            rows = self.connection.execute(
                "SELECT payload FROM projections ORDER BY id"
            ).fetchall()
            points = [
                point
                for row in rows
                if (point := json.loads(row[0])).get("model", "historical") == model
                and (
                    self.election is None or str(point.get("election")) == self.election
                )
                and (basis is None or point.get("basis") == basis)
            ]
            if len(points) <= 500:
                return points
            return [points[round(i * (len(points) - 1) / 499)] for i in range(500)]

    def close(self):
        with self.lock:
            self.connection.close()
