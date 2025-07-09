import React, { useState, ChangeEvent, useEffect } from 'react';
import ApiService from '../api/ApiService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import ProfileInputs from './components/UserProfile/ProfileInputs';
import notification from '../app/components/Notifications';

const defaultAvatars = [
	'avatar1.png',
	'avatar2.png',
	'avatar3.png',
	'avatar4.png',
];

export interface ProfileForm {
	email?: string;
	password?: string;
	username?: string;
	confirmPassword?: string;
	lang?: string;
	avatar?: string;
	twofa?: boolean;
}

const UserProfile: React.FC = () => {
	const { user, setUser } = useAuth();
	const { t, setLanguage } = useLanguage();
	const [form, setForm] = useState<ProfileForm>({
		email: user?.email || '',
		password: '',
		username: user?.username || '',
		confirmPassword: '',
		lang: user?.lang || '',
		avatar: defaultAvatars[0],
		twofa: user?.twofa || false,
	});
	const [uploading, setUploading] = useState(false);
	const [loading, setLoading] = useState(false);

	// Désactiver le scroll au montage, le réactiver au démontage
	useEffect(() => {
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, []);

	// Choix d'un avatar par défaut
	const handleAvatarSelect = (avatar: string) => {
		setForm({ ...form, avatar });
	};

	// Upload custom avatar
	const handleCustomAvatar = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
			notification.error(t('profile.avatar.errors.invalidFormat'));
			return;
		}
		if (file.size > 3 * 1024 * 1024) {
			notification.error(t('profile.avatar.errors.fileTooLarge'));
			return;
		}

		handleUpload(file);
	};

	const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value, type } = e.target;
		let finalValue: string | boolean = value;
		
		// Gérer les valeurs booléennes pour les checkboxes
		if (type === 'checkbox' && 'checked' in e.target) {
			finalValue = (e.target as HTMLInputElement).checked;
		}
		
		setForm({ ...form, [name]: finalValue });
	};

	const handleUpload = async (file: File) => {
		setUploading(true);
		try {
			const formData = new FormData();
			formData.append("file", file);

			const result: any = await ApiService.uploadFile("/upload-avatar", formData);
			if (!result.ok) {
				if (result.statusCode === 413) {
					notification.error(t('profile.avatar.errors.fileTooLarge'));
					setUploading(false);
				}
				return;
			}
			setForm({ ...form, avatar: result.fileName });
			setUploading(false);
			setUser((prevUser) => prevUser ? { ...prevUser, avatar: `${result.fileName}?v=${Date.now()}` } : null);
		} catch (err: any) {
			setUploading(false);
			console.error("Upload error:", err);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			let tab = { ...form };
			// Supprimer les valeurs vides mais préserver twofa même si false
			Object.keys(tab).forEach((key) => { 
				if (key !== 'twofa' && !tab[key as keyof ProfileForm]) {
					delete tab[key as keyof ProfileForm]; 
				}
			});

			if (!defaultAvatars.includes(tab.avatar || '')) {
				tab.avatar = '';
			}

			// Vérifier si l'email a été modifié
			const emailChanged = tab.email && tab.email !== user?.email;

			const res = await ApiService.put('/update-user', tab as JSON);
			if (res.ok) {
				setUser((prevUser) => prevUser ? { ...prevUser, ...res.user } : null);

				if (tab.lang && tab.lang !== user?.lang) {
					setLanguage(tab.lang, false);
				}

				if (emailChanged && tab.email) {
					notification.alert(t('profile.email.confirmationRequired', { email: tab.email }), 'email-confirmation-alert');
				}
			}
		} catch {
		} finally {
			setLoading(false);
		}
	};

	const displayAvatar = user?.avatar || form.avatar || defaultAvatars[0];
	useEffect(() => {
		setForm(prevForm => ({ ...prevForm, avatar: displayAvatar }));
	}, [displayAvatar]);

	return (
		<div className="h-screen flex items-center justify-center relative overflow-hidden">
			{/* Décorations flottantes façon Intro */}
			<div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
				<div className="absolute left-50 top-30 animate-bounce-slow text-5xl opacity-30 select-none">👤</div>
				<div className="absolute right-40 top-50 animate-float text-4xl opacity-20 select-none">⚙️</div>
				<div className="absolute right-100 bottom-30 animate-bounce-slow text-5xl opacity-20 select-none">🔧</div>
				<div className="absolute left-1/4 bottom-1/4 animate-float text-3xl opacity-15 select-none">📝</div>
			</div>

			<form className="z-10 w-full max-w-lg" onSubmit={handleSubmit}>
				<fieldset className="bg-gray-900 bg-opacity-90 border border-gray-700 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
					<legend className="text-2xl font-bold text-center text-white tracking-widest gradient-text mb-2">{t('profile.legend')}</legend>

					{/* AVATAR SELECTIONNE */}
					<div className="w-full flex flex-col items-center mb-4">
						<img
							src={ApiService.getFile(displayAvatar)}
							alt={t('profile.avatar.selected')}
							className="w-24 h-24 rounded-full object-cover shadow-lg ring-2 ring-yellow-400 ring-opacity-50 border-2 border-gray-600"
						/>
					</div>

					{/* CHOIX DES AVATARS */}
					<div className="flex flex-col items-center mb-4">
						<h3 className="font-bold mb-3 text-center text-white">{t('profile.avatar.choose')}</h3>
						<div className="flex gap-3 items-center justify-center flex-wrap">
							{defaultAvatars.map((av, idx) => (
								<img
									key={idx}
									src={ApiService.getFile(av)}
									className={`w-16 h-16 cursor-pointer rounded-full border-2 transition-all duration-300 hover:scale-110 ${form.avatar === av
										? "border-yellow-400 ring-2 ring-yellow-400 ring-opacity-50 shadow-lg"
										: "border-gray-600 hover:border-gray-400"
										}`}
									alt={`avatar${idx + 1}`}
									onClick={() => handleAvatarSelect(av)}
								/>
							))}
							<label className="bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 hover:from-pink-500 hover:to-yellow-400 text-black font-bold py-1 px-3 rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 shadow-lg text-sm">
								{t('profile.avatar.custom')}
								<input
									type="file"
									accept="image/jpeg,image/png,image/webp"
									onChange={handleCustomAvatar}
									className="hidden"
									disabled={uploading}
								/>
							</label>
						</div>

					</div>

					{/* Conteneur pour ProfileInputs avec styling cohérent */}
					<div className="text-white">
						<ProfileInputs form={form} handleChange={handleChange} user={user} />
					</div>

					<div className="flex justify-center">
						<button
							className="style-button shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
							type="submit"
							disabled={loading}
						>
							{loading ? t('profile.actions.updating') : t('profile.actions.update')}
						</button>
					</div>
				</fieldset>
			</form>
		</div>
	);
};

export default UserProfile;