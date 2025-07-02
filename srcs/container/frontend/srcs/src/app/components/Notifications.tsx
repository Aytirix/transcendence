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

	static confirm(
		message: string,
		options = {}
	): Promise<boolean> {
		return new Promise((resolve) => {
			const toastId = toast(
				<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
					{ToastNotification.formatMessage(message)}
					<div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
						<button
							onClick={() => {
								resolve(true);
								toast.dismiss(toastId);
							}}
							style={{
								padding: '5px 15px',
								backgroundColor: '#4CAF50',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer'
							}}
						>
							Accepter
						</button>
						<button
							onClick={() => {
								resolve(false);
								toast.dismiss(toastId);
							}}
							style={{
								padding: '5px 15px',
								backgroundColor: '#f44336',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer'
							}}
						>
							Refuser
						</button>
					</div>
				</div>,
				{
					autoClose: false,
					closeOnClick: false,
					...options
				}
			);
		});
	}

	static alert(
		message: string,
		toastId: string,
		options = {}
	): Promise<void> {
		return new Promise((resolve) => {
			const content = (
					
				<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
					{ToastNotification.formatMessage(message)}
					<div style={{ display: 'flex', justifyContent: 'center' }}>
						<button
							onClick={() => {
								resolve();
								toast.dismiss(toastId);
							}}
							style={{
								padding: '8px 20px',
								backgroundColor: '#2196F3',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '14px',
								fontWeight: '500',
								display: 'flex',
								justifyContent: 'center',
							}}
						>
							OK
						</button>
					</div>
				</div>
			);

			// Vérifier si une notification avec cet ID existe déjà
			if (toast.isActive(toastId)) {
				// Mettre à jour le contenu de la notification existante
				toast.update(toastId, {
					render: content,
					autoClose: false,
					closeOnClick: false,
					...options
				});
			} else {
				// Créer une nouvelle notification avec l'ID spécifié
				toast(content, {
					toastId: toastId,
					autoClose: false,
					closeOnClick: false,
					...options
				});
			}
		});
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

// Confirm dialog example
// ToastNotification.confirm("Are you sure you want to proceed?")
//   .then((result) => {
//     if (result) {

// Alert dialog example (just OK button)
// ToastNotification.alert("This is an important message!")
//   .then(() => {
//     console.log("User clicked OK");

// Alert dialog with custom ID (updates existing notification with same ID)
// ToastNotification.alertWithId("Updated message!", "my-custom-id")
//   .then(() => {
//     console.log("User clicked OK on updated notification");