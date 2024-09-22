import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const rgbeLoader = new RGBELoader();
rgbeLoader.load('public/HDRI/studio_small_09_4k.hdr', function (texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping; // Ensure correct mapping for reflections

  scene.background = Cubetexture; // Set as background for the scene (optional)
  scene.environment = texture; // Set as the environment for reflections
});




const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(3, 1, 15);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 20;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.5;
controls.autoRotate = false;
controls.target = new THREE.Vector3(0, 1, 0);
controls.update();

const groundGeometry = new THREE.PlaneGeometry(40, 40, 32, 32);
groundGeometry.rotateX(-Math.PI / 2);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x000000,
  metalness: .4,
  roughness:0.5,
  side: THREE.DoubleSide
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.castShadow = false;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

const spotLight = new THREE.SpotLight(0xffffff, 3000, 100, 0.22, 1);
spotLight.position.set(0, 25, 0);
spotLight.castShadow = true;
spotLight.shadow.bias = -0.0001;
scene.add(spotLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.1));

let mixer;
let animationActions = [];
let firstAction;
let animationPlaying = false;  // Track if animation is currently playing

const loader = new GLTFLoader().setPath('public/toon_robot/');
loader.load(
  'scene.gltf',
  (gltf) => {
    console.log('Model loaded');
    const model = gltf.scene;

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
      }
    });

    

    model.position.set(0, 0, -1);
    gltf.scene.scale.set(1.5, 1.5, 1.5);
    scene.add(model);

    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);

      gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        animationActions.push(action);
      });

      // Set first frame pose (time = 0)
      firstAction = animationActions[0]; // Assuming the first animation
      firstAction.play();  // Play it once
      firstAction.paused = true;  // Pause at frame 1
      firstAction.time = 0;  // Set to frame 1
      mixer.update(0);  // Force mixer to update to frame 1 pose
    }

    document.getElementById('progress-container').style.display = 'none';
  },
  (xhr) => {
    console.log(`Loading: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
  },
  (error) => {
    console.error('An error occurred:', error);
  }
);

// Toggle play/pause on button click
document.getElementById('playAnimation').addEventListener('click', () => {
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  if (mixer && firstAction) {
    if (firstAction.paused) {
      firstAction.paused = false;  // Resume the animation
      playIcon.style.display = 'none';  // Hide play icon
      pauseIcon.style.display = 'inline';  // Show pause icon
      animationPlaying = true;
      console.log("Animation started");
    } else {
      firstAction.paused = true;  // Pause the animation
      playIcon.style.display = 'inline';  // Show play icon
      pauseIcon.style.display = 'none';  // Hide pause icon
      animationPlaying = false;
      console.log("Animation paused");
    }
  } else {
    console.log("Animation or mixer not initialized");
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  controls.update();
  renderer.render(scene, camera);
}

animate();
