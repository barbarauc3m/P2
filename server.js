const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const fsPromises = require('fs').promises;
const bcrypt = require('bcrypt'); // HASHEAMOS CONTRASEÑAS FUEGO
const app = express();
const PORT = 6969;
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

app.get('/juego3.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/juego3.html'));
});

// LADO SERVIDOR
app.get('/juego1.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/juego1.html'));
});

app.get('/juego2.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/juego2.html'));
});

app.get('/juego3-inicio.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/juego3-inicio.html'));
});

app.get('/juego3.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/juego3.html'));
});

app.get('/juego4.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/juego4.html'));
});

app.get('/display/categories', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'server', 'categorias-lavados.html'));
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

app.get('/display/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/perfil.html'));
});

app.get('/display/lavados-favs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/server/lavados-favs.html'));
});


// CONEXIONES SOCKET.IO
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

  // CÓDIGO PARA QUE VAYA LA CONEXION DE JUEGOS
  socket.on('gameSelected', (data) => {
    console.log(`🎮 Juego seleccionado desde móvil: ${data.gameName}`);
    // Reenvía a todas las pantallas del servidor
    io.emit('showGameOnServer', {
        gameFile: data.gameFile,
        gameName: data.gameName
    });
  });
});


server.listen(PORT, () => {
  console.log(`Servidor HTTPS con Socket.IO en https://localhost:${PORT}`);
  console.log(`Accede a la pantalla del servidor en: https://localhost:${PORT}/`);
  console.log(`Accede a la pantalla del móvil en: https://localhost:${PORT}/mobile`);
  // Puedes añadir: console.log(`Pantalla servidor (categorías): https://localhost:${PORT}/display/categories`);
});


// MATAR UN PROCESO PARA VOLVER A CORRER EL SERVER
// lsof -i :6969
//COMMAND    PID          USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
//node    ****247897**** alba   23u  IPv6 1742693      0t0  TCP *:6969 (LISTEN)
// kill -9 PID