"""Small statistics helpers shared by every suite."""

from __future__ import annotations

import math
from typing import Any


def wilson_score_interval(hits: int, total: int, z: float = 1.95996) -> tuple[float, float]:
    """Calculate Wilson 95% score confidence interval for a binomial proportion."""
    if total == 0:
        return (0.0, 0.0)
    p = hits / total
    denom = 1.0 + (z * z) / total
    centre = p + (z * z) / (2.0 * total)
    sd = math.sqrt((p * (1.0 - p) + (z * z) / (4.0 * total)) / total)
    lower = max(0.0, (centre - z * sd) / denom)
    upper = min(1.0, (centre + z * sd) / denom)
    return (round(lower, 4), round(upper, 4))


def target_met(rate: float, total: int, target: str) -> bool:
    """Check a rate against a gate string such as `">=90%"` or `"100%"` (empty strata pass)."""
    if total == 0:
        return True
    if target == "100%":
        return rate == 1.0
    return rate >= float(target.lstrip(">=").rstrip("%")) / 100.0


def usage_stats(results: list[dict[str, Any]]) -> dict[str, Any]:
    """Latency and token distribution over `[{"case": ..., "result": ...}]` entries."""
    lat = sorted(r["result"]["latency_ms"] for r in results if r.get("result") and r["result"].get("latency_ms"))
    inp, outp, reason = [], [], []
    for r in results:
        usage = (r.get("result") or {}).get("usage") or {}
        if usage.get("input") is not None:
            inp.append(usage["input"])
        if usage.get("output") is not None:
            outp.append(usage["output"])
        if usage.get("reasoning") is not None:
            reason.append(usage["reasoning"])

    def stats(vals: list[int]) -> dict[str, Any]:
        if not vals:
            return {"count": 0}
        svals = sorted(vals)
        p95 = svals[min(len(svals) - 1, int(round(0.95 * (len(svals) - 1))))]
        return {
            "count": len(vals),
            "mean": round(sum(vals) / len(vals), 1),
            "median": round(svals[len(svals) // 2], 1),
            "p95": p95,
            "max": max(svals),
        }

    return {
        "latency_ms": stats(lat),
        "input_tokens": stats(inp),
        "output_tokens": stats(outp),
        "thinking_tokens": stats(reason),
    }
