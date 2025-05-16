import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import des styles nécessaires

class ToastNotification {
	static toastOptions = {
		autoClose: 1500, // durée d'affichage en millisecondes (équivalent de hideAfter: 5)
		position: 'top-right' as const, // position de la notification
		pauseOnHover: true, // permet de garder la notification visible si la souris passe dessus
		closeOnClick: true, // ferme la notif en cliquant dessus
		newestOnTop: false, // affiche les nouvelles notifs en haut
		closeButton: false, // affiche un bouton pour fermer la notif
		style: {
			userSelect: 'none' as const,
		},
	};

	static success(message: string, options = {}) {
		toast.success(message, { ...this.toastOptions, ...options });
	}

	static info(message: string, options = {}) {
		toast.info(message, { ...this.toastOptions, ...options });
	}

	static warn(message: string, options = {}) {
		toast.warn(message, { ...this.toastOptions, ...options });
	}

	static error(message: string, options = {}) {
		toast.error(message, { ...this.toastOptions, ...options });
	}

	static promise(promise: Promise<unknown> | (() => Promise<unknown>), successMessage: string, errorMessage: string, options = {}) {
		toast.promise(promise, {
			pending: "En cours...",
			success: successMessage,
			error: errorMessage,
		}, { ...this.toastOptions, ...options });
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