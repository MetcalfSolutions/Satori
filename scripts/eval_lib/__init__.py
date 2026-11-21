"""Shared evaluation library for Satori's harnesses.

Imported by `scripts/run_evals.py` (offline lint and evidence suites) and
`scripts/run_live_evals.py` (live suites against a pluggable backend):

    paths           repository locations
    datasets        benchmark registry and validating loaders
    stage1          Stage-1 structural and anti-slop checks (rubric S1.1 to S1.6)
    routing         Precedence Ladder labels, strata, deterministic lint classifier
    classification  routing prompt and tolerant reply parser
    detectors       boundary, red-team, privacy and escalation detectors
    stats           Wilson interval, gate targets, latency and token statistics
    checkpoint      JSONL checkpoint/resume and the bounded-concurrency runner
    context         per-run context (backend, output directory, artifact names)
    reports         report builders (classification, adversarial seam, calibration)
    live            live suite orchestration
    static_suites   deterministic evidence suites shared by both runners
    selfcheck       offline end-to-end pipeline check for the mock backend
    backends        pi, OpenAI-compatible, Anthropic and mock model backends

Standard library only: the repository ships with zero Python dependencies.
"""
