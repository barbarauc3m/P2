// --- script/guardar-prendas.js ---

// Variable global para guardar temporalmente el resultado del escaneo mientras el popup está abierto
let resultadoScanActual = null;
const DARK_L_THRESHOLD = 35;  // % de Luminosidad por debajo = Oscuro
const LIGHT_L_THRESHOLD = 75; // % de Luminosidad por encima = Claro


// --- Lógica de Compatibilidad ---

function checkCompatibility(scanResult, lavado) {
    if (!lavado) return { compatible: false, razon: "Error: No se encontró el lavado seleccionado." };

    console.log("Comprobando compatibilidad:", scanResult, "con Lavado:", lavado);

    // --- Compatibilidad de Etiqueta ---
    if (scanResult.type === 'etiqueta') {
        const simbolos = scanResult.data;
        let razonesIncompatibilidad = [];

        // 1. Comprobar "No Lavar"
        if (simbolos['Temperatura/Metodo']?.symbol === 'lavado_no') {
            razonesIncompatibilidad.push("La etiqueta indica 'No Lavar'.");
            // Si no se puede lavar, el resto de checks no importan tanto
            return { compatible: false, razon: razonesIncompatibilidad.join(' ') };
        }

        // 2. Comprobar Temperatura
        const tempSimbolo = simbolos['Temperatura/Metodo']?.symbol; // ej: "lavado_40", "lavado_a_mano"
        const tempLavado = parseInt(lavado.temperatura); // ej: 40

        if (tempSimbolo && tempSimbolo.startsWith('lavado_') && !tempSimbolo.includes('mano')) {
            const tempMaxSimbolo = parseInt(tempSimbolo.split('_')[1]);
            if (!isNaN(tempLavado) && !isNaN(tempMaxSimbolo) && tempLavado > tempMaxSimbolo) {
                razonesIncompatibilidad.push(`Temperatura del lavado (${tempLavado}°) supera la máxima de la etiqueta (${tempMaxSimbolo}°).`);
            }
        }
        // Considerar lavado a mano? Si el lavado no es a mano, sería incompatible? Depende de tu lógica.

        // 3. Comprobar Lejía
        const lejiaSimbolo = simbolos['Lejia']?.symbol; // ej: "lejia_no", "lejia_si"
        // Necesitamos saber si el lavado USA lejía. Asumimos que 'detergente' puede indicarlo?
        // Esto es una suposición, deberías tener una propiedad más clara como 'usaLejia: true/false'
        const usaLejiaLavado = lavado.detergente?.toLowerCase().includes('lejía') || lavado.detergente?.toLowerCase().includes('bleach'); // Suposición simple

        if (lejiaSimbolo === 'lejia_no' && usaLejiaLavado) {
            razonesIncompatibilidad.push("La etiqueta indica 'No usar Lejía', pero el lavado parece incluirla.");
        }
        if (lejiaSimbolo === 'lejia_si' && !usaLejiaLavado) {
            // Esto no es necesariamente 'incompatible', quizás solo una observación
            console.log("Info: Etiqueta permite lejía, pero el lavado no la incluye.");
        }

        // 4. Comprobar Delicadeza (Requiere mapeo o info extra en 'lavado')
        const delicadezaSimbolo = simbolos['Delicadeza']?.symbol; // ej: "lavado_delicado", "lavado_muy_delicado", "lavado_normal"
        // Necesitamos saber qué tan delicado es el programa del 'lavado' actual.
        // Ejemplo: si lavado.programa es "Sintéticos" podría ser delicado, "Algodón" normal...
        // Añade tu lógica aquí si tienes cómo comparar la delicadeza.
        // Ejemplo simple (necesitarás ajustar):
        /*
        const esLavadoDelicado = lavado.programa?.toLowerCase().includes('delicado') || lavado.programa?.toLowerCase().includes('sintetico');
        if (delicadezaSimbolo === 'lavado_muy_delicado' && !esLavadoDelicado) { // Asumiendo que un lavado no delicado daña ropa muy delicada
            razonesIncompatibilidad.push("Programa de lavado podría ser demasiado agresivo para etiqueta 'Muy Delicado'.");
        }
        */

        // Resultado final para etiqueta
        if (razonesIncompatibilidad.length > 0) {
            return { compatible: false, razon: razonesIncompatibilidad.join(' ') };
        } else {
            return { compatible: true, razon: "Símbolos de etiqueta parecen compatibles." };
        }
    }
    // --- Compatibilidad de Color ---
    else if (scanResult.type === 'color') {
        const colorData = scanResult.data; // { hex, L, tone }
        const L = parseFloat(colorData.L);

        // *** DETERMINAR TIPO DE COLADA ***
        // Intenta obtenerlo de lavado.tipoColada (MEJOR OPCIÓN si lo añades al crear el lavado)
        // Si no existe, intenta inferirlo del nombre (Opción Menos Fiable)
        let tipoColada = 'colores'; // Por defecto
        if (lavado.tipoColada) {
             tipoColada = lavado.tipoColada; // blancos, colores, oscuros
        } else if (lavado.nombre) {
             const nombreLowerCase = lavado.nombre.toLowerCase();
             if (nombreLowerCase.includes('blanco') || nombreLowerCase.includes('claro')) {
                 tipoColada = 'blancos';
             } else if (nombreLowerCase.includes('oscuro') || nombreLowerCase.includes('negro')) {
                 tipoColada = 'oscuros';
             }
        }
         console.log("Tipo colada inferido para check:", tipoColada);

        // Reglas de compatibilidad de color
        if (tipoColada === 'blancos' && L < LIGHT_L_THRESHOLD) {
             return { compatible: false, razon: `Color ${colorData.hex} (${colorData.tone}) podría desteñir en lavado de Blancos.` };
        }
        if (tipoColada === 'oscuros' && L > DARK_L_THRESHOLD) {
             return { compatible: false, razon: `Color claro ${colorData.hex} (${colorData.tone}) podría mancharse en lavado de Oscuros.` };
        }
        // Añadir advertencia opcional para colores mixtos si es muy claro/oscuro?
        if (tipoColada === 'colores' && (L < DARK_L_THRESHOLD || L > LIGHT_L_THRESHOLD)) {
           console.log(`Info: Prenda (${colorData.hex} / ${colorData.tone}) es muy oscura/clara para 'Colores Mixtos'.`);
           // Podríamos devolver compatible:true pero con una advertencia en la razón, o dejarlo compatible sin más.
           // return { compatible: true, razon: `Color ${colorData.hex} (${colorData.tone}) es muy oscuro/claro. Añadir con precaución a 'Colores Mixtos'.` };
        }

        // Si pasa los checks
        return { compatible: true, razon: `Color ${colorData.hex} (${colorData.tone}) parece compatible con lavado de ${tipoColada}.` };
    }
    // --- Tipo Desconocido ---
    else {
        return { compatible: false, razon: "Tipo de escaneo desconocido." };
    }
}

// --- Funciones del Popup ---

function mostrarPopupCompatibilidad(scanResult) {
    resultadoScanActual = scanResult; // Guarda el resultado actual para usarlo en 'añadirPrendaConfirmada'
    const lavado = JSON.parse(localStorage.getItem('lavadoSeleccionado'));
    const compatibilidad = checkCompatibility(scanResult, lavado);

    const popup = document.getElementById("popup-compatibilidad");
    if (!popup) {
        console.error("Error: No se encuentra el elemento #popup-compatibilidad en el HTML.");
        return;
    }
    const titulo = popup.querySelector(".popup-titulo"); // Asume que tienes un h2 con esta clase dentro
    const mensaje = popup.querySelector(".popup-mensaje"); // Asume que tienes un p con esta clase
    const razon = popup.querySelector(".popup-razon");     // Asume que tienes un p con esta clase

    // Comprobar si los elementos existen antes de usarlos
     if (!titulo || !mensaje || !razon) {
         console.error("Error: Faltan elementos .popup-titulo, .popup-mensaje o .popup-razon dentro de #popup-compatibilidad.");
         return;
     }

    if (compatibilidad.compatible) {
        titulo.textContent = "¡PRENDA COMPATIBLE!";
        mensaje.textContent = "Esta prenda parece ser compatible con los ajustes del lavado seleccionado.";
        razon.textContent = `Detalle: ${compatibilidad.razon}`;
        titulo.style.color = "#28a745"; // Verde (Bootstrap success)
    } else {
        titulo.textContent = "¡PRENDA NO COMPATIBLE!";
        mensaje.textContent = "Cuidado, esta prenda podría dañarse o dañar otras con los ajustes seleccionados.";
        razon.textContent = `Razón: ${compatibilidad.razon}`;
        titulo.style.color = "#dc3545"; // Rojo (Bootstrap danger)
    }

    popup.style.display = "flex"; // Muestra el popup
}

function cerrarPopupCompatibilidad() {
    const popup = document.getElementById("popup-compatibilidad");
    if (popup) {
        popup.style.display = "none";
    }
    resultadoScanActual = null; // Limpia el resultado temporal
}

function anadirPrendaConfirmada() {
    if (!resultadoScanActual) {
        console.error("No hay resultado de escaneo para añadir.");
        cerrarPopupCompatibilidad();
        return;
    }

    const lavadoJSON = localStorage.getItem('lavadoSeleccionado');
    if (!lavadoJSON) {
        console.error("No se encontró 'lavadoSeleccionado' en localStorage.");
        cerrarPopupCompatibilidad();
        return;
    }

    try {
        const lavado = JSON.parse(lavadoJSON);

        // Inicializa el array si no existe
        if (!Array.isArray(lavado.prendasEscaneadas)) {
            lavado.prendasEscaneadas = [];
        }

        // Genera ID único simple (podría mejorarse si es necesario)
        const index = lavado.prendasEscaneadas.length + 1;
        const nuevaPrenda = {
            id: `prenda${index}`,
            scanType: resultadoScanActual.type, // 'etiqueta' o 'color'
            scanData: resultadoScanActual.data // El objeto con hex/L o los símbolos
        };

        lavado.prendasEscaneadas.push(nuevaPrenda);

        // Guarda el objeto lavado ACTUALIZADO de vuelta en localStorage
        localStorage.setItem('lavadoSeleccionado', JSON.stringify(lavado));

        console.log("Prenda añadida al lavado:", nuevaPrenda);
        console.log("Estado del lavado actualizado en localStorage:", lavado);
        alert("Prenda añadida al lavado actual.");

        // Opcional: Actualizar la UI en empezar-lavado.html para mostrar las prendas añadidas

    } catch (e) {
        console.error("Error al añadir prenda o actualizar localStorage:", e);
        alert("Hubo un error al intentar añadir la prenda.");
    }

    cerrarPopupCompatibilidad();
}

function cancelarAnadirPrenda() {
    console.log("Adición de prenda cancelada.");
    cerrarPopupCompatibilidad();
}


// --- Inicialización y Listener Principal ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("guardar-prendas.js cargado y DOM listo.");

    // 1. Comprobar si hay un resultado de escaneo pendiente en sessionStorage
    const resultadoJSON = sessionStorage.getItem('ultimoResultadoScan');
    if (resultadoJSON) {
        sessionStorage.removeItem('ultimoResultadoScan'); // ¡Limpia SIEMPRE después de leer!
        try {
            const scanResult = JSON.parse(resultadoJSON);
            console.log("Resultado de escaneo recuperado de sessionStorage:", scanResult);
            // Usamos un pequeño retraso para asegurar que otros scripts/elementos estén listos
            setTimeout(() => mostrarPopupCompatibilidad(scanResult), 150);
        } catch (e) {
            console.error("Error al parsear resultado del scan desde sessionStorage:", e);
        }
    } else {
         console.log("No se encontraron resultados de escaneo pendientes en sessionStorage.");
    }

    // 2. Añadir listeners a los botones del popup de compatibilidad
    // Asegúrate de que estos IDs existen en tu HTML dentro del popup
    const btnAnadir = document.getElementById('btn-anadir-prenda');
    const btnCancelar = document.getElementById('btn-cancelar-prenda');
    const closeBtn = document.querySelector('#popup-compatibilidad .close-btn'); // Asume un botón de cierre

    if (btnAnadir) {
        btnAnadir.addEventListener('click', anadirPrendaConfirmada);
    } else {
        console.warn("Botón #btn-anadir-prenda no encontrado.");
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', cancelarAnadirPrenda);
    } else {
        console.warn("Botón #btn-cancelar-prenda no encontrado.");
    }

     if (closeBtn) {
         closeBtn.addEventListener('click', cerrarPopupCompatibilidad);
     } else {
          console.warn("Botón .close-btn dentro de #popup-compatibilidad no encontrado.");
     }

     // Listener para cerrar popup haciendo clic fuera (opcional pero útil)
     const popupCompatibilidad = document.getElementById("popup-compatibilidad");
     if (popupCompatibilidad) {
         popupCompatibilidad.addEventListener('click', function(event) {
             // Si se hace clic directamente sobre el fondo del popup (no en el contenedor interno)
             if (event.target === popupCompatibilidad) {
                 cancelarAnadirPrenda();
             }
         });
     }

});