// public/client/script/navigation.js

document.addEventListener('DOMContentLoaded', () => {
  console.log("Nav script cargado.");

  // --- Conexión Socket.IO (Opcional, si se usa en ambas páginas) ---
  let socketNav;
  if (typeof io !== 'undefined') {
      socketNav = io();
      socketNav.on('connect', () => console.log('📱✅ Socket de Navegación Global conectado.'));
      socketNav.on('connect_error', (err) => console.error('📱❌ Error conexión socket Nav Global:', err));
  } else {
      console.warn('Navigation Script: io no definido en esta página.');
  }

  // --- Elementos y Variables Globales de Navegación ---
  // Elementos que pueden o no existir dependiendo de la página
  const profileModal = document.getElementById('profile-modal');       // Modal de editar perfil
  const profileDropdownBtn = document.getElementById('profile-dropdown-btn'); // Botón dropdown perfil
  const profileDropdownMenu = document.getElementById('profile-dropdown-menu'); // Menú dropdown

  // Los popups de login/registro NO los necesitamos referenciar aquí si los vamos a ignorar

  let selectables = [];       // Array de elementos navegables activos
  let currentIndex = 0;     // Índice del elemento seleccionado actualmente
  let categorias = [];
  let navDebounce = false;  // Para evitar múltiples selecciones por inclinación rápida
  let lastHoveredCardElement = null;

  // Constantes de configuración (iguales)
  const NAV_TILT_THRESHOLD = 25;
  const NAV_DEBOUNCE_TIME = 500;
  const SHAKE_THRESHOLD = 3000;
  const SHAKE_DURATION = 3000;
  const BACK_TAP_THRESHOLD = 15;
  const DOUBLE_TAP_MAX_DELAY = 300;

  // Variables para detección de movimiento (iguales)
  let lastBackTap = 0;
  let lastTouch = 0;
  let shakeStartTime = null;
  let lastUpdate = 0;
  let x1 = 0, y1 = 0, z1 = 0;
  let x2 = 0, y2 = 0, z2 = 0;

  function handleHover(indexHovered) {
    categorias.forEach((el, idx) => {
      el.classList.remove("mover-izquierda", "mover-derecha");
      if (indexHovered === 0) {
        // si es la primera, mueve las siguientes a la derecha
        if (idx > indexHovered) {
          el.classList.add("mover-derecha");
        }
      } else if (indexHovered === 1) {
        // si es la del centro, solo mueve la de la derecha
        if (idx > indexHovered) {
          el.classList.add("mover-derecha");
        }
      // La primera (índice 0) se queda sin moverse
      } else if (indexHovered === 2) {
        // si es la última, mueve las anteriores a la izquierda
        if (idx < indexHovered) {
          el.classList.add("mover-izquierda");
        }
      }
    });
    }
    
    
    function handleLeave() {
    categorias.forEach(el => {
      el.classList.remove("mover-izquierda", "mover-derecha");
      }); 
    } 
  // --- Función para Actualizar la Selección Visual ---
  function updateSelection() {
      // GUARDIA DE SEGURIDAD (Importante)
      if (!selectables || selectables.length === 0) {
          // console.warn("updateSelection: No hay elementos seleccionables.");
          currentIndex = 0;
          // Limpiar cualquier selección residual si no hay nada seleccionable
           document.querySelectorAll('.selected, .hover-simulado').forEach(el => {
                el.classList.remove('selected', 'hover-simulado');
           });
          handleLeave();
          return;
      }
      if (currentIndex < 0 || currentIndex >= selectables.length) {
          console.warn(`updateSelection: currentIndex (${currentIndex}) fuera de rango [0, ${selectables.length -1}]. Reseteando a 0.`);
          currentIndex = 0;
      }
      
      if (lastHoveredCardElement) {
        const previousCardId = lastHoveredCardElement.dataset.categoryId;
        // console.log("Quitando hover simulado de:", lastHoveredCardElement);
        lastHoveredCardElement.classList.remove('card-hover-simulado'); // Quita la clase CSS
        if (previousCardId && socketNav && socketNav.connected) {
             // console.log("Emitiendo unhoverCategory (nav) para:", previousCardId);
             // Emitir evento si es necesario que el servidor sepa que ya no está seleccionada
             socketNav.emit('unhoverCategory', { categoryId: previousCardId });
        }
        lastHoveredCardElement = null; // Resetea el tracker
        }

      handleLeave(); // Limpia efectos de categoría si aplica

      selectables.forEach((el, i) => {
          el.classList.remove("selected", "hover-simulado");
          if (i === currentIndex) {
              el.classList.add("selected");
              // Aplica transición de categoría si el elemento seleccionado ES una categoría
              if (el.classList.contains("categoria")) {
                  const categoriaIndex = categorias.indexOf(el); // Busca en las categorías de ESTA página
                  if (categoriaIndex !== -1) {
                      handleHover(categoriaIndex);
                  }
                  el.classList.add("hover-simulado");
              }
              else if (el.id === 'historial') { // <--- AÑADIR ESTO
                // Quizás solo quieres el estilo simulado?
                el.classList.add("hover-simulado");
                // No llames a handleHover porque no tiene sentido para un solo elemento
            } else if (el.matches('.lavado-card .button')) { // Comprueba si es un botón EMPEZAR
                    const parentCard = el.closest('.lavado-card'); // Encuentra la tarjeta padre
                    if (parentCard) {
                        // console.log("Aplicando hover simulado a tarjeta:", parentCard);
                        parentCard.classList.add('card-hover-simulado'); // <-- Aplica la clase CSS!
                        lastHoveredCardElement = parentCard; // Guarda referencia para quitarla después

                        const categoryId = parentCard.dataset.categoryId; // Obtiene el ID de la tarjeta
                        if (categoryId && socketNav && socketNav.connected) {
                             // console.log("Emitiendo hoverCategory (nav) para:", categoryId);
                             // Emitir evento socket si es necesario
                             socketNav.emit('hoverCategory', { categoryId: categoryId });
                        }
                    }
                }
          }
      });

      const currentElement = selectables[currentIndex];
      if (currentElement) {
          currentElement.scrollIntoView({ behavior: "smooth", block: "center" });
          console.log("Elemento seleccionado:", currentElement);
      }
  }

  // --- Función para Recalcular los Elementos Seleccionables ---
  function reiniciarSelectables() {
      console.log("🔄 Reiniciando selectables...");

      let query = '';
      let isModalVisible = false; // Variable para saber si algún modal relevante está activo

      // 1. Comprobar si el MODAL DE EDITAR PERFIL está visible (solo si existe en la página)
      if (profileModal && profileModal.offsetParent !== null) {
          console.log("   🎯 Modal Editar Perfil visible.");
          query = '#profile-modal input, #profile-modal button'; // Selecciona inputs y botones dentro del modal
          selectables = Array.from(document.querySelectorAll(query));
          isModalVisible = true;
      }
      // 2. Comprobar si el MENÚ DROPDOWN DE PERFIL está visible (solo si existe)
      //    (Añadir sólo si quieres navegar por sus items una vez abierto)
      else if (profileDropdownMenu && profileDropdownMenu.offsetParent !== null) {
          console.log("   🎯 Dropdown Perfil visible.");
          query = '#profile-dropdown-menu li'; // Selecciona los items de la lista
          selectables = Array.from(document.querySelectorAll(query));
          isModalVisible = true; // Consideramos el dropdown como un "modal" para la selección
      }

      // 3. Si NINGÚN modal/dropdown relevante está visible: seleccionar elementos principales
      if (!isModalVisible) {
        console.log("   📄 Ningún modal/dropdown relevante visible. Seleccionando elementos principales.");
        // Query que busca elementos comunes y específicos de AMBAS páginas
        query =
              // --- Comunes (Barra Nav Inferior) ---
              '.button-container > .button-nav, ' +
              // --- index.html ---
              '.lavado-box .lavado-button, ' +
              '.categorias .categoria, ' +
              '#ver-mas-categorias, ' +
              '.personalizar-container .lavado-button, ' +
              '.mapa-container .mapa-button, ' +
              // --- perfil.html ---
              '#profile-dropdown-btn, ' +
              '#ver-mas-programas, ' +
              '.programas .button-lav, ' +
              '#historial, ' +                     // <-- !!! COMA AÑADIDA !!!
              // --- categorias-lavados.html ---
              '#back-button-categorias, ' +
              // --- historial.html ---
              '#back-button-historial, ' +        // (Asegúrate que está)
              // --- lavados-favs.html ---
              '#back-button-favs, ' +            // (Asegúrate que está)
              // --- Botones EMPEZAR (Común a varias páginas) ---
              '.lavado-card .button';

        selectables = Array.from(document.querySelectorAll(query));

        // Filtro MUY IMPORTANTE: Excluir CUALQUIER cosa dentro de un popup-overlay
        // Esto IGNORA los popups de login/registro aunque estén en el DOM
        selectables = selectables.filter(el => !el.closest('.popup-overlay'));

        categorias = Array.from(document.querySelectorAll(".categoria")) // Busca todas en el DOM
        .filter(cat => selectables.includes(cat));
    }

      // Filtro común FINAL: Quitar no visibles (display:none, etc.) o deshabilitados
      const initialCount = selectables.length;
      selectables = selectables.filter(el => {
        const isVisible = el.offsetParent !== null;
        const isDisabled = el.disabled;
        // Log específico para #historial
        if (el.id === 'historial') {
             console.log(`   Filtrando #historial: Visible=<span class="math-inline">\{isVisible\}, Disabled\=</span>{isDisabled}`);
        }
        return isVisible && !isDisabled; // Devuelve el resultado del filtro
    });      console.log(`   Filtro Visible/Enabled: ${initialCount} -> ${selectables.length} elementos activos.`);

      console.log("   Seleccionables finales:", selectables);

      currentIndex = 0; // Resetear índice

      // Limpiar selección anterior antes de aplicar la nueva
      document.querySelectorAll('.selected, .hover-simulado').forEach(el => {
          el.classList.remove('selected', 'hover-simulado');
      });
      handleLeave();

      if (selectables.length > 0) {
          updateSelection(); // Aplica la selección visual al NUEVO primer elemento
      } else {
          console.warn("   No se encontraron elementos seleccionables activos después de reiniciar.");
      }
       console.log("🔄 --- Fin reiniciarSelectables ---");
  }

  // --- Función para Simular Click --- (Sin cambios)
  function triggerCurrentClick() {
     if (!selectables || selectables.length === 0 || currentIndex < 0 || currentIndex >= selectables.length) {
         console.warn("triggerCurrentClick: No hay selección válida.");
         return;
     }
     const el = selectables[currentIndex];
     console.log("🔥 Click simulado sobre:", el);
     el.classList.add("clickeado");
     setTimeout(() => el.classList.remove("clickeado"), 300);
     if (typeof el.click === "function") { el.click(); }
     else { const evt = new MouseEvent("click", { bubbles: true, cancelable: true, view: window }); el.dispatchEvent(evt); }
  }

  // --- Función para Shake --- (Sin cambios, si la necesitas en perfil.html también)
  function handleShake() {
      console.log("🌀 Agitación detectada.");
       // Decide a dónde redirigir dependiendo de la página actual, si es necesario
       let targetUrl = "lavado-personalizado.html"; // URL por defecto
       console.log("Redirigiendo a:", targetUrl);

       if ("vibrate" in navigator) navigator.vibrate(200);
       const overlay = document.getElementById("transition-overlay");
       if (overlay) { // Si existe el overlay de transición
          overlay.style.transform = "scale(100)";
          setTimeout(() => { window.location.href = targetUrl; }, 800);
       } else {
          window.location.href = targetUrl; // Redirección directa
       }
  }

  // --- Listeners de Eventos de Navegación ---

  // Listener para cambios en Popups/Modales/Dropdowns
  // Escuchará eventos disparados desde perfil.js, login.js, etc.
  window.addEventListener('popupChange', () => {
      console.log("Evento 'popupChange' detectado. Llamando a reiniciarSelectables.");
      reiniciarSelectables();
  });

  // Doble tap (Sin cambios)
  document.addEventListener("touchstart", (e) => {
      const now = Date.now();
      if (now - lastTouch < DOUBLE_TAP_MAX_DELAY) { triggerCurrentClick(); lastTouch = 0; }
      else { lastTouch = now; }
  });

  // Tilt (Sin cambios)
  window.addEventListener("deviceorientation", (event) => {
      const gamma = event.gamma;
      if (navDebounce || !selectables || selectables.length < 2) return;
      let moved = false;
      if (gamma < -NAV_TILT_THRESHOLD && currentIndex > 0) { currentIndex--; moved = true; }
      else if (gamma > NAV_TILT_THRESHOLD && currentIndex < selectables.length - 1) { currentIndex++; moved = true; }
      if (moved) { 
        console.log("Tilt detectado. Nuevo currentIndex:", currentIndex);
        updateSelection(); 
        navDebounce = true; 
        setTimeout(() => navDebounce = false, NAV_DEBOUNCE_TIME); 
      }
  });

  // Teclado/Volumen (Sin cambios)
  window.addEventListener("keydown", (e) => {
      if (!selectables || selectables.length === 0) return;
      const relevantKeys = ["ArrowDown", "VolumeDown", "Enter", "Space", "ArrowLeft", "ArrowRight", "GamepadA", "GamepadLeft", "GamepadRight"];
      if (relevantKeys.includes(e.code) || relevantKeys.includes(e.key)) { e.preventDefault(); }

      if (["ArrowDown", "VolumeDown", "Enter", "Space", "GamepadA"].includes(e.code) || ["Enter", " "].includes(e.key)) { triggerCurrentClick(); }
      else if (e.code === "ArrowLeft" || e.code === "GamepadLeft") { if (currentIndex > 0) { currentIndex--; updateSelection(); } }
      else if (e.code === "ArrowRight" || e.code === "GamepadRight") { if (currentIndex < selectables.length - 1) { currentIndex++; updateSelection(); } }
  });

  // Devicemotion (Shake/Tap trasero) (Sin cambios)
  window.addEventListener('devicemotion', (e) => {
      const acc = e.accelerationIncludingGravity; if (!acc || !acc.x) return;
      const now = Date.now();
      if (now - lastUpdate > 100) {
          const diff = now - lastUpdate; lastUpdate = now;
          x2 = acc.x; y2 = acc.y; z2 = acc.z;
          const speed = diff > 0 ? Math.abs(x1 + y1 + z1 - x2 - y2 - z2) / diff * 10000 : 0;
          if (speed > SHAKE_THRESHOLD) { if (!shakeStartTime) { shakeStartTime = now; } else if (now - shakeStartTime >= SHAKE_DURATION) { handleShake(); shakeStartTime = null; } } else { shakeStartTime = null; }
          x1 = x2; y1 = y2; z1 = z2;
          const zDiff = acc.z - z1;
          if (Math.abs(zDiff) > BACK_TAP_THRESHOLD) { const tapNow = Date.now(); if (tapNow - lastBackTap < DOUBLE_TAP_MAX_DELAY) { triggerCurrentClick(); lastBackTap = 0; } else { lastBackTap = tapNow; } }
      }
  });

  // --- Listeners Botones Navegación Principal (HOME, PERFIL) ---
  // Mantenlos si la barra de navegación es igual en todas las páginas
  const homeButton = document.getElementById('nav-home-button');
  if (homeButton) {
      homeButton.addEventListener('click', (event) => {
          event.preventDefault();
          // Tu lógica de home... (emitir socket, redirigir)
          console.log('Home presionado');
          window.location.href = 'index.html'; // O a donde deba ir Home
      });
  }


  // --- Listener para VisibilityChange ---
   document.addEventListener("visibilitychange", () => {
       if (document.visibilityState === "visible") {
           console.log("👁 Página visible de nuevo. Reinicializando selección.");
           reiniciarSelectables(); // Llama directamente ahora que está en el mismo scope
       }
   });


  // --- Inicialización ---
  reiniciarSelectables(); // Configura la selección inicial una vez todo está listo


}); // Fin de DOMContentLoaded


// --- Listener para Pageshow (Fuera de DOMContentLoaded) ---
// Solo para recargar si viene de bfcache
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
      console.log("🧠 Página restaurada desde caché (bfcache). Recargando...");
      window.location.reload();
  }
});