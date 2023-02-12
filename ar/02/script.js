window.onload = () => {
	load_turbines_json();
	load_track_gpx();
};

window.addEventListener('gps-camera-update-position', e => {
	document.getElementById('lon').innerHTML = e.detail.position.longitude.toFixed(4);
	document.getElementById('lat').innerHTML = e.detail.position.latitude.toFixed(4);
	document.getElementById('dat').innerHTML = new Date().toLocaleString();
	update_own_elevation(e.detail.position.latitude.toFixed(4), e.detail.position.longitude.toFixed(4));
	
	// draw line to closest entity
	line_to_closest();
        });

// a simple memoize function that takes in a function
// and returns a memoized function
const memoize = (fn) => {
  let cache = {};
  return (...args) => {
    //let n = args[0];  // just taking one argument here
    let n = (() => {let concat = ''; for (let i = 0; i < args.length; i++) {concat += args[i];} return concat;})();
    if (n in cache) {
      console.log('Fetching from cache');
      return cache[n];
    }
    else {
      console.log('Calculating result');
      let result = fn(n);
      cache[n] = result;
      return result;
    }
  }
}

this.loaded = false;
function load_osm_ways(lat, lon, tags, link_by_or, radius, color) {
	if(this.loaded === true) {
		return;
	}
	query = "[timeout:900][out:json];(";
	if(link_by_or){
		for (var t = 0; t < tags.length; t+=2) {
			if(tags[t+1].length > 0){
				query += `way['${tags[t]}'='${tags[t+1]}'](around:${radius},${lat},${lon});`;
			}
			else {
				query += `way['${tags[t]}'](around:${radius},${lat},${lon});`;
			}
		}
	}
	else {
		// TODO
	}
	query += ");out body geom;";
	url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);
	console.log(url);
	fetch(url)
	  .then(response => response.json())
	  .then(json => {
		var camera = document.querySelector('[gps-projected-camera]');
		_cameraGps = camera.components['gps-projected-camera'];
		//var ele = camera.getAttribute('position')[1];
		ele = parseFloat(track_point.getElementsByTagName("ele")[0].innerHTML);
		// parse json
		console.log(json);
		ways = json.elements;
		console.log("found " + ways.length + " ways.");
		const track_ent = document.createElement('a-entity');
		for (var w = 0; w < ways.length; w++) {
			tags = json.elements[w].tags;
			nodes = json.elements[w].geometry;
			//console.log("way with tags " + tags);
			const line_ = document.createElement('a-entity');
			//line_.setAttribute('gps-projected-entity-place', `latitude: ${lat}; longitude: ${lon};`);
			var lastWorldPos;
			for (var n = 0; n < nodes.length; n++) {
				lat = nodes[n].lat;
				lon = nodes[n].lon;
				//console.log("node at " + lat + ", " + lon);
				var worldPos = _cameraGps.latLonToWorld(lat, lon);
				//console.log(worldPos);
				
				if(n > 0){	// add line from previous point
					line_.setAttribute('line__'+n, 
							   `start: ${lastWorldPos[0]} ${ele} ${lastWorldPos[1]}; `
							   +`end: ${worldPos[0]} ${ele} ${worldPos[1]}; `
							   +`color: ${color}`
							  );
				}
				lastWorldPos = worldPos;
			}
			line_.setAttribute('material', 'opacity: 0.5');
			track_ent.appendChild(line_);
		}
		let scene = document.querySelector('a-scene');
		scene.appendChild(track_ent);
		this.loaded = true;
	});
}

function line_to_closest() {
	// identify closest object
	//var elements = document.getElementsByTagName('a-entity');
	// filter gps-projected-entity-place
	//let camera = document.getElementsByTagName('a-camera')[0];
	var camera = document.querySelector('[gps-projected-camera]');
	var elements = document.querySelectorAll('[gps-projected-entity-place]');
	min_dist = Number.POSITIVE_INFINITY;
	min_idx = -1;
	console.log(elements.length + " elements, searching closest...");
	for (var i=0; i<elements.length; i++) {
		console.log(elements[i]);
		//var dist = dist(camera.getAttribute('position')[0], camera.getAttribute('position')[2], elements[i].getAttribute('position')[0], elements[i].getAttribute('position')[2]);
		var dist = elements[i].getAttribute('distance');
		console.log(i + ": " + dist + " m away.");
		if(dist <= min_dist){
			min_dist = dist;
			min_idx = i;
		}
		//dist = elements[i].getAttribute('distance');
		//dist = elements[i].getAttribute('distanceMsg');
		//let camera = document.getElementsByTagName('a-camera')[0];
		//var dist = elements[i].position.distanceTo(camera.getAttribute('position'));
		//const distance = elements[i].getAttribute('distance');
	}
	// draw line to closest
	closest = elements[min_idx];
	const line = document.createElement('a-entity');
	line.setAttribute('line', `start: 0 0 0; end: closest.position.x closest.position.y closest.position.z; color: white`);
	document.querySelector('a-scene').appendChild(line);
}

function load_turbines_json() {
	fetch("../assets/wind_potentials/Oberkirch/placed_turbines.geojson")
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

		console.log("added: Wind " + i + " at: " + latitude + ", " + longitude + ", " + local_height + " m, " + hub_height_m + " m, total_turbine_size " + total_turbine_size + " m");
	}
	console.log("loaded " + json.length + " wind turbines.");
}

function load_track_gpx() {
	fetch("../assets/tracks/2022-12-24_13-40_Sat Flow Trail kurz.gpx")
	  .then(response => response.text())
	  .then(text => add_track(text));
}

function add_track(text) {
	console.log(`parsing track...`);
	//console.log(`parsing ${text}...`);
	parser = new DOMParser();
	xmlDoc = parser.parseFromString(text,"text/xml");
	segments = xmlDoc.getElementsByTagName("gpx")[0].getElementsByTagName("trk")[0].getElementsByTagName("trkseg");
	try {
	  trk_name = xmlDoc.getElementsByTagName("gpx")[0].getElementsByTagName("trk")[0].getElementsByTagName("name")[0].innerHTML;
	} catch (error) {
	  console.error(error);
	  trk_name = "undefined";
	}
	console.log(`track ${trk_name} with ${segments.length} segments.`);
	
	// extract track starting point
	track_point = segments[0].getElementsByTagName("trkpt")[0]
	lat = track_point.getAttribute("lat");
	lon = track_point.getAttribute("lon");
	
	// add track name at starting point
	const track_ent = document.createElement('a-entity');
	const desc = document.createElement('a-text');
	desc.setAttribute('value', trk_name);
	desc.setAttribute('gps-projected-entity-place', `latitude: ${lat}; longitude: ${lon};`);
	desc.setAttribute('position', `0 ${50} 0`);
	desc.setAttribute('scale', '50 50 50');
	desc.setAttribute('look-at', "[gps-projected-camera]");
	track_ent.appendChild(desc);
	
	// add rotating greenventory logo at track starting point
	const gv_logo = document.createElement('a-entity');
	//gv_logo.setAttribute('gltf-model', '../assets/models/greenventory_logo/greenventory_logo_neu.glb');
	gv_logo.setAttribute('gltf-model', '../assets/models/greenventory_logo/greenventory_logo_neu_000000.glb');
	gv_logo.setAttribute('gps-projected-entity-place', `latitude: ${lat}; longitude: ${lon};`);
	gv_logo.setAttribute('position', `0 50 0`);
	//gv_logo.setAttribute('scale', `.2 .2 .2`);
	gv_logo.setAttribute('animation', `property: rotation; easing: linear; to: 0 -360 0; loop: true; dur: 5000`);
	track_ent.appendChild(gv_logo);
	const gv_logo2 = document.createElement('a-entity');
	gv_logo2.setAttribute('gltf-model', '../assets/models/greenventory_logo/greenventory_logo_neu_00ff00.glb');
	gv_logo2.setAttribute('gps-projected-entity-place', `latitude: ${lat}; longitude: ${lon};`);
	gv_logo2.setAttribute('position', `0 50 0`);
	//gv_logo2.setAttribute('scale', `.2 .2 .2`);
	gv_logo2.setAttribute('animation', `property: rotation; easing: linear; to: 0 360 0; loop: true; dur: 5000`);
	track_ent.appendChild(gv_logo2);
	console.log(`added logo at: (${lon}, ${lat})`);
	
	// add vertical line for each point
	for (var i = 0; i < segments.length; i++) {
		track_points = segments[i].getElementsByTagName("trkpt");
		for (var j = 0; j < track_points.length; j++) {
			track_point = track_points[j];
			lat = track_point.getAttribute("lat");
			lon = track_point.getAttribute("lon");
			ele = parseFloat(track_point.getElementsByTagName("ele")[0].innerHTML);
			console.log(`segment ${i}, track_point ${j}: (${lon}, ${lat}), ${ele} m`);
			
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
	url = `https://api.open-elevation.com/api/v1/lookup\?locations\=${lat},${lon}`;
	//url = `https://api.opentopodata.org/v1/srtm30m?locations=${lat},${lon}`;

	console.log("retrieving own elevation from "+url);
	fetch(url)
	  .then(response => response.json())
	  .then(json => {
	    //console.log(json);
	    let ele = parseFloat(json.results[0].elevation);
	    let camera = document.getElementsByTagName('a-camera')[0];
            const position = camera.getAttribute('position');
            position.y = ele + 1.6;
            camera.setAttribute('position', position);
	    console.log("set own elevation to: " + ele + "m");
	    document.getElementById('alt').innerHTML = ele;
		
		// load some ways from OSM
	    	console.log("loading OSM ways...");
		//load_osm_ways(lat, lon, ['highway', ''], true, 50, "black");
		load_osm_ways(lat, lon, ['power', 'line', 'power', 'minor_line', 'power', 'cable'], true, 5000, "red");
		load_osm_ways(lat, lon, ['type', 'gas', 'type', 'natural_gas', 'substance', 'gas', 'substance', 'natural_gas'], true, 5000, "yellow");
		load_osm_ways(lat, lon, ['type', 'heat', 'substance', 'heat'], true, 5000, "orange");
	  }
	);
}

//const update_own_elevation_memoized = memoize(update_own_elevation);

function dist(x1,y1,x2,y2) {
        var dx = x2-x1, dy = y2-y1;
        return Math.sqrt(dx*dx + dy*dy);
}

// find the distance from a point to a line
function haversineDistToLine(x, y, p1, p2) {
  // Calculate the dot product of vectors (x,y) and (p2-p1)
  var u = ((x-p1[0])*(p2[0]-p1[0])+(y-p1[1])*(p2[1]-p1[1])) / (Math.pow(p2[0]-p1[0],2)+Math.pow(p2[1]-p1[1],2));

  // Calculate the intersection point between the line segment defined by p1 and p2 and the perpendicular line passing through (x,y)
  var xintersection = p1[0]+u*(p2[0]-p1[0]), yintersection=p1[1]+u*(p2[1]-p1[1]);

  // Check if the intersection point is within the line segment defined by p1 and p2
  return (u>=0&&u<=1) ? 
  // If the intersection point is within the line segment, return the haversine distance between (x,y) and the intersection point, the coordinates of the intersection point, and the proportion of the distance between p1 and p2 that the intersection point is at
    {distance: this.haversineDist(x,y,xintersection,yintersection), intersection: [xintersection, yintersection], proportion:u} : 
    // If the intersection point is not within the line segment, return null
    null;
}

function haversineDist(lon1, lat1, lon2, lat2){            
	//Radius of the earth
	var R = 6371000;
	//Conversion of longitude and latitide differences to radians
	var dlon=(lon2-lon1)*(Math.PI / 180);
	var dlat=(lat2-lat1)*(Math.PI / 180);
	//Calculate sin of half of latitude and longitude difference
	var slat=Math.sin(dlat/2);
	var slon=Math.sin(dlon/2);
	//Calculate haversine distance
	var a = slat*slat + Math.cos(lat1*(Math.PI/180))*Math.cos(lat2*(Math.PI/180))*slon*slon;
	var c = 2 *Math.asin(Math.min(1,Math.sqrt(a)));
	//Return distance between two points
	return R*c;        
}

