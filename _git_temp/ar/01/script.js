window.onload = () => {
     let places = staticLoadPlaces();
     renderPlaces(places);
};

function staticLoadPlaces() {
     $.getJSON("./assets/wind_potential/placed_turbines.geojson", function(json) {
         console.log(json); // this will show the info it in firebug console
          json = json.features
          for (var i = 0; i < json.length; i++){
               json[i].name = "Wind " + i;
               json[i].location.lat = json[i].geometry.coordinates[1];
               json[i].location.lon = json[i].geometry.coordinates[0];
          }
          
          return json
     });
    /*return [
        {
            name: 'wind_hg',
            location: {
                lat: 48.607377,
                lng: 8.201714,
            }
        },
        {
            name: 'wind_home',
            location: {
                lat: 48.628049,
                lng: 8.082099,
            }
        },
    ];*/
}

function renderPlaces(places) {
    let scene = document.querySelector('a-scene');

    places.forEach((place) => {
        let latitude = place.location.lat;
        let longitude = place.location.lng;

        let model = document.createElement('a-entity');
        model.setAttribute('gps-entity-place', `latitude: ${latitude}; longitude: ${longitude};`);
        model.setAttribute('gltf-model', './assets/wind_turbine_01/windturbine.gltf');
        model.setAttribute('rotation', '0 180 0');
        model.setAttribute('animation-mixer', '');
        model.setAttribute('scale', '0.5 0.5 0.5');

        model.addEventListener('loaded', () => {
            window.dispatchEvent(new CustomEvent('gps-entity-place-loaded'))
        });

        scene.appendChild(model);
    });
}
