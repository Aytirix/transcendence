import React from 'react';
import ReactDOM from 'react-dom';
import { Zoom, toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import des styles nécessaires

export function ToastPortalContainer() {
	return ReactDOM.createPortal(
		<ToastContainer
			position="bottom-right"
			autoClose={1500}
			pauseOnHover={true}
			closeOnClick={true}
			newestOnTop={true}
			closeButton={false}
			limit={3}
			transition={Zoom}
			style={{ userSelect: 'none' }}
		/>,
		document.body
	);
}

class ToastNotification {
	static success(message: string, options = {}) {
		toast.success(ToastNotification.formatMessage(message), { ...options });
	}

	static info(message: string, options = {}) {
		toast.info(ToastNotification.formatMessage(message), { ...options });
	}

	static warn(message: string, options = {}) {
		toast.warn(ToastNotification.formatMessage(message), { ...options });
	}

	static error(message: string, options = {}) {
		toast.error(ToastNotification.formatMessage(message), { ...options });
	}

	static promise(promise: Promise<unknown> | (() => Promise<unknown>), successMessage: string, errorMessage: string, options = {}) {
		toast.promise(promise, {
			pending: "En cours...",
			success: successMessage,
			error: errorMessage,
		}, { ...options });
	}

	// Méthode pour fermer une notification spécifique
	static dismiss(toastId: string) {
		toast.dismiss(toastId);
	}

	// Utiliser le type React.ReactElement pour le typage
	private static formatMessage(message: string): React.ReactElement {
		const lines = message.split('\n');
		return (
			<div style={{ display: 'flex', flexDirection: 'column' }}>
				{lines.map((line, idx) => (
					<div key={idx}>{line}</div>
				))}
			</div>
		);
	}
}

// Exporter à la fois la classe et le composant ToastContainer
export { ToastContainer };
export default ToastNotification;

// Examples of usage

// Basic notifications
// ToastNotification.success("Operation successful!");
// ToastNotification.info("Here's some information for you.");
// ToastNotification.warn("Warning: This action may have consequences.");
// ToastNotification.error("An error occurred!");

// With custom options
// ToastNotification.success("Custom autoclose!", { autoClose: 5000 });
// ToastNotification.info("Custom position!", { position: 'top-center' });

// Promise example
// const asyncOperation = async () => {
//   return new Promise((resolve, reject) => {
//     // Simulate API call
//     setTimeout(() => {
//       const success = Math.random() > 0.5;
//       if (success) {
//         resolve("Data received");
//       } else {
//         reject("Network error");
//       }
//     }, 2000);
//   });
// };
// 
// ToastNotification.promise(
//   asyncOperation,
//   "Data successfully loaded!",
//   "Failed to load data"
// );