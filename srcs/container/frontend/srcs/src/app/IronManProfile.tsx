import React, { useState, ChangeEvent } from 'react';
import ApiService from '../api/ApiService';
import { useAuth } from '../contexts/AuthContext';
import ProfileInputs from './components/UserProfile/ProfileInputs';

const defaultAvatars = [
  'avatars/avatar1.png',
  'avatars/avatar2.png',
  'avatars/avatar3.png',
  'avatars/avatar4.png',
];

export interface ProfileForm {
  email?: string;
  password?: string;
  username?: string;
  confirmPassword?: string;
  lang?: string;
  avatar?: string;
}

const UserProfile: React.FC = () => {
  const [form, setForm] = useState<ProfileForm>({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
    lang: '',
    avatar: defaultAvatars[0],
  });
  const [preview, setPreview] = useState<string | null>(null); // Pour custom avatar
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Choix d'un avatar par défaut
  const handleAvatarSelect = (avatar: string) => {
    setForm({ ...form, avatar });
    setPreview(null);
    setCustomAvatarUrl(null);
    setError(null);
    setSuccess(null);
  };

  // Upload custom avatar
  const handleCustomAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    setCustomAvatarUrl(null);

    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Seuls JPEG, PNG ou WEBP acceptés.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("Fichier trop volumineux (3Mo max)");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    handleUpload(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await ApiService.uploadFile("/upload-avatar", formData);
      setUploading(false);

      if (res.error) {
        setError(res.error);
        return;
      }
      const avatarUrl = `${ApiService["url"]}${res.url}`;
      setSuccess("Avatar uploadé !");
      setCustomAvatarUrl(avatarUrl);
      console.log("urlA", avatarUrl)
      setForm((form) => ({ ...form, avatar: avatarUrl }));
    } catch (err: any) {
      setUploading(false);
      setError("Erreur lors de l'envoi.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const tab = { ...form };
      Object.keys(tab).forEach((key) => { if (!tab[key as keyof ProfileForm]) delete tab[key as keyof ProfileForm]; });
      console.log("tab1", tab);
      // delete tab.avatar;
      console.log("tab2", tab);
      const resp = await ApiService.put('/update-user', tab);
      if (!resp.ok) {
        const data = await resp.json();
        setError(data.message || "Erreur lors de la mise à jour.");
      } else {
        setSuccess("Profil mis à jour !");
      }
    } catch {
      setError("Erreur réseau ou serveur !");
    } finally {
      setLoading(false);
    }
  };

  // Avatar affiché = celui stocké dans form.avatar (toujours à jour)
  const displayAvatar = form.avatar || defaultAvatars[0];

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form className="profile-card" onSubmit={handleSubmit}>
        <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xl border p-4">
          <legend className="fieldset-legend">Modifier mon profil</legend>
          {/* AVATAR SELECTIONNE */}
          <div className="w-full flex flex-col items-center mb-4">
            <img
              src={displayAvatar}
              alt="Avatar sélectionné"
              className="w-24 h-24 rounded-full object-cover shadow ring-2 ring-secondary"
            />
            <span className="text-xs text-gray-400 mt-1">
              {displayAvatar}
            </span>
          </div>
          {/* CHOIX DES AVATARS */}
          <div>
            <h3 className="font-bold mb-2">Choisir votre avatar</h3>
            <div className="flex gap-3 items-center">
              {defaultAvatars.map((av, idx) => (
                <img
                  key={idx}
                  src={av}
                  className={`w-16 h-16 cursor-pointer rounded-full border-2 ${form.avatar === av ? "border-primary ring-2" : ""}`}
                  alt={`avatar${idx + 1}`}
                  onClick={() => handleAvatarSelect(av)}
                />
              ))}
              <label className="btn btn-outline btn-sm">
                Custom
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCustomAvatar}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            {/* Infos upload */}
            {(preview || customAvatarUrl || uploading || error || success) && (
              <div className="mt-4 flex flex-col items-center">
                {uploading && <span className="loading loading-dots loading-sm mt-1"></span>}
                {error && <div className="alert alert-error mt-2">{error}</div>}
                {success && <div className="alert alert-success mt-2">{success}</div>}
                {customAvatarUrl && (
                  <a
                    href={customAvatarUrl}
                    className="link-primary break-all text-xs mt-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >{customAvatarUrl}</a>
                )}
              </div>
            )}
          </div>

          <ProfileInputs form={form} handleChange={handleChange} user={user} />

          <button className="btn btn-neutral mt-4" type="submit" disabled={loading}>
            {loading ? "Mise à jour..." : "Mettre à jour"}
          </button>
        </fieldset>
      </form>
    </div>
  );
};

export default UserProfile;
