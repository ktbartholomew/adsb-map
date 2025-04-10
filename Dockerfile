FROM node:22 AS deps

WORKDIR /app
COPY package.json package-lock.json ./

RUN npm ci

###

FROM node:22 AS build

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_MAPBOX_TOKEN=""

RUN npm run build
RUN npm run socket:build

EXPOSE 9000
EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]