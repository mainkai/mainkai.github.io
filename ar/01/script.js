window.onload = () => {
     let places = staticLoadPlaces();
     console.log("got places: " + places);
     renderPlaces(places);
};

function staticLoadPlaces() {
     var xmlhttp = new XMLHttpRequest();
     /*xmlhttp.onreadystatechange = function() {
       if (this.readyState == 4 && this.status == 200) {
         var json = JSON.parse(this.responseText);
         json = json.features
         console.log(json); // this will show the info it in firebug console
          for (var i = 0; i < json.length; i++){
               json[i].name = "Wind " + i;
               json[i].location = {}
               json[i].location.lat = json[i].geometry.coordinates[1];
               json[i].location.lon = json[i].geometry.coordinates[0];
          }
          return json
       }
     };*/
     xmlhttp.open("GET", "./assets/wind_potential/placed_turbines.geojson", true);
     xmlhttp.send();
     //while (xmlhttp.readyState != 4) {}
     if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
         var json = JSON.parse(xmlhttp.responseText);
         json = json.features
         console.log(json); // this will show the info it in firebug console
          for (var i = 0; i < json.length; i++){
               json[i].name = "Wind " + i;
               json[i].location = {};
               json[i].location.lat = json[i].geometry.coordinates[1];
               json[i].location.lon = json[i].geometry.coordinates[0];
          }
          return json;
       }
     else {
          console.log("got status: " + xmlhttp.status);
          return [];
     }
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
        let local_height = place.local_height;

        let model = document.createElement('a-entity');
        model.setAttribute('gps-entity-place', `latitude: ${latitude}; longitude: ${longitude};`);
        model.setAttribute('gltf-model', '../02/assets/turbine/scene.gltf');
        model.setAttribute('position', `0 ${local_height} 0`);
        model.setAttribute('rotation', '0 180 0');
        model.setAttribute('animation-mixer', '');
        model.setAttribute('scale', '30 30 30');

        model.addEventListener('loaded', () => {
            window.dispatchEvent(new CustomEvent('gps-entity-place-loaded'))
        });

        scene.appendChild(model);
         
         
        let name = place.name;
        let upper_pos = place.local_height + place.hub_height_m;
         
        let desc = document.createElement('a-text');
        desc.setAttribute('gps-entity-place', `latitude: ${latitude}; longitude: ${longitude};`);
        desc.setAttribute('value', `0 ${name} 0`);
        desc.setAttribute('position', `0 ${upper_pos} 0`);
        desc.setAttribute('look-at', "[gps-camera]");
        desc.setAttribute('scale', '20 20 20');
        scene.appendChild(desc);
    });
}
