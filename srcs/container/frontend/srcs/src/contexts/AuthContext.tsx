import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../api/ApiService';
import { useLanguage } from '../contexts/LanguageContext';
import { User } from '../app/types/userTypes';

interface AuthContextType {
	user: User | null;
	loading: boolean;
	setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const IsAuthenticated = createContext<AuthContextType>({
	user: null,
	loading: true,
	setUser: () => { },
});

export const useAuth = (): AuthContextType => {
	return useContext(IsAuthenticated);
};

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const { setLanguage } = useLanguage();
	const navigate = useNavigate();

	useEffect(() => {
		let isMounted = true;

		const checkAuthentication = async () => {
			if (!isMounted) return;
			try {
				const res = await ApiService.get('/isAuth');
				if (isMounted) {
					setUser(res.user)
					if (res.isAuthenticated) setLanguage(res.user.lang, false);
					if (res.isAuthenticated && (window.location.pathname == "/login" || window.location.pathname == "/register")) {
						navigate('/');
					} else if (!res.isAuthenticated && (!["/login", "/register", "/forget-password", "/auth/checkCode"].includes(window.location.pathname))) {
						navigate('/login');
					}
				}
			} catch (err) {
				console.error("Auth check failed:", err);
				if (isMounted) {
					setUser(null);
				}
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		checkAuthentication();

		return () => {
			isMounted = false;
		};
	}, [navigate]);

	return (
		<IsAuthenticated.Provider value={{ user, loading, setUser }}>
			{loading ? (
				<></>
			) : (
				children
			)}
		</IsAuthenticated.Provider>
	);
};

// export const useAuth = () => useContext(IsAuthenticated);