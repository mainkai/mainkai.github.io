window.onload = () => {
	load_turbines_json();
	load_track_gpx();
	//load_osm_ways();
};

window.addEventListener('gps-camera-update-position', e => {
	console.log("Event: gps-projected-camera-update-position");
	document.getElementById('lon').innerHTML = e.detail.position.longitude.toFixed(4);
	document.getElementById('lat').innerHTML = e.detail.position.latitude.toFixed(4);
	document.getElementById('dat').innerHTML = new Date().toLocaleString();
	
	update_own_elevation(e.detail.position.latitude, e.detail.position.longitude);
	
	// identify closest object
	var elements = document.getElementsByTagName('a-entity');
	min_dist = Number.POSITIVE_INFINITY;
	min_idx = -1;
	for (var i=0; i<elements.length; i++) {
		dist = elements[i].getAttribute('distance');
		//dist = elements[i].getAttribute('distanceMsg');
		//var dist = camera.position.distanceTo(elements[i].position)
		console.log(i + ": " + dist + " m away.");
		if(dist <= min_dist){
			min_dist = dist;
			min_idx = i;
		}
	}
	// draw line to closest
	closest = elements[min_idx];
	const line = document.createElement('a-entity');
	line.setAttribute('line', `start: 0 0 0; end: closest.position.x closest.position.y closest.position.z; color: white`);
	document.querySelector('a-scene').appendChild(line);
        });

function load_turbines_json() {
	fetch("../assets/wind_potentials/Achern/placed_turbines.geojson")
	  .then(response => response.json())
	  .then(json => load_turbines_from_json(json));
}

function load_turbines_from_json(json) {
	json = json.features
	//console.log(json);
	let scene = document.querySelector('a-scene');
	for (var i = 0; i < json.length; i++) {
		// add wind turbine 3D model
		let latitude = json[i].geometry.coordinates[1];
		let longitude = json[i].geometry.coordinates[0];
		let local_height = json[i].properties.local_height;
		let hub_height_m = json[i].properties.hub_height_m;
		let rotor_diameter_m = json[i].properties.rotor_diameter_m;
		let total_turbine_size = hub_height_m + .5 * rotor_diameter_m;

		const model = document.createElement('a-entity');
		//model.setAttribute('gltf-model', '../assets/models/turbine/scene.gltf');
		model.setAttribute('gltf-model', '../assets/models/generic_wind_turbine_v136_125.5h_145d/scene.gltf');
		//model.setAttribute('scale', `${rotor_diameter_m} ${total_turbine_size} ${rotor_diameter_m}`);
		model.setAttribute('animation-mixer', '');
		//const model = document.createElement('a-box');
		//model.setAttribute('material', 'color: red; wireframe: true');
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
		line.setAttribute('line', `start: 0 ${hub_height_m} 0; end: ${rotor_diameter_m} ${total_turbine_size + rotor_diameter_m} 0; color: white`);
		line.setAttribute('line__1', `start: ${rotor_diameter_m} ${total_turbine_size + rotor_diameter_m} 0; end: ${rotor_diameter_m + 50} ${total_turbine_size + rotor_diameter_m} 0; color: white`);
		line.setAttribute('look-at', "[gps-projected-camera]");
		model.appendChild(line);
		
		// add text description for turbine
		const desc = document.createElement('a-text');
		desc.setAttribute('value', `${i}: ${json[i].properties.model}, ${json[i].properties.p_nominal_kw} kW`);
		desc.setAttribute('position', `${-rotor_diameter_m - 60} ${total_turbine_size + rotor_diameter_m} 0`);
		desc.setAttribute('align', 'left');
		//desc.setAttribute('baseline', 'bottom');
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
	  .then(response => response.text())
	  .then(text => add_track(text));
}

function add_track(text) {
	//console.log(`parsing ${text}...`);
	parser = new DOMParser();
	xmlDoc = parser.parseFromString(text,"text/xml");
	segments = xmlDoc.getElementsByTagName("gpx")[0].getElementsByTagName("trk")[0].getElementsByTagName("trkseg");
	trk_name = xmlDoc.getElementsByTagName("gpx")[0].getElementsByTagName("trk")[0].getElementsByTagName("name")[0].innerHTML;
	
	const track_ent = document.createElement('a-entity');
	const desc = document.createElement('a-text');
	desc.setAttribute('value', trk_name);
	desc.setAttribute('gps-projected-entity-place', `latitude: ${segments[0].getElementsByTagName("trkpt")[0].getAttribute("lat")}; longitude: ${segments[0].getElementsByTagName("trkpt")[0].getAttribute("lon")};`);
	desc.setAttribute('position', `0 ${50} 0`);
	desc.setAttribute('scale', '50 50 50');
	desc.setAttribute('look-at', "[gps-projected-camera]");
	track_ent.appendChild(desc);
	
	// add vertical line for each point
	for (var i = 0; i < segments.length; i++) {
		track_points = segments[i].getElementsByTagName("trkpt");
		for (var j = 0; j < track_points.length; j++) {
			track_point = track_points[j];
			lat = track_point.getAttribute("lat");
			lon = track_point.getAttribute("lon");
			ele = parseFloat(track_point.getElementsByTagName("ele")[0].innerHTML);
			//console.log(`segment ${i}, track_point ${j}: (${lon}, ${lat}), ${ele} m`);
			
			const line_ = document.createElement('a-entity');
			line_.setAttribute('gps-projected-entity-place', `latitude: ${lat}; longitude: ${lon};`);
			line_.setAttribute('line', `start: 0 ${ele} 0; end: 0 ${ele+50} 0; color: green`);
			//if(j < track_points.length - 1){	// add line to next point
			//	line_.setAttribute('line__2', `start: 0 ${ele} 0; end: 0 ${ele+50} 0; color: green`);
			//}
			line_.setAttribute('material', 'opacity: 0.5');
			track_ent.appendChild(line_);
		}
	}
	let scene = document.querySelector('a-scene');
	scene.appendChild(track_ent);
	/*
	for (var i = 0; i < segments.length; i++) {
		track_points = segments[i].getElementsByTagName("trkpt");
		for (var j = 0; j < track_points.length - 1; j++) {
			// add polygon for each segment
			let points = []; //vertices of Your shape
			points.push( new THREE.Vector2( 0, 0 ) );
			points.push( new THREE.Vector2( 3, 0 ) );
			points.push( new THREE.Vector2( 5, 2 ) );
			points.push( new THREE.Vector2( 5, 5 ) );
			const mesh = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(points)), new THREE.MeshBasicMaterial({color: f.properties.color, opacity: this.data.opacity, transparent: true}));
			this.el.setObject3D(mesh);
		}
	}
	*/
}

function update_own_elevation(lat, lon) {
	//url = `https://api.open-elevation.com/api/v1/lookup\?locations\=${lat},${lon}`;
	url = `https://api.opentopodata.org/v1/srtm30m?locations=${lat},${lon}`;

	console.log("retrieving own elevation from "+url);
	fetch(url)
	  .then(response => response.json())
	  .then(json => {
	    console.log(json);
	    let ele = parseFloat(json.results[0].elevation);
	    let camera = document.getElementsByTagName('a-camera')[0];
            const position = camera.getAttribute('position');
            position.y = ele + 1.6;
            camera.setAttribute('position', position);
	    console.log("set own elevation to: " + ele + "m");
	    document.getElementById('alt').innerHTML = ele;
	  }
	);
}
