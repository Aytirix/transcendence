import { Link } from 'react-router-dom';
// import { useLanguage } from '../contexts/LanguageContext';
import React, { useState } from 'react';
import ApiService from '../api/ApiService';
import { useNavigate } from 'react-router-dom';
import GoogleLoginButton from './components/GoogleLoginButton';
// import { User } from '../app/types/userTypes';

interface LoginSchema {
  email: string;
  password: string;
}

const IronManLogin: React.FC = () => {
  const [form, setForm] = useState<LoginSchema>({ email: '', password: '' });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log("test0");
      const resp = await ApiService.post('/login', form) as ApiService;
      console.log("test1", form);
      console.log(resp.ok);
      if (!resp.ok) {
        console.log("test2");
        console.log(resp.ok);
        const data = await resp.json();
        setError(data.message || 'Erreur lors de la connexion.');
      } else {
        navigate('/');
      }

      console.log("test4");
    } catch (err) {
      setError('Erreur réseau ou serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">

      <form className=" " onSubmit={handleSubmit}>
        <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
          <legend className="fieldset-legend">Login</legend>

          <label className="label">Email</label>
          <input type="text" name="email" className="input input-a" placeholder="  Email" onChange={handleChange} required />

          <label className="label">Password</label>
          <input type="password" name="password" className="input input-a" placeholder="  Password" onChange={handleChange} required />

          <button className="btn btn-neutral mt-4" type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
          <GoogleLoginButton />
          <div className="w-full justify-center items-center"><Link to="/register" className="w-full justify-center items-center">Nouveau héros ? Créer un compte</Link></div>
          {/* {error && <div style={{ color: '#c20000', marginTop: '16px', textAlign: 'center' }}>{error}</div>} */}
        </fieldset>
      </form>
    </div>
  );
};

export default IronManLogin;


