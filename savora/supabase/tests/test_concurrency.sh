#!/usr/bin/env bash
# Two guests try to book the same table for overlapping times at the same moment.
# Expected: exactly one booking is saved; the other fails with an exclusion violation.
set -uo pipefail
DB=savora_test
SQL="insert into public.reservations (guest_name, guest_email, guest_phone, party_size, starts_at, ends_at, table_id)
     select 'Race %s', 'race%s@example.com', '+2348000000099', 2, '2031-05-05 19:00+01', '2031-05-05 21:00+01', id
     from public.restaurant_tables where label = 'T3';"
OUT=$(mktemp -d)
psql -U postgres -d $DB -v ON_ERROR_STOP=1 -q -c "begin; $(printf "$SQL" A A) select pg_sleep(1.5); commit;" >"$OUT/a" 2>&1 & A=$!
sleep 0.3
psql -U postgres -d $DB -v ON_ERROR_STOP=1 -q -c "begin; $(printf "$SQL" B B) commit;" >"$OUT/b" 2>&1 & B=$!
wait $A; RA=$?; wait $B; RB=$?
SAVED=$(psql -U postgres -d $DB -Atc "select count(*) from public.reservations where guest_name like 'Race %'")
grep -q "reservations_no_table_overlap" "$OUT/b" && CONFLICT=yes || CONFLICT=no
echo "  session A exit=$RA, session B exit=$RB, rows saved=$SAVED, B hit overlap constraint=$CONFLICT"
[ "$RA" = 0 ] && [ "$RB" != 0 ] && [ "$SAVED" = 1 ] && [ "$CONFLICT" = yes ]
