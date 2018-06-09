#!/usr/bin/env bash

# This script dumps the database.
# The filename is set to the current datetime in ISO-8601 format.
# An optional name can be appended to it if passed as an argument.
# The dump can be loaded by db-load.sh

DUMP_BASE="db/dumps"

PGDATABASE="federation"

# Use an ISO-8601 prefix.
DUMP_NAME=$(date --iso-8601=seconds)

# If an argument was given, use it as the dump name.
if [ -n "$1" ]; then
  DUMP_NAME="${DUMP_NAME}_$1"
fi

# Determine the path to the file dump.
GIT_ROOT=$(git rev-parse --show-toplevel)
DUMP_PATH=$(realpath --relative-to=. "${GIT_ROOT}/${DUMP_BASE}")
DUMP_FILE="${DUMP_PATH}/${DUMP_NAME}.sql"

# Create the path if it doesn't already exist.
mkdir -p "$DUMP_PATH"

# Ensure database is running.
sudo docker-compose up --detach postgres

echo "Dumping database to $DUMP_FILE"

# Dump the database.
sudo docker-compose exec -T postgres \
     pg_dump --username postgres --clean --if-exists --create "$PGDATABASE" \
     > "$DUMP_FILE"

echo "Done"
