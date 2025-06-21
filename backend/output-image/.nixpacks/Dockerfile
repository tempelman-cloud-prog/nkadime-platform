FROM ghcr.io/railwayapp/nixpacks:ubuntu-1745885067

ENTRYPOINT ["/bin/bash", "-l", "-c"]
WORKDIR /app/


COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix
RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d


ARG CI NIXPACKS_METADATA NODE_ENV NPM_CONFIG_PRODUCTION
ENV CI=$CI NIXPACKS_METADATA=$NIXPACKS_METADATA NODE_ENV=$NODE_ENV NPM_CONFIG_PRODUCTION=$NPM_CONFIG_PRODUCTION

# setup phase
# noop

# start phase
COPY . /app/.
RUN  node dist/app.js

# install phase
ENV NIXPACKS_PATH=/app/node_modules/.bin:$NIXPACKS_PATH
COPY . /app/.
RUN --mount=type=cache,id=fZUArmNYv4-/root/npm,target=/root/.npm npm ci

# build phase
COPY . /app/.
RUN --mount=type=cache,id=fZUArmNYv4-node_modules/cache,target=/app/node_modules/.cache exit 1
RUN --mount=type=cache,id=fZUArmNYv4-node_modules/cache,target=/app/node_modules/.cache echo 'HELLO FROM NIXPACKS BUILD PHASE'
RUN --mount=type=cache,id=fZUArmNYv4-node_modules/cache,target=/app/node_modules/.cache ls -l
RUN --mount=type=cache,id=fZUArmNYv4-node_modules/cache,target=/app/node_modules/.cache npm install -g typescript
RUN --mount=type=cache,id=fZUArmNYv4-node_modules/cache,target=/app/node_modules/.cache npm ci
RUN --mount=type=cache,id=fZUArmNYv4-node_modules/cache,target=/app/node_modules/.cache ls -l src
RUN --mount=type=cache,id=fZUArmNYv4-node_modules/cache,target=/app/node_modules/.cache tsc
RUN --mount=type=cache,id=fZUArmNYv4-node_modules/cache,target=/app/node_modules/.cache ls -l dist



RUN printf '\nPATH=/app/node_modules/.bin:$PATH' >> /root/.profile


# start
COPY . /app

CMD ["npm run start"]

