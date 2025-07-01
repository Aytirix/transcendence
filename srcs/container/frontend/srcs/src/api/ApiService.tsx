import notification from '../app/components/Notifications';

class ApiService {
	private static apiURL = `${window.location.protocol}//${window.location.host}/api`;
	private static url = `${window.location.protocol}//${window.location.host}`;
	static navigate: ((url: string) => void) | null = null;

	static async request(path: string, method: string, body: any = null, notif: boolean = true): Promise<any> {
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
			let resJson: any = {};
			try {
				resJson = await response.json();
			} catch (error) { }
			resJson.ok = response.ok;
			if (resJson.message) {
				if (notif && response.ok) {
					notification.success(resJson.message);
				}
				else if (notif) {
					notification.error(resJson.message);
				}
			}

			if (resJson.redirect && resJson.redirect !== window.location.pathname) {
				if (this.navigate) {
					this.navigate(resJson.redirect);
				} else {
					console.warn('Navigation function not available, redirect requested to:', resJson.redirect);
				}
			}

			return resJson;
		} catch (error) {
			console.error('Error during fetch:', error);
			throw new Error('Network error');
		}
	}

	static async get(endpoint: string, body: any = null, notif: boolean = true) {
		return this.request(endpoint, 'GET', body, notif);
	}

	static async post(endpoint: string, body: any = null, notif: boolean = true) {
		return this.request(endpoint, 'POST', body, notif);
	}

	static async put(endpoint: string, body: any = null, notif: boolean = true) {
		return this.request(endpoint, 'PUT', body, notif);
	}

	static async delete(endpoint: string, body: any = null, notif: boolean = true) {
		return this.request(endpoint, 'DELETE', body, notif);
	}

	static async uploadFile(endpoint: string, formData: FormData, notif: boolean = true) {
		const config: RequestInit = {
			method: 'POST',
			body: formData,
			credentials: 'include',
		};

		try {
			const response = await fetch(`${this.apiURL}${endpoint}`, config);
			const resJson = await response.json();
			if (resJson.message) {
				if (notif && response.ok) {
					notification.success(resJson.message);
					resJson.ok = true;
				} else if (notif) {
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
		if (name && (name.startsWith('http://') || name.startsWith('https://'))) {
			return name;
		}
		if (!name || name === '' || name === 'null' || name === 'undefined') {
			return `${this.url}/avatars/avatar1.png`;
		}
		if (['avatar1.png', 'avatar2.png', 'avatar3.png', 'avatar4.png'].includes(name)) {
			return `${this.url}/avatars/${name}`;
		}
		else {
			return `${this.apiURL}/avatars/${name}`;
		}
	}

	static setNavigate(fn: (url: string) => void) {
		this.navigate = fn;
	}
}

export default ApiService;