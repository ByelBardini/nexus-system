#!/bin/bash
# stop-verify.sh
# Runs when Claude tries to finish a task (Stop event).
# This is the "employee-grade verification" - the agent cannot declare
# "Done!" until the project actually compiles, lints, and passes tests.
#
# If verification fails, exit 2 blocks the stop and sends errors back
# to Claude so it can fix them before completing.
#
# The stop_hook_active field prevents infinite loops: when Claude retries
# after fixing errors, the system sets this to true so we let it through.

INPUT=$(cat)

# Prevent infinite loop: if this hook already blocked once and Claude
# retried, allow the stop
STOP_ACTIVE=$(echo "$INPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(str(d.get('stop_hook_active', False)).lower())" 2>/dev/null || echo "false")
if [ "$STOP_ACTIVE" = "true" ]; then
  exit 0
fi

ERRORS=""
CHECKS_RUN=0

run_tsc() {
  local dir="$1"
  if [ -f "$dir/tsconfig.json" ]; then
    CHECKS_RUN=$((CHECKS_RUN + 1))
    TSC_OUTPUT=$(cd "$dir" && npx tsc --noEmit 2>&1)
    if [ $? -ne 0 ]; then
      ERRORS="${ERRORS}TYPE CHECK FAILED ($dir):\n$(echo "$TSC_OUTPUT" | head -30)\n\n"
    fi
  fi
}

run_eslint() {
  local dir="$1"
  if [ -f "$dir/.eslintrc" ] || [ -f "$dir/.eslintrc.js" ] || [ -f "$dir/.eslintrc.json" ] || \
     [ -f "$dir/.eslintrc.yml" ] || [ -f "$dir/eslint.config.js" ] || \
     [ -f "$dir/eslint.config.mjs" ] || [ -f "$dir/eslint.config.ts" ]; then
    CHECKS_RUN=$((CHECKS_RUN + 1))
    ESLINT_OUTPUT=$(cd "$dir" && npx eslint . --quiet 2>&1)
    if [ $? -ne 0 ]; then
      ERRORS="${ERRORS}LINT FAILED ($dir):\n$(echo "$ESLINT_OUTPUT" | head -30)\n\n"
    fi
  fi
}

run_npm_test() {
  local dir="$1"
  if [ -f "$dir/package.json" ]; then
    HAS_TEST=$(python3 -c "import json; d=json.load(open('$dir/package.json')); print(d.get('scripts', {}).get('test', ''))" 2>/dev/null)
    if [ -n "$HAS_TEST" ] && [ "$HAS_TEST" != "echo \"Error: no test specified\" && exit 1" ]; then
      CHECKS_RUN=$((CHECKS_RUN + 1))
      TEST_OUTPUT=$(cd "$dir" && npm test 2>&1)
      if [ $? -ne 0 ]; then
        ERRORS="${ERRORS}TESTS FAILED ($dir):\n$(echo "$TEST_OUTPUT" | tail -30)\n\n"
      fi
    fi
  fi
}

# --- Root-level checks ---
run_tsc "."
run_eslint "."

# --- Monorepo subdirectories ---
for SUBDIR in server client; do
  if [ -d "$SUBDIR" ]; then
    run_tsc "$SUBDIR"
    run_eslint "$SUBDIR"
    run_npm_test "$SUBDIR"
  fi
done

# --- Root test suite (only if root has its own test script) ---
if [ -f "package.json" ]; then
  HAS_TEST=$(python3 -c "import json; d=json.load(open('package.json')); print(d.get('scripts', {}).get('test', ''))" 2>/dev/null)
  if [ -n "$HAS_TEST" ] && [ "$HAS_TEST" != "echo \"Error: no test specified\" && exit 1" ]; then
    CHECKS_RUN=$((CHECKS_RUN + 1))
    TEST_OUTPUT=$(npm test 2>&1)
    if [ $? -ne 0 ]; then
      ERRORS="${ERRORS}TESTS FAILED (root):\n$(echo "$TEST_OUTPUT" | tail -30)\n\n"
    fi
  fi
fi

# --- Python type-check ---
if [ -f "pyproject.toml" ] || [ -f "setup.py" ] || [ -f "setup.cfg" ]; then
  if command -v mypy &> /dev/null && { [ -f "mypy.ini" ] || grep -q '\[tool.mypy\]' pyproject.toml 2>/dev/null; }; then
    CHECKS_RUN=$((CHECKS_RUN + 1))
    MYPY_OUTPUT=$(mypy . 2>&1)
    if [ $? -ne 0 ]; then
      ERRORS="${ERRORS}MYPY FAILED:\n$(echo "$MYPY_OUTPUT" | head -30)\n\n"
    fi
  fi

  if command -v ruff &> /dev/null; then
    CHECKS_RUN=$((CHECKS_RUN + 1))
    RUFF_OUTPUT=$(ruff check . 2>&1)
    if [ $? -ne 0 ]; then
      ERRORS="${ERRORS}RUFF FAILED:\n$(echo "$RUFF_OUTPUT" | head -30)\n\n"
    fi
  fi
fi

# --- Rust ---
if [ -f "Cargo.toml" ]; then
  CHECKS_RUN=$((CHECKS_RUN + 1))
  CARGO_OUTPUT=$(cargo check 2>&1)
  if [ $? -ne 0 ]; then
    ERRORS="${ERRORS}CARGO CHECK FAILED:\n$(echo "$CARGO_OUTPUT" | head -30)\n\n"
  fi
fi

# --- Report ---
if [ -n "$ERRORS" ]; then
  SUMMARY="Verification failed ($CHECKS_RUN checks ran). Fix these errors before completing:\n\n${ERRORS}"
  printf '{"decision":"block","reason":"%s"}' "$(echo "$SUMMARY" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read())[1:-1])")"
  exit 2
fi

exit 0
