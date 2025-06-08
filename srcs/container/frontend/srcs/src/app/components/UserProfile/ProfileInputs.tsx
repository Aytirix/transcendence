import React, { ChangeEvent } from 'react';
import { ProfileForm } from '../UserProfile';

interface ProfileInputsProps {
  form: ProfileForm;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  user: any;
}

const ProfileInputs: React.FC<ProfileInputsProps> = ({ form, handleChange, user }) => (
  <>
    <input
      className="input input-a"
      type="text"
      name="username"
      placeholder={form?.username || "  Pseudo"}
      value={form.username || user?.username}
      onChange={handleChange}
    />
    <input
      className="input input-a"
      type="email"
      name="email"
      placeholder={form?.email || "  E-mail"}
      value={form.email}
      onChange={handleChange}
    />
    <input
      className="input input-a"
      type="password"
      name="password"
      placeholder="  Ancien mot de passe"
      value={form.password}
      onChange={handleChange}
    />
    <input
      className="input input-a"
      type="password"
      name="confirmPassword"
      placeholder="  Nouveau mot de passe"
      value={form.confirmPassword}
      onChange={handleChange}
    />
    <select className="select" value={form.lang} name="lang" onChange={handleChange}>
      <option disabled={true} value="">Langue...</option>
      <option value="fr">Français</option>
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="it">Italia</option>
    </select>
  </>
);

export default ProfileInputs;
