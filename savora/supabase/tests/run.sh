#!/usr/bin/env bash
# Local test runner: rebuilds a scratch database, applies stubs + all migrations + demo seed,
# then runs the SQL test suite. Usage: PGHOST=/tmp PGPORT=54329 supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB=savora_test
PGOPTIONS="-c client_min_messages=warning" psql -U postgres -q -c "drop database if exists $DB" -c "create database $DB" >/dev/null
run() { psql -U postgres -d $DB -q -v ON_ERROR_STOP=1 -f "$1" >/dev/null && echo "ok  $1"; }
run tests/supabase_stubs.sql
for f in migrations/*.sql; do run "$f"; done
for f in seed/menu.sql seed/demo.sql; do run "$f"; done
for f in tests/test_*.sql; do
  psql -U postgres -d $DB -q -v ON_ERROR_STOP=1 -f "$f" && echo "PASS $f"
done
for f in tests/test_*.sh; do
  "$f" && echo "PASS $f" || { echo "FAIL $f"; exit 1; }
done
