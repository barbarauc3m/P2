const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const fsPromises = require('fs').promises;
const bcrypt = require('bcrypt'); // HASHEAMOS CONTRASEÑAS FUEGO
const app = express();
const PORT = 6969;
let serverDisplaySocketId = null;
const USERS_FILE = path.join(__dirname, 'usuarios.json');
const { Server } = require('socket.io');

const SALT_ROUNDS = 10; // hashing para bcrypt

// USE JSON
// esto es para que podamos meter fotos y cosas grandes en el json, que sino no debaja guardar fotos.
app.use(express.json({ limit: '1000mb' })); 
app.use(express.urlencoded({ extended: true, limit: '1000mb' }));

// Carga de certificados
// GENERAMOS CERTIFICADOS CON EL SIGUIENTE COMANDO:
// openssl req -nodes -new -x509 -keyout key.pem -out cert.pem -days 365

const server = https.createServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}, app);

// Inicializamos Socket.IO sobre HTTPS
const io = new Server(server);


// rutas para carpetas del proyecto
app.use(express.static(path.join(__dirname, 'src', 'public')));

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/fonts', express.static(path.join(__dirname, 'fonts')));

app.use('/sounds', express.static(path.join(__dirname, 'sounds')));

app.use('/script', express.static(path.join(__dirname, 'public', 'client', 'script')));

app.use('/styles', express.static(path.join(__dirname, 'public', 'client', 'styles')));

app.use('/client', express.static(path.join(__dirname, 'public', 'client')));

app.use('/server', express.static(path.join(__dirname, 'public', 'server')));


// RUTAS INICIALES DONDE SE CARGA EL SERVIDOR
// ruta / que es el index del SERVIDOR (ordenador)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/index.html'));
}
);

// ruta /mobile que es el index del CLIENTE (movil)
app.get('/mobile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'client', 'index.html'));
});


// LADO CLIENTE
app.get('/index.html', (req, res) => 
  res.redirect('/mobile'));

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


// LADO SERVIDOR
app.get('/juegos-server.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/juegos-server.html'));
});
app.get('/pantalla-carga-server.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/pantalla-carga-server.html'));
});

app.get('/juego1.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/juego1.html'));
});

app.get('/juego2.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/juego2.html'));
});

app.get('/display/categories', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/categorias-lavados.html'));
});

app.get('/display/lavados-favs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/lavados-favs.html'));
});

app.get('/display/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/login.html'));
});

app.get('/display/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/register.html'));
});

app.get('/display/empezar-lavado', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/empezar-lavado.html'));
});

app.get('/display/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/perfil.html'));
});

app.get('/display/lavados-favs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/lavados-favs.html'));
});

app.get('/display/historial', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/historial.html'));
});

app.get('/display/lavado-personalizado', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/lavado-personalizado.html'));
});





// FUNCIONES QUE NOS AYUDAN
// Función para leer usuarios.json y devolver un objeto
async function readUsers() {
  try {
      const data = await fsPromises.readFile(USERS_FILE, 'utf8');
      return data.trim() === '' ? {} : JSON.parse(data);
  } catch (error) {
      if (error.code === 'ENOENT') {
          return {}; // Devuelve objeto vacío si no existe
      } else {
          // Propaga otros errores (parseo, permisos, etc.)
          throw new Error(`Error al leer o parsear ${USERS_FILE}: ${error.message}`);
      }
  }
}

// POST

// REGISTRO DE USUARIOS
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  // 1. Validamos los datos
  if (!username || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
      // 2. Leer usuarios existentes 
      let users = {};
      try {
          const data = await fsPromises.readFile(USERS_FILE, 'utf8');
          users = JSON.parse(data); // Parseamos el JSON
      } catch (error) {
          console.log('Archivo usuarios.json no encontrado, se creará uno nuevo.');
      }

      // 3. Comprobar duplicados (username y email)
      if (users[username]) {
          return res.status(409).json({ message: 'El nombre de usuario ya existe.' }); 
      }
      const emailExists = Object.values(users).some(user => user.email === email);
      if (emailExists) {
          return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
      }

      // 4. hasheamos la contraseña FUEGOTE
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // 5. creams new usuario 
      const newUser = {
          username: username,
          email: email,
          hashedPassword: hashedPassword, // Guardar el hash
          foto: '/images/persona_os.svg', // foto por defecto
          favoritos: [], // favoritos inicial
          personalizados: [] // lavados personalizados inicial
      };

      // 6. añadimos el new usuario al json
      users[username] = newUser;

      // 7. escribimos el json actualizado
      await fsPromises.writeFile(USERS_FILE, JSON.stringify(users, null, 2)); // null, 2 para formatear bonito
      console.log(`Usuario ${username} registrado exitosamente en ${USERS_FILE}`);

      // 8. Enviar respuesta de éxito
      res.status(201).json({ message: `Registro exitoso. ¡Bienvenido/a, ${username}!` }); // 201 creao

  } catch (error) {
      console.error('Error en /api/register:', error); // error por si acaso AB
      res.status(500).json({ message: 'Error interno del servidor durante el registro.' });
  }
});

// LOGIN DE USUARIOS
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // 1. validation basica
  if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
  }

  try {
      // 2. Leer archivo de usuarios
      let users = {};
      try {
          const data = await fsPromises.readFile(USERS_FILE, 'utf8');
          // Comprobar si está vacío antes de parsear
          if (data.trim() === '') {
               return res.status(401).json({ message: 'Credenciales inválidas (no hay usuarios).' }); // 401 no users fuk
          }
          users = JSON.parse(data);
      } catch (error) {
          console.log('Intento de login pero usuarios.json no existe.');
          return res.status(401).json({ message: 'Credenciales inválidas (archivo no encontrado).' });
      }

      // 3. Buscar usuario por email
      let foundUser = null;
      let foundUsername = null;
      // encontrar el usuario por email 
      for (const username in users) {
          if (users[username].email === email) {
              foundUser = users[username];
              foundUsername = username; // Guardamos el username
              break;
          }
      }

      // 4. Usuario no encontrado
      if (!foundUser) {
          return res.status(401).json({ message: 'Credenciales inválidas (email no encontrado).' });
      }

      // 5. Comparar contraseña usando bcrypt
      const match = await bcrypt.compare(password, foundUser.hashedPassword);

      if (match) {
          // 6. contraseña correcta
          res.status(200).json({
              message: `¡Bienvenido/a, ${foundUsername}!`,
              username: foundUsername, // El cliente necesita esto para localStorage
          });
      } else {
          // 7. contraseña incorrecta
          return res.status(401).json({ message: 'Credenciales inválidas (contraseña incorrecta).' });
      }

  } catch (error) {
      console.error('Error en /api/login:', error);
      res.status(500).json({ message: 'Error interno del servidor durante el inicio de sesión.' });
  }
});

// GUARDAR LAVADO (empezar lavado)
app.post('/guardar-lavado', (req, res) => {
  // 1. recibimos nuestro querido lavado 
  const nuevoLavado = req.body; // datos lavado
  const usuario = nuevoLavado.usuario; // user

  if (!usuario) {
    return res.status(400).send('Falta el nombre del usuario');
  }

  // 2. guardamos el lavado en un json
  const filePath = path.join(__dirname, 'lavados-usuarios.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    let dataUsuarios = {};
    if (!err && data) {
      try {
        dataUsuarios = JSON.parse(data); // parseamos el json
      } catch (e) {
        return res.status(500).send('Error al parsear JSON de lavados-usuarios');
      }
    }

    // si no tiene lavados previos el usar, creamos un array vacío
    if (!dataUsuarios[usuario]) dataUsuarios[usuario] = [];

    // guardamos el lavado nuevo
    dataUsuarios[usuario].unshift(nuevoLavado);

    fs.writeFile(filePath, JSON.stringify(dataUsuarios, null, 2), err => {
      if (err) {
        return res.status(500).send('Error al guardar el lavado');
      }
      res.send('Lavado guardado correctamente');
    });
  });
});

// OBTENER LAVADOS DE LOS USUARIOS (historial)
app.get('/lavados/:usuario', (req, res) => {
  const usuario = req.params.usuario;
  const filePath = path.join(__dirname, 'lavados-usuarios.json');

  // leemos el lavaos-usuarios.json
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err || !data) {
      return res.json([]);
    }
    try {
      const json = JSON.parse(data);
      res.json(json[usuario] || []); // si no tiene lavados, devolvemos un array vacío
    } catch (e) {
      res.status(500).send('Error al parsear lavados');
    }
  });
});


// GUARDAR LAVADOS FAVORITOS
app.post('/guardar-favoritos', async (req, res) => { 
  const { usuario, favoritos } = req.body;

  if (!usuario || !Array.isArray(favoritos)) { // validamos que favoritos sea un array
    return res.status(400).json({ message: 'Falta nombre de usuario o la lista de favoritos es inválida.' });
  }

  try {
    let users = await readUsers(); // leemos usuarios

    // verificamos si el usuario existe
    if (!users[usuario]) {
      return res.status(404).json({ message: 'Usuario no encontrado.' }); // explota
    }

    // actualizamos el array de favoritos de ESE usuario
    users[usuario].favoritos = favoritos;

    // guardamos TODO el objeto users de vuelta en usuarios.json
    await fsPromises.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    res.status(200).json({ message: 'Favoritos guardados correctamente.' }); // Enviar JSON

  } catch (error) {
    res.status(500).json({ message: 'Error interno al guardar favoritos.' });
  }
});

// OBTENER LOS LAVADOS FAVORITOS DE USUARIO
app.get('/api/users/:username/favoritos', async (req, res) => {
    const username = req.params.username;

    try {
        const users = await readUsers(); // leemos usuarios.json

        if (!users[username]) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // devolvemos SOLO el array de favoritos de ese usuario (o vacío si no tiene)
        res.status(200).json(users[username].favoritos || []);

    } catch (error) {
        res.status(500).json({ message: 'Error interno al obtener favoritos.' });
    }
});


// GUARDAR LAVADO PERSONALIZADO POR USER
app.post('/guardar-lavado-personalizado', async (req, res) => {
  const lavadoData = req.body;
  const usuario = lavadoData.usuario; 

  if (!usuario) {
      return res.status(400).json({ message: 'Falta el nombre del usuario.' });
  }

  try {
      let users = await readUsers(); // lee usuarios.json

      if (!users[usuario]) {
          return res.status(404).json({ message: 'Usuario no encontrado.' });
      }

      // verificar que el array personalizados exista
      if (!Array.isArray(users[usuario].personalizados)) {
          users[usuario].personalizados = [];
      }

      // añadimos el lavaodo personalizado al array
      const nuevoIndex = users[usuario].personalizados.length + 1;
      const nuevoLavado = {
          ...lavadoData, // Copia los datos recibidos
          nombre: `Lavado personalizado ${nuevoIndex}`, // nombre
          index: nuevoIndex, // Asigna índice
          fechaGuardado: new Date().toISOString()
      };
      delete nuevoLavado.usuario; // quita el usuario del objeto

      users[usuario].personalizados.unshift(nuevoLavado); // añadimos al principio uwu

      // guardamos TODO el objeto users de vuelta
      await fsPromises.writeFile(USERS_FILE, JSON.stringify(users, null, 2)); // escribimos el json
      res.status(200).json({ message: 'Lavado personalizado guardado correctamente.' }); // bomba

  } catch (error) {
      console.error('❌ Error en /guardar-lavado-personalizado:', error);
      res.status(500).json({ message: 'Error interno al guardar lavado personalizado.' });
  }
});

// OBTENEMOS LAVADOS PERSOALIZADOS POR USER
app.get('/api/users/:username/personalizados', async (req, res) => { // Nueva ruta
  const username = req.params.username;

  try {
      const users = await readUsers();

      if (!users[username]) {
          return res.status(404).json({ message: 'Usuario no encontrado.' });
      }

      // Devolver SOLO el array de personalizados de ese usuario (o vacío)
      res.status(200).json(users[username].personalizados || []);

  } catch (error) {
      console.error(`❌ Error en /api/users/${username}/personalizados:`, error);
      res.status(500).json({ message: 'Error interno al obtener lavados personalizados.' });
  }
});

// OBTENER DATOS USER
app.get('/api/users/:username', async (req, res) => {
  const requestedUsername = req.params.username;

  try {
      const users = await readUsers(); // leer usuarios.json

      if (!users[requestedUsername]) {
          // Usuario no encontrado
          return res.status(404).json({ message: 'Usuario no encontrado.' });
      }

      // usuario encontrado, enviamos datillos
      const publicUserData = {
          username: users[requestedUsername].username,
          email: users[requestedUsername].email, 
          foto: users[requestedUsername].foto
      };

      res.status(200).json(publicUserData); // enviao

  } catch (error) {
      console.error(`❌ Error en /api/users/${requestedUsername}:`, error); // :(
      res.status(500).json({ message: 'Error interno al obtener datos del usuario.' });
  }
});

// ACTUALIZAR PERFIL DE USUARIO
app.put('/api/users/:username', async (req, res) => {
  const oldUsername = req.params.username;
  const { username: newUsername, email, password, foto } = req.body; // nuevos datos

  try {
    const text = await fsPromises.readFile(USERS_FILE, 'utf8');
    const usuarios = JSON.parse(text || '{}');

    // comprobamos si el antiguo username existe 
    if (!usuarios[oldUsername]) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // si cambia de username renombrar la clave!! *IMPORTANTE*
    if (newUsername !== oldUsername) {
      usuarios[newUsername] = usuarios[oldUsername]; // new
      delete usuarios[oldUsername]; // borramos el antiguo
    }

    // actualizamos los campos editados
    const user = usuarios[newUsername];
    user.username = newUsername;
    user.email    = email;

    // hasheamos contraseña
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    user.hashedPassword = await bcrypt.hash(password, salt);

    // fotillo
    if (foto) {
      user.foto = foto;
    }

    // guardamos el json actualizado
    await fsPromises.writeFile(USERS_FILE, JSON.stringify(usuarios, null, 2),'utf8');

    
    return res.json({
      message: 'Perfil actualizado con éxito',
      user: { username: newUsername, email, foto }
    });

  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    return res.status(500).json({ message: 'Error interno al guardar usuario' });
  }
});





// SOCKET.IO CONEXIONES
io.on('connection', (socket) => {

  // Registrar la pantalla del servidor como display principal
  socket.on('registerDisplay', () => {
    serverDisplaySocketId = socket.id;
  });

  // mensajes a otros clientes
  socket.on('mensaje', (data) => {
    socket.broadcast.emit('mensaje', data);
  });

  // Lanzar objeto en juego 3 desde móvil
  socket.on('lanzar', () => {
    socket.broadcast.emit('lanzar');
  });

  // Actualizar posición del carrito al inclinar el móvil
  socket.on('movimientoCarrito', (inclinacion) => {
    socket.broadcast.emit('actualizarPosicionCarrito', inclinacion);
  });

  // Control de juego desde el móvil
  socket.on('juego-empezar', () => {
    socket.broadcast.emit('juego-empezar');
  });

  socket.on('juego-pausar', () => {
    socket.broadcast.emit('juego-pausar');
  });

  socket.on('juego-reiniciar', () => {
    socket.broadcast.emit('juego-reiniciar');
  });

  socket.on('juego-reanudar', () => {
    io.emit('juego-reanudado');
  });

  socket.on('juego-volver', () => {
    socket.broadcast.emit('juego-backtoMenu');
  });

  // Control por voz desde el móvil
  socket.on('voiceControl-start', () => {
    io.emit('voiceControl-start');
  });

  // Control del popup de fin de juego en móvil
  socket.on('juego-finished', () => {
    io.emit('juego-finished');
  });

  // Control para quitar el popup de fin
  socket.on('juego-reiniciado', () => {
    io.emit('juego-reiniciado');
  });

  // Efectos visuales al inclinar el móvil en juegos
  socket.on("expandir-juego1", () => {
    socket.broadcast.emit('expandir-juego1');
  });

  socket.on("expandir-juego2", () => {
    socket.broadcast.emit('expandir-juego2');
  });

  // Solicitud del móvil para cambiar pantalla del display (servidor)
  socket.on('requestDisplayChange', (data) => {
    socket.broadcast.emit('changeDisplay', data);
  });

  // Hover sobre tarjetas de categorías desde el móvil
  socket.on('hoverCategory', (data) => {
    socket.broadcast.emit('highlightCategory', data);
  });

  socket.on('unhoverCategory', (data) => {
    socket.broadcast.emit('unhighlightCategory', data);
  });

  // Actualización de favoritos desde el móvil
  socket.on('favoritesUpdated', (data) => {
    socket.broadcast.emit('refreshFavorites', data);
  });

  // Envío de los datos del lavado actual para mostrar en pantalla del servidor
  socket.on('updateServerDisplay', (washData) => {
    if (serverDisplaySocketId && io.sockets.sockets.get(serverDisplaySocketId)) {
      io.to(serverDisplaySocketId).emit('updateDisplay', washData);
    }
  });

  // Notificación al servidor de que se ha iniciado un lavado
  socket.on('washInitiated', (washInfo) => {
    if (serverDisplaySocketId) {
      io.to(serverDisplaySocketId).emit('showWashStartedPopup', washInfo);
    }
  });

  // Limpiar pantalla del servidor cuando el cliente sale
  socket.on('clearServerDisplay', () => {
    if (serverDisplaySocketId && io.sockets.sockets.get(serverDisplaySocketId)) {
      io.to(serverDisplaySocketId).emit('clearDisplay');
    }
  });

  // Mostrar juego específico en pantalla del servidor
  socket.on('showGameOnServer', (data) => {
    io.emit('loadGameOnDisplay', {
      gameFile: data.gameFile,
      gameName: data.gameName
    });
  });

  // Abrir pantalla de juegos en el display desde el móvil
  socket.on("abrir-juegos", () => {
    socket.broadcast.emit('redirigir-a-juegos');
  });

  // Controles del juego enviados desde el móvil
  socket.on('gameControl', (data) => {
    io.emit('gameAction', data);
  });

  // Cerrar juego desde el móvil
  socket.on('closeGameDisplay', () => {
    io.emit('closeGameDisplay');
  });

  // Actualización en vivo de opciones de lavado personalizado
  socket.on('updatePersonalizadoOption', (payload) => {
    if (serverDisplaySocketId) {
      io.to(serverDisplaySocketId).emit('updatePersonalizadoOption', payload);
    }
  });

  // Notificar guardado de lavado personalizado (para mostrar popup)
  socket.on('personalizadoSaved', () => {
    if (serverDisplaySocketId) {
      io.to(serverDisplaySocketId).emit('personalizadoSaved');
    }
  });

  // Cuando un cliente se desconecta
  socket.on('disconnect', () => {
    // Limpieza si es necesario
  });
});


// CONEXION CON EL SERVIDOR
server.listen(PORT, () => {
  console.log(`Accede a la pantalla del servidor en: https://localhost:${PORT}/`);
  console.log(`Accede a la pantalla del móvil en: https://localhost:${PORT}/mobile`);
});


// MATAR UN PROCESO PARA VOLVER A CORRER EL SERVER
// lsof -i :6969
//COMMAND    PID          USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
//node    ****247897**** alba   23u  IPv6 1742693      0t0  TCP *:6969 (LISTEN)
// kill -9 PID