# TrackFlow Agent Guide

Keep changes small, readable, and aligned with the current milestone.

## Start Every Session

Read these files before editing:

1. `CONTEXT.md`
2. `memory-bank/projectbrief.md`
3. `memory-bank/techContext.md`
4. `memory-bank/progress.md`
5. The nearest folder `README.md` and any matching rule under `.agents/rules/`

Update `memory-bank/progress.md` when the project state changes.

## Mandatory Pre-commit Workflow

1. Review `git status` and confirm only intended files changed.
2. Re-read the applicable context, rule, and local README for the changed area.
3. Run the smallest relevant checks documented in `memory-bank/techContext.md` or the UI README.
4. Run `git diff --check` and inspect `git diff` for accidental or unrelated changes.
5. Record the exact checks and results before asking the developer for commit confirmation.

## Protected Areas

Do not change these without explicit developer confirmation:

- `CONTEXT-hito-1.md`, `CONTEXT-hito-2.md`, and `CONTEXT-hito-3.md`
- Root Hito 1/Hito 2 application files, including `index.html`, `application.html`, `operations.html`, `validation.js`, and `src/`
- `uis/talent-pipeline-tracker/`
- `services/`, `infra/`, `data/`, and dependency or lock files

## Scoped Rules and Skills

- `.agents/rules/` contains conventions with explicit file scopes. Apply a rule only when its scope matches the files being changed.
- `.agents/skills/` contains reusable, task-focused workflows. Load a skill only when its trigger matches the task.
- `verify-trackflow-ui`: use `.agents/skills/verify-trackflow-ui/SKILL.md` to verify one TrackFlow UI before delivery.
