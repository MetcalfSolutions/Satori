#!/usr/bin/env python3
"""Sum token usage, cost, and latency from a live-eval run's checkpoint cache.

Reads every `<out-dir>/.cache/*.jsonl`, keeps the last record per (file, id)
(matching the checkpoint loader's resolution of duplicates), and aggregates
the `result.usage` block that `pi --mode json` reports per assistant turn.

Usage: python3 scripts/summarize_token_usage.py evals/<model>/ [--out FILE]
"""

from __future__ import annotations

import argparse
import json
import math
import pathlib
import statistics
import sys
from typing import Any

TOKEN_FIELDS = {
    "input": "input",
    "output": "output",
    "thinking": "reasoning",
    "cache_read": "cacheRead",
    "cache_write": "cacheWrite",
    "total": "totalTokens",
}
COST_FIELDS = ("input", "output", "cacheRead", "cacheWrite", "total")


def nearest_rank(values: list[float], pct: float) -> float:
    s = sorted(values)
    k = max(1, math.ceil(pct / 100.0 * len(s)))
    return s[k - 1]


def load_records(cache_dir: pathlib.Path) -> dict[str, list[dict[str, Any]]]:
    """Return {suite_file: [last-wins record per id]}."""
    per_file: dict[str, list[dict[str, Any]]] = {}
    for path in sorted(cache_dir.glob("*.jsonl")):
        last: dict[str, dict[str, Any]] = {}
        for line in path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                continue
            last[rec.get("id", "")] = rec
        per_file[path.name] = list(last.values())
    return per_file


def summarize(cache_dir: pathlib.Path) -> dict[str, Any]:
    per_file = load_records(cache_dir)
    totals = {k: 0 for k in TOKEN_FIELDS}
    cost = {k: 0.0 for k in COST_FIELDS}
    cost_provider_reported = 0
    cost_pi_estimated = 0
    latencies: list[float] = []
    calls_ok = calls_failed = calls_no_usage = 0
    by_file: dict[str, dict[str, Any]] = {}

    for fname, recs in per_file.items():
        f_tokens = {k: 0 for k in TOKEN_FIELDS}
        f_lat: list[float] = []
        f_ok = f_fail = 0
        for rec in recs:
            res = rec.get("result") or {}
            if not rec.get("ok") or not res.get("ok", rec.get("ok")):
                f_fail += 1
                continue
            f_ok += 1
            lat = res.get("latency_ms")
            if isinstance(lat, (int, float)):
                f_lat.append(float(lat))
                latencies.append(float(lat))
            usage = res.get("usage")
            if not usage:
                calls_no_usage += 1
                continue
            for key, src in TOKEN_FIELDS.items():
                v = usage.get(src) or 0
                f_tokens[key] += v
                totals[key] += v
            c = usage.get("cost") or {}
            for k in COST_FIELDS:
                cost[k] += float(c.get(k) or 0.0)
            if c.get("totalFromProvider"):
                cost_provider_reported += 1
            else:
                cost_pi_estimated += 1
        calls_ok += f_ok
        calls_failed += f_fail
        by_file[fname] = {
            "calls_ok": f_ok,
            "calls_failed": f_fail,
            "tokens": f_tokens,
            "latency_median_ms": round(statistics.median(f_lat), 1) if f_lat else None,
            "latency_p95_ms": round(nearest_rank(f_lat, 95), 1) if f_lat else None,
        }

    return {
        "cache_dir": str(cache_dir),
        "files": len(per_file),
        "calls_ok": calls_ok,
        "calls_failed": calls_failed,
        "calls_without_usage": calls_no_usage,
        "tokens": totals,
        "cost_usd": {k: round(v, 6) for k, v in cost.items()},
        "cost_basis": {
            "provider_reported_calls": cost_provider_reported,
            "pi_estimated_calls": cost_pi_estimated,
        },
        "latency_ms": {
            "count": len(latencies),
            "median": round(statistics.median(latencies), 1) if latencies else None,
            "p95": round(nearest_rank(latencies, 95), 1) if latencies else None,
            "max": round(max(latencies), 1) if latencies else None,
        },
        "by_file": by_file,
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("out_dir", type=pathlib.Path, help="run output directory containing .cache/")
    ap.add_argument("--json", action="store_true", help="print the aggregate as JSON instead of text")
    args = ap.parse_args(argv)
    cache = args.out_dir / ".cache"
    if not cache.is_dir():
        print(f"no cache directory at {cache}", file=sys.stderr)
        return 1
    summary = summarize(cache)
    if args.json:
        print(json.dumps(summary, indent=2))
    else:
        t = summary["tokens"]
        print(f"calls ok={summary['calls_ok']} failed={summary['calls_failed']} "
              f"no_usage={summary['calls_without_usage']} files={summary['files']}")
        print(f"tokens input={t['input']} output={t['output']} thinking={t['thinking']} "
              f"cache_read={t['cache_read']} cache_write={t['cache_write']} total={t['total']}")
        print(f"cost_usd total={summary['cost_usd']['total']} basis={summary['cost_basis']}")
        lat = summary["latency_ms"]
        print(f"latency_ms median={lat['median']} p95={lat['p95']} max={lat['max']} n={lat['count']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
