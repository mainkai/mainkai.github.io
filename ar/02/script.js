window.onload = () => {
	load_turbines_json();
	load_track_gpx();
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
		//model.setAttribute('scale', `${rotor_diameter_m} ${total_turbine_size} ${rotor_diameter_m}`);
		//model.setAttribute('animation-mixer', '');
		const model = document.createElement('a-box');
		model.setAttribute('material', 'color: red; wireframe: true');
		model.setAttribute('gps-projected-entity-place', `latitude: ${latitude}; longitude: ${longitude};`);
		model.setAttribute('position', `0 ${local_height + .5 * total_turbine_size} 0`);
		model.setAttribute('height', total_turbine_size);
		model.setAttribute('width', rotor_diameter_m);
		model.setAttribute('depth', rotor_diameter_m);
		model.addEventListener('loaded', () => {
			window.dispatchEvent(new CustomEvent('gps-entity-place-loaded'))
		});
		
		// add line from turbine to text
		const line = document.createElement('a-entity');
		line.setAttribute('line', `start: 0 ${hub_height_m} 0; end: ${rotor_diameter_m} ${total_turbine_size + rotor_diameter_m} 0; color: gray`);
		line.setAttribute('line__1', `start: ${rotor_diameter_m} ${total_turbine_size + rotor_diameter_m} 0; end: ${rotor_diameter_m + 500} ${total_turbine_size + rotor_diameter_m} 0; color: gray`);
		line.setAttribute('look-at', "[gps-projected-camera]");
		model.appendChild(line);
		
		// add text description for turbine
		const desc = document.createElement('a-text');
		desc.setAttribute('value', `${i}: ${json[i].properties.model}, ${json[i].properties.p_nominal_kw} kW`);
		desc.setAttribute('position', `${-rotor_diameter_m} ${total_turbine_size + rotor_diameter_m + 10} 0`);
		desc.setAttribute('align', 'left');
		desc.setAttribute('baseline', 'bottom');
		desc.setAttribute('look-at', "[gps-projected-camera]");
		desc.setAttribute('scale', '500 500 500');
		model.appendChild(desc);
		
		scene.appendChild(model);

		//console.log("added: Wind " + i + " at: " + latitude + ", " + longitude + ", " + local_height + " m, " + hub_height_m + " m, total_turbine_size " + total_turbine_size + " m");
	}
	console.log("loaded " + json.length + " objects.");
}

function load_track_gpx() {
	fetch("../assets/tracks/2020-03-31 1844 Hausrunde__20200331_1844.gpx")
	  .then(response => add_track(response));
}

function add_track(text) {
	console.log(`parsing ${text}...`);
	parser = new DOMParser();
	xmlDoc = parser.parseFromString(text,"text/xml");
	console.log(`parsed xmlDoc: ${xmlDoc}...`);
	segments = xmlDoc.getElementsByTagName("gpx")[0].getElementsByTagName("trk")[0].getElementsByTagName("trkseg");
	
	for (var i = 0; i < segments.length; i++) {
		track_points = segments[i].getElementsByTagName("trkpt");
		for (var j = 0; j < track_points.length; j++) {
			track_point = track_points[j];
			lat = track_point.getAttribute("lat");
			lon = getAttribute("lon");
			ele = track_point.getElementsByTagName("ele")[0].nodeValue;
			console.log(`segment ${i}, track_point ${j}: (${lon}, ${lat}), ${ele} m`);
		}
	}
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
