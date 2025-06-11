import React, { useState, useEffect, ChangeEvent } from 'react';
import ApiService from '../api/ApiService';
import { useAuth } from '../contexts/AuthContext';
import AvatarSelector from './components/UserProfile/AvatarSelector';
import ProfileInputs from './components/UserProfile/ProfileInputs';
// import UserProfileFeedback from './UserProfile/UserProfileFeedback';
import AvatarUploader from './components/AvatarUploader';

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
  const [customAvatarFile, setCustomAvatarFile] = useState<File | null>(null);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => { /* ... */ }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarSelect = (avatar: string) => {
    setForm({ ...form, avatar });
    setCustomAvatarFile(null);
    setCustomAvatar(null);
  };

  const handleCustomAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setCustomAvatar(evt.target?.result as string);
        setForm((prev) => ({ ...prev, avatar: "custom" }));
      };
      reader.readAsDataURL(file);
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
      delete tab.avatar;
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

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form className="profile-card" onSubmit={handleSubmit}>
        <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xl border p-4">
          <legend className="fieldset-legend">Modifier mon profil</legend>

          <AvatarSelector
            defaultAvatars={defaultAvatars}
            selectedAvatar={form.avatar}
            handleAvatarSelect={handleAvatarSelect}
            handleCustomAvatar={handleCustomAvatar}
            customAvatar={customAvatar}
          />

          <ProfileInputs form={form} handleChange={handleChange} user={user} />

          <button className="btn btn-neutral mt-4" type="submit" disabled={loading}>
            {loading ? "Mise à jour..." : "Mettre à jour"}
          </button>

          {/* <UserProfileFeedback error={error} success={success} /> */}
        </fieldset>
      </form>
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <AvatarUploader />
      </div>
    </div>
  );
};

export default UserProfile;
