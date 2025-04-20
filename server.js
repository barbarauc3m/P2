const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const fsPromises = require('fs').promises;
const bcrypt = require('bcrypt'); // HASHEAMOS CONTRASEÑAS FUEGO
const app = express();
const PORT = 6969;
let serverDisplaySocketId = null;
const USERS_FILE = path.join(__dirname, 'usuarios.json'); // Ruta al archivo de usuarios
const { Server } = require('socket.io');

const SALT_ROUNDS = 10; // Coste del hashing para bcrypt

// --- Middlewares (asegúrate de tener express.json y express.urlencoded) ---
app.use(express.json()); // Para parsear JSON bodies
app.use(express.urlencoded({ extended: true }));

// Carga de certificados
// GENERA CERTIFICADOS CON EL SIGUIENTE COMANDO:
// openssl req -nodes -new -x509 -keyout key.pem -out cert.pem -days 365

const server = https.createServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}, app);

// Inicializa Socket.IO sobre HTTPS
const io = new Server(server);

// USE
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/fonts', express.static(path.join(__dirname, 'fonts')));

app.use('/script', express.static(path.join(__dirname, 'public', 'client', 'script')));

app.use('/styles', express.static(path.join(__dirname, 'public', 'client', 'styles')));

app.use('/client', express.static(path.join(__dirname, 'public', 'client')));

app.use('/server', express.static(path.join(__dirname, 'public', 'server')));


// GET
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/index.html'));
}
);

// Ruta '/mobile' servirá el index del CLIENTE (móvil)
app.get('/mobile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'client', 'index.html'));
});

// LADO CLIENTE
app.get('/index.html', (req, res) => 
  res.redirect('/mobile')); // Redirige a /mobile si se pide explícitamente el index del cliente

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

app.get('/juego1.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/juego1.html'));
});

app.get('/juego2.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/juego2.html'));
});

app.get('/display/categories', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'server', 'categorias-lavados.html'));
});

app.get('/display/lavados-favs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'server', 'lavados-favs.html'));
});

app.get('/display/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/login.html'));
});

app.get('/display/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/register.html'));
});

app.get('/display/empezar-lavado', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'server', 'empezar-lavado.html'));
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
  console.log('🔔 /display/lavado-personalizado pedido');
  res.sendFile(path.join(__dirname, 'public/server/lavado-personalizado.html'));
});




// funciones que nos ayudan
async function readUsers() {
  try {
      const data = await fsPromises.readFile(USERS_FILE, 'utf8');
      // Manejar archivo vacío
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

  // 1. Validación básica del servidor
  if (!username || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
      // 2. Leer usuarios existentes (o crear archivo si no existe)
      let users = {};
      try {
          const data = await fsPromises.readFile(USERS_FILE, 'utf8');
          users = JSON.parse(data);
      } catch (error) {
          if (error.code === 'ENOENT') {
              console.log('Archivo usuarios.json no encontrado, se creará uno nuevo.');
          } else {
              throw error; // Otro tipo de error de lectura sí es problema
          }
      }

      // 3. Comprobar duplicados (username y email)
      if (users[username]) {
          return res.status(409).json({ message: 'El nombre de usuario ya existe.' }); // 409 Conflict
      }
      const emailExists = Object.values(users).some(user => user.email === email);
      if (emailExists) {
          return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
      }

      // 4. Hashear la contraseña
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // 5. Crear nuevo objeto de usuario 
      const newUser = {
          username: username,
          email: email,
          hashedPassword: hashedPassword, // Guardar el hash
          foto: '/images/persona_cla.svg', // Ruta absoluta por defecto
          favoritos: [], // Lista de favoritos inicial
          personalizados: [] // Lista de lavados personalizados inicial};
      };

      // 6. Añadir usuario al objeto
      users[username] = newUser;

      // 7. Escribir el archivo JSON actualizado
      await fsPromises.writeFile(USERS_FILE, JSON.stringify(users, null, 2)); // null, 2 para formatear bonito
      console.log(`Usuario ${username} registrado exitosamente en ${USERS_FILE}`);

      // 8. Enviar respuesta de éxito
      res.status(201).json({ message: `Registro exitoso. ¡Bienvenido/a, ${username}!` }); // 201 Created

  } catch (error) {
      console.error('Error en /api/register:', error);
      res.status(500).json({ message: 'Error interno del servidor durante el registro.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // 1. Validación básica
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
               return res.status(401).json({ message: 'Credenciales inválidas (no hay usuarios).' }); // 401 Unauthorized
          }
          users = JSON.parse(data);
      } catch (error) {
          if (error.code === 'ENOENT') {
              // Si el archivo no existe, nadie puede loguearse
              console.log('Intento de login pero usuarios.json no existe.');
              return res.status(401).json({ message: 'Credenciales inválidas (archivo no encontrado).' });
          } else {
              // Otro error de lectura o parseo
              throw new Error(`Error al leer/parsear usuarios.json: ${error.message}`);
          }
      }

      // 3. Buscar usuario por email
      let foundUser = null;
      let foundUsername = null;
      // Iteramos para encontrar el usuario y su clave (username)
      for (const username in users) {
          if (users[username].email === email) {
              foundUser = users[username];
              foundUsername = username; // Guardamos el username
              break;
          }
      }

      // 4. Usuario no encontrado
      if (!foundUser) {
          console.log(`Intento de login fallido: Email ${email} no encontrado.`);
          return res.status(401).json({ message: 'Credenciales inválidas (email no encontrado).' });
      }

      // 5. Comparar contraseña usando bcrypt
      console.log(`Comparando contraseña para usuario: ${foundUsername}`);
      const match = await bcrypt.compare(password, foundUser.hashedPassword);

      if (match) {
          // 6. ¡Contraseña correcta! Login exitoso
          console.log(`Login exitoso para usuario: ${foundUsername}`);
          // Enviamos una respuesta exitosa incluyendo el username (necesario para el cliente)
          // NO ENVÍES NUNCA EL HASH DE LA CONTRASEÑA
          res.status(200).json({
              message: `¡Bienvenido/a, ${foundUsername}!`,
              username: foundUsername, // El cliente necesita esto para localStorage
              foto: foundUser.foto // Enviar la foto para que el cliente la use
          });
      } else {
          // 7. Contraseña incorrecta
          console.log(`Intento de login fallido: Contraseña incorrecta para ${foundUsername}.`);
          return res.status(401).json({ message: 'Credenciales inválidas (contraseña incorrecta).' });
      }

  } catch (error) {
      console.error('Error en /api/login:', error);
      res.status(500).json({ message: 'Error interno del servidor durante el inicio de sesión.' });
  }
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


// GUARDAR LAVADOS FAVORITOS
app.post('/guardar-favoritos', async (req, res) => { // Convertida a async
  const { usuario, favoritos } = req.body; // 'usuario' es el username

  if (!usuario || !Array.isArray(favoritos)) { // Validar que favoritos sea un array
    return res.status(400).json({ message: 'Falta nombre de usuario o la lista de favoritos es inválida.' });
  }

  try {
    let users = await readUsers(); // Leer usuarios

    // Verificar si el usuario existe
    if (!users[usuario]) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Actualizar el array de favoritos de ESE usuario
    users[usuario].favoritos = favoritos;

    // Guardar TODO el objeto users de vuelta en usuarios.json
    await fsPromises.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    console.log(`✅ Favoritos guardados para ${usuario}`);
    res.status(200).json({ message: 'Favoritos guardados correctamente.' }); // Enviar JSON

  } catch (error) {
    console.error('❌ Error en /guardar-favoritos:', error);
    res.status(500).json({ message: 'Error interno al guardar favoritos.' });
  }
});

// --- Refactorizar OBTENER FAVORITOS ---
// Cambiamos la ruta a una API más específica
app.get('/api/users/:username/favoritos', async (req, res) => { // Nueva ruta
    const username = req.params.username;

    try {
        const users = await readUsers();

        if (!users[username]) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Devolver SOLO el array de favoritos de ese usuario (o vacío si no tiene)
        res.status(200).json(users[username].favoritos || []);

    } catch (error) {
        console.error(`❌ Error en /api/users/${username}/favoritos:`, error);
        res.status(500).json({ message: 'Error interno al obtener favoritos.' });
    }
});


// Ruta para guardar lavado personalizado
app.post('/guardar-lavado-personalizado', async (req, res) => { // Convertida a async
  const lavadoData = req.body;
  const usuario = lavadoData.usuario; // Asumiendo que el cliente envía el 'usuario'

  if (!usuario) {
      return res.status(400).json({ message: 'Falta el nombre del usuario.' });
  }
  // Puedes añadir más validaciones para los campos del lavado si quieres

  try {
      let users = await readUsers();

      if (!users[usuario]) {
          return res.status(404).json({ message: 'Usuario no encontrado.' });
      }

      // Asegurarse de que el array 'personalizados' exista
      if (!Array.isArray(users[usuario].personalizados)) {
          users[usuario].personalizados = [];
      }

      // Lógica para añadir el lavado (similar a la anterior)
      const nuevoIndex = users[usuario].personalizados.length + 1;
      const nuevoLavado = {
          ...lavadoData, // Copia los datos recibidos
          nombre: `Lavado personalizado ${nuevoIndex}`, // Asigna nombre
          index: nuevoIndex, // Asigna índice
          fechaGuardado: new Date().toISOString()
      };
      delete nuevoLavado.usuario; // Quitar el campo usuario del objeto guardado en el array

      users[usuario].personalizados.unshift(nuevoLavado); // Añadir al principio
      users[usuario].personalizados = users[usuario].personalizados.slice(0, 20); // Limitar

      // Guardar TODO el objeto users de vuelta
      await fsPromises.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
      console.log(`✅ Lavado personalizado guardado para ${usuario}`);
      res.status(200).json({ message: 'Lavado personalizado guardado correctamente.' }); // Enviar JSON

  } catch (error) {
      console.error('❌ Error en /guardar-lavado-personalizado:', error);
      res.status(500).json({ message: 'Error interno al guardar lavado personalizado.' });
  }
});

app.get('/api/users/:username', async (req, res) => {
  const requestedUsername = req.params.username;
  console.log(`API: Solicitud de datos para usuario: ${requestedUsername}`);

  try {
      const users = await readUsers(); // Usa tu función helper para leer usuarios.json

      if (!users[requestedUsername]) {
          // Usuario no encontrado
          return res.status(404).json({ message: 'Usuario no encontrado.' });
      }

      // Usuario encontrado, preparar datos públicos para enviar
      const publicUserData = {
          username: users[requestedUsername].username,
          email: users[requestedUsername].email, // Decide si quieres enviar el email
          foto: users[requestedUsername].foto
          // NUNCA incluyas hashedPassword aquí
      };

      res.status(200).json(publicUserData); // Enviar datos públicos

  } catch (error) {
      console.error(`❌ Error en /api/users/${requestedUsername}:`, error);
      res.status(500).json({ message: 'Error interno al obtener datos del usuario.' });
  }
});

// PUT /api/users/:username
// PUT /api/users/:username
app.put('/api/users/:username', async (req, res) => {
  const oldUsername = req.params.username;
  const { username: newUsername, email, password, foto } = req.body;

  try {
    // 1) Leer el fichero con promesas
    const text = await fsPromises.readFile(USERS_FILE, 'utf8');
    const usuarios = JSON.parse(text || '{}');

    // 2) Comprobar existencia
    if (!usuarios[oldUsername]) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // 3) Si cambia de username, renombrar la clave
    if (newUsername !== oldUsername) {
      usuarios[newUsername] = usuarios[oldUsername];
      delete usuarios[oldUsername];
    }

    // 4) Actualizar campos
    const user = usuarios[newUsername];
    user.username = newUsername;
    user.email    = email;

    // Hashear contraseña
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    user.hashedPassword = await bcrypt.hash(password, salt);

    if (foto) {
      user.foto = foto;
    }

    // 5) Escribir de vuelta en disco con promesas
    await fsPromises.writeFile(
      USERS_FILE,
      JSON.stringify(usuarios, null, 2),
      'utf8'
    );

    // 6) Responder al cliente (no enviamos hashedPassword)
    return res.json({
      message: 'Perfil actualizado con éxito',
      user: { username: newUsername, email, foto }
    });

  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    return res.status(500).json({ message: 'Error interno al guardar usuario' });
  }
});

// --- Refactorizar OBTENER LAVADOS PERSONALIZADOS ---
// Cambiamos la ruta
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




// CONEXIONES SOCKET.IO
io.on('connection', (socket) => {
  console.log('Usuario conectado');

  socket.on('registerDisplay', () => {
    serverDisplaySocketId = socket.id;
    console.log('📺 Server‑Display registrado con ID:', serverDisplaySocketId);
  });
  
  


  /*
  socket.onAny((event, ...args) => {
    console.log(`📥 Evento recibido: ${event}`, args);
});*/


  socket.on('mensaje', (data) => {
    console.log('Mensaje recibido:', data);
    socket.broadcast.emit('mensaje', data);
  });

  socket.on('lanzar', () => {  // Juego 3
    console.log('[SERVER.JS] Movimiento recibido desde móvil');
    socket.broadcast.emit('lanzar'); // Reenvía a todos menos al móvil
  }); 

  socket.on('movimientoCarrito', (inclinacion) => {
    // Reenvía la inclinación a todos los clientes (excepto al emisor)
    socket.broadcast.emit('actualizarPosicionCarrito', inclinacion);
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });

  socket.on('juego1-empezar', () => {  // Llega solicitud desde el móvil
    console.log('[SERVER.JS] Empieza el juego 1');
    socket.broadcast.emit('juego1-empezar'); // Reenvía a todos menos al móvil
  });

  socket.on('juego1-pausar', () => {  // Llega solicitud desde el móvil
    console.log('[SERVER.JS]📱 Pausa recibida desde móvil');
    socket.broadcast.emit('juego1-pausar'); // Reenvía a todos menos al móvil
  }); 

  socket.on('juego1-reiniciar', () => {  // Llega solicitud desde el móvil
    console.log('[SERVER.JS]📱 Petición reinicio recibida desde móvil');
    socket.broadcast.emit('juego1-reiniciar'); // Reenvía a todos menos al móvil
  }); 

  socket.on('juego1-reanudar', () => {
    console.log("📱 Juego 1 reanudado desde servidor");
    io.emit('juego1-reanudado');
  });

  socket.on('juego2-empezar', () => {  // Llega solicitud desde el móvil
    console.log('[SERVER.JS] Empieza el juego 3');
    socket.broadcast.emit('juego2-empezar'); // Reenvía a todos menos al móvil
  }); 

  socket.on('juego2-pausar', () => {  // Llega solicitud desde el móvil
    console.log('[SERVER.JS]📱 Pausa recibida desde móvil');
    socket.broadcast.emit('juego2-pausar'); // Reenvía a todos menos al móvil
  }); 

  socket.on('juego2-reiniciar', () => {  // Llega solicitud desde el móvil
    console.log('[SERVER.JS]📱 Petición reinicio recibida desde móvil');
    socket.broadcast.emit('juego2-reiniciar'); // Reenvía a todos menos al móvil
  }); 

  socket.on('juego2-reanudar', () => {
    console.log("📱 Juego 2 reanudado desde servidor");
    io.emit('juego2-reanudado');
  });

  socket.on('juego2-volver', () => {
    console.log("Recibido 'volver'");
    //io.emit('moverCienteAlMenu');
    socket.broadcast.emit('juego2-backtoMenu');
  });

  socket.on('voiceControl-start', () => {
    console.log("voiceControl-start recibido por el servidor. Lo reenvía al cliente");
    io.emit('voiceControl-start');
  });
/*
  socket.on('moverClienteAlMenu', () => {  
    console.log('[SERVER.JS]📱 Señal mandada al móvil para ir al menú');
    io.emit('moverCienteAlMenu'); 
  }); */

  // Para animar los juegos si inclinas el móvil a un lado o a otro
  socket.on("expandir-juego1", () => {  
    console.log("Server: Expandir juego1 recibido");
    socket.broadcast.emit('expandir-juego1'); 
  });
  socket.on("expandir-juego2", () => {  
    console.log("Server: Expandir juego2 recibido");
    socket.broadcast.emit('expandir-juego2'); 
  });

  // NUEVO: Escuchar solicitud para cambiar la pantalla del servidor
  socket.on('requestDisplayChange', (data) => {
    console.log(`📱 Recibida petición de ${socket.id} para cambiar display a: ${data.targetPage}`);
    // Reenviar solo a los otros clientes (asumiendo que son las pantallas del servidor)
    socket.broadcast.emit('changeDisplay', data);
    console.log(`🖥️ Emitiendo 'changeDisplay' a otros clientes.`);
  });

  // NUEVO: Escuchar evento de hover desde el móvil
  socket.on('hoverCategory', (data) => {
    console.log(`📱 Hover en categoría ${data.categoryId} desde ${socket.id}`);
    // Reenviar a los otros clientes (pantallas del servidor)
    socket.broadcast.emit('highlightCategory', data);
  });

  // NUEVO: Escuchar evento de fin de hover desde el móvil
  socket.on('unhoverCategory', (data) => {
    console.log(`📱 Unhover en categoría ${data.categoryId} desde ${socket.id}`);
    // Reenviar a los otros clientes (pantallas del servidor)
    socket.broadcast.emit('unhighlightCategory', data);
  });

  socket.on('favoritesUpdated', (data) => {
    console.log(`❤️ Favoritos actualizados para usuario: ${data.userId} (Notificado por: ${socket.id})`);
    // Retransmitir a los otros clientes (pantallas servidor) para que refresquen
    socket.broadcast.emit('refreshFavorites', data); // Reenvía la misma data
    console.log(`🖥️ Emitiendo 'refreshFavorites' a otros clientes.`);
  });

  socket.on('updateServerDisplay', (washData) => { // Recibe datos actualizados del cliente
    console.log(`⚡ Cliente ${socket.id} enviando actualización de lavado a display: ${washData?.nombre}`);
     if (serverDisplaySocketId && io.sockets.sockets.get(serverDisplaySocketId)) {
         io.to(serverDisplaySocketId).emit('updateDisplay', washData); // Envía datos a la pantalla del servidor
     } else {
         console.warn("Server Display no conectado (para datos), no se pudo enviar datos de lavado.");
     }
  });

  socket.on('washInitiated', (washInfo) => {
    if (serverDisplaySocketId) {
      io.to(serverDisplaySocketId).emit('showWashStartedPopup', washInfo);
    }
  });
  
  

  socket.on('clearServerDisplay', () => { // Recibe señal de cliente saliendo
    console.log(`⚡ Cliente ${socket.id} señalando limpiar display.`);
     if (serverDisplaySocketId && io.sockets.sockets.get(serverDisplaySocketId)) {
         io.to(serverDisplaySocketId).emit('clearDisplay'); // Envía señal para limpiar contenido/volver
     } else {
         console.warn("Server Display no conectado (para datos), no se pudo enviar señal de limpiar.");
     }
  });


  
  // Manejar la visualización del juego en el servidor
  socket.on('showGameOnServer', (data) => {
    console.log(`🖥️ Recibido juego para mostrar: ${data.gameName}`);
    
    // Enviar a TODAS las pantallas del servidor (incluyendo la que lo envió si es necesario)
    io.emit('loadGameOnDisplay', {
        gameFile: data.gameFile,
        gameName: data.gameName
    });
  });

  // Manejar la solicitud de abrir la pantalla de juegos
  socket.on("abrir-juegos", () => {
    console.log("Se pidió abrir la pantalla de juegos");
    socket.broadcast.emit('redirigir-a-juegos');
  });

  // Manejar controles del juego
  socket.on('gameControl', (data) => {
    console.log(`🎮 Control recibido: ${data.action} para ${data.game}`);
    // Reenviar a todas las pantallas del servidor
    io.emit('gameAction', data);
  });

  socket.on('closeGameDisplay', () => {
    console.log('📱 Recibida petición para cerrar juego');
    io.emit('closeGameDisplay');  // Envía a todas las pantallas del servidor
  });

  // reenviamos cada cambio de opción al display
  socket.on('updatePersonalizadoOption', payload => {
    if (serverDisplaySocketId) {
      io.to(serverDisplaySocketId).emit('updatePersonalizadoOption', payload);
    }
  });

// reenviamos el “guardado” para que aparezca el popup
  socket.on('personalizadoSaved', () => {
    if (serverDisplaySocketId) {
      io.to(serverDisplaySocketId).emit('personalizadoSaved');
    }
  });
});


server.listen(PORT, () => {
  console.log(`Servidor HTTPS con Socket.IO en https://localhost:${PORT}`);
  console.log(`Accede a la pantalla del servidor en: https://localhost:${PORT}/`);
  console.log(`Accede a la pantalla del móvil en: https://localhost:${PORT}/mobile`);
  // Se puede añadir: console.log(`Pantalla servidor (categorías): https://localhost:${PORT}/display/categories`);
});


// MATAR UN PROCESO PARA VOLVER A CORRER EL SERVER
// lsof -i :6969
//COMMAND    PID          USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
//node    ****247897**** alba   23u  IPv6 1742693      0t0  TCP *:6969 (LISTEN)
// kill -9 PID