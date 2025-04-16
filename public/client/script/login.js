// EN: public/client/script/login.js (O donde esté el listener para #login-form-nuevo)

document.addEventListener('DOMContentLoaded', () => {
  console.log('Login script cargado.');

  // Asegúrate que socket.io se carga ANTES
  if (typeof io === 'undefined') {
      console.error('Login script: io no definido.');
      // return; // Considera si quieres detener todo si socket.io falta
  }
  // Conexión Socket.IO (puede ser necesaria para emitir tras login)
  // Si ya tienes una conexión global en otro script, puedes reutilizarla
  // Si no, crea una aquí:
  const socketLogin = io();
   socketLogin.on('connect', () => console.log('✅ Socket conectado en login.js'));
   socketLogin.on('connect_error', (err) => console.error('❌ Error conexión socket en login.js:', err));


  const loginForm = document.getElementById("login-form-nuevo");
  const loginPopup = document.getElementById("popup-login");
  const registerPopup = document.getElementById("popup-register"); // Para poder cambiar entre popups

   // --- Lógica para abrir/cerrar popups (asegúrate que esté aquí o en otro script global) ---
  const abrirRegistroLink = document.getElementById("abrir-registro");
  const abrirLoginLink = document.getElementById("abrir-login"); // Asumo que existe en el popup de registro

   if (abrirRegistroLink && loginPopup && registerPopup) {
      abrirRegistroLink.addEventListener("click", function (e) {
          e.preventDefault();
          loginPopup.style.display = "none";
          registerPopup.style.display = "flex";
      });
  }
   if (abrirLoginLink && loginPopup && registerPopup) {
       abrirLoginLink.addEventListener("click", function (e) {
          e.preventDefault();
          registerPopup.style.display = "none";
          loginPopup.style.display = "flex";
      });
  }
   if (loginPopup) {
      // Cierre por clic fuera
      loginPopup.addEventListener("click", function (e) {
          // Si se hizo clic directamente en el overlay (fondo)
          if (e.target === loginPopup) {
               loginPopup.style.display = "none";

               if (socketLogin && socketLogin.connected) {
                const usuario = localStorage.getItem("loggedInUser"); // Puede ser null
                console.log("Emitiendo requestDisplayChange a '/' al cerrar popup.");
                socketLogin.emit('requestDisplayChange', {
                    targetPage: '/', // <-- Ir a la home del servidor
                    userId: usuario // Enviar por si acaso
                });
             }
          }
       });
   }
   // --- Fin lógica abrir/cerrar popups ---


  // --- Listener del Formulario de Login ---
  if (loginForm && loginPopup) {
      loginForm.addEventListener("submit", async function (e) { // async para await
          e.preventDefault();

          const emailInput = document.getElementById("emailLoginNuevo");
          const passwordInput = document.getElementById("passwordLoginNuevo");

          const email = emailInput.value.trim();
          const password = passwordInput.value;

          // Validación básica
          if (!email || !password) {
              alert("Por favor, introduce email y contraseña.");
              return;
          }

          // Enviar credenciales al API del servidor
          try {
              console.log(`Enviando login para email: ${email}`);
              const response = await fetch('/api/login', { // Llama a la nueva ruta API
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ email: email, password: password }),
              });

              const result = await response.json(); // Intenta parsear respuesta

              if (response.ok) { // Status 200 OK
                  // --- LOGIN EXITOSO (Respuesta del Servidor) ---
                  console.log('Login exitoso:', result.message);
                  alert(result.message || "Inicio de sesión exitoso.");

                  // 1. Guardar estado en localStorage
                  localStorage.setItem("isLoggedIn", "true");
                  localStorage.setItem("loggedInUser", result.username); // Guarda el username recibido
                  console.log(`Guardado en localStorage: isLoggedIn=true, loggedInUser=${result.username}`);

                  // 2. Ocultar popup y resetear form
                  loginPopup.style.display = "none";
                  loginForm.reset();

                  // 3. Actualizar icono de perfil (si existe en esta página)
                  const perfilButtonImg = document.querySelector("#perfil-boton img");
                  if (perfilButtonImg && result.foto) {
                       perfilButtonImg.src = result.foto; // Usa la foto de la respuesta
                       console.log('Icono de perfil actualizado.');
                  }

                  // 4. Notificar al servidor para que cambie su pantalla a perfil
                  console.log(`⚡ Emitiendo 'requestDisplayChange' para mostrar perfil del servidor.`);
                  socketLogin.emit('requestDisplayChange', {
                      targetPage: '/display/profile',
                      userId: result.username // Envía el username del usuario logueado
                  });

              } else {
                  // --- LOGIN FALLIDO (Respuesta del Servidor) ---
                  console.warn('Login fallido:', result.message);
                  alert(`Error: ${result.message || response.statusText}`); // Muestra el error del servidor
              }

          } catch (error) {
              console.error('Error de red o fetch durante el login:', error);
              alert('Error de conexión al intentar iniciar sesión. Inténtalo más tarde.');
          }
      });
  } else {
       console.warn('Formulario de login #login-form-nuevo o popup #popup-login no encontrado.');
  }


   const perfilButton = document.getElementById('perfil-boton');
   if (perfilButton) {
       perfilButton.addEventListener('click', () => {
           const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
           const loggedInUser = localStorage.getItem("loggedInUser");
           if (isLoggedIn && loggedInUser) {
               socketLogin.emit('requestDisplayChange', { 
                    targetPage: '/display/profile', 
                    userId: loggedInUser 
                });
               window.location.href = 'perfil.html';
           } else {
               socketLogin.emit('requestDisplayChange', { 
                targetPage: '/display/login', 
                userId: null });
               if(loginPopup) loginPopup.style.display = 'flex';
           }
       });
   }
   
});