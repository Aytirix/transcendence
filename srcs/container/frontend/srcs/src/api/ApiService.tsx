import notification from '../app/components/Notifications';

class ApiService {
	private static url = `https://${window.location.hostname}:7000`;

	static async request(path: string, method: string, body?: JSON) {
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
			const response = await fetch(`${this.url}${path}`, config);
			const resJson = await response.json();
			if (resJson.message) {
				if (response.ok) {
					notification.success(resJson.message);
					resJson.ok = true;
				}
				else {
					resJson.ok = false;
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
			// Surtout PAS de 'Content-Type', laissé à fetch
		};

		try {
			const response = await fetch(`${this.url}${endpoint}`, config);
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
		} catch (error) {
			console.error('Error during file upload:', error);
			throw new Error('Upload error');
		}
	}

}

export default ApiService;