import pako from 'pako';

self.onmessage = function (e) {
	const { type, data } = e.data;
	try {
		if (type === 'compress') {
			const json = JSON.stringify(data);
			const compressed = pako.deflate(json);
			let binary = '';
			const chunkSize = 0x8000;
			for (let i = 0; i < compressed.length; i += chunkSize) {
				binary += String.fromCharCode.apply(null, Array.from(compressed.subarray(i, i + chunkSize)));
			}
			const base64 = btoa(binary);
			self.postMessage({ type: 'compress', result: base64 });
		} else if (type === 'decompress') {
			const binary = atob(data);
			const bytes = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
			const decompressed = pako.inflate(bytes, { to: 'string' });
			self.postMessage({ type: 'decompress', result: JSON.parse(decompressed) });
		}
	} catch (error: any) {
		self.postMessage({ type, error: error.message });
	}
};