// Abrir el popup de registro desde login
document.getElementById("abrir-registro").addEventListener("click", function (e) {
    e.preventDefault();
    document.getElementById("popup-login").style.display = "none";
    document.getElementById("popup-register").style.display = "flex";
  });

  // Abrir el popup de login desde registro
  document.getElementById("abrir-login").addEventListener("click", function (e) {
    e.preventDefault();
    document.getElementById("popup-register").style.display = "none";
    document.getElementById("popup-login").style.display = "flex";
  });

  // Cierre por clic fuera (opcional)
  document.getElementById("popup-register").addEventListener("click", function (e) {
    if (e.target.id === "popup-register") {
      document.getElementById("popup-register").style.display = "none";
    }
  });


  document.getElementById("register-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("nameRegister").value.trim();
    const email = document.getElementById("emailRegister").value.trim();
    const password = document.getElementById("passwordRegister").value;

    // Validaciones básicas
    if (!username || !email || !password) {
      alert("Por favor, rellena todos los campos.");
      return;
    }

    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || {};

    // Comprobar si ya hay un usuario con ese email
    for (const key in usuarios) {
      if (usuarios[key].email === email) {
        alert("Ya existe una cuenta con ese correo.");
        return;
      }

      if (usuarios[key].username === username) {
        alert("Ya existe una cuenta con ese username.");
        return;
      }
    }

    // Guardar nuevo usuario
    usuarios[username] = {
      username,
      email,
      password,
      foto: "../../../images/persona_cla.svg", // Por defecto
      favoritos: [],
    };

    localStorage.setItem("usuarios", JSON.stringify(usuarios));

    alert("Registro exitoso. ¡Bienvenido/a, " + username + "!");

    // Cerrar popup y resetear
    document.getElementById("register-form").reset();
    document.getElementById("popup-register").style.display = "none";
  });