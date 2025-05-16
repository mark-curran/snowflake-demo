FROM node:22.14.0-slim AS builder

# node-rdkafka requires the python3 runtime to build.
RUN \
    apt-get update -qqy && \
    # NOTE: rdkafka uses gpy which needs python3 and C++ compiler tools.
    apt-get install -y python3 make g++ \
    # NOTE: rdkafka needs openssl-dev to be installed because you need to use it to build rdkafka.
    libssl-dev  

WORKDIR /builder

COPY load_via_kafka/package.json load_via_kafka/package-lock.json load_via_kafka/tsconfig.json ./
COPY load_via_kafka/src/ ./src/
COPY shared_schemas/ts_package /shared_schemas/ts_package/

# NOTE: This will take a long time because node-rdkafka needs to be compiled
# ENV NODE_ENV=production
RUN npm ci --loglevel verbose
RUN npm run buildProduction

FROM builder AS production

RUN useradd -m app

WORKDIR /app

COPY --from=builder /builder/dist/src ./dist
COPY --from=builder /builder/node_modules ./node_modules
COPY --from=builder /builder/package.json ./
COPY --from=builder /builder/package-lock.json ./

RUN chown -R app:app /app

USER app

ENTRYPOINT ["node", "dist/index.js"]