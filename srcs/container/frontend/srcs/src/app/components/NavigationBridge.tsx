import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ApiService from '../../api/ApiService';

interface NavigationBridgeProps {
    children: React.ReactNode;
    onNavigateReady: (navigate: (url: string) => void) => void;
    onLocationReady: (pathname: string) => void;
}

export const NavigationBridge: React.FC<NavigationBridgeProps> = ({ children, onNavigateReady, onLocationReady }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    useEffect(() => {
        ApiService.setNavigate(navigate);
        onNavigateReady(navigate);
    }, [navigate, onNavigateReady]);

    useEffect(() => {
        onLocationReady(location.pathname);
    }, [location.pathname, onLocationReady]);
    
    return <>{children}</>;
};