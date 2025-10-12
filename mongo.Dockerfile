# Use the default Docker builder.
FROM mongo:7.0

ENV MONGO_INITDB_DATABASE=WhatToWatch

COPY movies.json /docker-entrypoint-initdb.d/movies.json
COPY tv_shows.json /docker-entrypoint-initdb.d/tv_shows.json
COPY db/WhatToWatch.Movies.json /docker-entrypoint-initdb.d/WhatToWatch.Movies.json
COPY db/WhatToWatch.Series.json /docker-entrypoint-initdb.d/WhatToWatch.Series.json
COPY db/WhatToWatch.users.json /docker-entrypoint-initdb.d/WhatToWatch.users.json
COPY docker/mongo-init.sh /docker-entrypoint-initdb.d/mongo-init.sh

RUN chmod +x /docker-entrypoint-initdb.d/mongo-init.sh
