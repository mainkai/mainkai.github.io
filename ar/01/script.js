window.onload = () => {
	staticLoadPlaces();
};

function staticLoadPlaces() {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			var json = JSON.parse(this.responseText);
			json = json.features
			console.log(json);
			let scene = document.querySelector('a-scene');
			for (var i = 0; i < json.length; i++) {
				// add wind turbine 3d model
				let latitude = json[i].geometry.coordinates[1];
				let longitude = json[i].geometry.coordinates[0];
				let local_height = json[i].properties.local_height;
				let gltf_file = "../02/assets/turbine/scene.gltf";

				let model = document.createElement('a-entity');
				model.setAttribute('gps-entity-place', "latitude: " + latitude + "; longitude: " + longitude + ";");
				model.setAttribute('gltf-model', `${gltf_file}`);
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
				let name = "Wind " + i;
				let hub_height_m = json[i].properties.hub_height_m;
				let upper_pos = local_height + hub_height_m;
				let desc = document.createElement('a-text');
				desc.setAttribute('gps-entity-place', `latitude: ${ latitude }; longitude: ${ longitude };`);
				desc.setAttribute('value', "Wind " + i);
				desc.setAttribute('position', `0 "${upper_pos}" 0`);
				desc.setAttribute('look-at', "[gps-camera]");
				desc.setAttribute('scale', '20 20 20');
				scene.appendChild(desc);
				console.log("added: " + name + " at: " + latitude + ", " + longitude + ", " + local_height + " m, " + hub_height_m + " m");
			}
		}
	};
	xmlhttp.open("GET", "./assets/wind_potential/placed_turbines.geojson", true);
	xmlhttp.send();
}
