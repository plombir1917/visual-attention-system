FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -mod=vendor -o /analytics-service ./cmd/app

FROM alpine:3.20

COPY --from=builder /analytics-service /analytics-service

ENTRYPOINT ["/analytics-service"]
