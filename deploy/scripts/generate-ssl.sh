#!/usr/bin/env bash
set -e

CERTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../nginx/certs" && pwd)"
mkdir -p "$CERTS_DIR"

IP="${1:-202.155.16.177}"

echo "Generating SSL certificate for IP: $IP..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERTS_DIR/key.pem" \
  -out "$CERTS_DIR/cert.pem" \
  -subj "/C=ID/ST=Lampung/L=BandarLampung/O=Topshop/CN=$IP" \
  -addext "subjectAltName = IP:$IP,IP:127.0.0.1,DNS:localhost"

chmod 600 "$CERTS_DIR/key.pem"
chmod 644 "$CERTS_DIR/cert.pem"

echo "SSL certificate successfully generated at:"
echo "  Certificate : $CERTS_DIR/cert.pem"
echo "  Private Key : $CERTS_DIR/key.pem"
