"""Arquivo integral das observações; amostra pública cobre toda a trajetória."""

import hashlib
import json
import sqlite3
from datetime import datetime, timezone

from .snapshot import encode


def point_signature(point):
    return hashlib.sha256(
        encode({key: value for key, value in point.items() if key != "snapshot_id"})
    ).hexdigest()


def sample_rows(connection, table, limit):
    """Transfere somente os corpos da amostra; o SQLite ordena a trajetória."""
    order = {"observations": "instant, sequence", "publications": "sequence"}[table]
    count = connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
    indices = list(range(count)) if count <= limit else [
        round(index * (count - 1) / (limit - 1)) for index in range(limit)
    ]
    if not indices:
        return count, []
    placeholders = ",".join("?" for _ in indices)
    rows = connection.execute(
        f"WITH ranked AS (SELECT sequence, ROW_NUMBER() OVER (ORDER BY {order}) - 1 "
        f"AS position FROM {table}) SELECT source.body FROM ranked "
        f"JOIN {table} AS source USING (sequence) "
        f"WHERE ranked.position IN ({placeholders}) ORDER BY ranked.position",
        indices,
    ).fetchall()
    return count, [json.loads(row[0]) for row in rows]


class History:
    def __init__(self, state_dir, mode):
        self.path = state_dir / f"history-{mode}.sqlite3"
        self.legacy = state_dir / f"history-{mode}.json"

    def _open(self):
        connection = sqlite3.connect(self.path)
        connection.execute(
            "CREATE TABLE IF NOT EXISTS observations "
            "(sequence INTEGER PRIMARY KEY, instant REAL, signature TEXT, body TEXT)"
        )
        connection.execute("CREATE INDEX IF NOT EXISTS observations_time ON observations (instant, sequence)")
        connection.execute("CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY)")
        migrated = connection.execute(
            "SELECT 1 FROM migrations WHERE name = 'legacy-json'"
        ).fetchone()
        if not migrated:
            points = json.loads(self.legacy.read_text()) if self.legacy.exists() else []
            for point in points:
                self._append(connection, point)
            connection.execute("INSERT INTO migrations VALUES ('legacy-json')")
            connection.commit()
        return connection

    @staticmethod
    def _append(connection, point):
        signature = point_signature(point)
        previous = connection.execute(
            "SELECT signature FROM observations ORDER BY sequence DESC LIMIT 1"
        ).fetchone()
        if previous and previous[0] == signature:
            return
        instant = datetime.fromisoformat(point["as_of"])
        if instant.tzinfo is None:
            instant = instant.replace(tzinfo=timezone.utc)
        connection.execute(
            "INSERT INTO observations (instant, signature, body) VALUES (?, ?, ?)",
            (instant.timestamp(), signature, encode(point).decode()),
        )

    def observe(self, point, *, limit=500):
        if type(limit) is not int or not 2 <= limit <= 500:
            raise ValueError("A amostra precisa ter de 2 a 500 pontos, preservando início e fim")
        connection = self._open()
        try:
            self._append(connection, point)
            connection.commit()
            return sample_rows(connection, "observations", limit)[1]
        finally:
            connection.close()
