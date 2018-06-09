#!/usr/bin/env bash

# This script loads a pg_dump file into the database.
# Due to the way that the dump file is created, loading it will drop and
# recreate the database objects.

PGHOST="postgres"
PGUSER="postgres"

if [ -z "$1" ] || [ ! -f "$1" ]; then
  echo "Must pass the path to the database dump"
  exit
fi

DUMP_FILE="$1"

echo "Restoring from $DUMP_FILE"

sudo docker-compose run --rm postgres \
     psql -h "$PGHOST" -U "$PGUSER" --set ON_SERROR_STOP=on < "$DUMP_FILE"
