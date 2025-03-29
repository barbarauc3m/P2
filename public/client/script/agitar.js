document.addEventListener("DOMContentLoaded", () => {
    // ELEMENTOS SELECCIONABLES
    const selectables = Array.from(document.querySelectorAll(".button-nav, button, a, .categoria"));
    let currentIndex = 0;
    let navDebounce = false;
    const NAV_TILT_THRESHOLD = 15;
    const NAV_DEBOUNCE_TIME = 500;
  
    // Actualiza visualmente qué elemento está seleccionado
    function updateSelection() {
      selectables.forEach((el, i) => {
        el.classList.remove("selected", "hover-simulado");
        if (i === currentIndex) {
          el.classList.add("selected");
  
          // Si es una categoría, le simulamos el hover
          if (el.classList.contains("categoria")) {
            el.classList.add("hover-simulado");
          }
        }
      });
  
      // Hacemos scroll automático para asegurarnos que está visible
      selectables[currentIndex].scrollIntoView({ behavior: "smooth", block: "center" });
      console.log("Elemento seleccionado:", selectables[currentIndex]);
    }
  
    updateSelection();
  
    // INCLINAR IZQUIERDA / DERECHA PARA NAVEGAR
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
  
    // DOUBLE TAP PARA HACER CLICK
    let lastBackTap = 0;
    const BACK_TAP_THRESHOLD = 15;
    const DOUBLE_TAP_MAX_DELAY = 300;
  
    function triggerCurrentClick() {
      const el = selectables[currentIndex];
      console.log("Haciendo click en:", el);
      el.click?.();
    }
  
    // AGITAR 5s PARA REDIRIGIR
    let lastUpdate = 0;
    let x1 = 0, y1 = 0, z1 = 0;
    let x2 = 0, y2 = 0, z2 = 0;
    const SHAKE_THRESHOLD = 2000;
    const SHAKE_DURATION = 3000;
    let shakeStartTime = null;
  
    window.addEventListener('devicemotion', (e) => {
      const { accelerationIncludingGravity } = e;
      if (!accelerationIncludingGravity) return;
  
      const currentTime = Date.now();
      if (currentTime - lastUpdate > 100) {
        const diffTime = currentTime - lastUpdate;
        lastUpdate = currentTime;
  
        x2 = accelerationIncludingGravity.x;
        y2 = accelerationIncludingGravity.y;
        z2 = accelerationIncludingGravity.z;
  
        const speed = Math.abs(x1 + y1 + z1 - x2 - y2 - z2) / diffTime * 10000;
  
        if (speed > SHAKE_THRESHOLD) {
          if (!shakeStartTime) {
            shakeStartTime = currentTime;
          } else if (currentTime - shakeStartTime >= SHAKE_DURATION) {
            handleShake();
            shakeStartTime = null;
          }
        } else {
          shakeStartTime = null;
        }
  
        x1 = x2;
        y1 = y2;
        z1 = z2;
  
        // DOUBLE TAP
        const zDiff = Math.abs(z2 - z1);
        if (zDiff > BACK_TAP_THRESHOLD) {
          if (currentTime - lastBackTap < DOUBLE_TAP_MAX_DELAY) {
            console.log("Double tap detectado");
            triggerCurrentClick();
            lastBackTap = 0;
          } else {
            lastBackTap = currentTime;
          }
        }
      }
    });
  
    function handleShake() {
      console.log("¡Agitación detectada durante 5s! → Redirigiendo a lavado-personalizado.html");
      if ("vibrate" in navigator) navigator.vibrate(200);
      const overlay = document.getElementById("transition-overlay");
      overlay.style.transform = "scale(100)";
      setTimeout(() => {
        window.location.href = "lavado-personalizado.html";
      }, 800);
    }
  });
  