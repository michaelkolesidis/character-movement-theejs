import "./style.css";
import * as THREE from "three";
import * as dat from "lil-gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Basics
 */
// Debug panel
const gui = new dat.GUI();
gui.hide();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0088ff);

/**
 * Models
 */
const gltfLoader = new GLTFLoader();
let model = null;
let mixer = null;

let walk = null;
let lookAround = null;
let run = null;

gltfLoader.load(
  "/models/Fox/glTF/Fox.gltf",
  (gltf) => {
    model = gltf.scene.children[0];

    mixer = new THREE.AnimationMixer(model);
    walk = mixer.clipAction(gltf.animations[1]);
    lookAround = mixer.clipAction(gltf.animations[0]);
    run = mixer.clipAction(gltf.animations[2]);

    model.scale.set(0.025, 0.025, 0.025);
    scene.add(model);
  },
  () => {
    console.log("Model Loading");
  },
  () => {
    console.log("Error, model not loaded");
  }
);

/**
 * Ground
 */
const textureLoader = new THREE.TextureLoader();
const groundTexture = textureLoader.load("/textures/ground.png");
groundTexture.magFilter = THREE.NearestFilter;

groundTexture.repeat.set(64, 64);
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(160, 160),
  new THREE.MeshStandardMaterial({
    map: groundTexture,
    metalness: 0,
    roughness: 0.9,
  })
);
ground.receiveShadow = true;
ground.rotation.x = -Math.PI * 0.5;
scene.add(ground);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.castShadow = false;
// directionalLight.shadow.mapSize.set(1024, 1024);
// directionalLight.shadow.camera.far = 15;
// directionalLight.shadow.camera.left = -7;
// directionalLight.shadow.camera.top = 7;
// directionalLight.shadow.camera.right = 7;
// directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(-5, 5, 5);
scene.add(directionalLight);

/**
 * Fog
 */
const fog = new THREE.Fog("#0088ff", 10, 40);
scene.fog = fog;

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(2, 8, 12);
scene.add(camera);

// Orbit Controls
// const controls = new OrbitControls(camera, canvas);
// controls.target.set(0, 0.75, 0);
// controls.enableDamping = true;
// controls.zoomSpeed = 0.5;
// controls.maxDistance = 28;
// controls.minDistance = 4;
// controls.maxPolarAngle = Math.PI / 2 - 0.02;
// controls.minPolarAngle = Math.PI / 4;
// controls.minZoom = 20;
// controls.panSpeed = 0;
// controls.rotateSpeed = 0.7;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Movement controls
 */
let walkingSpeed = 0.1;
let runningSpeed = 0.3;

document.onkeydown = (e) => {
  // WALK
  // Up
  if (e.key === "ArrowUp") {
    if (model.rotation.y !== Math.PI) {
      model.rotation.y = Math.PI;
    }
    model.position.z -= walkingSpeed;
    walk.play();
  }

  // Down
  else if (e.key === "ArrowDown") {
    if (model.rotation.y !== 0) {
      model.rotation.y = 0;
    }
    model.position.z += walkingSpeed;
    walk.play(); // will play when we update the mixer on each frame
  }

  // Right
  else if (e.key === "ArrowRight") {
    if (model.rotation.y !== Math.PI / 2) {
      model.rotation.y = Math.PI / 2;
    }
    model.position.x += walkingSpeed;
    walk.play(); // will play when we update the mixer on each frame
  }

  // Left
  else if (e.key === "ArrowLeft") {
    if (model.rotation.y !== -Math.PI / 2) {
      model.rotation.y = -Math.PI / 2;
    }
    model.position.x -= walkingSpeed;
    walk.play(); // will play when we update the mixer on each frame
  }

  // LOOK AROUND
  else if (e.key === " ") {
    lookAround.play(); // will play when we update the mixer on each frame
  }
};

// Stop movement
document.onkeyup = (e) => {
  if (e.key === "ArrowUp") {
    walk.stop();
  } else if (e.key === "ArrowDown") {
    walk.stop();
  } else if (e.key === "ArrowRight") {
    walk.stop();
  } else if (e.key === "ArrowLeft") {
    walk.stop();
  } else if (e.key === " ") {
    lookAround.stop();
  }
};

/**
 * Camera movement
 */
const cameraOffset = new THREE.Vector3(-4.0, 4.0, 7.0); // distance between camera and object
let modelPosition = new THREE.Vector3();
camera.position.copy(modelPosition).add(cameraOffset);

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const animate = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // update mixer
  if (mixer) {
    mixer.update(deltaTime);
  }

  if (model) {
    model.getWorldPosition(modelPosition);
  }

  // Update orbit controls
  // controls.update();

  // Update camera
  camera.position.copy(modelPosition).add(cameraOffset);
  camera.lookAt(modelPosition);

  // Render
  renderer.render(scene, camera);

  // Call animate again on the next frame
  window.requestAnimationFrame(animate);
};

animate();

/**
 * Help box
 */
const help = document.createElement("div");
help.setAttribute("id", "help");

const walkText = document.createElement("p");
walkText.innerText = `WALK: Arrows`;
help.appendChild(walkText);

const runText = document.createElement("p");
runText.innerText = `RUN: Arrows + Ctrl`;
help.appendChild(runText);

const lookAroundText = document.createElement("p");
lookAroundText.innerText = `LOOK AROUND: Space`;
help.appendChild(lookAroundText);

const close = document.createElement("div");
close.setAttribute("id", "close");
close.innerText = `✕`;

close.addEventListener("click", () => {
  help.style.opacity = 0;
  helpShown = false;
});

document.addEventListener("keydown", (e) => {
  console.log(e);
  if (e.key === "i" || e.key === "I" || e.key === "Ι" || e.key === "ι") {
    help.style.opacity = 1;
  }
});

help.appendChild(close);
document.body.appendChild(help);

/**
 * Title
 */
const title = document.createElement("h1");
title.setAttribute("id", "title");
title.innerHTML = `
<span id="fantastic">( Not so Fantastic )</span>
<br>
Mr. Fox
`;
document.body.appendChild(title);
