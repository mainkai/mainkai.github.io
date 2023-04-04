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
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
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



// (async () => {
//     const scene = document.querySelector('a-scene');
//     const userLatitude = scene.getAttribute('gps-camera').getAttribute('latitude');
//     const userLongitude = scene.getAttribute('gps-camera').getAttribute('longitude');

//     console.log('User location:', userLatitude, userLongitude);
//     showToast('User location fetched');
//     showDebugInfo(`User location: ${userLatitude.toFixed(5)}, ${userLongitude.toFixed(5)}`);

//     await updateCameraElevation(userLatitude, userLongitude);

//     const turbines = await fetchWindTurbines(userLatitude, userLongitude, 10000);
//     console.log('Wind turbines fetched:', turbines);
//     showToast('Wind turbines fetched');

//     for (const turbine of turbines) {
//       const elevation = await getElevation(turbine.lat, turbine.lon);
//       const turbineEntity = createWindTurbineEntity(turbine, elevation);
//       scene.appendChild(turbineEntity);
//     }
//   })();

window.onload = () => {
    let testEntityAdded = false;

    const el = document.querySelector("[gps-new-camera]");

    el.addEventListener("gps-camera-update-position", e => {
        if (!testEntityAdded) {
            alert(`Got first GPS position: lon ${e.detail.position.longitude} lat ${e.detail.position.latitude}`);

            console.log('User location:', e.detail.position.latitude, e.detail.position.longitude);
            showToast('User location fetched');
            showDebugInfo(`User location: ${e.detail.position.latitude.toFixed(5)}, ${e.detail.position.longitude.toFixed(5)}`);

            updateCameraElevation(userLatitude, userLongitude);

            // add wind turbines
            const turbines = fetchWindTurbines(userLatitude, userLongitude, 10000);
            console.log('Wind turbines fetched:', turbines);
            showToast('Wind turbines fetched');

            for (const turbine of turbines) {
                const elevation = getElevation(turbine.lat, turbine.lon);
                const turbineEntity = createWindTurbineEntity(turbine, elevation);
                document.querySelector("a-scene").appendChild(turbineEntity);
            }


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
    const entity = document.createElement('a-entity');
    entity.setAttribute('gps-entity-place', `latitude: ${turbine.lat}; longitude: ${turbine.lon}`);
    entity.setAttribute('geometry', 'primitive: cylinder; radius: 0.5; height: 10');
    entity.setAttribute('material', 'color: green');
    entity.setAttribute('scale', '5 5 5');
    entity.setAttribute('position', `0 ${altitude} 0`);
    return entity;
}

async function updateCameraElevation(latitude, longitude) {
    const elevation = await getElevation(latitude, longitude);
    const camera = document.querySelector('[gps-camera]');
    camera.setAttribute('position', `0 ${elevation} 0`);
}

function showToast(message, duration = 3000) {
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

function showDebugInfo(text) {
    const debugInfo = document.querySelector('#debugInfo');
    debugInfo.setAttribute('text', `value: ${text}; color: #FFF; width: 6;`);
}