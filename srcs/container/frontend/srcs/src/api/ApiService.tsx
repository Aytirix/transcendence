import notification from '../app/components/Notifications';

class ApiService {
	private static apiURL = `https://${window.location.hostname}:7000`;
	private static url = `https://${window.location.hostname}:3000`;

	static async request(path: string, method: string, body?: JSON) : Promise<any> {
		const headers = new Headers({
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		});

		const config: RequestInit = {
			method,
			headers,
			credentials: 'include'
		};

		if (body) {
			config.body = JSON.stringify(body);
		}

		try {
			const response = await fetch(`${this.apiURL}${path}`, config);
			const resJson = await response.json();
			resJson.ok =  response.ok;
			if (resJson.message) {
				if (response.ok) {
					notification.success(resJson.message);
				}
				else {
					notification.error(resJson.message);
				}
			}
			return resJson;
		} catch (error) {
			console.error('Error during fetch:', error);
			throw new Error('Network error');
		}
	}

	static async get(endpoint: string, body?: JSON) {
		return this.request(endpoint, 'GET', body);
	}

	static async post(endpoint: string, body?: JSON) {
		return this.request(endpoint, 'POST', body);
	}

	static async put(endpoint: string, body?: JSON) {
		return this.request(endpoint, 'PUT', body);
	}

	static async delete(endpoint: string, body?: JSON) {
		return this.request(endpoint, 'DELETE', body);
	}

	static async uploadFile(endpoint: string, formData: FormData) {
		const config: RequestInit = {
			method: 'POST',
			body: formData,
			credentials: 'include',
		};

		try {
			const response = await fetch(`${this.apiURL}${endpoint}`, config);
			const resJson = await response.json();
			if (resJson.message) {
				if (response.ok) {
					notification.success(resJson.message);
					resJson.ok = true;
				} else {
					resJson.ok = false;
					notification.error(resJson.message);
				}
			}
			return resJson;
		} catch (error: any) {
			notification.error(error.message);
			console.error('Error during file upload:', error);
			throw new Error('Upload error');
		}
	}

	static getFile(name: string | null | undefined): string {
		if (!name || name === '' || name === 'null' || name === 'undefined') {
			return `${this.apiURL}/avatars/avatar1.png`;
		}
		if (['avatar1.png', 'avatar2.png', 'avatar3.png', 'avatar4.png'].includes(name)) {
			return `${this.url}/avatars/${name}`;
		}
		else {
			return `${this.apiURL}/avatars/${name}`;
		}
	}
}

export default ApiService;