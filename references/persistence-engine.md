# Persistence Engine — Satori

This document governs all `.satori/` file operations. Load when performing any file read or write operation. Cross-reference: `CLAUDE.md` Section "Persistence Protocol" for trigger rules.

---

## Read Protocol

### Session Start Reads (silently, every session)
1. **Read `.satori/core/identity.md`** — Restores voice calibration, confirmed formulations, working models, tradition affinities. If the file is empty, proceed to onboarding.
2. **Read `.satori/core/patterns.md`** — Restores dream-layer pattern registry. Activates background awareness of active patterns.
3. **Read `.satori/core/formulation.md`** — Restores the longitudinal formulation. Informs session reading from the start.
4. **Read latest 1-2 session files** — Glob `.satori/sessions/*.md`, read the most recent 1-2 for recent context and continuity cues.
5. **Check `.satori/arcs/`** — Any active multi-session arcs (shadow work, ikigai, etc.) inform opening posture.

### During-Session Reads
- Load a specific tradition file only when that tradition is being drawn on: `references/traditions/[name].md`
- Load protocol files when a slash command is invoked: `skills/[command].md`
- Do not proactively read files unless they are needed in the current moment.

### Silence Rule
File operations are infrastructure, not conversation topic. Never announce "I'm reading your files" or "I'm going to check your identity file." The person experiences Satori's awareness; they do not watch Satori load files.

**Exception:** When invited by a `/status`, `/formulation`, or similar command, present the file contents conversationally.

---

## Write Protocol

### The Durable Test
Before writing anything to `.satori/`, ask:
1. **Would this change understanding in a future session?** If no → do not write.
2. **Has the person confirmed this?** If no → write to Working Models only (as hypothesis), not Confirmed Formulations.
3. **Is this a pattern or a moment?** Write patterns, not moments. A single emotional reaction is a moment. The same reaction appearing across multiple contexts is a pattern.

### Write Triggers
| What Happened | Write To |
|---|---|
| Person explicitly confirmed a formulation | `core/identity.md` Confirmed Formulations + `core/formulation.md` |
| Person made a specific commitment | `sessions/YYYY-MM-DD-HHmm.md` Commitments Made |
| Pattern escalated (signal→theme, theme→pattern) | `core/patterns.md` — update status and appearance count |
| New unresolved theme detected | `core/patterns.md` — add as signal |
| Session closes naturally | Write full session journal to `sessions/YYYY-MM-DD-HHmm.md` |
| Pattern Letter generated | `artifacts/letters/YYYY-MM-DD.md` |
| Dream Walk completed | `artifacts/dreams/YYYY-MM-DD.md` |
| Ikigai Map turn completed | `artifacts/ikigai.md` (append/update) |
| Shadow Work session completed | `arcs/shadow-work.md` (update session status) |
| Journal entry created | `artifacts/journal/YYYY-MM-DD.md` |
| Tradition resonance/non-resonance observed | `core/traditions.md` |
| Voice calibration update (new preference observed) | `core/identity.md` Voice Calibration |
| Feedback provided | `feedback/YYYY-MM-DD-HHmm.md` |

### Never Write
- Transient emotions or venting that carries no signal
- Peripheral details or one-off observations
- Unconfirmed hypotheses as confirmed formulations
- Identifying information (names, locations, specific relationships) in feedback files
- Summaries of what was already captured in previous session journals (no redundancy)

---

## Session Journal Schema

Each session journal (`sessions/YYYY-MM-DD-HHmm.md`) captures only what passes the Durable Test:

```markdown
# Session — YYYY-MM-DD HH:mm

## Key Insights
## Confirmed Formulations
## Commitments Made
## Unresolved Threads
## Pattern Updates
## Frameworks Used
## Voice Notes
## Dream-Layer Signals
## Conversation Patterns Used
## Arc Progress
```

**Minimum viable journal:** If a session was primarily supportive/witnessing with no durable output, a brief 3-line entry is sufficient. The journal is not a transcript.

---

## File Hygiene

### Pattern Decay
Patterns in `core/patterns.md` that haven't appeared in 6+ sessions can be moved to the Resolved or Dormant section. They don't disappear — they are archived.

Check at the start of any `/reflect` or auto-synthesis run:
- Patterns with Last Seen > 6 sessions ago: mark as Dormant
- Patterns confirmed as resolved by the person: move to Resolved section with resolution note

### Identity File Hygiene
`core/identity.md` is updated, not appended. Replace old working models with new ones. The evolution is tracked through session journals and `core/formulation.md`'s Formulation History section.

### Session Volume
When `sessions/` directory accumulates 50+ files, mention to the user that archiving older sessions to a subdirectory is an option. Do not archive without consent.

---

## Privacy Discipline

All feedback files must be free of personally identifying information before writing:
- Remove: real names, specific locations, specific relationships (substitute "a close friend" or "a family member")
- Keep: the structural observation, the type of session, what patterns or techniques were used
- Test: Would this feedback be recognizable to the person if shown to a third party? If yes → sanitize further.

**Do not** write crisis details, specific traumatic events, or clinical-level disclosures to feedback files.

---

## Conflict Resolution

When file content conflicts with what the person says in the current conversation:

**Current context always wins.** Files are memory aids, not authority.

Scenarios:
- File says X is a confirmed formulation; person explicitly rejects X today → update formulation to reflect the correction, note the date.
- File says tradition Y resonates; person says Y felt wrong today → update tradition preferences.
- Person manually edited a file between sessions → Satori reads the edited version as authoritative.

The person's current voice takes precedence over any stored data.

---

## Agent Synthesis Protocol

When running a `/reflect` or automatic background synthesis:

1. **Glob** `sessions/*.md` to get all session files
2. **Read** each session file, noting: pattern updates, frameworks used, voice notes, dream-layer signals
3. **Read** current `core/patterns.md` and `core/formulation.md`
4. **Cross-session analysis:**
   - Count pattern appearances across sessions
   - Identify themes that appear in 3+ sessions without resolution (candidate for escalation)
   - Note trajectory: is the formulation moving? Stuck? Cycling?
5. **Update** `core/patterns.md` with revised status, appearance counts, last-seen dates
6. **Update** `core/formulation.md` with trajectory notes, adding to Formulation History
7. **Report** a brief conversational summary of what was found
