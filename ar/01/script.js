window.onload = () => {
	staticLoadPlaces();
};

function staticLoadPlaces() {
	
	fetch("./assets/wind_potential/placed_turbines.geojson")
	  .then(response => response.json())
	  .then(json => load_turbines_from_json(json))
	  .then(json => console.log(json));
	
	/*
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			var json = JSON.parse(this.responseText);
			load_turbines_from_json(json);
		}
	};
	xmlhttp.open("GET", "./assets/wind_potential/placed_turbines.geojson", true);
	xmlhttp.send();
	*/
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

		let model = document.createElement('a-entity');
		model.setAttribute('gps-entity-place', "latitude: " + latitude + "; longitude: " + longitude + ";");
		model.setAttribute('gltf-model', '../02/assets/turbine/scene.gltf');
		model.setAttribute('position', {
			x: 0,
			y: local_height, 
			z: 0
		    });
		model.setAttribute('rotation', "0 180 0");
		model.setAttribute('animation-mixer', '');
		model.setAttribute('scale', '30 30 30');
		model.addEventListener('loaded', () => {
			window.dispatchEvent(new CustomEvent('gps-entity-place-loaded'))
		});
		scene.appendChild(model);

		// add descriptions text for turbine
		let desc = document.createElement('a-text');
		desc.setAttribute('gps-entity-place', `latitude: ${ latitude }; longitude: ${ longitude };`);
		desc.setAttribute('value', "Wind " + i);
		desc.setAttribute('position', `0 "${local_height + json[i].properties.hub_height_m}" 0`);
		desc.setAttribute('look-at', "[gps-camera]");
		desc.setAttribute('scale', '20 20 20');
		scene.appendChild(desc);
		console.log("added: " + name + " at: " + latitude + ", " + longitude + ", " + local_height + " m, " + json[i].properties.hub_height_m + " m");
	}
}
