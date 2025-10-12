#!/bin/bash
set -euo pipefail

DB_NAME="${MONGO_INITDB_DATABASE:-WhatToWatch}"

existing_docs=$(mongosh --quiet --eval "(() => { const db = db.getSiblingDB('${DB_NAME}'); return db.Movies.countDocuments(); })()")

if [[ "${existing_docs}" != "0" ]]; then
  echo "Existing data detected in ${DB_NAME}.Movies (${existing_docs} docs). Skipping seed import."
  exit 0
fi

echo "Importing movies into ${DB_NAME}.Movies"
mongoimport --db "$DB_NAME" --collection Movies --file /docker-entrypoint-initdb.d/movies.json --jsonArray --drop

echo "Importing series into ${DB_NAME}.Series"
mongoimport --db "$DB_NAME" --collection Series --file /docker-entrypoint-initdb.d/tv_shows.json --jsonArray --drop
