"""Enriquece campos opcionais de uma versão persistida sem reescrever votos."""

OPTIONAL_COUNTS = frozenset(
    (
        "electorate_totalized",
        "electorate_installed",
        "abstention",
        "computed_votes",
        "annulled_votes",
        "sub_judice_votes",
        "total_votes",
    )
)


def metadata_enrichment(previous, incoming):
    """Somente ausências antigas podem receber contagens da mesma observação."""
    if previous == incoming:
        return False
    fixed_previous = {k: v for k, v in previous.items() if k not in OPTIONAL_COUNTS}
    fixed_incoming = {k: v for k, v in incoming.items() if k not in OPTIONAL_COUNTS}
    if fixed_previous != fixed_incoming:
        return False
    for field in OPTIONAL_COUNTS:
        before, after = previous.get(field), incoming.get(field)
        if field in previous and field not in incoming:
            return False
        if before is not None and before != after:
            return False
        if after is not None and (
            isinstance(after, bool) or not isinstance(after, int) or after < 0
        ):
            return False
    return True
