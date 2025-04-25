// public/client/script/navigation.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("Nav script cargado.");

    // Conexión Socket.IO para la navegación global
    if (typeof io === 'undefined') {
        console.error('Navigation Script: io no definido.');
        return;
    }
    const socketNav = io();
    socketNav.on('connect', () => console.log('📱✅ Socket de Navegación Global conectado.'));
    socketNav.on('connect_error', (err) => console.error('📱❌ Error conexión socket Nav Global:', err));


    const categorias = Array.from(document.querySelectorAll(".categoria"));

    // FUNCION PARA LAS TRANSICIONES DE CATEGORIAS
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

    // --- Listener para Botón HOME ---
    const homeButton = document.getElementById('nav-home-button');

    if (homeButton) {
        homeButton.addEventListener('click', (event) => {
            event.preventDefault(); // Buena práctica para botones
            console.log('📱 Botón Home presionado.');
            const usuario = localStorage.getItem("loggedInUser"); // Obtener usuario (aunque no se use para ir a home)

            // Verificar conexión antes de emitir
            if (socketNav && socketNav.connected) {
                console.log('   Socket conectado. Emitiendo para / ...');
                socketNav.emit('requestDisplayChange', {
                    targetPage: '/', // <-- Pantalla principal del servidor
                    userId: usuario   // <-- Enviar por si acaso
                });
                // Navegar cliente a su página principal
                window.location.href = '/mobile'; // <-- Página principal del cliente
            } else {
                console.error("Socket no conectado al intentar volver a home.");
                alert("Error de conexión. Inténtalo de nuevo.");
                // Fallback: Navegar solo cliente si falla el socket
                // window.location.href = '/mobile';
            }
        });
         console.log("📱 Listener añadido a #nav-home-button.");
    } else {
        // Es normal si alguna página no tiene este botón específico
        // console.warn("Botón #nav-home-button no encontrado en esta página.");
    }

    // --- Listener para Botón de PERFIL ---
    const perfilButton = document.getElementById('perfil-boton');
    if (perfilButton) {
        perfilButton.addEventListener('click', () => {
            // ... (Copiar aquí la lógica del profile-button-handler.js) ...
            // Comprobar login, emitir requestDisplayChange para /display/profile o /display/login-prompt,
            // navegar cliente a perfil.html o mostrar popup...
        });
        console.log("📱 Listener añadido a #perfil-boton (desde navigation.js).");
    }


});



window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      console.log("🧠 Página restaurada desde caché (bfcache)");
      window.location.reload();
    }


    let currentIndex = 0;
    let navDebounce = false;
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
  
    // Recoge los elementos seleccionables
    let selectables = Array.from(document.querySelectorAll(".button-nav, button, a, .categoria"));
  
    function updateSelection() {
      handleLeave();
      selectables.forEach((el, i) => {
        el.classList.remove("selected", "hover-simulado");
        if (i === currentIndex) {
          el.classList.add("selected");
          if (el.classList.contains("categoria")) {
            // Busca el índice específico dentro de la lista de categorías
            const categoriaIndex = categorias.indexOf(el);
            if (categoriaIndex !== -1) {
                // Llama a tu función de transición con el índice correcto
                handleHover(categoriaIndex);
            }
            el.classList.add("hover-simulado");
          }
        }
      });
      selectables[currentIndex].scrollIntoView({ behavior: "smooth", block: "center" });
      console.log("Elemento seleccionado:", selectables[currentIndex]);
    }
  
    // Reinicia todo
    function reiniciarSelectables() {
      selectables = Array.from(document.querySelectorAll(".button-nav, button, a, .categoria"));
      currentIndex = 0;
      updateSelection();
    }
  
    // Selección inicial
    updateSelection();

    // Doble tap en pantalla
    document.addEventListener("touchstart", (e) => {
        const now = Date.now();
        if (now - lastTouch < 300) {
            console.log("👆 Double tap detectado");
            triggerCurrentClick();
            lastTouch = 0;
        } else {
            lastTouch = now;
        }
        });
  
    // Movimiento horizontal
    window.addEventListener("deviceorientation", (event) => {
      const gamma = event.gamma;
      if (navDebounce) return;
  
      if (gamma < -NAV_TILT_THRESHOLD && currentIndex > 0) {
        currentIndex--;
        updateSelection();
        navDebounce = true;
        setTimeout(() => navDebounce = false, NAV_DEBOUNCE_TIME);
      } else if (gamma > NAV_TILT_THRESHOLD && currentIndex < selectables.length - 1) {
        currentIndex++;
        updateSelection();
        navDebounce = true;
        setTimeout(() => navDebounce = false, NAV_DEBOUNCE_TIME);
      }
    });
  
  
    // Fallback por teclado (emulador, pruebas)
    window.addEventListener("keydown", (e) => {
      if (e.code === "ArrowDown" || e.code === "VolumeDown") {
        console.log("⬇️ Tecla de volumen o flecha abajo detectada");
        triggerCurrentClick();
      }
    });
  
      
    function triggerCurrentClick() {
        const el = selectables[currentIndex];
        console.log("🔥 Click forzado sobre:", el);
        el.classList.add("clickeado");
        setTimeout(() => el.classList.remove("clickeado"), 1000);
    
        // Forzamos click real
        if (typeof el.click === "function") {
          el.click();
        } else {
          // Si no tiene click (por ejemplo, un <div>), forzamos un evento
          const evt = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window
          });
          el.dispatchEvent(evt);
        }
      }
      
    // Shake y double tap por z
    window.addEventListener('devicemotion', (e) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
  
      const now = Date.now();
      if (now - lastUpdate > 100) {
        const diff = now - lastUpdate;
        lastUpdate = now;
  
        x2 = acc.x;
        y2 = acc.y;
        z2 = acc.z;
  
        const speed = Math.abs(x1 + y1 + z1 - x2 - y2 - z2) / diff * 10000;
  
        if (speed > SHAKE_THRESHOLD) {
          if (!shakeStartTime) {
            shakeStartTime = now;
          } else if (now - shakeStartTime >= SHAKE_DURATION) {
            handleShake();
            shakeStartTime = null;
          }
        } else {
          shakeStartTime = null;
        }
  
        x1 = x2;
        y1 = y2;
        z1 = z2;
  
        const zDiff = Math.abs(z2 - z1);
        if (zDiff > BACK_TAP_THRESHOLD) {
          if (now - lastBackTap < DOUBLE_TAP_MAX_DELAY) {
            console.log("💥 Double tap trasero detectado");
            triggerCurrentClick();
            lastBackTap = 0;
          } else {
            lastBackTap = now;
          }
        }
      }
    });
  
    function handleShake() {
      console.log("🌀 Agitación durante 3s detectada. Redirigiendo...");
      if ("vibrate" in navigator) navigator.vibrate(200);
      const overlay = document.getElementById("transition-overlay");
      overlay.style.transform = "scale(100)";
      setTimeout(() => {
        window.location.href = "lavado-personalizado.html";
      }, 800);
    }
  
    // Reinicia selectables si vuelves del historial
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        console.log("👁 Volviendo a la página. Reinicializando selección.");
        reiniciarSelectables();
      }
    });
  });
  