// Initialize the scene
const scene = new THREE.Scene();

// Set up the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Set up the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xeeeeee); // Set a clear color for better visibility
document.getElementById('threejs-container').appendChild(renderer.domElement);

// Add a directional light source with increased intensity
const directionalLight1 = new THREE.DirectionalLight(0xffffff, 2);
directionalLight1.position.set(5, 5, 5).normalize();
scene.add(directionalLight1);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 2);
directionalLight2.position.set(-5, 5, 5).normalize();
scene.add(directionalLight2);

const directionalLight3 = new THREE.DirectionalLight(0xffffff, 2);
directionalLight3.position.set(5, -5, 5).normalize();
scene.add(directionalLight3);

const directionalLight4 = new THREE.DirectionalLight(0xffffff, 2);
directionalLight4.position.set(5, 5, -5).normalize();
scene.add(directionalLight4);

// Add an ambient light source with increased intensity
const ambientLight = new THREE.AmbientLight(0x404040, 3); // Soft white light, increased intensity
scene.add(ambientLight);

// Add point lights to illuminate the model from different angles
const pointLight1 = new THREE.PointLight(0xffffff, 1.5);
pointLight1.position.set(0, 5, 5);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xffffff, 1.5);
pointLight2.position.set(-5, -5, 5);
scene.add(pointLight2);

const pointLight3 = new THREE.PointLight(0xffffff, 1.5);
pointLight3.position.set(5, -5, -5);
scene.add(pointLight3);

// Add OrbitControls for zooming and rotating
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable smooth damping
controls.dampingFactor = 0.25;
controls.enableZoom = true; // Enable zooming
controls.enableRotate = true; // Enable rotating

// Load the GLTF model
const loader = new THREE.GLTFLoader();
let mannequinMixer, necklaceMixer;
let actions = {};
const clock = new THREE.Clock(); // Add clock for accurate delta time
let currentModel;
let currentNecklace;
let currentActionName;

function loadModel(url, isNecklace = false) {
    if (!isNecklace && currentModel) {
        scene.remove(currentModel);
        currentModel = null;
        mannequinMixer = null;
    }
    if (isNecklace && currentNecklace) {
        scene.remove(currentNecklace);
        currentNecklace = null;
        necklaceMixer = null;
    }

    loader.load(
        url,
        (gltf) => {
            const model = gltf.scene;
            model.scale.set(1, 1, 1); // Adjust scale if needed
            model.position.set(0, -1, 0); // Adjust position if needed
            scene.add(model);

            const mixer = new THREE.AnimationMixer(model);
            if (isNecklace) {
                currentNecklace = model;
                necklaceMixer = mixer;
            } else {
                currentModel = model;
                mannequinMixer = mixer;
            }

            console.log(`Animations in ${url}:`);
            gltf.animations.forEach((clip, index) => {
                console.log(`${index + 1}. Name: ${clip.name}, Duration: ${clip.duration.toFixed(2)} seconds`);
                const actionName = clip.name;
                if (!actions[actionName]) {
                    actions[actionName] = { mannequin: null, necklace: null };
                }
                if (isNecklace) {
                    actions[actionName].necklace = mixer.clipAction(clip);
                    if (currentActionName === actionName && actions[actionName].mannequin) {
                        actions[actionName].necklace.play().time = actions[actionName].mannequin.time;
                    }
                } else {
                    actions[actionName].mannequin = mixer.clipAction(clip);
                }
            });

            // Log camera animations if present
            const cameraAnimations = gltf.animations.filter(clip => clip.name.toLowerCase().includes('camera'));
            if (cameraAnimations.length > 0) {
                console.log('Camera Animations:');
                cameraAnimations.forEach((clip, index) => {
                    console.log(`${index + 1}. Name: ${clip.name}, Duration: ${clip.duration.toFixed(2)} seconds`);
                });
            } else {
                console.log('No camera animations found.');
            }

            // Update animation buttons
            updateAnimationButtons();
        },
        undefined,
        (error) => console.error("Error loading model", error)
    );
}

// Function to update animation buttons
function updateAnimationButtons() {
    const animationButtonsContainer = document.querySelector('.animation-buttons');
    animationButtonsContainer.innerHTML = ''; // Clear existing buttons

    Object.keys(actions).forEach(actionName => {
        const button = document.createElement('button');
        button.textContent = actionName;
        button.addEventListener('click', () => playAction(actionName));
        animationButtonsContainer.appendChild(button);
    });
}

// Handle Navbar buttons
['handButton', 'earButton', 'chainButton', 'watchButton', 'glassesButton'].forEach((id) => {
    document.getElementById(id).addEventListener('click', () => {
        loadModel('models/Mannequin Animation Test.glb');
    });
});

// Handle Necklace buttons
document.getElementById('necklace1Button').addEventListener('click', () => {
    loadModel('models/necklace1.glb', true);
});

document.getElementById('necklace2Button').addEventListener('click', () => {
    loadModel('models/necklace2.glb', true);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    if (mannequinMixer) mannequinMixer.update(deltaTime);
    if (necklaceMixer) necklaceMixer.update(deltaTime);
    controls.update(); // Update the controls
    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Load the initial model
loadModel('models/MannequinAnimationTest.glb');

// Animation button functionality
function stopAllActions() {
    for (let actionName in actions) {
        const action = actions[actionName];
        if (action.mannequin) action.mannequin.stop();
        if (action.necklace) action.necklace.stop();
    }
}

function playAction(actionName) {
    stopAllActions();
    currentActionName = actionName;
    const action = actions[actionName];
    if (action.mannequin) action.mannequin.reset().play();
    if (action.necklace) action.necklace.reset().play();
}