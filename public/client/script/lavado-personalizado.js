const socket = io(); // conexion al servidor
const usuarioActual = localStorage.getItem('loggedInUser');


// 1. nivel de suciedad
document.querySelectorAll('.suciedad .dropdown-menu input[type=checkbox]')
  .forEach(chk => chk.addEventListener('change', e => {
    if (!e.target.checked) return;
    const valor = e.target.parentElement.textContent.trim();
    console.log(valor);
    socket.emit('updatePersonalizadoOption', { 
      category: 'suciedad', 
      value: valor 
    }); // emite el evento al servidor
  }));

// 2. temperatura
const tempSlider = document.getElementById('temperatura');
tempSlider.addEventListener('input', () => {
  const v = `${tempSlider.value}°C`;

  socket.emit('updatePersonalizadoOption', { 
    category: 'temperatura', 
    value: v 
  }); //emite server
});

// 3. Centrifugado
document.querySelectorAll('.centrifugado .dropdown-menu input[type=checkbox]')
  .forEach(chk => chk.addEventListener('change', e => {
    if (!e.target.checked) return;
    socket.emit('updatePersonalizadoOption', {
      category: 'centrifugado',
      value: e.target.parentElement.textContent.trim()
    });
  }));

// 4. Duración
const durSlider = document.getElementById('duracion');
durSlider.addEventListener('input', () => {
  const v = `${durSlider.value} min`;
  socket.emit('updatePersonalizadoOption', { 
    category: 'duracion', 
    value: v 
  });
});

// 5. Detergente
const detSlider = document.getElementById('detergente');
detSlider.addEventListener('input', () => {
  const v = `${detSlider.value} ml`;
  socket.emit('updatePersonalizadoOption', { 
    category: 'detergente', 
    value: v 
  });
});

// 6. Tejido
document.querySelectorAll('.tejido .dropdown-menu input[type=checkbox]')
  .forEach(chk => chk.addEventListener('change', e => {
    if (!e.target.checked) return;
    socket.emit('updatePersonalizadoOption', {
      category: 'tejido',
      value: e.target.parentElement.textContent.trim()
    });
  }));

document.addEventListener("DOMContentLoaded", function () {
    socket.emit('requestDisplayChange', { targetPage: '/display/lavado-personalizado' });

    document.querySelector(".button-save").addEventListener("click", () => {
        const usuario = localStorage.getItem("loggedInUser");
        if (!usuario) return alert("Debes iniciar sesión para guardar el lavado.");
      
        // Validaciones
        const obtenerSeleccionado = (clase) => {
            const checks = [...document.querySelectorAll(`.${clase} .dropdown-menu input[type='checkbox']:checked`)];
            return checks.map(c => c.parentElement.textContent.trim());
          };
          
          // obtener los valores seleccionados
          const nivelSuciedad = obtenerSeleccionado("suciedad");
          const centrifugado = obtenerSeleccionado("centrifugado");
          const tejido = obtenerSeleccionado("tejido");
          
          const temperatura = document.getElementById("temperatura").value;
          const duracion = document.getElementById("duracion").value;
          const detergente = document.getElementById("detergente").value;
          
      
        if (!nivelSuciedad.length || !centrifugado.length || !tejido.length) {
            alert("Por favor selecciona al menos una opción en cada campo.");
            return;
          }
          
          // guardar el lavado personalizado
          const lavadoPersonalizado = {
            usuario, 
            nivelSuciedad: nivelSuciedad[0],
            temperatura: `${temperatura}°C`,
            centrifugado: centrifugado[0],
            duracion: `${duracion} min`,
            detergente: `${detergente} ml`,
            tejido,
          };

      
        // GUARDAR  
        fetch('/guardar-lavado-personalizado', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lavadoPersonalizado)
          })
          .then(res => res.text())
          .then(msg => {
            socket.emit('personalizadoSaved'); // emite al servidor
            setTimeout(() => {
              window.location.href = "/index.html";
            }, 500); // esperamos para redirigir un pelin
            
          })
          .catch(err => {
            console.error(err);
            alert("Error al guardar el lavado personalizado.");
          });


      });


    const backBtn = document.getElementById("back-button");
    backBtn.addEventListener("click", e => {
      e.preventDefault();  
      socket.emit("requestDisplayChange", { targetPage: "/" });  // pa atras
      window.location.href = "/index.html";                
    });

      
});
