// Inicializar el mapa centrado en UC3M Leganés (como fallback)
const mymap = L.map('sample_map').setView([40.3340, -3.7690], 10);

// Capa de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 19
}).addTo(mymap);

//MARCADOR UC3M LEGANÉS 
const uc3mMarker = L.marker([40.329415, -3.7638942], {
    icon: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    })
}).addTo(mymap);

uc3mMarker.bindPopup("<b>Residencia UC3M</b><br>Leganés").openPopup();

//MARCADOR COSLADA
const cosladaCity = L.marker([40.4296052, -3.5410666], {
    icon: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    })
}).addTo(mymap);
cosladaCity.bindPopup("<b>Bloomest</b><br>Coslada").openPopup();

//MARCADOR TOLEDO
const toledANO = L.marker([39.8664968, -4.0294517], {
    icon: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    })
}).addTo(mymap);
toledANO.bindPopup("<b>Lavandería de Santa Teresa</b><br>Toledo").openPopup();

//MARCADOR ILLESCAS
const illescacas = L.marker([40.1243023, -3.8469376], {
    icon: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    })
}).addTo(mymap);
illescacas.bindPopup("<b>La Colada</b><br>Illescas").openPopup();

// Marcador para la ubicación del usuario
let userMarker = null;



// Icono personalizado para el marcador (opcional)
const userIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Obtener la ubicación del usuario
function locateUser() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                // Centrar mapa en la ubicación del usuario
                mymap.setView([userLat, userLng], 16);

                // Eliminar marcador anterior si existe
                if (userMarker) {
                    mymap.removeLayer(userMarker);
                }

                // Añadir nuevo marcador
                userMarker = L.marker([userLat, userLng], { icon: userIcon })
                    .addTo(mymap)

                // Opcional: Añadir un círculo de precisión
                L.circle([userLat, userLng], {
                    color: '#0078A8',
                    fillColor: '#0078A8',
                    fillOpacity: 0.2,
                    radius: position.coords.accuracy / 1
                }).addTo(mymap);
            },
            (error) => {
                console.error("Error obteniendo ubicación: ", error);
                alert("No se pudo obtener tu ubicación. Usando ubicación por defecto (UC3M Leganés).");
            }
        );
    } else {
        alert("Tu navegador no soporta geolocalización. Usando ubicación por defecto.");
    }
}


// Intentar geolocalizar al cargar la página
locateUser();