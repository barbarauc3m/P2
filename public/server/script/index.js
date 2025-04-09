// En /server/script/index.js
const socket = io(); // Conecta al servidor

socket.on('connect', () => {
    console.log('Conectado al servidor (Pantalla Servidor) con ID:', socket.id);
});

// Ejemplo para recibir el evento 'lanzar' desde el móvil
socket.on('lanzar', () => {
    console.log('Pantalla Servidor: Evento "lanzar" recibido!');
    // Aquí haces que la pantalla del servidor reaccione
    document.body.style.backgroundColor = 'lightblue'; // ¡Cambia el fondo! (Ejemplo simple)
    // Vuelve al color original después de un tiempo
    setTimeout(() => {
      document.body.style.backgroundColor = '';
    }, 1000);
});

// Ejemplo para enviar un evento desde esta pantalla (si es necesario)
// document.getElementById('algunBotonServidor').addEventListener('click', () => {
//     socket.emit('accionServidor', { info: 'Algo pasó en el servidor' });
// });

socket.on('disconnect', () => {
    console.log('Desconectado del servidor (Pantalla Servidor)');
});