// =========================
// FUNCIONES GLOBALES DE PERFIL
// =========================

// Abre el modal de edición
function openModal() {
  document.getElementById('profile-modal').classList.add('popup-animado');
  document.getElementById('profile-modal').style.display = 'flex';
}
function closeModal() {
  document.getElementById('profile-modal').style.display = 'none';
}


// Rellena el formulario del modal con los datos del usuario
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

      // CONTRASEÑA (no la rellenas; sólo dejas el placeholder)
      document.getElementById('edit-password').value = 'userData.password';
    })
    .catch(err => {
      console.error('mostrarPerfil: fallo al cargar perfil', err);
      alert('Error al cargar los datos de tu perfil. Revisa la consola.');
    });
}



// Previsualiza la imagen seleccionada en el input
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

// Dispara el selector de archivo
function subirFoto(event) {
  event.preventDefault();
  event.stopPropagation();
  document.getElementById('profile-edit-foto-input').click();
}

// Elimina la foto y actualiza localStorage
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

// Valida y guarda cambios en localStorage
async function guardarCambiosPerfil() {
  const oldUsername = localStorage.getItem('loggedInUser');
  if (!oldUsername) {
    return alert("Inicia sesión de nuevo para editar tu perfil.");
  }

  // Recoge valores del formulario
  const newUsername = document.getElementById('edit-username').value.trim();
  const newEmail    = document.getElementById('edit-email').value.trim();
  const newPassword = document.getElementById('edit-password').value;
  const newFoto     = document.getElementById('profile-edit-foto').src;

  // Validaciones idénticas a las tuyas
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
    // Llamada a tu API REST
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

    // Éxito: actualiza localStorage si cambió el username
    if (newUsername !== oldUsername) {
      localStorage.setItem('loggedInUser', newUsername);
    }
    alert("Perfil actualizado con éxito.");

    // Refresca el avatar en la página
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




// =========================
// LÓGICA PRINCIPAL AL CARGAR DOM
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const usuario = localStorage.getItem("loggedInUser");
  const perfilImg = document.getElementById("perfil-imagen");
  if (usuario) {
    fetch(`/api/users/${usuario}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(userData => {
        // Pintamos su foto en el avatar principal:
        perfilImg.src = userData.foto;
      })
      .catch(err => {
        console.error("Error cargando foto de perfil:", err);
        // dejamos la imagen por defecto si falla
      });
    // también ponemos el nombre junto al avatar
    document.querySelector(".username").textContent = usuario;
  }

  // — Socket de navegación
  const socketPerfil = io();
  socketPerfil.on('connect',       () => console.log('📱✅ Socket conectado en perfil.js'));
  socketPerfil.on('connect_error', err => console.error('📱❌ Error socket en perfil.js:', err));
  socketPerfil.on('disconnect',     () => console.log('📱 Socket desconectado'));

  // — Dropdown de perfil
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

  // — Opciones del dropdown
  document.getElementById("dropdown-edit-profile")
    .addEventListener("click", () => {
      mostrarPerfil();
      openModal();
      menuDropdown.style.display = "none";
    });
  document.getElementById("dropdown-logout")
    .addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      window.location.href = "/index.html";
    });

  // — Control del modal
  document.getElementById("profile-modal")
    .addEventListener("click", e => {
      if (e.target.id === "profile-modal") closeModal();
    });

  // — Preview de imagen al cambiar input
  document.getElementById("profile-edit-foto-input")
    .addEventListener("change", previewImagePerfil);

  // =========================
  // LAVADOS COMPLETADOS
  // =========================
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

      document.querySelector(".completados").textContent = lavados.length;

      const categorias = document.querySelectorAll(".categoria");
      categorias.forEach((el, idx) => {
        el.addEventListener("mouseenter", () => {
          categorias.forEach((item, j) => {
            item.classList.remove("mover-izquierda", "mover-derecha");
            if (idx === 0 && j > idx) item.classList.add("mover-derecha");
            if (idx === 1 && j > idx) item.classList.add("mover-derecha");
            if (idx === 2 && j < idx) item.classList.add("mover-izquierda");
          });
        });
        el.addEventListener("mouseleave", () => {
          categorias.forEach(item =>
            item.classList.remove("mover-izquierda", "mover-derecha")
          );
        });
      });
    });

  // =========================
  // LAVADOS FAVORITOS
  // =========================
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
                <button class="button-lav">Empezar</button>
              </div>
            </div>
          </div>
        </div>
      `;
      favBox.appendChild(favDiv);

      // "Ver más programas"
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
