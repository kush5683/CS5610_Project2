#!/bin/bash
set -euo pipefail

DB_NAME="${MONGO_INITDB_DATABASE:-WhatToWatch}"

existing_docs=$(mongosh --quiet --eval "(() => { const db = db.getSiblingDB('${DB_NAME}'); return db.Movies.countDocuments(); })()")

if [[ "${existing_docs}" != "0" ]]; then
  echo "Existing data detected in ${DB_NAME}.Movies (${existing_docs} docs). Skipping seed import."
  exit 0
fi

import_collection() {
  local file_path="$1"
  local collection="$2"

  if [[ ! -f "$file_path" ]]; then
    echo "Seed file ${file_path} not found. Skipping ${collection} import."
    return
  fi

  echo "Importing ${collection} from $(basename "$file_path")"
  mongoimport --db "$DB_NAME" --collection "$collection" --file "$file_path" --jsonArray --drop
}

MOVIES_FILE="/docker-entrypoint-initdb.d/WhatToWatch.Movies.json"
SERIES_FILE="/docker-entrypoint-initdb.d/WhatToWatch.Series.json"
USERS_FILE="/docker-entrypoint-initdb.d/WhatToWatch.users.json"

if [[ ! -f "$MOVIES_FILE" ]]; then
  MOVIES_FILE="/docker-entrypoint-initdb.d/movies.json"
fi

if [[ ! -f "$SERIES_FILE" ]]; then
  SERIES_FILE="/docker-entrypoint-initdb.d/tv_shows.json"
fi

import_collection "$MOVIES_FILE" "Movies"
import_collection "$SERIES_FILE" "Series"
import_collection "$USERS_FILE" "users"

echo "Mongo seed import complete."
