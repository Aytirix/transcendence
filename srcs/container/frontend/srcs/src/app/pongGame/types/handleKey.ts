export function handleKeyDown(event: KeyboardEvent, keyPressed: {[key: string]: boolean}) {
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