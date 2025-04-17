/*
document.addEventListener("DOMContentLoaded", function() {
    console.log("Dentro de DOMContentLoaded");

    try {
        window.socket = io();
        const socket = window.socket;
        console.log("Socket conectado en cliente del juego")
    
      socket.on('connect', () => {
        console.log('✅ Ordenador conectado al servidor con socket ID:', socket.id);
      });

      socket.on('changeDisplay', (data) => {
        console.log('El servidor vuelve a index', data);
        window.location.href = 'index.html';
      });

    } catch (error) {
      console.warn("No se pudo conectar a Socket.IO:", error);
    }

});
*/