FROM golang:1.12.4-alpine AS dependencies
ENV GO111MODULE=on
WORKDIR /app
COPY go.mod .
COPY go.sum .
RUN apk add --no-cache --virtual .build-deps git \
  && go mod download \
  && apk del .build-deps

FROM dependencies AS builder
COPY gqlgen.yml gqlgen.yml
COPY schemata/ schemata/
COPY server/ server/
COPY *.go ./
RUN go build -o enterprise server/server.go

FROM alpine
WORKDIR /app
COPY --from=builder /app/enterprise enterprise
EXPOSE 8080
ENTRYPOINT /app/enterprise
