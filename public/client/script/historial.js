document.addEventListener("DOMContentLoaded", () => {
    const usuario = localStorage.getItem("loggedInUser");
    if (!usuario) return;
  
    const contenedor = document.getElementById("historial-container");
  
    Promise.all([
      fetch(`/lavados/${usuario}`).then(res => res.json()),
      fetch("/favoritos").then(res => res.json())
    ]).then(([lavados, favoritosData]) => {
      const favoritos = favoritosData[usuario] || [];
  
      lavados.forEach(lavado => {
        const fechaInicio = parseFecha(lavado.fechaInicio);
        const fechaStr = fechaBonita(fechaInicio);
        const horaInicio = formatHora(fechaInicio);
        const horaFin = calcularHoraFin(fechaInicio, lavado.duracion);
  
        const isFavorito = favoritos.some(fav => fav.nombre === lavado.nombre);
  
        const section = document.createElement("section");
        section.classList.add("lavado");
  
        section.innerHTML = `
          <h2>${fechaStr}</h2>
          <div class="lavado-card">
            <img src="${lavado.imagen}" class="icon" alt="${lavado.nombre}" />
            <div class="info">
              <h3 class="hist-title">${lavado.nombre}</h3>
              <p class="hist-hour">${horaInicio} - ${horaFin}</p>
              <div class="lavado-button">
                <button class="button">EMPEZAR</button>
            </div>
            </div>
            <img src="../../../images/${isFavorito ? "cora_relleno" : "corazon"}.svg" class="heart ${isFavorito ? "activo" : ""}" />
          </div>
        `;
  
        contenedor.appendChild(section);
      });
    });
  });
  
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
  