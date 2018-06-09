#!/usr/bin/env bash

# This script loads a pg_dump file into the database.
# Due to the way that the dump file is created, loading it will drop and
# recreate the database objects.

if [ -z "$1" ] || [ ! -f "$1" ]; then
  echo "Must pass the path to the database dump"
  exit
fi

DUMP_FILE="$1"

# Ensure database is running.
sudo docker-compose up --detach postgres

echo "Restoring from $DUMP_FILE"

sudo docker-compose exec -T postgres \
     psql --username postgres --set ON_SERROR_STOP=on \
     < "$DUMP_FILE"

echo "Done"
