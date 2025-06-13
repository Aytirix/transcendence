import {
  Engine,
  Scene,
  FreeCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  LoadAssetContainerAsync,
  DirectionalLight,
  Color4,
  Mesh,
  AbstractMesh,
  Color3,
  StandardMaterial,
} from '@babylonjs/core';

import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic';
registerBuiltInLoaders();

export type BabylonInitResult = {
  scene: Scene;
  engine: Engine;
  ball: Mesh;
  paddle1: Mesh;
  paddle2: Mesh;
  galactic: AbstractMesh;
  camera: FreeCamera;
};

export async function initBabylon(canvas: HTMLCanvasElement) : Promise<BabylonInitResult> {
	const engine = new Engine(canvas, true);
	const scene = new Scene(engine);
	const thanos = await LoadAssetContainerAsync("/images/thanos-danse.glb", scene);
	thanos.addAllToScene();
	const ironman = await LoadAssetContainerAsync("/images/ironman-fight.glb", scene);
	ironman.addAllToScene();
	const galactic = await LoadAssetContainerAsync("/images/galactic3d.glb", scene);
	galactic.addAllToScene();
	const galacticMesh = galactic.meshes.find(mesh => mesh.name === "Sphere__0")!;
	galacticMesh.rotationQuaternion = null;
	const accessories1 = await LoadAssetContainerAsync("/images/SpaceCraft1.glb", scene);
	accessories1.addAllToScene();

	thanos.meshes.forEach(mesh => {
		mesh.scaling = new Vector3(2.3, 2.3, 2.3);
		mesh.position = new Vector3(190, 1.28, 0);
		mesh.rotation.y = 1.3;
		mesh.rotation.x = 0;
		mesh.rotation.z = 0;
	})

	ironman.meshes.forEach(mesh => {
		mesh.scaling = new Vector3(1.6, 1.6, 1.6);
		mesh.position = new Vector3(0, 1.28, 0);
		mesh.rotation.y = -1;
		mesh.rotation.x = 0;
		mesh.rotation.z = 0;
	})
	galactic.meshes.forEach(mesh => {
		mesh.scaling = new Vector3(2, 2, 2);
		mesh.position = new Vector3(0, 0, 0);
		mesh.rotation.y = 0;
		mesh.rotation.x = 0;
		mesh.rotation.z = 0;
	})
	accessories1.meshes.forEach(mesh => {
		mesh.scaling = new Vector3(2, 2, 2);
		mesh.position = new Vector3(227, 99, -105);
		mesh.rotation.y = 0;
		mesh.rotation.x = 0;
		mesh.rotation.z = 0;
	})

	// Caméra
	const camera = new FreeCamera("camera1", new Vector3(60, 60, -70), scene);
	camera.setTarget(Vector3.Zero());
	// camera.keysDown = [];
	// camera.keysUp = [];
	// camera.keysLeft = [];
	// camera.keysRight = [];
	camera.attachControl(canvas, true);
	camera.position.x = -1209;
	camera.position.y = 21.71;
	camera.position.z = -1.446;
	camera.rotation.x = 0.081;
	camera.rotation.y = 1.599;
	

	// Lumière principale
	const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
	light.intensity = 1.8;
	
	// Lumière directionnelle pour ombres réalistes
	const dirLight = new DirectionalLight("dirLight", new Vector3(-3, -2, 0), scene);
	dirLight.position = new Vector3(5, 10, -5);
	
	// Raquette et balle
	const paddle1 = MeshBuilder.CreateBox("paddle1", { width: 0.1, height: 0.2, depth: 1 }, scene);
	paddle1.position.set(20, 4, 0);
	paddle1.scaling = new Vector3(10, 10 ,10)
	const greenMaterial = new StandardMaterial("greenMat", scene);
	greenMaterial.diffuseColor = new Color3(0, 1, 0);
	paddle1.material = greenMaterial;
	paddle1.enableEdgesRendering();
	paddle1.edgesWidth = 15;
	paddle1.edgesColor = new Color4(1, 0, 0, 1);

	const ball = MeshBuilder.CreateSphere("ball", { diameter: 2 }, scene);
	ball.position.set(30, 4, 0);


	const paddle2 = MeshBuilder.CreateBox("paddle2", { width: 0.1, height: 0.2, depth: 1 }, scene);
	paddle2.position.set(98, 4, 0);
	paddle2.scaling = new Vector3(10, 10 ,10)
	const blueMaterial = new StandardMaterial("blueMat", scene);
	blueMaterial.diffuseColor = new Color3(0, 0, 1);
	paddle2.material = blueMaterial;
	paddle2.enableEdgesRendering();
	paddle2.edgesWidth = 15;
	paddle2.edgesColor = new Color4(1, 0, 0, 1);
	
	// terrain ping pong 
	
	const cube = MeshBuilder.CreateBox("cube", {width: 8, height: 0.001, depth: 6.1}, scene);
	cube.scaling = new Vector3(10, 10 ,10)
	cube.position.set(59, 4, 0);
	cube.enableEdgesRendering();
	cube.edgesWidth = 25;
	cube.edgesColor = new Color4(1, 0, 0, 1);
	cube.visibility = 0.01;

	return ({scene, engine, ball, paddle1, paddle2, galactic: galacticMesh, camera});	
}