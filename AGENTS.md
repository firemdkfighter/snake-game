# Snake Game — AI Agent Instructions

## Before starting

- Read `README.md` first — it contains all project context (structure, controls, features, API, tech stack).
- Update `AGENTS.md` or `README.md` as needed when project conventions, structure, or context changes.

## Build & run

- This application MUST be built and run ONLY inside Docker.
- Do NOT run `npm run dev`, `npm run build`, or `npm run preview` directly on the host.
- To build and run: `docker compose up -d --build`
- To stop: `docker compose down`
- The game will be available at http://localhost:8080
- **After making any code changes**, rebuild and restart (`docker compose up -d --build`). Then suggest testing at http://localhost:8080.

## Task tracking

- Before starting work, read the current task list from `TASKS.md` (create it if it doesn't exist).
- Write all tasks to `TASKS.md` at the start of a session, organized as a checklist using Markdown checkboxes (`- [ ]` for pending, `- [x]` for completed).
- Update `TASKS.md` as you complete each task — mark items done, add new tasks discovered during work.
- Keep the file in sync with the actual state of work at all times.
- Commit `TASKS.md` alongside code changes when a task is completed.

## Code style

- Comment code by logical blocks — one comment per section explaining the intent.
- Follow existing patterns (ES modules, `const`/`let`, arrow functions, async/await).
- CSS: no framework, custom properties, `clamp()` for responsive sizing.

## Lint

- Run `npm run lint` before committing to check for code style issues.

## Git

- `.gitignore` excludes: `node_modules/`, `dist/`, `data/`, `*.log`
- The `data/` directory is a bind-mounted Docker volume — never commit it.
- Work on each task in a separate branch (e.g. `feature/description` or `fix/description`).
- Before starting work on a task, switch to `master`, pull latest changes, create a new branch, and rebase it onto `master`.
- Commit after each completed task, but only commit what was intended (never secrets or generated files).
- Before committing, review `git status`, `git diff`, recent history (`git log --oneline -10`), and run lint on changed files.
- Stage only intended files — never commit secrets or generated files.
- Write concise commit messages matching the repo style.
