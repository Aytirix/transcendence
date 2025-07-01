import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface NavigationBridgeProps {
    children: React.ReactNode;
    onNavigateReady: (navigate: (url: string) => void) => void;
}

export const NavigationBridge: React.FC<NavigationBridgeProps> = ({ children, onNavigateReady }) => {
    const navigate = useNavigate();
    
    useEffect(() => {
        onNavigateReady(navigate);
    }, [navigate, onNavigateReady]);
    return <>{children}</>;
};