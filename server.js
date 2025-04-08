const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const app = express();
const PORT = 6969;
const { Server } = require('socket.io');

// Carga de certificados
// GENERA CERTIFICADOS CON EL SIGUIENTE COMANDO:
// openssl req -nodes -new -x509 -keyout key.pem -out cert.pem -days 365

const server = https.createServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}, app);

// Inicializa Socket.IO sobre HTTPS
const io = new Server(server);

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/fonts', express.static(path.join(__dirname, 'fonts')));

app.use('/script', express.static(path.join(__dirname, 'public', 'client', 'script')));

app.use('/styles', express.static(path.join(__dirname, 'public', 'client', 'styles')));

app.use('/client', express.static(path.join(__dirname, 'public', 'client')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/index.html'));
}
);

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/index.html'));
});

app.get('/perfil.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/perfil.html'));
});

app.get('/empezar-lavado.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/empezar-lavado.html'));
});

app.get('/categorias-lavados.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/categorias-lavados.html'));
});

app.get('/escaner.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/escaner.html'));
});

app.get('/historial.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/historial.html'));
});

app.get('/lavado-personalizado.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/lavado-personalizado.html'));
});

app.get('/jugando.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/jugando.html'));
});

app.get('/pantalla-carga.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/pantalla-carga.html'));
});

app.get('/jugando.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/jugando.html'));
});

app.get('/juegos.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/juegos.html'));
});

app.get('/mapa.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/mapa.html'));
});

app.get('/lavados-favs.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/lavados-favs.html'));
});

app.get('/escaner-etiqueta.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/escaner-etiqueta.html'));
});


app.get('/escaner-color.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/escaner-color.html'));
});

app.get('/juego3.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/juego3.html'));
});

// Ruta POST para guardar lavado
app.post('/guardar-lavado', (req, res) => {
  const nuevoLavado = req.body;
  const usuario = nuevoLavado.usuario;

  if (!usuario) return res.status(400).send('Falta el nombre del usuario');

  const filePath = path.join(__dirname, 'lavados-usuarios.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    let dataUsuarios = {};
    if (!err && data) {
      try {
        dataUsuarios = JSON.parse(data);
      } catch (e) {
        return res.status(500).send('Error al parsear JSON de lavados-usuarios');
      }
    }

    // Si no hay lavados previos para el usuario, lo inicializamos
    if (!dataUsuarios[usuario]) dataUsuarios[usuario] = [];

    // Guardamos el nuevo lavado al principio y limitamos a 20
    dataUsuarios[usuario].unshift(nuevoLavado);
    dataUsuarios[usuario] = dataUsuarios[usuario].slice(0, 20);

    fs.writeFile(filePath, JSON.stringify(dataUsuarios, null, 2), err => {
      if (err) return res.status(500).send('Error al guardar el lavado');
      res.send('Lavado guardado correctamente');
    });
  });
});

// Nueva ruta para obtener lavados de un usuario
app.get('/lavados/:usuario', (req, res) => {
  const usuario = req.params.usuario;
  const filePath = path.join(__dirname, 'lavados-usuarios.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err || !data) return res.json([]);
    try {
      const json = JSON.parse(data);
      res.json(json[usuario] || []);
    } catch (e) {
      res.status(500).send('Error al parsear lavados');
    }
  });
});


// Ruta GET para obtener favoritos
app.get('/favoritos', (req, res) => {
  fs.readFile('lavados-favs.json', 'utf8', (err, data) => {
    if (err) return res.json({});
    res.json(JSON.parse(data));
  });
});

// Ruta POST para guardar favoritos
app.post('/guardar-favoritos', (req, res) => {
  const { usuario, favoritos } = req.body;

  fs.readFile('lavados-favs.json', 'utf8', (err, data) => {
    let allFavs = {};
    if (!err && data) {
      try {
        allFavs = JSON.parse(data);
      } catch (e) {
        return res.status(500).send('❌ Error parsing JSON');
      }
    }

    allFavs[usuario] = favoritos;

    fs.writeFile('lavados-favs.json', JSON.stringify(allFavs, null, 2), err => {
      if (err) return res.status(500).send('❌ Error al guardar favoritos');
      res.send('✅ Favoritos guardados correctamente');
    });
  });
});


// Ruta para guardar lavado personalizado
app.post('/guardar-lavado-personalizado', (req, res) => {
  const lavado = req.body;
  const usuario = lavado.usuario;

  if (!usuario) {
    return res.status(400).send('Falta el nombre del usuario');
  }

  const camposRequeridos = [
    'temperatura', 'duracion', 'centrifugado', 'detergente'
  ];

  const faltaCampo = camposRequeridos.some(campo => !lavado[campo]);
  if (faltaCampo) {
    return res.status(400).send('Faltan parámetros obligatorios del lavado personalizado');
  }

  const filePath = path.join(__dirname, 'lavados-personalizados.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    let dataUsuarios = {};
    if (!err && data) {
      try {
        dataUsuarios = JSON.parse(data);
      } catch (e) {
        return res.status(500).send('Error al parsear JSON de lavados-personalizados');
      }
    }

    if (!dataUsuarios[usuario]) dataUsuarios[usuario] = [];

    // Calcular el nuevo índice
    const nuevoIndex = dataUsuarios[usuario].length + 1;
    lavado.nombre = `Lavado personalizado ${nuevoIndex}`;
    lavado.index = nuevoIndex;

    // Guardar al principio
    dataUsuarios[usuario].unshift(lavado);
    dataUsuarios[usuario] = dataUsuarios[usuario].slice(0, 20);

    fs.writeFile(filePath, JSON.stringify(dataUsuarios, null, 2), err => {
      if (err) return res.status(500).send('Error al guardar el lavado personalizado');
      res.send('Lavado personalizado guardado correctamente');
    });
  });
});



app.get('/lavados-personalizados/:usuario', (req, res) => {
  const usuario = req.params.usuario;
  const filePath = path.join(__dirname, 'lavados-personalizados.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err || !data) return res.json([]);
    try {
      const json = JSON.parse(data);
      res.json(json[usuario] || []);
    } catch (e) {
      res.status(500).send('Error al parsear lavados personalizados');
    }
  });
});


// Lógica de socket
io.on('connection', (socket) => {
  console.log('Usuario conectado');

  socket.on('mensaje', (data) => {
    console.log('Mensaje recibido:', data);
    socket.broadcast.emit('mensaje', data);
  });

  socket.on('lanzar', () => {  // BARBARAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA (por si la lio)
    console.log('📱 Movimiento recibido desde móvil');
    socket.broadcast.emit('lanzar'); // Reenvía a todos menos al móvil
  }); // BARBARAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });
});


server.listen(PORT, () => {
  console.log(`Servidor HTTPS con Socket.IO en https://localhost:${PORT}`);
});


// MATAR UN PROCESO PARA VOLVER A CORRER EL SERVER
// lsof -i :6969
//COMMAND    PID          USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
//node    ****247897**** alba   23u  IPv6 1742693      0t0  TCP *:6969 (LISTEN)
// kill -9 PID