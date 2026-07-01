@echo off
mkdir ssl
cd ssl

REM Генерируем корневой сертификат (только если нужно)
openssl genrsa -out rootCA.key 2048
openssl req -x509 -new -nodes -key rootCA.key -sha256 -days 3650 -out rootCA.pem -subj "/C=RU/ST=Moscow/L=Moscow/O=VideoHosting/CN=VideoHostingRootCA"

REM Генерируем сертификат для localhost
openssl genrsa -out localhost.key 2048
openssl req -new -key localhost.key -out localhost.csr -subj "/C=RU/ST=Moscow/L=Moscow/O=VideoHosting/CN=localhost"

openssl x509 -req -in localhost.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out localhost.crt -days 365 -sha256

echo Certificates created successfully
pause