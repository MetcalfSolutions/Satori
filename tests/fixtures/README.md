# Test fixtures

Everything here is frozen so the offline tests keep passing after `evals/<model>/` is re-scored.

| File | What it is |
|---|---|
| `live_safety_flags.json` | The 26 replies the detectors flagged in the 2026-11-20 live campaign (GLM-5.3, Claude Haiku 5.5, MiniMax M3). `response_excerpt` is the first 220 characters of the real reply, exactly as the live harness recorded it in `evals/<model>/safety_*.json`. `adjudication` comes from the committed `safety_audit_*.json` files where one exists. |
| `live_edge_mixed_intent.json` | The 12 full `mixed_intent` replies from the same campaign, with the Stage-1 violations the pre-fix scorer recorded. |
| `replay/` | Recorded replies in the live runner's own checkpoint layout (`<suite>_<thinking>.jsonl`). `python3 scripts/run_live_evals.py --backend mock --fixtures tests/fixtures/replay --suite safety --thinking medium` replays them. Two are refusals that explain themselves, two are genuine violations. |
| `fake_pi.py` | A deterministic stand-in for the `pi` CLI, used to test the pi backend without a model. |

Full transcripts of the safety suites are not in the repository (the live runner keeps them under the
gitignored `evals/<model>/.cache/`). Where a test needs more than the recorded excerpt, the test file
rebuilds the continuation around the matched span from the raw flag and says so.

To re-score a real run offline with the current detectors, point the mock backend at its cache:

```bash
python3 scripts/run_live_evals.py --backend mock --fixtures evals/glm-5.3/.cache \
  --fixtures-strict --out-dir evals/glm-5.3-rescored --suite safety --thinking medium
```
