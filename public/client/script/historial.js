document.addEventListener("DOMContentLoaded", () => {
    const usuario = localStorage.getItem("loggedInUser");
    if (!usuario) return;
  
    const contenedor = document.getElementById("historial-container");
  
     // --- Conexión Socket.IO (Necesaria para emitir hover) ---
     if (typeof io === 'undefined') {
      console.error('Historial script: io no definido.');
      // return; // Opcional: detener si no hay socket
    }
    const socketHistorial = io(); // Conexión específica para esta página
    socketHistorial.on('connect', () => console.log('📱✅ Historial Client Conectado:', socketHistorial.id));
    socketHistorial.on('connect_error', (err) => console.error('📱❌ Error conexión socket en historial.js:', err));



    Promise.all([
      fetch(`/lavados/${usuario}`).then(res => res.json()),
      fetch(`/api/users/${usuario}/favoritos`).then(res => res.json())
    ]).then(([lavados, favoritos]) => {
  
      lavados.forEach(lavado => {
        const fechaInicio = parseFecha(lavado.fechaInicio);
        const fechaStr = fechaBonita(fechaInicio);
        const horaInicio = formatHora(fechaInicio);
        const horaFin = calcularHoraFin(fechaInicio, lavado.duracion);
  
        const isFavorito = favoritos.some(fav => fav.nombre === lavado.nombre);
  
        const uniqueId = sanitizeId(`${lavado.nombre}-${lavado.fechaInicio || index}`);

        const section = document.createElement("section");
        section.classList.add("lavado");
  
        section.innerHTML = `
          <h2>${fechaStr}</h2>
          <div class="lavado-card" data-category-id="${uniqueId}">
            <img src="${lavado.imagen}" class="icon" alt="${lavado.nombre}" />
            <div class="info">
              <h3 class="hist-title">${lavado.nombre}</h3>
              <p class="hist-subtitle">${lavado.descripcion}</p>
              <p class="hist-hour">${horaInicio} - ${horaFin}</p>
              <div class="lavado-button">
                <button class="button">EMPEZAR</button>
            </div>
            </div>
            <img src="/images/${isFavorito ? "cora_relleno" : "corazon"}.svg" class="heart ${isFavorito ? "activo" : ""}" alt="Favorito"/>          
            </div>
        `;
  
        contenedor.appendChild(section);

        // --- Paso 2: Añadir Event Listener al Corazón ---
        const heartIcon = section.querySelector('.heart');
        if (heartIcon) {
            // Pasamos el objeto 'lavado' completo del historial a la función handler
            heartIcon.addEventListener('click', () => handleFavoriteToggle(usuario, lavado, heartIcon));
        }

        // Añadir listener al botón "EMPEZAR" (si lo mantienes)
        const empezarBtn = section.querySelector('.lavado-button .button');
        if (empezarBtn) {
            empezarBtn.addEventListener('click', () => handleEmpezarClickHistorial(lavado));
        }

        const cardElement = section.querySelector('.lavado-card');
                if (cardElement) {
                    cardElement.addEventListener('mouseenter', () => {
                        // console.log(`➡️ ENTER Historial: ${uniqueId}`); // Log opcional
                        socketHistorial.emit('hoverCategory', { categoryId: uniqueId });
                    });
                    cardElement.addEventListener('mouseleave', () => {
                         // console.log(`⬅️ LEAVE Historial: ${uniqueId}`); // Log opcional
                        socketHistorial.emit('unhoverCategory', { categoryId: uniqueId });
                    });
                }

      });
    });
  });

  function sanitizeId(text) {
    if (!text) return `item-${Math.random().toString(36).substr(2, 9)}`;
    return text.toString().toLowerCase()
               .replace(/\s+/g, '-') // Reemplaza espacios con guiones
               .replace(/[^\w-]+/g, ''); // Quita caracteres no alfanuméricos (excepto guion)
               // Podrías añadir más reemplazos si las fechas/horas dan problemas (:, /)
               // .replace(/[:\/]/g, '-');
}

   // --- Paso 3: Crear Función handleFavoriteToggle ---
   async function handleFavoriteToggle(currentUser, washData, heartElement) {
    console.log(`Toggle favorito para: ${washData.nombre}, Usuario: ${currentUser}`);

    // 1. Obtener la lista MÁS RECIENTE de favoritos del servidor
    let currentFavoritos = [];
    try {
        const res = await fetch(`/api/users/${currentUser}/favoritos`);
        if (!res.ok) throw new Error('No se pudo obtener la lista actual de favoritos');
        currentFavoritos = await res.json();
    } catch (error) {
        console.error("Error al obtener favoritos antes de actualizar:", error);
        alert("Error de red al intentar actualizar favoritos. Inténtalo de nuevo.");
        return; // Salir si no podemos obtener la lista actual
    }

    // 2. Determinar si ya es favorito y preparar la nueva lista
    const nombreLavado = washData.nombre;
    const indexInFavs = currentFavoritos.findIndex(fav => fav.nombre === nombreLavado);
    let newFavoritosList = [...currentFavoritos]; // Copiar la lista actual
    let isNowFavorite;

    if (indexInFavs > -1) {
        // --- Ya es favorito -> Quitarlo ---
        newFavoritosList.splice(indexInFavs, 1); // Quitar del array copiado
        isNowFavorite = false;
    } else {
        // --- No es favorito -> Añadirlo ---
        // Crear el objeto favorito (asegúrate que tiene los campos necesarios)
        const favoritoToAdd = {
            nombre: washData.nombre,
            descripcion: washData.descripcion || "",
            temperatura: washData.temperatura || "",
            duracion: washData.duracion || "",
            centrifugado: washData.centrifugado || "",
            detergente: washData.detergente || "", // Podría faltar en historial
            imagen: washData.imagen || '/images/default-wash.png'
            // Añadir otros campos si son necesarios para mostrar favoritos en otras partes
        };
        newFavoritosList.push(favoritoToAdd); // Añadir al array copiado
        isNowFavorite = true;
        console.log(`❤️ Añadiendo "${nombreLavado}" a favoritos.`);
    }

    // 3. Enviar la lista ACTUALIZADA al servidor
    console.log("💾 Guardando nueva lista de favoritos en servidor...");
    const saveResponse = await fetch('/guardar-favoritos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: currentUser, favoritos: newFavoritosList })
    });

    if (!saveResponse.ok) {
          const errData = await saveResponse.json(); // Intenta obtener mensaje de error
          throw new Error(errData.message || 'Error del servidor al guardar favoritos');
    }

    const result = await saveResponse.json(); // Asumiendo que ahora devuelve JSON
    console.log(`✅ Servidor respondió: ${result.message}`);

    // 4. Actualizar la UI del corazón clickeado (SIN RECARGAR)
    heartElement.src = isNowFavorite ? '/images/cora_relleno.svg' : '/images/corazon.svg';
    heartElement.title = isNowFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos';
    heartElement.classList.toggle('activo', isNowFavorite); // Añade/quita clase 'activo'

      // Opcional: Notificar a otros clientes (si es necesario)
      // No parece necesario desde el historial, pero podrías hacerlo:
      // const socketHistorial = io(); // Necesitarías una conexión socket aquí
      // socketHistorial.emit('favoritesUpdated', { userId: currentUser });

} // Fin handleFavoriteToggle


// --- Función para Empezar Lavado desde Historial (ya la tenías, revisada) ---
 function handleEmpezarClickHistorial(lavadoData) {
    if (!lavadoData || !usuario) return; // Añadida verificación de usuario
     console.log("Empezando lavado desde historial:", lavadoData.nombre);
     const lavadoParaEmpezar = {
        nombre: lavadoData.nombre,
        descripcion: lavadoData.descripcion || "",
        temperatura: lavadoData.temperatura || "?",
        duracion: lavadoData.duracion || "?",
        centrifugado: lavadoData.centrifugado || "?",
        detergente: lavadoData.detergente || "?",
        fechaInicio: new Date().toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }), // Fecha/Hora actual
        imagen: lavadoData.imagen || '/images/default-wash.png'
     };
     localStorage.setItem("lavadoSeleccionado", JSON.stringify(lavadoParaEmpezar));
     window.location.href = "empezar-lavado.html";
}
  
  function parseFecha(fechaStr) {
    const [fecha, hora] = fechaStr.split(', ');
    const [dia, mes, anio] = fecha.split('/').map(Number);
    const [horas, minutos] = hora.split(':').map(Number);
    const añoReal = anio < 100 ? 2000 + anio : anio;
    return new Date(añoReal, mes - 1, dia, horas, minutos);
  }
  
  function fechaBonita(fecha) {
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
                   'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${dias[fecha.getDay()]}, ${fecha.getDate()} ${meses[fecha.getMonth()]}`;
  }
  
  function formatHora(fecha) {
    return fecha.toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' });
  }
  
  function calcularHoraFin(fechaInicio, duracionStr) {
    const duracionMatch = duracionStr.match(/(\d+)h\s?(\d+)?/i);
    const minMatch = duracionStr.match(/(\d+)\s?min/);
    let totalMin = 0;
  
    if (duracionMatch) {
      totalMin += parseInt(duracionMatch[1]) * 60;
      if (duracionMatch[2]) totalMin += parseInt(duracionMatch[2]);
    } else if (minMatch) {
      totalMin += parseInt(minMatch[1]);
    }
  
    const fin = new Date(fechaInicio.getTime() + totalMin * 60000);
    return formatHora(fin);
  }
  