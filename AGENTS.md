# Repository Guidelines

## Project Structure & Module Organization
- Root: `docker-compose.yml`, shared `.env.example`, docs in `_docs/`.
- Backend (FastAPI): `backend/` with app code in `backend/app/` (api, models, schemas, services, tasks), entrypoint `backend/main.py`, migrations `backend/alembic/`.
- Frontend (Expo React Native): `frontend/` with source in `frontend/src/` (components, screens, services, store, navigation, utils), assets in `frontend/assets/`.
- Tests: `backend/tests/` (pytest). Frontend tests are not yet configured.

## Build, Test, and Development Commands
- Start full stack (DB, Redis, API, Celery): `docker-compose up --build`
- Backend local dev: `uvicorn main:app --reload --app-dir backend --port 8000`
- Install backend deps: `pip install -r backend/requirements.txt`
- DB migrations: `alembic -c backend/alembic.ini upgrade head` | new: `alembic -c backend/alembic.ini revision --autogenerate -m "msg"`
- Backend tests: `pytest -q backend` | with coverage: `pytest --cov=app backend`
- Lint/format (backend): `black backend && flake8 backend && mypy backend/app`
- Frontend dev: `cd frontend && npm install && npm run start` (or `npm run ios`/`npm run android`)

## Coding Style & Naming Conventions
- Python: Black formatting, 88–100 cols; type hints required for new/changed code; `snake_case` for modules/functions, `PascalCase` for classes.
- TypeScript/React Native: 2‑space indent; `PascalCase` components (`MyWidget.tsx`), `camelCase` variables; keep UI in `src/components|screens`, logic in `src/services|store|utils`.
- Imports: prefer absolute paths within each app’s root.

## Testing Guidelines
- Framework: `pytest` (backend). Name files `test_*.py`; use fixtures and async tests via `pytest-asyncio`.
- Aim for 80%+ coverage on new backend code; include at least one happy‑path and one failure case.
- Frontend: add unit tests when introducing shared logic (e.g., in `src/utils/`).

## Commit & Pull Request Guidelines
- Commits: imperative mood, concise summary (e.g., “add review scheduler”, “fix auth redirect”). Group related changes.
- Pull Requests: clear description, linked issue, setup/run steps, and screenshots for UI changes. Include migration notes when Alembic revisions are added.

## Security & Configuration
- Copy `.env.example` to `.env` in root, `backend/`, and `frontend/`. Never commit secrets. Required keys include `OPENAI_API_KEY`, DB, and Redis URLs.
- Validate inputs on API endpoints and avoid leaking stack traces in production.
