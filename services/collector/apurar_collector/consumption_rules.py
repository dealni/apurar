"""Condições estáveis e mensagem sem identificadores de conta ou destinatário."""

DEFAULTS = {"requests": 50000, "cpu_ms": 1000000, "r2_requests": 500000, "usd_hour": 1,
            "growth_ratio": 3, "growth_min": 10000, "recovery_ratio": .8}
LABELS = {"requests": "Tráfego elevado", "cpu_ms": "CPU elevada", "r2_requests": "Operações R2 elevadas",
          "usd_hour": "Estimativa bruta elevada", "growth": "Crescimento de tráfego",
          "analytics": "Falha repetida na leitura do Analytics"}


def conditions(sample, previous, limits):
    current, baseline = sample["current"], sample["previous"]
    active = set()
    for key in ("requests", "cpu_ms", "r2_requests", "usd_hour"):
        bound = limits[key] * (limits["recovery_ratio"] if key in previous else 1)
        if current[key] >= bound:
            active.add(key)
    if baseline is None:
        # Ausência de amostra anterior não ativa nem normaliza crescimento.
        if "growth" in previous:
            active.add("growth")
        return active
    factor = limits["recovery_ratio"] if "growth" in previous else 1
    # Base zero não produz divisão por zero; só alerta com volume mínimo real.
    if current["requests"] >= limits["growth_min"] * factor and current["requests"] >= max(1, baseline["requests"]) * limits["growth_ratio"] * factor:
        active.add("growth")
    return active


def message(condition, active, sample, end):
    from .consumption_analytics import timestamp
    label = LABELS[condition]
    status = "atenção" if active else "normalização confirmada"
    lines = [f"Apurar: {status} — {label}."]
    if condition == "analytics":
        lines.append("Telemetria indisponível ou incompleta; isso não confirma recuperação do consumo.")
        if not active:
            lines[-1] = "Leitura do Analytics restabelecida com janela atual válida."
        return "\n".join(lines)
    current = sample["current"]
    lines.extend([f"Janela fechada de 10 min até {timestamp(end)} (UTC), telemetria com atraso de pelo menos 5 min.",
                  f"Worker: {current['requests']:,.0f} consultas; {current['cpu_ms']:,.0f} CPU ms; {current['errors']:,.0f} erros.",
                  f"R2: A {current['r2_a']:,.0f}; B {current['r2_b']:,.0f}; gratuitas {current['r2_free']:,.0f}; não classificadas {current['r2_unknown']:,.0f}.",
                  f"Estimativa BRUTA no ritmo observado: US$ {current['usd_hour']:.2f}/h; US$ {current['usd_hour'] * 24:.2f}/24 h.",
                  "Não é fatura nem consumo mensal real. Sem descontar franquias compartilhadas; exclui armazenamento, planos, impostos e operações não classificadas. R2 Standard."])
    if sample["previous"] is None:
        lines.append("Janela anterior sem amostra; crescimento indeterminado, sem confirmar normalização desse alerta.")
    return "\n".join(lines)
