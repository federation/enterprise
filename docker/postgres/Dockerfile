FROM postgres:latest

# NOTE
# These paths are relative to the Docker build context, which is set in
# docker-compose as $GIT_ROOT/db/.
COPY ./sql/schema.sql ./sql/seed.sql ./docker-entrypoint-initdb.d/
