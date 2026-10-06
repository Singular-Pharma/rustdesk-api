FROM golang:1.23-alpine AS backend
RUN apk add --no-cache gcc musl-dev
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download && go install github.com/swaggo/swag/cmd/swag@v1.16.3
COPY . .
RUN swag init -g cmd/apimain.go --output docs/api --instanceName api --exclude http/controller/admin \
 && swag init -g cmd/apimain.go --output docs/admin --instanceName admin --exclude http/controller/api \
 && CGO_ENABLED=1 go build -ldflags "-s -w -extldflags '-static'" -o /out/apimain ./cmd/apimain.go

FROM node:18-alpine AS admin
ARG WEB_REPO=https://github.com/Singular-Pharma/rustdesk-api-web.git
ARG WEB_REF=v2.7
RUN apk add --no-cache git && git clone --depth 1 -b "$WEB_REF" "$WEB_REPO" /web
WORKDIR /web
# sp1 has under 2 GB free; vite's default heap can push the host into OOM next to cdc-publisher
ENV NODE_OPTIONS=--max-old-space-size=1024
RUN npm ci && npm run build

FROM alpine:3.20
RUN apk add --no-cache tzdata
WORKDIR /app
COPY --from=backend /out/apimain ./
COPY --from=backend /src/conf ./conf/
COPY --from=backend /src/resources ./resources/
COPY --from=backend /src/docs ./docs/
COPY --from=admin /web/dist/ ./resources/admin/
RUN mkdir -p data runtime
VOLUME /app/data
EXPOSE 21114
CMD ["./apimain"]
