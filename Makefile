.PHONY: lint format test coverage run check clean

PYTHON ?= python
NPM ?= npm --prefix frontend

lint:
	$(PYTHON) -m ruff check backend/app backend/tests/conftest.py backend/tests/test_branch_coverage.py
	$(PYTHON) -m ruff format --check backend/app backend/tests/conftest.py backend/tests/test_branch_coverage.py
	cd backend && $(PYTHON) -m mypy --config-file ../pyproject.toml -p app
	$(NPM) run format:check
	$(NPM) run lint
	$(NPM) run typecheck

format:
	$(PYTHON) -m ruff check --fix backend/app backend/tests/conftest.py backend/tests/test_branch_coverage.py
	$(PYTHON) -m ruff format backend/app backend/tests
	$(NPM) run format

test:
	cd backend && $(PYTHON) -m pytest tests -q
	$(NPM) test

coverage:
	cd backend && $(PYTHON) -m pytest tests --cov=app --cov-config=.coveragerc --cov-branch --cov-report=term-missing --cov-fail-under=95 -q
	$(NPM) run test:coverage

run:
	cd backend && $(PYTHON) -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

check: lint
	$(PYTHON) scripts/check_all.py
	$(PYTHON) -m pip_audit -r backend/requirements.txt
	$(NPM) audit --audit-level=high
