// --- script/guardar-prendas.js ---
socket.on('connect', () => {
  console.log('🧺 guardar-prendas conectado con ID:', socket.id);
});


// Variable global para guardar temporalmente el resultado del escaneo mientras el popup está abierto
let resultadoScanActual = null;
const DARK_L_THRESHOLD = 35;  // % de Luminosidad por debajo = Oscuro
const LIGHT_L_THRESHOLD = 75; // % de Luminosidad por encima = Claro


// (Asegúrate de que la función auxiliar getSymbolName esté definida antes)
function getSymbolName(detectedString) {
    if (!detectedString || typeof detectedString !== 'string' || detectedString === 'No detectado') {
        return null;
    }
    // Extraer el nombre antes del primer espacio (ej: "lavado_40" de "lavado_40 (0.95)")
    // O devolver el string completo si no hay espacio (por si acaso)
    const parts = detectedString.split(' ');
    return parts[0];
}


function checkCompatibility(scanResult, lavado) {
    if (!lavado) return { compatible: false, razon: "Error: No se encontró el lavado seleccionado." };

    console.log("Comprobando compatibilidad:", scanResult, "con Lavado:", lavado);

    // --- Compatibilidad de Etiqueta ---
    if (scanResult.type === 'etiqueta') {
        const simbolosDetectados = scanResult.data; // Ej: {'Temperatura': 'lavado_40 (0.95)', 'Delicadeza': 'lavado_delicado (0.88)', ...}
        let razonesIncompatibilidad = [];

        // 1. Comprobar "No Lavar" (Sin Cambios)
        const tempSymbolName = getSymbolName(simbolosDetectados['Temperatura']);
        if (tempSymbolName === 'lavado_no') {
            razonesIncompatibilidad.push("La etiqueta indica 'No Lavar'.");
            return { compatible: false, razon: razonesIncompatibilidad.join(' ') };
        }

        // 2. Comprobar Temperatura (Sin Cambios)
        const tempLavado = parseInt(lavado.temperatura);
        if (tempSymbolName && tempSymbolName.startsWith('lavado_') && !tempSymbolName.includes('mano') && tempSymbolName !== 'lavado_no' && tempSymbolName !== 'lavado_normal') {
            try {
                 const tempMaxSimbolo = parseInt(tempSymbolName.split('_')[1]);
                 if (!isNaN(tempLavado) && !isNaN(tempMaxSimbolo) && tempLavado > tempMaxSimbolo) {
                     razonesIncompatibilidad.push(`Temperatura del lavado (${tempLavado}°) supera la máxima de la etiqueta (${tempMaxSimbolo}°).`);
                 }
            } catch (e) {
                 console.error("Error parseando temperatura del símbolo:", tempSymbolName, e);
            }
        }
        // Advertencia sobre lavado a mano (Sin Cambios)
        if (tempSymbolName === 'lavado_a_mano' && lavado.nombre?.toLowerCase() !== 'lavado a mano') {
             console.warn("Advertencia: Etiqueta indica lavado a mano, programa seleccionado no lo es explícitamente.");
        }


        // 3. Comprobar Lejía (Sin Cambios)
        const lejiaSymbolName = getSymbolName(simbolosDetectados['Lejía']);
        const usaLejiaLavado = lavado.detergente?.toLowerCase().includes('lejía') || lavado.detergente?.toLowerCase().includes('bleach');

        if (lejiaSymbolName === 'lejia_no' && usaLejiaLavado) {
            razonesIncompatibilidad.push("La etiqueta indica 'No usar Lejía', pero el lavado parece incluirla.");
        }
        if (lejiaSymbolName === 'lejia_si' && !usaLejiaLavado) {
            console.log("Info: Etiqueta permite lejía, pero el lavado no la incluye.");
        }

        // --- 4. Comprobar Delicadeza vs Centrifugado (RPM) ---
        const delicadezaSymbolName = getSymbolName(simbolosDetectados['Delicadeza']);

        const rpmLavadoStr = lavado.centrifugado; // Obtener el valor de RPM del objeto lavado
        let rpmLavado = NaN;

        if (rpmLavadoStr !== undefined && rpmLavadoStr !== null) {
            // Intentar convertir a número (quitando "rpm" si lo tuviera)
            rpmLavado = parseInt(String(rpmLavadoStr).replace(/[^0-9]/g, ''), 10);
        }

        console.log(`Check Delicadeza: Simbolo='${delicadezaSymbolName}', RPM Lavado='${rpmLavadoStr}' (parsed as ${rpmLavado})`);

        // Solo realizar el check si tenemos ambos datos: símbolo de delicadeza y un RPM válido
        if (delicadezaSymbolName && !isNaN(rpmLavado)) {
            const maxRpmPermitidoDelicado = 700; // Límite definido

            // Lista de símbolos que requieren centrifugado bajo
            const simbolosDelicados = ['lavado_delicado', 'lavado_muy_delicado', 'lavado_a_mano'];

            if (simbolosDelicados.includes(delicadezaSymbolName)) {
                // Si el símbolo es delicado y las RPM superan el límite
                if (rpmLavado > maxRpmPermitidoDelicado) {
                    // Añadir razón de incompatibilidad
                    razonesIncompatibilidad.push(`Centrifugado (${rpmLavado} RPM) es demasiado alto para etiqueta '${delicadezaSymbolName}' (máx ${maxRpmPermitidoDelicado} RPM).`);
                }
            }
            // Si el símbolo es 'lavado_normal', no hacemos nada, es compatible con todo.
            else if (delicadezaSymbolName === 'lavado_normal') {
                 console.log("Símbolo 'lavado_normal' detectado, compatible con cualquier RPM.");
            }
        } else if (delicadezaSymbolName && isNaN(rpmLavado)) {
            // Si tenemos símbolo pero no RPM, podríamos mostrar advertencia o no hacer nada
            console.warn(`No se pudo determinar el RPM del lavado ('${rpmLavadoStr}') para comprobar compatibilidad con símbolo '${delicadezaSymbolName}'.`);
        } else if (!delicadezaSymbolName) {
            console.log("No se detectó símbolo de delicadeza claro para comprobar RPM.");
        }
        // --- Fin Sección 4 ---


        // Resultado final para etiqueta (Sin Cambios)
        if (razonesIncompatibilidad.length > 0) {
            return { compatible: false, razon: razonesIncompatibilidad.join(' ') };
        } else {
             const algunSimboloUtil = tempSymbolName || getSymbolName(simbolosDetectados['Delicadeza']) || lejiaSymbolName;
             if (!algunSimboloUtil || algunSimboloUtil === 'No detectado') {
                  return { compatible: true, razon: "No se detectaron símbolos claros, compatibilidad asumida." };
             }
            return { compatible: true, razon: "Símbolos de etiqueta parecen compatibles." };
        }
    }
    // --- Compatibilidad de Color (SIN CAMBIOS aquí) ---
    else if (scanResult.type === 'color') {
        // ... (tu lógica de color existente, sin cambios) ...
        const colorData = scanResult.data;
        const L = parseFloat(colorData.L);
        let tipoColada = 'colores';
        if (lavado.tipoColada && ['blancos', 'colores', 'oscuros'].includes(lavado.tipoColada)) {
            tipoColada = lavado.tipoColada;
        }
        else if (lavado.nombre === 'Lavado Ropa Blanca') tipoColada = 'blancos';
        else if (lavado.nombre === 'Lavado Ropa Oscura') tipoColada = 'oscuros';
        else if (lavado.tejido) {
            const tejidoSeleccionado = lavado.tejido.toLowerCase();
            if (tejidoSeleccionado === 'blanco') tipoColada = 'blancos';
            else if (tejidoSeleccionado === 'color') tipoColada = 'colores';
            else tipoColada = 'colores';
        } else {
             console.log("Usando 'colores' por defecto para tipo colada.");
        }
        console.log("Tipo colada final determinado:", tipoColada);
        if (tipoColada === 'blancos' && L < LIGHT_L_THRESHOLD) {
             return { compatible: false, razon: `Color ${colorData.hex} (${colorData.tone}) podría desteñir en lavado de Blancos.` };
        }
        if (tipoColada === 'oscuros' && L > DARK_L_THRESHOLD) {
             return { compatible: false, razon: `Color claro ${colorData.hex} (${colorData.tone}) podría mancharse en lavado de Oscuros.` };
        }
        if (tipoColada === 'colores' && (L < DARK_L_THRESHOLD || L > LIGHT_L_THRESHOLD)) {
            console.log(`Advertencia leve: Prenda (${colorData.hex} / ${colorData.tone}) es muy oscura/clara para 'Colores Mixtos'.`);
        }
        return { compatible: true, razon: `Color ${colorData.hex} (${colorData.tone}) parece compatible con lavado de tipo '${tipoColada}'.` };
    }
    // --- Tipo Desconocido (Sin Cambios) ---
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
        socket.emit('updateServerDisplay', JSON.parse(localStorage.getItem('lavadoSeleccionado')));

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