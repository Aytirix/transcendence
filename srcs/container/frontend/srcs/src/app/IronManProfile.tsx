import React, { useState, ChangeEvent, useEffect } from 'react';
import ApiService from '../api/ApiService';
import {useAuth} from '../contexts/AuthContext';
import IronManNavBar from './IronManNavBar';
import './assets/styles/UserProfile.css';

interface ProfileForm {
  email?: string;
  password?: string;
  username?: string;
  confirmPassword?: string;
  lang?: string;
  avatar?: string;
}
const defaultAvatars = [
  'src/app/assets/avatars/avatar1.png',
  'src/app/assets/avatars/avatar2.png',
  'src/app/assets/avatars/avatar3.png',
  'src/app/assets/avatars/avatar4.png',
];

const UserProfile: React.FC = () => {
  const [form, setForm] = useState<ProfileForm>({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
    lang:  '',
    avatar: defaultAvatars[0]
  });
  const [customAvatarFile, setCustomAvatarFile] = useState<File | null>(null);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    // Ce code sera exécuté à chaque montage du composant
    console.log("Le composant est monté !");
  const toto = useAuth()
  console.log("TOTOTOTOT", toto);
  form.username = toto?.user?.username;
  form.email = toto.user?.email
  }, []);




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
        setForm({ ...form, avatar: "custom" }); // marqueur pour signaler qu'on a un custom
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
      let resp;
      
      const tab = { ...form };
      if (tab.email === '') delete tab.email;
      if (tab.username === '') delete tab.username;
      if (tab.lang === '') delete tab.lang;
      if (tab.password === '') delete tab.password;
      if (tab.confirmPassword === '') delete tab.confirmPassword;
      // if (form.avatar === 'custom' && customAvatarFile) {
          // tab.avatar = customAvatarFile
      // } else {
      // }
      delete tab.avatar;
      resp = await ApiService.put('/update-user', tab) as ApiService;

      if (!resp.ok) {
        const data = await resp.json();
        setError(data.message || "Erreur lors de la mise à jour.");
      } else {
        setSuccess("Profil mis à jour !");
      }
    } catch (err) {
      setError("Erreur réseau ou serveur !");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <form className="profile-card" onSubmit={handleSubmit}>
        <h2 className="profile-title">Modifier mon profil</h2>

        {/* Sélection des avatars */}
        <div className="avatar-options">
          {defaultAvatars.map((avatar, idx) => (
            <img
              key={avatar}
              src={avatar}
              className={`avatar-img${form.avatar === avatar ? ' selected' : ''}`}
              alt={`Avatar ${idx + 1}`}
              onClick={() => handleAvatarSelect(avatar)}
            />
          ))}
          <label className="custom-avatar-btn">
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleCustomAvatar}
            />
            {customAvatar ? (
              <img className="avatar-img selected" src={customAvatar} alt="Custom Avatar" />
            ) : (
              <span>+ Ajouter</span>
            )}
          </label>
        </div>

        <input
          className="profile-input"
          type="text"
          name="username"
          // placeholder={toto?.user?.username || "Pseudo"}
          value={form.username}
          onChange={handleChange}
        />
        <input
          className="profile-input"
          type="email"
          name="email"
          // placeholder={toto?.user?.email || "E-mail"}
          value={form.email}
          onChange={handleChange}
        />
        <input
          className="profile-input"
          type="password"
          name="password"
          placeholder="Ancien mot de passe"
          value={form.password}
          onChange={handleChange}
        />
        <input
          className="profile-input"
          type="password"
          name="confirmPassword"
          placeholder="Nouveau mot de passe"
          value={form.confirmPassword}
          onChange={handleChange}
        />
        <select
          className="profile-input"
          name="lang"
          value={form.lang}
          onChange={handleChange}
        >
          <option value="">Langue...</option>
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="it">Italia</option>
        </select>
        <button className="profile-btn" type="submit" disabled={loading}>
          {loading ? "Mise à jour..." : "Mettre à jour"}
        </button>
        {error && <div className="profile-error">{error}</div>}
        {success && <div className="profile-success">{success}</div>}
      </form>
    </div>
  );
};

export default UserProfile;