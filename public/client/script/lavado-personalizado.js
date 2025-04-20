const socket = io();
const usuarioActual = localStorage.getItem('loggedInUser');

// 1. Cada vez que el usuario elige un nivel de suciedad:
document.querySelectorAll('.suciedad .dropdown-menu input[type=checkbox]')
  .forEach(chk => chk.addEventListener('change', e => {
    if (!e.target.checked) return;
    const valor = e.target.parentElement.textContent.trim();
    console.log(valor);
    socket.emit('updatePersonalizadoOption', { category: 'suciedad', value: valor });
  }));

// 2. Temperatura (rango):
const tempSlider = document.getElementById('temperatura');
tempSlider.addEventListener('input', () => {
  const v = `${tempSlider.value}°C`;

  socket.emit('updatePersonalizadoOption', { category: 'temperatura', value: v });
});

// 3. Centrifugado:
document.querySelectorAll('.centrifugado .dropdown-menu input[type=checkbox]')
  .forEach(chk => chk.addEventListener('change', e => {
    if (!e.target.checked) return;
    socket.emit('updatePersonalizadoOption', {
      category: 'centrifugado',
      value: e.target.parentElement.textContent.trim()
    });
  }));

// 4. Duración:
const durSlider = document.getElementById('duracion');
durSlider.addEventListener('input', () => {
  const v = `${durSlider.value} min`;
  socket.emit('updatePersonalizadoOption', { category: 'duracion', value: v });
});

// 5. Detergente:
const detSlider = document.getElementById('detergente');
detSlider.addEventListener('input', () => {
  const v = `${detSlider.value} ml`;
  socket.emit('updatePersonalizadoOption', { category: 'detergente', value: v });
});

// 6. Tejido:
document.querySelectorAll('.tejido .dropdown-menu input[type=checkbox]')
  .forEach(chk => chk.addEventListener('change', e => {
    if (!e.target.checked) return;
    socket.emit('updatePersonalizadoOption', {
      category: 'tejido',
      value: e.target.parentElement.textContent.trim()
    });
  }));

document.addEventListener("DOMContentLoaded", function () {
    const favButton = document.getElementById("favButton");
    const favKey = "lavadoPersonalizadoFavorito";

    socket.emit('requestDisplayChange', { targetPage: '/display/lavado-personalizado' });

    // Actualizar icono según estado
    function actualizarIconoFavorito(esFavorito) {
        if (esFavorito) {
            favButton.src = "../../../images/cora_relleno.svg";
        } else {
            favButton.src = "../../../images/cora_blanco.svg";
        }
    }


    // Manejar clic en botón de favoritos
    favButton.addEventListener("click", function () {
        if (!usuarioActual) {
            alert("Debes iniciar sesión para guardar favoritos.");
            return;
        }

        if (usuarioActual) {
            const esFavorito = localStorage.getItem(favKey) === "true";
            localStorage.setItem(favKey, !esFavorito);
            actualizarIconoFavorito(!esFavorito);
        }
    
    });




    document.querySelector(".button-save").addEventListener("click", () => {
        const usuario = localStorage.getItem("loggedInUser");
        if (!usuario) return alert("Debes iniciar sesión para guardar el lavado.");
      
        // Validaciones
        const obtenerSeleccionado = (clase) => {
            const checks = [...document.querySelectorAll(`.${clase} .dropdown-menu input[type='checkbox']:checked`)];
            return checks.map(c => c.parentElement.textContent.trim());
          };
          
          const nivelSuciedad = obtenerSeleccionado("suciedad");
          const centrifugado = obtenerSeleccionado("centrifugado");
          const tejido = obtenerSeleccionado("tejido");
          
          const temperatura = document.getElementById("temperatura").value;
          const duracion = document.getElementById("duracion").value;
          const detergente = document.getElementById("detergente").value;
          
        const esFavorito = document.getElementById("favButton").classList.contains("activo");
      
        if (!nivelSuciedad.length || !centrifugado.length || !tejido.length) {
            alert("Por favor selecciona al menos una opción en cada campo.");
            return;
          }
          
          const lavadoPersonalizado = {
            usuario, 
            nivelSuciedad: nivelSuciedad[0],
            temperatura: `${temperatura}°C`,
            centrifugado: centrifugado[0],
            duracion: `${duracion} min`,
            detergente: `${detergente} ml`,
            tejido,
            favorito: esFavorito
          };

      
        // Enviar al backend
        fetch('/guardar-lavado-personalizado', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lavadoPersonalizado)
          })
          .then(res => res.text())
          .then(msg => {
            // primero notificamos al display
            socket.emit('personalizadoSaved');
            setTimeout(() => {
              window.location.href = "/index.html";
            }, 500);
            
          })
          .catch(err => {
            console.error(err);
            alert("Error al guardar el lavado personalizado.");
          });


      });


    const backBtn = document.getElementById("back-button");
    backBtn.addEventListener("click", e => {
      e.preventDefault();                                   // evita efectos colaterales
      socket.emit("requestDisplayChange", { targetPage: "/" }); 
      // Navega a la página principal (ruta absoluta)
      window.location.href = "/index.html";                 // o simplemente "/"
    });

      
});
