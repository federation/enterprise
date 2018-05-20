# This layer installs production dependencies.
FROM node:10.1.0-alpine AS dependencies
WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

# Install dependencies in a reproducible manner
RUN yarn install --frozen-lockfile --production

# This layer further adds dev dependencies and compiles TypeScript.
FROM dependencies AS builder

# Add dev dependencies before copying the source files to prevent
# it from unnecessarily re-running when those files have been modified,
# since they depend on package.json and yarn.lock, not the source files.
RUN yarn install --frozen-lockfile

COPY src/ ./src/
COPY tsconfig.json ./

RUN yarn run build

# Reset to production dependencies-only and copy the
# compiled TypeScript application.
FROM dependencies
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/build/ ./build

EXPOSE 8080

CMD [ "node", "./build/index.js" ]
