document.addEventListener("DOMContentLoaded", () => {
    const usuario = localStorage.getItem("loggedInUser");
    if (!usuario) return;
  
    const contenedor = document.getElementById("historial-container");
  
     // conexion SOCKET
    const socketHistorial = io(); 
    socketHistorial.on('connect', () => {});



    // cargamos los lavados iniciados y los favoritos del usuario
    Promise.all([
      fetch(`/lavados/${usuario}`).then(res => res.json()), // iniciados
      fetch(`/api/users/${usuario}/favoritos`).then(res => res.json()) // favoritos
    ]).then(([lavados, favoritos]) => {
  
      lavados.forEach(lavado => {
        const fechaInicio = parseFecha(lavado.fechaInicio);
        const fechaStr = fechaBonita(fechaInicio);
        const horaInicio = formatHora(fechaInicio);
        const horaFin = calcularHoraFin(fechaInicio, lavado.duracion);
  
        const isFavorito = favoritos.some(fav => fav.nombre === lavado.nombre);
  
        const uniqueId = sanitizeId(`${lavado.nombre}-${lavado.fechaInicio || index}`); // id unico para diferenciar que lavado es


        // creamos el elemento HTML para los lavados iniciados, teniendo en cuenta si son favoritos o no para poner el corazoncito
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
        window.dispatchEvent(new CustomEvent('popupChange'));

        // corazoncito 
        const heartIcon = section.querySelector('.heart');
        if (heartIcon) {
            heartIcon.addEventListener('click', () => handleFavoriteToggle(usuario, lavado, heartIcon));
        }

        // empezar lavado desde el historial
        const empezarBtn = section.querySelector('.lavado-button .button');
        if (empezarBtn) {
            empezarBtn.addEventListener('click', () => handleEmpezarClickHistorial(lavado));
        }

        // añadir hover para el socket y que se vea chulito
        const cardElement = section.querySelector('.lavado-card');
                if (cardElement) {
                    cardElement.addEventListener('mouseenter', () => {
                        // console.log(`hover Historial: ${uniqueId}`);
                        socketHistorial.emit('hoverCategory', { categoryId: uniqueId });
                    });
                    cardElement.addEventListener('mouseleave', () => {
                         // console.log(`unhover Historial: ${uniqueId}`); 
                        socketHistorial.emit('unhoverCategory', { categoryId: uniqueId });
                    });
                }

      });
    });

    const backButtonHistorial = document.getElementById('back-button-historial');
    const homeButtonHistorial = document.getElementById('home-button-historial');

    // FUNCION PARA VOVER AL PERFIL
    function navigateToProfile(event) {
        event.preventDefault(); 
        const usuario = localStorage.getItem("loggedInUser"); 

        // console.log('perfil');

        if (socketHistorial && socketHistorial.connected) {
             console.log('   Socket conectado. Emitiendo para /display/profile...');
            socketHistorial.emit('requestDisplayChange', {
                targetPage: '/display/profile', // <-- pantalla de perfil del servidor
                userId: usuario // <-- enviar userId
            });
            // ir a la pagina del perifl del user
            window.location.href = 'perfil.html'; // <-- pagina de perfil del cliente
        } else {
            console.error("Socket no conectado al intentar volver al perfil.");
        }
    }

    // FUNCION PARA VOLVER AL INDEX
     function navigateToHome(event) {
        event.preventDefault();
        const usuario = localStorage.getItem("loggedInUser");

        // console.log('home');

        if (socketHistorial && socketHistorial.connected) {
             console.log('   Socket conectado. Emitiendo para / ...');
            socketHistorial.emit('requestDisplayChange', {
                targetPage: '/', // <-- pantalla principal del servidor
                userId: usuario // <-- enviar userId
            });
            // ir al index del user
            window.location.href = '/mobile'; // <-- pagina principal del cliente
        } else {
            console.error("Socket no conectado al intentar volver a home.");
        }
    }


    // listener de los botones
    if (backButtonHistorial) {
        backButtonHistorial.addEventListener('click', navigateToProfile);
    }

    if (homeButtonHistorial) {
        homeButtonHistorial.addEventListener('click', navigateToHome);
    } 

    // FUNCION PARA EMPEZAR LAVADO DESDE EL HISTORIAL
    function handleEmpezarClickHistorial(lavadoData) {
      if (!lavadoData || !usuario) return;
       // console.log("Empezando lavado desde historial:", lavadoData.nombre);
       const lavadoParaEmpezar = {
          nombre: lavadoData.nombre,
          descripcion: lavadoData.descripcion || "",
          temperatura: lavadoData.temperatura || "?",
          duracion: lavadoData.duracion || "?",
          centrifugado: lavadoData.centrifugado || "?",
          detergente: lavadoData.detergente || "?",
          fechaInicio: new Date().toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }), // Fecha/Hora actual
          imagen: lavadoData.imagen
       };
       localStorage.setItem("lavadoSeleccionado", JSON.stringify(lavadoParaEmpezar)); // añadidos el lavaado en el localStorage
       
       // emit socket para ir a la pantalla de empezar lavado en el server
       socketHistorial.emit('requestDisplayChange', {
        targetPage: '/display/empezar-lavado',
      });
      
    
       window.location.href = "empezar-lavado.html";
        
    }
  });

  // funcion axuliar para crear un id unico para cada lavado
  function sanitizeId(text) {
    if (!text) return `item-${Math.random().toString(36).substr(2, 9)}`;
    return text.toString().toLowerCase()
               .replace(/\s+/g, '-') 
               .replace(/[^\w-]+/g, ''); 
}

   // FUNCION PARA PONer LOS COrAZONES EN LOS LAVADOS
   async function handleFavoriteToggle(currentUser, washData, heartElement) {

    let currentFavoritos = []; // lista de lavados del server
    try {
        const res = await fetch(`/api/users/${currentUser}/favoritos`);
        if (!res.ok) throw new Error('No se pudo obtener la lista actual de favoritos');
        currentFavoritos = await res.json();
    } catch (error) {
        console.error("Error al obtener favoritos antes de actualizar:", error);
        alert("Error de red al intentar actualizar favoritos. Inténtalo de nuevo.");
        return; 
    }

    // actualizar la lista de favoritos si es necesario
    const nombreLavado = washData.nombre;
    const indexInFavs = currentFavoritos.findIndex(fav => fav.nombre === nombreLavado);
    let newFavoritosList = [...currentFavoritos]; // Copiar la lista actual
    let isNowFavorite;

    if (indexInFavs > -1) {
        // ya no es favorito... QUITARLO
        newFavoritosList.splice(indexInFavs, 1); 
        isNowFavorite = false;
    } else {
        // no es favorito... AÑADIRLO
        const favoritoToAdd = {
            nombre: washData.nombre,
            descripcion: washData.descripcion || "",
            temperatura: washData.temperatura || "",
            duracion: washData.duracion || "",
            centrifugado: washData.centrifugado || "",
            detergente: washData.detergente || "", // falta en el historial yo creo hay que verlo
            imagen: washData.imagen 
        };
        newFavoritosList.push(favoritoToAdd); // añadir al array copiado
        isNowFavorite = true;
        // console.log(`Añadiendo "${nombreLavado}" a favoritos.`);
    }

    // enviamos la lista ACTUALIZADA al servidor
    const saveResponse = await fetch('/guardar-favoritos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: currentUser, favoritos: newFavoritosList })
    });

    // si hay errorcines
    if (!saveResponse.ok) {
          const errData = await saveResponse.json(); // Intenta obtener mensaje de error
          throw new Error(errData.message || 'Error del servidor al guardar favoritos');
    }

    const result = await saveResponse.json(); 

    // actualizar corazoncito relleno
    heartElement.src = isNowFavorite ? '/images/cora_relleno.svg' : '/images/corazon.svg';
    heartElement.title = isNowFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos';
    heartElement.classList.toggle('activo', isNowFavorite); // Añade/quita clase 'activo'


}


  // FUNCIONES AUXILIARES PARA FORMATEAR FECHAS Y HORAS
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
  