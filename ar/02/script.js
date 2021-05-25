window.onload = () => {
	load_turbines_json();
};

window.addEventListener('gps-camera-update-position', e => {
	    update_own_elevation(e.detail.position.e.detail.position.longitude, lon);
        });

function load_turbines_json() {
	fetch("../assets/wind_potentials/Achern/placed_turbines.geojson")
	  .then(response => response.json())
	  .then(json => load_turbines_from_json(json));
}

function update_own_elevation(lat, lon) {
	// get elevation
	fetch(`https://api.open-elevation.com/api/v1/lookup\?locations\=${lat},${lon}`)
	  .then(response => response.json())
	  .then(json => {
            const position = this.camera.getAttribute('position');
            position.y = json.results[0].elevation + 1.6;
            this.camera.setAttribute('position', position);
	    console.log("set own elevation to: " + json.results[0].elevation + "m")
	}
	);
	//.then(json => console.log("elevation result: " + json.results[0].elevation + "m"));
}

function load_turbines_from_json(json) {
	json = json.features
	console.log(json);
	let scene = document.querySelector('a-scene');
	for (var i = 0; i < json.length; i++) {
		// add wind turbine 3D model
		let latitude = json[i].geometry.coordinates[1];
		let longitude = json[i].geometry.coordinates[0];
		let local_height = json[i].properties.local_height;
		let total_turbine_size = json[i].properties.hub_height_m + .5 * json[i].properties.rotor_diameter_m;

		const model = document.createElement('a-entity');
		model.setAttribute('gps-entity-place', "latitude: " + latitude + "; longitude: " + longitude + ";");
		model.setAttribute('gltf-model', '../assets/models/turbine/scene.gltf');
		model.setAttribute('position', `0 ${local_height} 0`);
		model.setAttribute('rotation', "0 180 0");
		model.setAttribute('animation-mixer', '');
		model.setAttribute('scale', `${total_turbine_size} ${total_turbine_size} ${total_turbine_size}`);
		model.setAttribute('animation-mixer', '');
		model.addEventListener('loaded', () => {
			window.dispatchEvent(new CustomEvent('gps-entity-place-loaded'))
		});
		
		// add descriptions text for turbine
		const desc = document.createElement('a-text');
		// desc.setAttribute('gps-entity-place', `latitude: ${ latitude }; longitude: ${ longitude };`);
		desc.setAttribute('value', "Wind " + i);
		desc.setAttribute('position', '0 2 0');
		desc.setAttribute('look-at', "[gps-camera]");
		desc.setAttribute('scale', '20 20 20');
		model.appendChild(desc);
		
		scene.appendChild(model);

		console.log("added: Wind " + i + " at: " + latitude + ", " + longitude + ", " + local_height + " m, " + json[i].properties.hub_height_m + " m");
	}
	//alert("loaded " + json.length + " objects.");
}
