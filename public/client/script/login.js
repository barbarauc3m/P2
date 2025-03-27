// Mostrar el popup si no ha iniciado sesión
document.getElementById("perfil-icono").addEventListener("click", () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn === "true") {
      window.location.href = "perfil.html";
    } else {
      document.getElementById("popup-login").style.display = "flex";
    }
  });

  // cerrar con clic fuera del popup
  document.getElementById("popup-login").addEventListener("click", function (e) {
    if (e.target.id === "popup-login") {
      document.getElementById("popup-login").style.display = "none";
    }
  });

  
  document.getElementById("login-form-nuevo").addEventListener("submit", function (e) {
    e.preventDefault();

    const emailInput = document.getElementById("emailLoginNuevo").value;
    const passwordInput = document.getElementById("passwordLoginNuevo").value;

    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || {};
    let usuarioEncontrado = null;

    for (const username in usuarios) {
      const usuario = usuarios[username];
      if (usuario.email === emailInput) {
        usuarioEncontrado = usuario;
        break;
      }
    }

    if (!usuarioEncontrado) {
      alert("No se encontró ningún usuario con ese email. Regístrate primero.");
      return;
    }

    if (usuarioEncontrado.password !== passwordInput) {
      alert("Contraseña incorrecta.");
      return;
    }

    alert("Inicio de sesión exitoso. ¡Bienvenido/a, " + usuarioEncontrado.username + "!");
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("loggedInUser", usuarioEncontrado.username);

    // Ocultar popup y resetear formulario
    document.getElementById("popup-login").style.display = "none";
    document.getElementById("login-form-nuevo").reset();

    // Cambiar imagen de perfil si hay foto personalizada
    const perfilIcono = document.getElementById("perfil-icono");
    if (usuarioEncontrado.foto) {
      perfilIcono.src = usuarioEncontrado.foto;
    }
  });