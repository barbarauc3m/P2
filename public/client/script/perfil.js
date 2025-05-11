let socketPerfil;

// FUNCION PARA ABRIR EL POPUP DE EDICION DEL PERFIL
function openModal() {
  document.getElementById('profile-modal').classList.add('popup-animado');
  document.getElementById('profile-modal').style.display = 'flex';
}

// FUNCION PARA CERRAR EL POPUP DE EDICION DEL PERFIL
function closeModal() {
  document.getElementById('profile-modal').style.display = 'none';
}


// FUNCION PARA MOSTAR EL PERFIL DEL USUARIO
// rellena los datos del usuario
function mostrarPerfil() {
  const username = localStorage.getItem('loggedInUser');
  if (!username) {
    console.warn('mostrarPerfil: no hay usuario logueado');
    return;
  }

  fetch(`/api/users/${username}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(userData => {
      // FOTO
      document.getElementById('perfil-imagen').src     = userData.foto;
      document.getElementById('profile-edit-foto').src = userData.foto;

      // CAMPOS
      document.getElementById('edit-username').value = userData.username;
      document.getElementById('edit-email').value    = userData.email;

      // CONTRASEÑA
      document.getElementById('edit-password').value = 'userData.password';
    })
    .catch(err => {
      console.error('mostrarPerfil: fallo al cargar perfil', err);
      alert('Error al cargar los datos de tu perfil. Revisa la consola.');
    });
}



// FUNCION PARA PREVISUALIZAR LA FOTO DE PERFIL
function previewImagePerfil(event) {
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('profile-edit-foto').src = reader.result;
  };
  if (event.target.files && event.target.files[0]) {
    reader.readAsDataURL(event.target.files[0]);
  } else {
    document.getElementById('profile-edit-foto').src = '../../images/persona_os.svg';
  }
}

// FUNCION PARA SUBIR UNA FOTO PARA EL PERFIL
function subirFoto(event) {
  event.preventDefault();
  event.stopPropagation();
  document.getElementById('profile-edit-foto-input').click();
}

// FUNCION PARA BORRAR LA IMAGEN DE PERFIL Y PONER LA DEFAULT
function eliminarFotoPerfil() {
  if (!confirm("¿Estás seguro de que quieres eliminar tu foto de perfil?")) return;
  const defaultImg = '../../images/persona_os.svg';
  document.getElementById('profile-edit-foto').src = defaultImg;
  document.getElementById('perfil-imagen').src      = defaultImg;

  const user = localStorage.getItem('loggedInUser');
  if (user) {
    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || {};
    if (usuarios[user]) {
      usuarios[user].foto = defaultImg;
      localStorage.setItem('usuarios', JSON.stringify(usuarios));
    }
  }
}

// FUNCION PARA GUARDAR Y VALIDAR LOS CAMBIOS DEL PERFIL
async function guardarCambiosPerfil() {
  const oldUsername = localStorage.getItem('loggedInUser');
  if (!oldUsername) {
    return alert("Inicia sesión de nuevo para editar tu perfil.");
  }

  // recogemos los valores del formulario
  const newUsername = document.getElementById('edit-username').value.trim();
  const newEmail    = document.getElementById('edit-email').value.trim();
  const newPassword = document.getElementById('edit-password').value;
  const newFoto     = document.getElementById('profile-edit-foto').src;

  // validaciones
  if (!newUsername || !newEmail || !newPassword) {
    return alert("Rellena todos los campos.");
  }
  if (newUsername.length < 3) {
    return alert("El nombre de usuario debe tener al menos 3 caracteres.");
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(newEmail)) {
    return alert("Introduce un email válido.");
  }

  try {
    // llamamos a la API para guardar los cambios
    const res = await fetch(`/api/users/${oldUsername}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: newUsername,
        email:    newEmail,
        password: newPassword,
        foto:     newFoto
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(()=>null);
      throw new Error(err?.message || res.statusText);
    }
    const result = await res.json();

    // actualizamso el localStorage uwu que casi la cago
    if (newUsername !== oldUsername) {
      localStorage.setItem('loggedInUser', newUsername);
    }
    alert("Perfil actualizado con éxito.");

    // nueva fotillo, si hay
    document.getElementById('perfil-imagen').src = newFoto;
    closeModal();
  } catch (err) {
    console.error('guardarCambiosPerfil:', err);
    alert(`Error al guardar tu perfil: ${err.message}`);
  }
}

document.getElementById('profile-form')
  .addEventListener('submit', e => {
    e.preventDefault();
    guardarCambiosPerfil();
  });




document.addEventListener("DOMContentLoaded", () => {
  const usuario = localStorage.getItem("loggedInUser");
  const perfilImg = document.getElementById("perfil-imagen");
  // datillos del usuario
  if (usuario) {
    fetch(`/api/users/${usuario}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(userData => {
        perfilImg.src = userData.foto; // foto
      })
      .catch(err => {
        console.error("Error cargando foto de perfil:", err);
      });
    document.querySelector(".username").textContent = usuario; // username
  }

  // SOCKET
  socketPerfil = io();
  socketPerfil.on('connect',       () => {});
  socketPerfil.on('disconnect',     () => {});

  // dropdown de editar perfil
  const btnDropdown    = document.getElementById("profile-dropdown-btn");
  const menuDropdown   = document.getElementById("profile-dropdown-menu");
  btnDropdown.addEventListener("click", e => {
    e.stopPropagation();
    menuDropdown.style.display = menuDropdown.style.display === "block" ? "none" : "block";
  });
  document.addEventListener("click", () => {
    if (menuDropdown.style.display === "block") {
      menuDropdown.style.display = "none";
    }
  });

  // editar perfil
  document.getElementById("dropdown-edit-profile")
    .addEventListener("click", () => {
      mostrarPerfil();
      openModal();
      menuDropdown.style.display = "none";
    });

  // cerrar sesion
  document.getElementById("dropdown-logout")
    .addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      window.location.href = "/index.html";
    });

  // cerrar popup si se hace click fuera
  document.getElementById("profile-modal")
    .addEventListener("click", e => {
      if (e.target.id === "profile-modal") closeModal();
    });

  // preview de imagen al cambiar input
  document.getElementById("profile-edit-foto-input")
    .addEventListener("change", previewImagePerfil);

  // LAVADOS COMPLETADOS
  fetch(`/lavados/${usuario}`)
    .then(res => res.json())
    .then(lavados => {
      const ultimosTres = lavados.slice(0, 3);
      const contenedor = document.querySelector(".categoria-list");
      contenedor.innerHTML = "";

      ultimosTres.forEach((lavado, index) => {
        const div = document.createElement("div");
        div.classList.add("categoria");
        if (index === 2) div.classList.add("eco");
        div.innerHTML = `
          <img src="${lavado.imagen}" alt="${lavado.nombre}" />
          <div class="info">
            <p><strong>${lavado.nombre || 'No definido'}</strong></p>
            <p>Temperatura: ${lavado.temperatura || 'No definido'}</p>
            <p>Duración: ${lavado.duracion || 'No definido'}</p>
            <p>Centrifugado: ${lavado.centrifugado || 'No definido'}</p>
          </div>
        `;
        contenedor.appendChild(div);
      });

      window.dispatchEvent(new CustomEvent('popupChange'));

      document.querySelector(".completados").textContent = lavados.length;

      const categoriasActualizadas = contenedor.querySelectorAll(".categoria"); 
      // para las transiciones de las categorias
      categoriasActualizadas.forEach((el, idx) => {
        el.addEventListener("mouseenter", () => {
          categoriasActualizadas.forEach((item, j) => {
            item.classList.remove("mover-izquierda", "mover-derecha");
            if (idx === 0 && j > idx) item.classList.add("mover-derecha");
            if (idx === 1 && j > idx) item.classList.add("mover-derecha");
            if (idx === 2 && j < idx) item.classList.add("mover-izquierda");
          });
        });
        el.addEventListener("mouseleave", () => {
          categoriasActualizadas.forEach(item =>
            item.classList.remove("mover-izquierda", "mover-derecha")
          );
        });
      });
    });


   // LAVADOS FAVORITOS
  fetch(`/api/users/${usuario}/favoritos`)
    .then(res => res.json())
    .then(favoritos => {
      document.querySelector(".favoritos").textContent = favoritos.length;
      if (favoritos.length === 0) return;

      const ultimo = favoritos.at(-1);
      if (!ultimo) return;

      document.querySelector(".lavado-box-none").classList.add("none");
      const favBox = document.querySelector(".lavado-box");
      const favDiv = document.createElement("div");
      favDiv.classList.add("lavado-sombra");
      favDiv.innerHTML = `
        <div class="sombra sombra-50"></div>
        <div class="sombra sombra-20"></div>
        <div class="lavado">
          <div class="lavado-header">
            <img src="${ultimo.imagen}" alt="${ultimo.nombre}" class="ult-lavado-icono"/>
            <div class="lavado-text">
              <h3>${ultimo.nombre}</h3><br>
              <p>${ultimo.descripcion}</p>
              <div class="lavado-button">
                <button class="button-lav-emp">Empezar</button>
              </div>
            </div>
          </div>
        </div>
      `;
      favBox.appendChild(favDiv);

      // añadir listener al botón de empezar
      const nuevoBotonEmpezar = favDiv.querySelector('.button-lav-emp');
      if (nuevoBotonEmpezar) {
          nuevoBotonEmpezar.addEventListener('click', () => {
              // console.log(`Click en Empezar para favorito: ${ultimo.nombre}`);

              // Guarda los datos de ESTE lavado favorito para la siguiente página
               const lavadoParaEmpezar = {
                  nombre: ultimo.nombre,
                  descripcion: ultimo.descripcion,
                  temperatura: ultimo.temperatura,
                  duracion: ultimo.duracion,
                  centrifugado: ultimo.centrifugado,
                  detergente: ultimo.detergente || 'N/A', 
                  fechaInicio: new Date().toLocaleString("es-ES", {
                      dateStyle: "short",
                      timeStyle: "short"
                  }),
                  imagen: ultimo.imagen
               };
               localStorage.setItem("lavadoSeleccionado", JSON.stringify(lavadoParaEmpezar));

              if (socketPerfil && socketPerfil.connected) {
                   socketPerfil.emit('requestDisplayChange', {
                       targetPage: '/display/empezar-lavado',
                   });
              }

              // Redirigir a la página para empezar el lavado
              window.location.href = 'empezar-lavado.html';
          });
      } else {
           console.error("No se pudo encontrar el botón .button-lav recién creado.");
      }

      window.dispatchEvent(new CustomEvent('popupChange'));


      // ver mas
      const verMasProgramasBtn = document.getElementById('ver-mas-programas');
      if (verMasProgramasBtn) {
        verMasProgramasBtn.addEventListener('click', event => {
          event.preventDefault();
          if (!usuario) {
            alert("Debes iniciar sesión para ver tus programas.");
            const loginPopup = document.getElementById('popup-login');
            if (loginPopup) loginPopup.style.display = 'flex';
            return;
          }
          socketPerfil.emit('requestDisplayChange', {
            targetPage: '/display/lavados-favs',
            userId: usuario
          });
          window.location.href = 'lavados-favs.html';
        });
      }
    });

  // =========================
  // VER MÁS HISTORIAL
  // =========================
  const verMasHistorialLink = document.getElementById('historial');
  if (verMasHistorialLink) {
    verMasHistorialLink.addEventListener('click', event => {
      event.preventDefault();
      if (!usuario) {
        alert("Debes iniciar sesión para ver el historial completo.");
        return;
      }
      socketPerfil.emit('requestDisplayChange', {
        targetPage: '/display/historial',
        userId: usuario
      });
      window.location.href = 'historial.html';
    });
  }
});

// FUNCION PARA ABRIR LAS VENTANAS DE LOS JUEGOS
function loadJuegos() {

  // console.log("Botón de mando pulsado");
  socketPerfil.emit("abrir-juegos"); 
  window.location.href = 'pantalla-carga.html';
}