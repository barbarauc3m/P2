
(() => {
  const socket = io();

  // Registrar display al conectarse
  socket.on('connect', () => {
    socket.emit('registerDisplay');
  });

  // Al recibir petición de cambio de pantalla, si es la de empezar-lavado, limpiamos
  socket.on('changeDisplay', (data) => {
    // Aceptamos cualquier ruta que contenga "empezar-lavado.html"
    if (data.targetPage && data.targetPage.includes('empezar-lavado.html')) {
      console.log('🖥️ Mostrando pantalla Empezar Lavado:', data.targetPage);
      clearDisplay();
    }
    else if (data.targetPage === '/') {
        // recarga o redirige la pantalla servidor al home
        window.location.href = '/'; // o la ruta que sirva tu home
      }
  });

  // Recibe datos actualizados del lavado seleccionado
  socket.on('updateDisplay', (washData) => {
    console.log('⚡ Actualizando display con datos de lavado:', washData);
    displayWashDetails(washData);
    displayEscaneos(washData.prendasEscaneadas || []);
  });

  // Muestra popup cuando el lavado inicia
  socket.on('showWashStartedPopup', (washInfo) => {
    showWashStartedPopup(washInfo);
  });

  // Función para renderizar detalles del lavado
  function displayWashDetails(wash) {
    document.getElementById('titulo').style.display = 'none';
    
    const area = document.getElementById('configuracion');
    area.innerHTML = `
    <div class="card-lavado">
      <h2>${wash.nombre}</h2>
      <p>${wash.descripcion}</p>
      <div class="detalles">
        <div class="detalles-imagen">
            <img src="${wash.imagen}" alt="Imagen lavado" class="wash-image"/>
        </div>
        <div class="detalles-lavado">
            <p><strong>Temperatura:</strong> ${wash.temperatura}</p>
            <p><strong>Duración:</strong> ${wash.duracion}</p>
            <p><strong>Centrifugado:</strong> ${wash.centrifugado}</p>
            <p><strong>Detergente:</strong> ${wash.detergente}</p>
            <p><strong>Inicio:</strong> ${wash.fechaInicio}</p>
        </div>
        </div>
      </div>
    `;
  }

  // Función para mostrar las prendas escaneadas
function displayEscaneos(prendas) {
    const escaneosArea = document.getElementById('escaneos');
    escaneosArea.innerHTML = '';

    if (prendas.length === 0) {
        escaneosArea.innerHTML = '<p>No se han escaneado prendas todavía.</p>';
        return;
    }

    prendas.forEach((prenda) => {
        const card = document.createElement('div');
        card.classList.add('escaneo-card');

        function getSymbolName(str) {
            return str.split(' ')[0]; // quita la probabilidad
          }
          
          if (prenda.scanType === 'etiqueta') {
            const { scanData: info, id } = prenda;
            const itemsHtml = Object.entries(info).map(([key, raw]) => {
              const sym = getSymbolName(raw);
              let display;
              if (key === 'Temperatura') {
                // de "lavado_30" → "30º"
                const num = sym.split('_')[1];
                display = `${num}º`;
              } else if (key === 'Delicadeza') {
                // mapeo explícito
                if (sym === 'lavado_normal')        display = 'normal';
                else if (sym === 'lavado_delicado') display = 'delicado';
                else if (sym === 'lavado_muy_delicado') display = 'muy delicado';
                else if (sym === 'lavado_a_mano')   display = 'lavado a mano';
                else                                  display = sym;
              } else if (key === 'Lejía' || key === 'Lejia') {
                // "lejia_si"/"lejia_no" → "Sí"/"No"
                display = sym === 'lejia_si' ? 'Sí' : 'No';
              } else {
                // Por si hay otros símbolos
                display = sym;
              }
              return `<li>${key}: ${display}</li>`;
            }).join('');
          
            card.innerHTML = `
              <h3>${id} – Etiqueta</h3>
              <ul>${itemsHtml}</ul>
            `;
          }
          else if (prenda.scanType === 'color') {
            const color = prenda.scanData;
            card.innerHTML = `
                <h3>${prenda.id} - Color</h3>
                <div class="color-sample" style="background-color:${color.hex};"></div>
                <p><strong>Hex:</strong> ${color.hex}</p>
                <p><strong>Tono:</strong> ${color.tone}</p>
            `;
        } else {
            card.innerHTML = `<h3>Prenda ${prenda.id}</h3><p>Tipo de escaneo desconocido.</p>`;
        }

        escaneosArea.appendChild(card);
    });
}


  // Muestra popup de inicio de lavado
  function showWashStartedPopup(info) {
  const popup = document.getElementById("wash-started-popup");
  document.getElementById("started-wash-name").textContent = info.nombre;
  popup.style.display = "flex";           
  setTimeout(() => {
    popup.style.display = "none";
     // Al cerrar el popup, redirigimos al inicio
    window.location.href = "/";
    }, 3000);}


  // Limpia detalles y prendas
  function clearDisplay() {
    document.getElementById('configuracion').innerHTML = '';
    document.getElementById('escaneos').innerHTML = '';
    document.getElementById('wash-started-popup').style.display = 'none';
  }



window.addEventListener('load', () => {
    const lavado = JSON.parse(localStorage.getItem('lavadoSeleccionado'));
    if (lavado) {
      displayWashDetails(lavado);
      displayEscaneos(lavado.prendasEscaneadas || []);
    }
  });


  window.addEventListener('storage', (e) => {
    if (e.key === 'lavadoSeleccionado') {
      const lavado = JSON.parse(e.newValue);
      displayWashDetails(lavado);
      displayEscaneos(lavado.prendasEscaneadas || []);
    }
  });

    window.addEventListener("storage", (e) => {
    if (e.key === "lavadoIniciado" && e.newValue) {
      const info = JSON.parse(e.newValue);
      showWashStartedPopup(info);
      localStorage.removeItem("lavadoIniciado");
    }
  });
  
})();


  