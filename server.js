const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use('/client', express.static('public/client'));
app.use('/server', express.static('public/server'));

io.on('connection', (socket) => {
  console.log('Conectado:', socket.id);

  socket.on('mensaje-del-cliente', (data) => {
    // Reenvía a todos los demás
    socket.broadcast.emit('mensaje-para-servidor', data);
  });
});

http.listen(3000, () => {
  console.log('Servidor listo en http://localhost:3000');
});
