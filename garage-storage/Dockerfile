FROM alpine:latest

# Устанавливаем curl и скачиваем garage
RUN apk add --no-cache curl && \
    mkdir -p /garage-data/meta /garage-data/data && \
    curl -L -o /garage https://garagehq.deuxfleurs.fr/_releases/v1.0.0/x86_64-unknown-linux-musl/garage && \
    chmod +x /garage

# Копируем конфигурацию
COPY ./config/garage.toml /etc/garage.toml

EXPOSE 3900 3901 3903

ENTRYPOINT ["/garage", "server"]