import { FreeCamera } from "@babylonjs/core";

export function handleKeyDown(event: KeyboardEvent, keyPressed: {[key: string]: boolean}, camera: FreeCamera) {
	console.log(event.key);
	switch (event.key) {
		case 'ArrowLeft' :
			keyPressed.p1_down = true;
			break;
		case 'ArrowRight' :
			keyPressed.p1_up = true;
			break;
		case 'a' :
			keyPressed.p2_up = true;
			break;
		case 'd' :
			keyPressed.p2_down = true;
			break;
		case '1' :
			camera.position.x = 71.376;
			camera.position.y = 91.805;
			camera.position.z = -67.399;
			camera.rotation.x = 0.908;
			camera.rotation.y = -0.136;
			break;
		case '2' :
			camera.position.x = 130.38;
			camera.position.y = 32.81;
			camera.position.z = -1.33;
			camera.rotation.x = 0.478
			camera.rotation.y = -1.581;
			break;
		case '3' :
			camera.position.x = -19.203;
			camera.position.y = 28.187;
			camera.position.z = -0.804;
			camera.rotation.x = 0.363
			camera.rotation.y = 1.570;
			break;
		case '4' :
			camera.position.x = 338.131;
			camera.position.y = 136.188;
			camera.position.z = -481.417;
			camera.rotation.x = 0.280;
			camera.rotation.y = -0.561;
			break;
	}
}

export function handleKeyUp(event: KeyboardEvent, keyPressed: {[key: string]: boolean}) {
		switch (event.key) {
		case 'ArrowLeft' :
			keyPressed.p1_down = false;
			break;
		case 'ArrowRight' :
			keyPressed.p1_up = false;
			break;
		case 'a' :
			keyPressed.p2_up = false;
			break;
		case 'd' :
			keyPressed.p2_down = false;
			break;
	}
}