document.addEventListener('DOMContentLoaded', function () {
    // ABRIR dropdown al hacer clic en la barrita
    document.querySelectorAll('.barrita-elige-valor').forEach(barrita => {
      barrita.addEventListener('click', (e) => {
        const option = barrita.closest('.option');
        option.classList.toggle('expand');
        e.stopPropagation();
      });
    });
  
    // CERRAR dropdown si haces clic fuera
    document.addEventListener('click', (e) => {
      document.querySelectorAll('.option.expand').forEach(option => {
        if (!option.contains(e.target)) {
          option.classList.remove('expand');
        }
      });
    });
  
    // CHECKBOX: actualizar subtítulo y cerrar
    document.querySelectorAll('.option').forEach(option => {
      const dropdownMenu = option.querySelector('.dropdown-menu');
      const subtitle = option.querySelector('.subtitle');
      const checkboxes = dropdownMenu.querySelectorAll('input[type="checkbox"]');
  
      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          checkboxes.forEach(cb => {
            if (cb !== checkbox) cb.checked = false;
          });
  
          if (checkbox.checked) {
            subtitle.textContent = '✔ ' + checkbox.parentElement.textContent.trim();
            subtitle.style.opacity = 0;
            setTimeout(() => {
              subtitle.style.opacity = 1;
            }, 200);
            option.classList.remove('expand');
          } else {
            subtitle.textContent = 'Elige un valor';
          }
        });
      });
    });
  
    // SLIDER: actualizar valores y subtítulo
    const sliderMap = [
      { id: 'temperatura', label: 'Temperatura', unit: '°C', valueId: 'tempValue' },
      { id: 'duracion', label: 'Duración', unit: 'min', valueId: 'durValue' },
      { id: 'detergente', label: 'Detergente', unit: 'ml', valueId: 'detValue' }
    ];
  
    sliderMap.forEach(({ id, label, unit, valueId }) => {
      const slider = document.getElementById(id);
      const display = document.getElementById(valueId);
  
      if (slider && display) {
        slider.addEventListener('input', (e) => {
          const valor = e.target.value;
          display.textContent = valor;
  
          const option = slider.closest('.option');
          const subtitle = option.querySelector('.subtitle');
          subtitle.textContent = `✔ ${label}: ${valor}${unit}`;
  
          subtitle.style.opacity = 0;
          setTimeout(() => {
            subtitle.style.opacity = 1;
          }, 200);
        });
      }
    });

    const usuario = localStorage.getItem("loggedInUser");
    const corazon = document.querySelector(".heart");
  
    if (!usuario) {
      corazon.addEventListener("click", () => {
        alert("Debes iniciar sesión para guardar lavados como favoritos.");
      });
      return;
    }
  
    fetch("/favoritos")
      .then(res => res.json())
      .then(data => {
        const favoritos = data[usuario] || [];
  
        corazon.addEventListener("click", () => {
          // Obtener valores de sliders
          const temperatura = document.getElementById("temperatura").value + " °C";
          const duracion = document.getElementById("duracion").value + " min";
          const detergente = document.getElementById("detergente").value + " ml";
  
          // Obtener texto de subtítulos
          const suciedad = getCheckedText(0);
          const centrifugado = getCheckedText(2);
          const tejido = getCheckedText(5);
  
          // Contar cuántos personalizados ya hay
          const personalizadosPrevios = favoritos.filter(f => f.nombre?.startsWith("Lavado personalizado")).length;
          const nombre = `Lavado personalizado ${personalizadosPrevios + 1}`;
  
          const nuevoFav = {
            nombre,
            descripcion: `${suciedad || "Lavado a medida con configuración personalizada."}`,
            temperatura,
            duracion,
            centrifugado,
            detergente,
            imagen: "../../images/icono-personalizado.svg"
          };
  
          favoritos.push(nuevoFav);
          corazon.src = "../../../images/cora_relleno.svg";
          corazon.classList.add("activo");
  
          fetch("/guardar-favoritos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, favoritos })
          })
            .then(res => res.text())
            .then(msg => console.log("✅ Favorito guardado:", msg))
            .catch(err => console.error("❌ Error:", err));
        });
      });
  
    function getCheckedText(indexOption) {
      const option = document.querySelectorAll(".option")[indexOption];
      const checked = option.querySelector("input[type='checkbox']:checked");
      return checked ? checked.parentElement.textContent.trim() : "";
    }
  });
  
  