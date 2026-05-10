FROM golang:1.23-alpine AS builder

WORKDIR /app

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -mod=vendor -o /attention-service ./cmd/server

FROM alpine:3.20

COPY --from=builder /attention-service /attention-service

EXPOSE 8080

ENTRYPOINT ["/attention-service"]
