window.onload = () => {
	load_turbines_json();
};

window.addEventListener('gps-projected-camera-update-position', e => {
	    console.log("updating own elevation...");
	    update_own_elevation(e.detail.position.latitude, e.detail.position.longitude);
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
	    console.log("set own elevation to: " + json.results[0].elevation + "m");
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
		let hub_height_m = json[i].properties.hub_height_m;
		let rotor_diameter_m = json[i].properties.rotor_diameter_m;
		let total_turbine_size = hub_height_m + .5 * rotor_diameter_m;

		//const model = document.createElement('a-entity');
		//model.setAttribute('gltf-model', '../assets/models/turbine/scene.gltf');
		//model.setAttribute('animation-mixer', '');
		const model = document.createElement('a-box');
		model.setAttribute('material', 'color: red; wireframe: true');
		model.setAttribute('gps-projected-entity-place', `latitude: ${latitude}; longitude: ${longitude};`);
		model.setAttribute('position', `0 ${local_height} 0`);
		model.setAttribute('scale', `${rotor_diameter_m} ${total_turbine_size} ${rotor_diameter_m}`);
		model.addEventListener('loaded', () => {
			window.dispatchEvent(new CustomEvent('gps-entity-place-loaded'))
		});
		
		// add line from turbine to text
		const line = document.createElement('a-entity');
		line.setAttribute('line__1', `start: 0 ${hub_height_m} 0; end: 0 ${total_turbine_size + 2} 0; color: gray`);
		line.setAttribute('line__2', `start: 0 ${total_turbine_size + 2} 0; end: 5 ${total_turbine_size + 2} 0; color: gray`);
		model.appendChild(line);
		
		// add descriptions text for turbine
		const desc = document.createElement('a-text');
		desc.setAttribute('value', `${i}: ${json[i].properties.model}`);
		desc.setAttribute('position', `0 ${total_turbine_size + 2} 0`);
		desc.setAttribute('look-at', "[gps-projected-camera]");
		desc.setAttribute('scale', '10 10 10');
		desc.setAttribute('align', 'center');
		model.appendChild(desc);
		
		scene.appendChild(model);

		//console.log("added: Wind " + i + " at: " + latitude + ", " + longitude + ", " + local_height + " m, " + hub_height_m + " m, total_turbine_size " + total_turbine_size + " m");
	}
	console.log("loaded " + json.length + " objects.");
}
