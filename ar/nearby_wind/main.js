async function fetchWindTurbines(latitude, longitude, radius) {
    const query = `
        [out:json];
        (
        node["power"="generator"]["generator:source"="wind"](around:${radius},${latitude},${longitude});
        way["power"="generator"]["generator:source"="wind"](around:${radius},${latitude},${longitude});
        relation["power"="generator"]["generator:source"="wind"](around:${radius},${latitude},${longitude});
        );
        out body;
        >;
        out skel qt;
    `;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    console.log(`fetching wind turbines from: ${url}`);
    const response = await fetch(url);
    const data = await response.json();
    return data.elements;
}

function createWindTurbineEntity(turbine) {
    const entity = document.createElement('a-entity');
    entity.setAttribute('gps-entity-place', `latitude: ${turbine.lat}; longitude: ${turbine.lon}`);
    entity.setAttribute('geometry', 'primitive: cylinder; radius: 0.5; height: 10');
    entity.setAttribute('material', 'color: green');
    entity.setAttribute('scale', '5 5 5');
    return entity;
}

window.onload = () => {
    let testEntityAdded = false;

    const el = document.querySelector("[gps-new-camera]");

    el.addEventListener("gps-camera-update-position", e => {
        if (!testEntityAdded) {
            // console.log('User location:', e.detail.position.latitude, e.detail.position.longitude);
            showToast(`User location: ${e.detail.position.latitude.toFixed(5)}, ${e.detail.position.longitude.toFixed(5)}`);

            updateCameraElevation(e.detail.position.latitude, e.detail.position.longitude);

            // add wind turbines (in 50 km radius)
            fetchWindTurbines(e.detail.position.latitude, e.detail.position.longitude, 50000)
            .then((turbines) => {
                showToast(`got ${turbines.length} wind turbines`);

                for (const turbine of turbines) {
                    const elevation = getElevation(turbine.lat, turbine.lon);
                    const turbineEntity = createWindTurbineEntity(turbine, elevation);
                    document.querySelector("a-scene").appendChild(turbineEntity);
                }
            })
            .catch((err) => {
                console.error(err);
            });


            // Add a box to the north of the initial GPS position
            const entity = document.createElement("a-box");
            entity.setAttribute("scale", {
                x: 20,
                y: 20,
                z: 20
            });
            entity.setAttribute('material', {
                color: 'red'
            });
            entity.setAttribute('gps-new-entity-place', {
                latitude: e.detail.position.latitude + 0.001,
                longitude: e.detail.position.longitude
            });
            document.querySelector("a-scene").appendChild(entity);


        }
        testEntityAdded = true;
    });
};



function createWindTurbineEntity(turbine, altitude) {
    // TODO: check
    // https://ar-js-org.github.io/AR.js-Docs/location-based/#projection-details
    // The key method is the latLonToWorld(lat, lon) method of the gps-new-camera and gps-projected-camera components. This converts latitude and longitude directly to world coordinates, performing the projection as the first step and then calculating the world coordinates from the projected coordinates. It will return a 2-member array containing the x and z world coordinates, allowing the developer to calculate or specify the y coordinate (altitude) independently.
    // const camera = document.querySelector("[gps-new-camera]");
    // const [worldX, worldZ] = camera.components["gps-new-camera"].latLonToWorld(lat,lon);

    const entity = document.createElement('a-entity');
    entity.setAttribute('gps-entity-place', `latitude: ${turbine.lat}; longitude: ${turbine.lon}`);
    entity.setAttribute('geometry', 'primitive: cylinder; radius: 0.5; height: 10');
    entity.setAttribute('material', 'color: green');
    entity.setAttribute('scale', '100 200 100');
    entity.setAttribute('position', `0 ${altitude} 0`);
    return entity;
}

async function updateCameraElevation(latitude, longitude) {
    const elevation = await getElevation(latitude, longitude);
    const camera = document.querySelector('[gps-new-camera]');
    camera.setAttribute('position', `0 ${elevation + 1.6} 0`);
    showToast(`camera elevation set to: ${elevation + 1.6}`);
}

function showToast(message, duration = 3000) {
    console.log(`showing toast: ${message}`)
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '10px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    toast.style.color = 'white';
    toast.style.padding = '10px';
    toast.style.borderRadius = '5px';
    toast.style.zIndex = '1000';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        document.body.removeChild(toast);
    }, duration);
}

const tileCache = {};

async function fetchTile(url) {
  if (tileCache[url]) {
    return tileCache[url];
  }

  console.log(`fetching tile from: ${url}`);
  const response = await fetch(url);
  const blob = await response.blob();
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      tileCache[url] = ctx;
      resolve(ctx);
    };

    img.onerror = (err) => {
      reject(err);
    };
  });
}

async function getElevation(lat, lng, zoom = 15) {  // max Zoom is 15 -> resolution ~4.777m/pixel -> 1,2km x 1,2km per tile https://wiki.openstreetmap.org/wiki/Zoom_levels
  const tileSize = 256;

  // pre-calculate multiplicator to reuse for tile number and pixels calculation
  const xMul = ((lng + 180) / 360) * Math.pow(2, zoom);
  // const yMul = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) * Math.pow(2, zoom - 1);
  const yMul = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);  // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_(JavaScript/ActionScript,_etc.)

  const tileX = Math.floor(xMul);
  const tileY = Math.floor(yMul);

  const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${zoom}/${tileX}/${tileY}.png`;

  const ctx = await fetchTile(url);

  const pixelX = Math.floor(xMul * tileSize) % tileSize;
  const pixelY = Math.floor(yMul * tileSize) % tileSize;

  const imageData = ctx.getImageData(pixelX, pixelY, 1, 1);
  const [r, g, b] = imageData.data;

  const elevation = (r * 256 + g + b / 256) - 32768;
  //console.log(`got elevation: ${elevation} meters`);
  showToast(`got elevation: ${elevation} m for ${lat}, ${lng}`);
  return elevation;
}

// // Usage
// getElevation(37.7749, -122.4194)
//   .then((elevation) => {
//     console.log(`Elevation at given coordinates: ${elevation} meters`);
//   })
//   .catch((err) => {
//     console.error(err);
//   });
