#!/usr/bin/env bash
# Runs the migration, the RLS/trigger assertions, and the seed against a
# throwaway local Postgres cluster. Requires Postgres 15+ binaries on PATH
# (initdb, pg_ctl, psql). Usage: bash scripts/test-db.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BIN="${PG_BIN:-$(dirname "$(command -v initdb || ls /usr/lib/postgresql/*/bin/initdb | tail -1)")}"
DATA="$(mktemp -d)"
PORT="${PGPORT_TEST:-54329}"
# Postgres refuses to run as root; containers often are root.
as_pg() { if [ "$(id -u)" = 0 ]; then chown -R postgres "$DATA"; runuser -u postgres -- "$@"; else "$@"; fi; }
trap 'as_pg "$BIN/pg_ctl" -D "$DATA/db" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DATA"' EXIT

as_pg "$BIN/initdb" -D "$DATA/db" -U postgres -A trust >/dev/null
as_pg "$BIN/pg_ctl" -D "$DATA/db" -o "-p $PORT -k $DATA -c listen_addresses=''" -l "$DATA/log" -w start >/dev/null

run() { "$BIN/psql" -h "$DATA" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -q "$@"; }

run -c "create database keel_rls" -d postgres
run -d keel_rls -f "$ROOT/supabase/tests/auth_stub.sql"
run -d keel_rls -f "$ROOT/supabase/migrations/0001_init.sql"
run -d keel_rls -f "$ROOT/supabase/tests/rls_test.sql"

run -c "create database keel_seed" -d postgres
run -d keel_seed -f "$ROOT/supabase/tests/auth_stub.sql"
run -d keel_seed -f "$ROOT/supabase/migrations/0001_init.sql"
run -d keel_seed -f "$ROOT/supabase/seed.sql"
run -d keel_seed -f "$ROOT/supabase/tests/seed_integrity.sql"
run -d keel_seed -At -c "select 'seed ok: ' || (select count(*) from public.tasks) || ' tasks, ' || (select count(*) from public.projects) || ' projects'"
