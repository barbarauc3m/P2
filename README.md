1) abrir la carpeta en la terminal
2) ejecutar EN LOCAL CADA UNO "openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes" para obtener certificados SSL (key.pem y cert.pem).
3) "npm run dev" o "npm start" (dev recarga automáticamente con cada cambio que hagamos)