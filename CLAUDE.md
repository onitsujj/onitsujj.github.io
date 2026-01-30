# CLAUDE.md
AI-assisted development using BMAD Method v6.0 (Hardened)

---

## Hard Rules (Read First)

These rules override all defaults.

- **Authority of Artifacts**
  - `project-context.md` is the primary source of truth.
  - Domain-specific correctness rules live in `ai-domain-rules.md`.
  - If artifacts conflict, stop and ask for clarification.

- **No Unscoped Work**
  - Do NOT implement features, refactors, or architectural changes without referencing the relevant PRD and/or architecture.

- **No Silent Assumptions**
  - If requirements are unclear or conflicting, STOP and request clarification.

- **No Unreviewed Commits**
  - All commits require a clarity review before `/commit`.
  - No AI attribution in git history.

---

## Orchestration & Delegation Model

- The main agent acts as an orchestrator.
- Prefer delegation to specialized subagents.
- Prefer parallel delegation for independent tasks.
- If subagent tools are unavailable:
  - Explicitly simulate delegation by role.
  - State clearly that execution is simulated.

Never silently bypass orchestration.

---

## Ambiguity Resolution

When ambiguity is detected:
1. Pause implementation
2. Summarize the ambiguity
3. Request clarification
4. Proceed only after resolution

---

## Required Context Checks

Before major decisions or implementation, always check (if present):

1. `project-context.md`
2. `ai-domain-rules.md`
3. `_bmad/_memory/lessons-learned.md`
4. `_bmad-output/prd.md`
5. `_bmad-output/architecture.md`

If any required artifact is missing, state it explicitly.

---

## Default Behaviors

- Keep changes minimal and scoped.
- Match existing code style.
- Write tests for new executable logic unless explicitly excluded.
- Update documentation when public APIs change.
- Use lessons-learned to avoid repeated mistakes.

---

## Design Principle

**Constrain intent, not mechanics.**
