document.addEventListener('DOMContentLoaded', () => {

  const socketLogin = io(); // conexión al servidor
   socketLogin.on('connect', () => {});

  const loginForm = document.getElementById("login-form-nuevo");
  const loginPopup = document.getElementById("popup-login");
  const registerPopup = document.getElementById("popup-register"); 

   // logica abrir/cerrar popups
  const abrirRegistroLink = document.getElementById("abrir-registro");
  const abrirLoginLink = document.getElementById("abrir-login"); 

   if (abrirRegistroLink && loginPopup && registerPopup) {
      abrirRegistroLink.addEventListener("click", function (e) {
          e.preventDefault();
          loginPopup.style.display = "none";
          registerPopup.style.display = "flex";
          window.dispatchEvent(new CustomEvent('popupChange'));
          
      });
  }
   if (abrirLoginLink && loginPopup && registerPopup) {
       abrirLoginLink.addEventListener("click", function (e) {
          e.preventDefault();
          registerPopup.style.display = "none";
          loginPopup.style.display = "flex";
          window.dispatchEvent(new CustomEvent('popupChange'));
      });
  }
   if (loginPopup) {
      loginPopup.addEventListener("click", function (e) {
          if (e.target === loginPopup) {
               loginPopup.style.display = "none";
               window.dispatchEvent(new CustomEvent('popupChange'));

               if (socketLogin && socketLogin.connected) {
                const usuario = localStorage.getItem("loggedInUser"); 
                socketLogin.emit('requestDisplayChange', { // emito el evento al servidor
                    targetPage: '/', 
                    userId: usuario 
                });
             }
          }
       });
   }



  // FORMULARIO LOGIN
  if (loginForm && loginPopup) {
      loginForm.addEventListener("submit", async function (e) { // async para await
          e.preventDefault();

          const emailInput = document.getElementById("emailLoginNuevo");
          const passwordInput = document.getElementById("passwordLoginNuevo");

          const email = emailInput.value.trim();
          const password = passwordInput.value;

          // validacion básica
          if (!email || !password) {
              alert("Por favor, introduce email y contraseña.");
              return;
          }

          try {
              const response = await fetch('/api/login', { // llamamos a la ruta API
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ email: email, password: password }),
              });

              const result = await response.json(); // parsear respuesta

              if (response.ok) { // Status 200 OK
                  // LOGIN EXITOSO
                  console.log('Login exitoso:', result.message);
                  alert(result.message || "Inicio de sesión exitoso.");

                  // guardar loggedInUser en localStorage
                  localStorage.setItem("isLoggedIn", "true");
                  localStorage.setItem("loggedInUser", result.username); 
                  // console.log(`Guardado en localStorage: isLoggedIn=true, loggedInUser=${result.username}`);

                  // ocultar popup y resetear form
                  loginPopup.style.display = "none";
                  window.dispatchEvent(new CustomEvent('popupChange'));
                  loginForm.reset();

                  socketLogin.emit('requestDisplayChange', {
                      targetPage: '/display/profile',
                      userId: result.username 
                  });

              } else {
                  // LOGIN FALLIDO
                  console.warn('Login fallido:', result.message);
                  alert(`Error: ${result.message || response.statusText}`); 
              }

          } catch (error) {
              console.error('Error de red o fetch durante el login:', error);
              alert('Error de conexión al intentar iniciar sesión. Inténtalo más tarde.');
          }
      });
  } else {
       console.warn('Formulario de login #login-form-nuevo o popup #popup-login no encontrado.');
  }


    // BOTON LOGIN EN EL NAV
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
               if(loginPopup) {
                loginPopup.style.display = 'flex';
                window.dispatchEvent(new CustomEvent('popupChange'));
               }
           }
       });
   }
   
});