"""Append-only JSONL checkpointing and the bounded-concurrency case runner."""

from __future__ import annotations

import concurrent.futures
import json
import pathlib
import sys
import threading
from typing import Any

from .util import utcnow_iso


class Checkpoint:
    """Append-only JSONL checkpoint with resume support (one file per suite+thinking)."""

    def __init__(self, path: pathlib.Path):
        self.path = path
        self.done: dict[str, dict[str, Any]] = {}
        self._lock = threading.Lock()
        if path.exists():
            for line in path.read_text(encoding="utf-8").splitlines():
                if not line.strip():
                    continue
                try:
                    rec = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if rec.get("ok"):
                    self.done[rec["id"]] = rec

    def has(self, case_id: str) -> bool:
        return case_id in self.done

    def get(self, case_id: str) -> dict[str, Any] | None:
        return self.done.get(case_id)

    def record(self, case_id: str, result: dict[str, Any]) -> None:
        if not result.get("ok"):
            return  # only checkpoint usable successes; failures retry on resume
        rec = {"id": case_id, "ok": True, "ts": utcnow_iso(), "result": result}
        with self._lock:
            with self.path.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps(rec) + "\n")
            self.done[case_id] = rec


def run_cases(
    cases: list[dict[str, Any]],
    *,
    cache_dir: pathlib.Path,
    suite: str,
    thinking: str,
    workers: int,
    timeout: float,
    force: bool,
    runner,  # callable(case, thinking, timeout) -> result dict
    progress_every: int = 25,
) -> list[dict[str, Any]]:
    """Run `runner` over `cases` with bounded concurrency, resuming from `<cache_dir>/<suite>_<thinking>.jsonl`.

    Returns `[{"case": case, "result": result_or_None}]` in dataset order. Only
    successful results are checkpointed, so failed calls are retried on the next run.
    """
    cache_path = cache_dir / f"{suite}_{thinking}.jsonl"
    cache_dir.mkdir(parents=True, exist_ok=True)
    ckpt = Checkpoint(cache_path)
    if force:
        ckpt.done = {}

    results: list[dict[str, Any]] = []
    pending = [c for c in cases if not ckpt.has(c["id"])]
    print(
        f"[{suite}] {len(cases)} cases ({len(cases) - len(pending)} resumed from {cache_path.name}, "
        f"{len(pending)} to run, workers={workers})",
        file=sys.stderr,
    )

    completed = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(runner, case, thinking, timeout): case for case in pending}
        for fut in concurrent.futures.as_completed(futures):
            case = futures[fut]
            try:
                result = fut.result()
            except Exception as exc:  # defensive: worker crash must not sink the suite
                result = {"ok": False, "error": f"worker exception: {exc!r}", "text": "", "thinking": "",
                          "latency_ms": None, "usage": None,
                          "classification": {"label": None, "rank": None, "rank_ok": False,
                                             "rationale": "", "parse_mode": None, "error": str(exc)}}
            ckpt.record(case["id"], result)
            completed += 1
            if completed % progress_every == 0 or completed == len(pending):
                print(f"[{suite}] {completed}/{len(pending)} done", file=sys.stderr)

    for case in cases:
        rec = ckpt.get(case["id"])
        if rec is None:
            # Should not happen (failures are retried above), but keep explicit.
            results.append({"case": case, "result": None})
        else:
            results.append({"case": case, "result": rec["result"]})
    return results
