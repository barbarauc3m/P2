document.addEventListener('DOMContentLoaded', () => {

    socketRegister = io();
    socketRegister.on('connect', () => {});

    const registerForm = document.getElementById("register-form");
    const registerPopup = document.getElementById("popup-register");
    const loginPopup = document.getElementById("popup-login"); 

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
          if (e.target === registerPopup) { // cierra solo si se hace clic en el fondo
              registerPopup.style.display = "none";

              if (socketRegister && socketRegister.connected) {
                const usuario = localStorage.getItem("loggedInUser");
                socketRegister.emit('requestDisplayChange', {
                    targetPage: '/', // <-- Ir a la home del servidor
                    userId: usuario
                });
             }
          }
      });
  }


  // FORMIARIO DE REGISTRO
  if (registerForm) {
      registerForm.addEventListener("submit", async function (e) { // usamos async para await
          e.preventDefault();

          const usernameInput = document.getElementById("nameRegister");
          const emailInput = document.getElementById("emailRegister");
          const passwordInput = document.getElementById("passwordRegister");

          const username = usernameInput.value.trim();
          const email = emailInput.value.trim();
          const password = passwordInput.value;

          // validacion basica
          if (!username || !email || !password) {
              alert("Por favor, rellena todos los campos.");
              return;
          }

          // enviar datos al API del servidor usando fetch
          try {
              const response = await fetch('/api/register', { 
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ // evniamso los datos como JSON
                      username: username,
                      email: email,
                      password: password
                  }),
              });

              // respuesta del servidor
              const result = await response.json(); // Intenta parsear la respuesta JSON

              if (response.ok) { // Si el status es 2xx 
                  // console.log('Registro exitoso:', result.message);
                  alert(result.message || "Registro exitoso."); 

                  // limpiar formulario y cerrar popup de registro
                  registerForm.reset();
                  if (registerPopup) registerPopup.style.display = "none";

                  // moostrar popup de login 
                  if (loginPopup) loginPopup.style.display = "flex";

              } else {
                  // Si el status es 4xx o 5xx 
                  console.error('Error en el registro:', result.message);
                  alert(`Error en el registro: ${result.message || response.statusText}`); 
              }

          } catch (error) {
              console.error('Error de red o fetch durante el registro:', error);
              alert('Error de conexión al intentar registrar. Inténtalo más tarde.');
          }
      });
  }
});