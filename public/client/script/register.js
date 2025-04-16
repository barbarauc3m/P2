document.addEventListener('DOMContentLoaded', () => {

    socketRegister = io();
    socketRegister.on('connect', () => console.log('✅ Socket conectado en register.js'));
    socketRegister.on('connect_error', (err) => console.error('❌ Error conexión socket en register.js:', err));

  const registerForm = document.getElementById("register-form");
  const registerPopup = document.getElementById("popup-register");
  const loginPopup = document.getElementById("popup-login"); // Para mostrarlo después

  // abrir/cerrar popups
  const abrirRegistroLink = document.getElementById("abrir-registro");
  const abrirLoginLink = document.getElementById("abrir-login");

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
  if (registerPopup) {
      registerPopup.addEventListener("click", function (e) {
          if (e.target === registerPopup) { // Cierra solo si se hace clic en el fondo
              registerPopup.style.display = "none";

              if (socketRegister && socketRegister.connected) {
                const usuario = localStorage.getItem("loggedInUser"); // Puede ser null
                console.log("Emitiendo requestDisplayChange a '/' al cerrar popup.");
                socketRegister.emit('requestDisplayChange', {
                    targetPage: '/', // <-- Ir a la home del servidor
                    userId: usuario
                });
             }
          }
      });
  }


  // Formulario de Registro
  if (registerForm) {
      registerForm.addEventListener("submit", async function (e) { // Usamos async para await
          e.preventDefault();

          const usernameInput = document.getElementById("nameRegister");
          const emailInput = document.getElementById("emailRegister");
          const passwordInput = document.getElementById("passwordRegister");

          const username = usernameInput.value.trim();
          const email = emailInput.value.trim();
          const password = passwordInput.value; // No hacer trim a la contraseña

          // 1. Validación básica del cliente
          if (!username || !email || !password) {
              alert("Por favor, rellena todos los campos.");
              return;
          }

          // 2. Enviar datos al API del servidor usando fetch
          try {
              console.log('Enviando datos de registro al servidor...');
              const response = await fetch('/api/register', { // Llama a la nueva ruta API
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ // Envía los datos como JSON
                      username: username,
                      email: email,
                      password: password
                  }),
              });

              // 3. Procesar la respuesta del servidor
              const result = await response.json(); // Intenta parsear la respuesta JSON

              if (response.ok) { // Si el status es 2xx (ej: 201 Created)
                  console.log('Registro exitoso:', result.message);
                  alert(result.message || "Registro exitoso."); // Muestra mensaje del servidor

                  // Limpiar formulario y cerrar popup de registro
                  registerForm.reset();
                  if (registerPopup) registerPopup.style.display = "none";

                  // Opcional: Mostrar popup de login automáticamente
                  if (loginPopup) loginPopup.style.display = "flex";

              } else {
                  // Si el status es 4xx o 5xx (ej: 400, 409, 500)
                  console.error('Error en el registro:', result.message);
                  alert(`Error en el registro: ${result.message || response.statusText}`); // Muestra error del servidor
              }

          } catch (error) {
              // Error de red o al parsear JSON
              console.error('Error de red o fetch durante el registro:', error);
              alert('Error de conexión al intentar registrar. Inténtalo más tarde.');
          }
      });
  } else {
      console.warn('Formulario de registro #register-form no encontrado.');
  }
});