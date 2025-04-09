// public/server/script/perfil.js
// (Para la página public/server/perfil-display.html)

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🖥️ Script perfil-display.js cargado (para pantalla servidor).");

    // --- 1. Obtener Usuario y Elementos DOM ---
    const userId = sessionStorage.getItem('currentDisplayUserId');

    const usernameElement = document.querySelector(".username");
    const photoElement = document.getElementById("profile-page-photo");
    const historialContainer = document.querySelector(".categoria-list"); // Contenedor historial
    const historialCountElement = document.querySelector(".completados");
    const favoritosContainer = document.getElementById("perfil-favoritos-lista"); // Contenedor lista favoritos
    const favoritosCountElement = document.querySelector(".favoritos");
    const personalizadosContainer = document.getElementById("perfil-personalizados-lista"); // Contenedor lista personalizados
    const personalizadosCountElement = document.getElementById("personalizados-count");

    // Verificar elementos esenciales
    if (!userId || !usernameElement || !photoElement || !historialContainer || !historialCountElement || !favoritosContainer || !favoritosCountElement || !personalizadosContainer || !personalizadosCountElement) {
        console.error("Error: Faltan elementos HTML necesarios o userId en perfil-display.html");
        document.body.innerHTML = "<h1>Error</h1><p>No se pudo cargar el perfil correctamente.</p>";
        return;
    }

    usernameElement.textContent = userId;
    console.log(`🖥️ Cargando datos de perfil para: ${userId}`);

    // Mensajes iniciales de carga
    historialContainer.innerHTML = '<p class="loading-message">Cargando...</p>';
    favoritosContainer.innerHTML = '<p class="loading-message">Cargando...</p>';
    personalizadosContainer.innerHTML = '<p class="loading-message">Cargando...</p>';

    // --- Fetch de TODOS los datos en paralelo ---
    try {
        const [userData, historial, favoritos, personalizados] = await Promise.all([
            fetch(`/api/users/${userId}`).then(res => res.ok ? res.json() : Promise.resolve({ username: userId, foto: null, error: true })),
            fetch(`/lavados/${userId}`).then(res => res.ok ? res.json().catch(() => []) : Promise.resolve([])),
            fetch(`/api/users/${userId}/favoritos`).then(res => res.ok ? res.json().catch(() => []) : Promise.resolve([])),
            fetch(`/api/users/${userId}/personalizados`).then(res => res.ok ? res.json().catch(() => []) : Promise.resolve([]))
        ]);

        console.log("Datos recibidos:", { userData, historial, favoritos, personalizados });

        // --- Mostrar Datos Básicos del Usuario ---
        if (userData && !userData.error) {
            usernameElement.textContent = userData.username || userId;
            photoElement.src = userData.foto || '/images/persona_os.svg'; // Usa foto de API o default
        } else {
             usernameElement.textContent = userId; // Fallback
             photoElement.src = '/images/persona_os.svg';
             console.warn("No se pudieron cargar datos completos del usuario (API /api/users/:userId pendiente o falló).");
        }

        // --- Mostrar Historial (Máximo 4 - Estilo Tarjeta) ---
        historialContainer.innerHTML = ""; // Limpiar
        historialCountElement.textContent = historial.length;
        if (historial.length === 0) {
            historialContainer.innerHTML = '<p class="empty-message">Sin historial reciente.</p>';
        } else {
            // Usar una clase contenedora si quieres aplicar grid/flex (opcional, depende de tu HTML/CSS)
            // historialContainer.classList.add('categories-container'); // Por ejemplo
            historial.slice(0, 2).forEach(lavado => {
                const section = document.createElement("section");
                // *** Aplicar la clase de estilo de tarjeta ***
                section.className = "category-display";
                // No necesitamos data-category-id aquí si no hay hover interactivo

                // Corregir ruta de imagen si es necesario
                let imagenHistorial = lavado.imagen || '/images/default-wash.png';
                if (imagenHistorial.startsWith('.')) imagenHistorial = '/images/' + imagenHistorial.split('/').pop();

                // *** Generar HTML con estructura similar a categorias-lavados ***
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

        // --- Mostrar Favoritos (Máximo 4 - Estilo Tarjeta) ---
        favoritosContainer.innerHTML = ""; // Limpiar
        favoritosCountElement.textContent = favoritos.length;
        if (favoritos.length === 0) {
            favoritosContainer.innerHTML = '<p class="empty-message">Sin favoritos.</p>';
        } else {
            // favoritosContainer.classList.add('categories-container'); // Opcional
            favoritos.slice(0, 1).forEach(lavado => {
                const section = document.createElement("section");
                section.className = "category-display"; // Misma clase = mismo estilo base

                let imagenFavorito = lavado.imagen || '/images/default-wash.png';
                 if (imagenFavorito.startsWith('.')) imagenFavorito = '/images/' + imagenFavorito.split('/').pop();

                section.innerHTML = `
                <div class="lavado-sombra">
                    <div class="sombra sombra-50"></div>
                    <div class="sombra sombra-20"></div>
                    <div class="lavado">
                    <h2>${lavado.nombre || 'Favorito'}</h2>
                     <div class="lavado-card">
                        <img src="${imagenFavorito}" class="icon" alt="${lavado.nombre || 'Favorito'}">
                        <div class="info">
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

        // --- Mostrar Personalizados (Máximo 4 - Estilo Tarjeta) ---
        personalizadosContainer.innerHTML = ""; // Limpiar
        personalizadosCountElement.textContent = personalizados.length;
        if (personalizados.length === 0) {
            personalizadosContainer.innerHTML = '<p class="empty-message">Sin personalizados.</p>';
        } else {
            // personalizadosContainer.classList.add('categories-container'); // Opcional
            personalizados.slice(0, 1).forEach(lavado => {
                const section = document.createElement("section");
                section.className = "category-display"; // Misma clase

                section.innerHTML = `
                <div class="lavado-sombra">
                    <div class="sombra sombra-50"></div>
                    <div class="sombra sombra-20"></div>
                    <div class="lavado">
                    <h2>${lavado.nombre || 'Personalizado'}</h2>
                    <div class="lavado-card">
                        <img src="/images/personalizado.svg" class="icon" alt="Personalizado">
                        <div class="info">
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

    // --- Funciones de Fecha (necesarias si las usas en el HTML generado, como en historial) ---
    function parseFecha(fechaStr) {
        try { // Añadir try-catch robusto
            if (!fechaStr || typeof fechaStr !== 'string') return new Date(NaN); // Devuelve fecha inválida
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
            return new Date(NaN); // Devuelve fecha inválida en cualquier error
        }
    }

    function fechaBonita(fecha) {
        if (!(fecha instanceof Date) || isNaN(fecha)) return "Fecha desconocida";
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${dias[fecha.getDay()]}, ${fecha.getDate()} ${meses[fecha.getMonth()]}`;
    }


}); // Fin DOMContentLoaded