const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir archivos estáticos desde "public"
app.use(express.static("public"));

// Manejar conexión de sockets
io.on("connection", (socket) => {
    console.log("Usuario conectado:", socket.id);

    socket.on("mensaje", (data) => {
        console.log("Mensaje recibido:", data);
        io.emit("mensaje", data); // Reenviar mensaje a todos los clientes
    });

    socket.on("disconnect", () => {
        console.log("Usuario desconectado:", socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
