document.addEventListener('DOMContentLoaded', () => {
  console.log("Nav script cargado.");


  const socketNav = io();
  socketNav.on('connect', () => {});


  const profileModal = document.getElementById('profile-modal');       // popup de editar perfil
  const profileDropdownBtn = document.getElementById('profile-dropdown-btn'); // boton dropdown perfil
  const profileDropdownMenu = document.getElementById('profile-dropdown-menu'); // menu dropdown


  let selectables = [];       // elementos navegables activos
  let currentIndex = 0;     // index (id) del elemento seleccionado actualmente
  let categorias = [];       // array de categorías (para transiciones)
  let navDebounce = false;  // no queremos multiples selecciones
  let lastHoveredCardElement = null;


  const NAV_TILT_THRESHOLD = 25;
  const NAV_DEBOUNCE_TIME = 500;
  const SHAKE_THRESHOLD = 3000;
  const SHAKE_DURATION = 3000;
  const BACK_TAP_THRESHOLD = 15;
  const DOUBLE_TAP_MAX_DELAY = 300;

  let lastBackTap = 0;
  let lastTouch = 0;
  let shakeStartTime = null;
  let lastUpdate = 0;
  let x1 = 0, y1 = 0, z1 = 0;
  let x2 = 0, y2 = 0, z2 = 0;


  // FUNCION PARA LA TRANSICION DE CATEGORIAS
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

  // FUNCION PARA ACTUALIZAR EL HOVER PARA LAS tRANSICIONES
  function updateSelection() {
      // GUARDIA DE SEGURIDAD (Importante)
      if (!selectables || selectables.length === 0) {
          // console.warn("updateSelection: No hay elementos seleccionables.");
          currentIndex = 0;
          // limpiar el hover
           document.querySelectorAll('.selected, .hover-simulado').forEach(el => {
                el.classList.remove('selected', 'hover-simulado');
           });
          handleLeave();
          return;
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

      handleLeave(); 

      // limpieza cleaning porque a veces se queda el hover simulado
      selectables.forEach((el, i) => {
          el.classList.remove("selected", "hover-simulado");
          if (i === currentIndex) {
              el.classList.add("selected");
              // transición de categoría si el elemento seleccionado ES una categoría
              if (el.classList.contains("categoria")) {
                  const categoriaIndex = categorias.indexOf(el); // busca en las categorías de ESTA página
                  if (categoriaIndex !== -1) {
                      handleHover(categoriaIndex);
                  }
                  el.classList.add("hover-simulado");
              }
              else if (el.id === 'historial') { // si es el botón HISTORIAL
                el.classList.add("hover-simulado");
            } else if (el.matches('.lavado-card .button')) { // si es un botón EMPEZAR
                    const parentCard = el.closest('.lavado-card'); // tarjeta papi
                    if (parentCard) {
                        // console.log("Aplicando hover simulado a tarjeta:", parentCard);
                        parentCard.classList.add('card-hover-simulado'); // clase css para hover
                        lastHoveredCardElement = parentCard;

                        const categoryId = parentCard.dataset.categoryId; // id de la card
                        if (categoryId && socketNav && socketNav.connected) {
                             // console.log("Emitiendo hoverCategory (nav) para:", categoryId);
                             // emitir evento socket 
                             socketNav.emit('hoverCategory', { 
                              categoryId: categoryId
                            });
                        }
                    }
                }
          }
      });

      const currentElement = selectables[currentIndex];
      if (currentElement) {
          currentElement.scrollIntoView({ behavior: "smooth", block: "center" });
          // console.log("Elemento seleccionado:", currentElement);
      }
  }

  // FUNCION PARA REINICIAR SELECCIONABLES (para cuando carga el historial o asi)
  function reiniciarSelectables() {
      console.log("🔄 Reiniciando selectables...");

      let query = '';
      let isModalVisible = false; 

      // 1. Comprobar si el MODAL DE EDITAR PERFIL está visible (solo si existe)
      if (profileModal && profileModal.offsetParent !== null) {
          query = '#profile-modal input, #profile-modal button'; // Selecciona inputs y botones dentro del modal
          selectables = Array.from(document.querySelectorAll(query));
          isModalVisible = true;
      }
      // 2. Comprobar si el MENÚ DROPDOWN DE PERFIL está visible (solo si existe)
      else if (profileDropdownMenu && profileDropdownMenu.offsetParent !== null) {
          query = '#profile-dropdown-menu li'; 
          selectables = Array.from(document.querySelectorAll(query));
          isModalVisible = true;
      }

      // 3. Si NINGÚN modal/dropdown relevante está visible: seleccionar elementos principales
      if (!isModalVisible) {
        query =
              // nav
              '.button-container > .button-nav, ' +
              // index.html
              '.lavado-box .lavado-button, ' +
              '.categorias .categoria, ' +
              '#ver-mas-categorias, ' +
              '.personalizar-container .lavado-button, ' +
              '.mapa-container .mapa-button, ' +
              // perfil.html
              '#profile-dropdown-btn, ' +
              '#ver-mas-programas, ' +
              '.programas .button-lav, ' +
              '#historial, ' +                     
              // categorias-lavados.html 
              '#back-button-categorias, ' +
              // historial.html
              '#back-button-historial, ' +        
              // lavados-favs.html
              '#back-button-favs, ' +            
              // Botones EMPEZAR 
              '.lavado-card .button';

        selectables = Array.from(document.querySelectorAll(query));

        selectables = selectables.filter(el => !el.closest('.popup-overlay')); // quita los elementos dentro de popups

        categorias = Array.from(document.querySelectorAll(".categoria"))
        .filter(cat => selectables.includes(cat));
    }

      // FILTRO FINAL quitar no visibles y deshabilitados
      const initialCount = selectables.length;
      selectables = selectables.filter(el => {
        const isVisible = el.offsetParent !== null;
        const isDisabled = el.disabled;
        return isVisible && !isDisabled;
    });     

      // console.log("   Seleccionables finales:", selectables);

      currentIndex = 0; // reset index

      // limpiamos selección anterior antes de aplicar la nueva
      document.querySelectorAll('.selected, .hover-simulado').forEach(el => {
          el.classList.remove('selected', 'hover-simulado');
      });
      handleLeave();

      if (selectables.length > 0) {
          updateSelection();
      } else {
          console.warn("No se encontraron elementos seleccionables activos después de reiniciar.");
      }
  }

  // FUNCION SIMULAR CLICK
  function triggerCurrentClick() {
     if (!selectables || selectables.length === 0 || currentIndex < 0 || currentIndex >= selectables.length) {
         console.warn("triggerCurrentClick: No hay selección válida.");
         return;
     }
     const el = selectables[currentIndex];
     // console.log("Click simulado sobre:", el);
     el.classList.add("clickeado");
     setTimeout(() => el.classList.remove("clickeado"), 300);
     if (typeof el.click === "function") { el.click(); }
     else { const evt = new MouseEvent("click", { bubbles: true, cancelable: true, view: window }); el.dispatchEvent(evt); }
  }

  // FUNCION PARA PONER UN LAVADO PERSONALIZADO CUANDO EL USER AGITA EL MOVIL
  function handleShake() {
      console.log("🌀 Agitación detectada.");
       let targetUrl = "lavado-personalizado.html"; 

       if ("vibrate" in navigator) navigator.vibrate(200);
          const overlay = document.getElementById("transition-overlay");
       if (overlay) {
          overlay.style.transform = "scale(100)";
          setTimeout(() => { window.location.href = targetUrl; }, 800);
       } else {
          window.location.href = targetUrl; // Redirección directa
       }
  }


  // Listener para cambios en Popups/Modales/Dropdowns
  // para cuando se abre y cierra popups
  window.addEventListener('popupChange', () => {
      console.log("Evento 'popupChange' detectado. Llamando a reiniciarSelectables.");
      reiniciarSelectables();
  });

  // DOBLE TAB
  document.addEventListener("touchstart", (e) => {
      const now = Date.now();
      if (now - lastTouch < DOUBLE_TAP_MAX_DELAY) { triggerCurrentClick(); lastTouch = 0; }
      else { lastTouch = now; }
  });

  // moversus
  window.addEventListener("deviceorientation", (event) => {
      const gamma = event.gamma;
      if (navDebounce || !selectables || selectables.length < 2) return;
      let moved = false;
      if (gamma < -NAV_TILT_THRESHOLD && currentIndex > 0) {  // mover a la izquierda
        currentIndex--; 
        moved = true; }
      else if (gamma > NAV_TILT_THRESHOLD && currentIndex < selectables.length - 1) { // mover a la derecha
        currentIndex++; 
        moved = true; }
      if (moved) { 
        updateSelection(); 
        navDebounce = true; 
        setTimeout(() => navDebounce = false, NAV_DEBOUNCE_TIME); 
      }
  });

  // IDEA PARA HACER CLICK CON SUBIR Y BAJAR VOLUMEN O DOBLE TAB ATRAS
  /*
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
  */
 
  const homeButton = document.getElementById('nav-home-button');
  if (homeButton) {
      homeButton.addEventListener('click', (event) => {
          event.preventDefault();
          // Tu lógica de home... (emitir socket, redirigir)
          console.log('Home presionado');
          window.location.href = 'index.html'; 
      });
  }


   document.addEventListener("visibilitychange", () => {
       if (document.visibilityState === "visible") {
           reiniciarSelectables();
       }
   });


  reiniciarSelectables(); 


}); 


window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
      console.log("🧠 Página restaurada desde caché (bfcache). Recargando...");
      window.location.reload();
  }
});