import { FreeCamera } from "@babylonjs/core";

export function handleKeyDown(event: KeyboardEvent, keyPressed: {[key: string]: boolean}, camera: FreeCamera) {
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
			camera.position.x = 56;
			camera.position.y = 93;
			camera.position.z = -68;
			camera.rotation.x = 0.90;
			camera.rotation.y = 0.010;
			break;
		case '2' :
			camera.position.x = 58.7;
			camera.position.y = 84.15;
			camera.position.z = -47.60;
			camera.rotation.x = 1.07;
			camera.rotation.y = 0.002;
			break;
		case '3' :
			camera.position.x = 59.06;
			camera.position.y = 106.81;
			camera.position.z = -7.52;
			camera.rotation.x = 1.529
			camera.rotation.y = 0.005;
			break;
		case '4' :
			camera.position.x = 130.38;
			camera.position.y = 32.81;
			camera.position.z = -1.33;
			camera.rotation.x = 0.478
			camera.rotation.y = -1.581;
			break;
		case '5' :
			camera.position.x = -19.203;
			camera.position.y = 28.187;
			camera.position.z = -0.804;
			camera.rotation.x = 0.363
			camera.rotation.y = 1.570;
			break;
		case '6' :
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