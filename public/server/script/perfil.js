// public/server/script/perfil.js
document.addEventListener("DOMContentLoaded", async () => {
    const userId = sessionStorage.getItem('currentDisplayUserId');
    const usernameElement = document.querySelector(".username");
    const photoElement = document.getElementById("profile-page-photo");
    const historialContainer = document.querySelector(".categoria-list"); 
    const historialCountElement = document.querySelector(".completados");
    const favoritosContainer = document.getElementById("perfil-favoritos-lista"); 
    const favoritosCountElement = document.querySelector(".favoritos");
    const personalizadosContainer = document.getElementById("perfil-personalizados-lista"); 
    const personalizadosCountElement = document.getElementById("personalizados-count");

    // verify
    if (!userId || !usernameElement || !photoElement || !historialContainer || !historialCountElement || !favoritosContainer || !favoritosCountElement || !personalizadosContainer || !personalizadosCountElement) {
        console.error("Error: Faltan elementos HTML necesarios o userId en perfil-display.html");
        document.body.innerHTML = "<h1>Error</h1><p>No se pudo cargar el perfil correctamente.</p>";
        return;
    }

    usernameElement.textContent = userId;

    historialContainer.innerHTML = '<p class="loading-message">Cargando...</p>';
    favoritosContainer.innerHTML = '<p class="loading-message">Cargando...</p>';
    personalizadosContainer.innerHTML = '<p class="loading-message">Cargando...</p>';

    // Fetch de TODOS los datos en paralelo
    try {
        const [userData, historial, favoritos, personalizados] = await Promise.all([
            fetch(`/api/users/${userId}`).then(res => res.ok ? res.json() : Promise.resolve({ username: userId, foto: null, error: true })),
            fetch(`/lavados/${userId}`).then(res => res.ok ? res.json().catch(() => []) : Promise.resolve([])),
            fetch(`/api/users/${userId}/favoritos`).then(res => res.ok ? res.json().catch(() => []) : Promise.resolve([])),
            fetch(`/api/users/${userId}/personalizados`).then(res => res.ok ? res.json().catch(() => []) : Promise.resolve([]))
        ]);

        // DATOS DEL USUARIO
        if (userData && !userData.error) {
            usernameElement.textContent = userData.username || userId;
            photoElement.src = userData.foto || '/images/persona_os.svg';
        } else {
             usernameElement.textContent = userId;
             photoElement.src = '/images/persona_os.svg';
        }

        // MOSTRAR HISORIAL 2 max
        historialContainer.innerHTML = ""; // Limpiar
        historialCountElement.textContent = historial.length;
        if (historial.length === 0) {
            historialContainer.innerHTML = '<p class="empty-message">Sin historial reciente.</p>';
        } else {
            historial.slice(0, 2).forEach(lavado => {
                const section = document.createElement("section");
                section.className = "category-display";

                let imagenHistorial = lavado.imagen;

                section.innerHTML = `
                <div class="lavado-sombra">
                    <div class="sombra sombra-50"></div>
                    <div class="sombra sombra-20"></div>
                    <div class="lavado">
                        <h2>${lavado.nombre || 'Historial'}</h2>
                        <div class="lavado-card"> <img src="${imagenHistorial}" class="icon" alt="${lavado.nombre || 'Lavado'}">
                            <div class="info">
                                <p>${lavado.descripcion || `Realizado: ${lavado.fechaInicio ? fechaBonita(parseFecha(lavado.fechaInicio)) : '?'}`}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
                `;
                historialContainer.appendChild(section);
            });
        }

        // MOSTRAR FAVS 2 max
        favoritosContainer.innerHTML = ""; 
        favoritosCountElement.textContent = favoritos.length;
        if (favoritos.length === 0) {
            favoritosContainer.innerHTML = '<p class="empty-message">Sin favoritos.</p>';
        } else {
            favoritos.slice(0, 2).forEach(lavado => {
                const section = document.createElement("section");
                section.className = "category-display-fav"; 

                let imagenFavorito = lavado.imagen || '/images/default-wash.png';
                 if (imagenFavorito.startsWith('.')) imagenFavorito = '/images/' + imagenFavorito.split('/').pop();

                section.innerHTML = `
                <div class="lavado-sombra">
                    <div class="sombra sombra-50"></div>
                    <div class="sombra sombra-20"></div>
                    <div class="lavado-fav">
                    <h2>${lavado.nombre || 'Favorito'}</h2>
                     <div class="lavado-card-fav">
                        <img src="${imagenFavorito}" class="icon-fav" alt="${lavado.nombre || 'Favorito'}">
                        <div class="info-fav">
                            <p>${lavado.descripcion || 'Descripción no disponible'}</p>
                            <ul style="font-size: 0.8em; color: #555;">
                                 ${lavado.temperatura ? `<li>Temp: ${lavado.temperatura}</li>` : ''}
                                 ${lavado.duracion ? `<li>Dur: ${lavado.duracion}</li>` : ''}
                                 ${lavado.centrifugado ? `<li>Cent: ${lavado.centrifugado}</li>` : ''}
                             </ul>
                        </div>
                        <img src="/images/cora_relleno.svg" class="heart" alt="Favorito" style="position: absolute; top: 10px; right: 10px; width: 20px; height: 20px; display:block; opacity: 0.7;">
                    </div>
                    </div>
                    </div>
                    </div>
                </div>
                `;
                favoritosContainer.appendChild(section);
            });
        }

        // MOSTRAR PERSONALIZADOS 2 mac
        personalizadosContainer.innerHTML = "";
        personalizadosCountElement.textContent = personalizados.length;
        if (personalizados.length === 0) {
            personalizadosContainer.innerHTML = '<p class="empty-message">Sin personalizados.</p>';
        } else {
            personalizados.slice(0, 2).forEach(lavado => {
                const section = document.createElement("section");
                section.className = "category-display-fav"; 

                section.innerHTML = `
                <div class="lavado-sombra">
                    <div class="sombra sombra-50"></div>
                    <div class="sombra sombra-20"></div>
                    <div class="lavado-fav">
                    <h2>${lavado.nombre || 'Personalizado'}</h2>
                    <div class="lavado-card-fav">
                        <img src="/images/personalizado.svg" class="icon-fav" alt="Personalizado">
                        <div class="info-fav">
                             <p>${lavado.nivelSuciedad || 'Nivel de suciedad no especificado'}</p>
                             <ul style="font-size: 0.8em; color: #555;">
                                 ${lavado.temperatura ? `<li>Temp: ${lavado.temperatura}</li>` : ''}
                                 ${lavado.duracion ? `<li>Dur: ${lavado.duracion}</li>` : ''}
                                 ${lavado.centrifugado ? `<li>Cent: ${lavado.centrifugado}</li>` : ''}
                             </ul>
                        </div>
                         </div>
                         </div>
                    </div>
                    </div>
                </div>
                `;
                personalizadosContainer.appendChild(section);
            });
        }

        

    } catch (error) {
        console.error("Error fatal cargando datos del perfil:", error);
        const errorMsg = '<p class="error-message">Error al cargar datos.</p>';
        if (historialContainer) historialContainer.innerHTML = errorMsg;
        if (favoritosContainer) favoritosContainer.innerHTML = errorMsg;
        if (personalizadosContainer) personalizadosContainer.innerHTML = errorMsg;
        if (historialCountElement) historialCountElement.textContent = 'E';
        if (favoritosCountElement) favoritosCountElement.textContent = 'E';
        if (personalizadosCountElement) personalizadosCountElement.textContent = 'E';
    }

    // FUNCIONES PARA PONER LA FECHA BONITA
    function parseFecha(fechaStr) {
        try { // Añadir try-catch robusto
            if (!fechaStr || typeof fechaStr !== 'string') return new Date(NaN); 
            const parts = fechaStr.split(', ');
            if (parts.length !== 2) return new Date(NaN);
            const [fecha, hora] = parts;
            const fechaParts = fecha.split('/');
            const horaParts = hora.split(':');
            if (fechaParts.length !== 3 || horaParts.length !== 2) return new Date(NaN);
            const [dia, mes, anio] = fechaParts.map(Number);
            const [horas, minutos] = horaParts.map(Number);
            const añoReal = anio < 100 ? 2000 + anio : anio;
            if (isNaN(dia) || isNaN(mes) || isNaN(añoReal) || isNaN(horas) || isNaN(minutos)) return new Date(NaN);
            return new Date(añoReal, mes - 1, dia, horas, minutos);
        } catch (e) {
            console.error("Error en parseFecha con:", fechaStr, e);
            return new Date(NaN); 
        }
    }

    function fechaBonita(fecha) {
        if (!(fecha instanceof Date) || isNaN(fecha)) return "Fecha desconocida";
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${dias[fecha.getDay()]}, ${fecha.getDate()} ${meses[fecha.getMonth()]}`;
    }

    // logica de sockets
    const socketDisplayManager = io();

    socketDisplayManager.on('connect', () => {});

    socketDisplayManager.on('changeDisplay', (data) => {
      // console.log(`Recibido 'changeDisplay' para: ${data.targetPage} (Usuario: ${data.userId})`);

      if (data.userId !== undefined) { // guarda userid
          sessionStorage.setItem('currentDisplayUserId', data.userId);
      }

      // navegamos SOLO si la página destino es DIFERENTE a la actual
      if (window.location.pathname !== data.targetPage) {
      window.location.href = data.targetPage; // Cambia la página actual del navegador
      }
    });


}); 