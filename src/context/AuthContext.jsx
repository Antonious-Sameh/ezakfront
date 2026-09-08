import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler } from '@/lib/api';

const STORAGE_KEY = 'system5_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	// Token lives in memory + sessionStorage only (localStorage is not used).
	const [token, setToken] = useState(() => sessionStorage.getItem(STORAGE_KEY));

	const logout = useCallback(() => {
		sessionStorage.removeItem(STORAGE_KEY);
		setToken(null);
	}, []);

	// Any 401 from the API layer ends the session automatically.
	useEffect(() => {
		setUnauthorizedHandler(logout);
		return () => setUnauthorizedHandler(null);
	}, [logout]);

	const login = useCallback(async (password) => {
		const result = await api.login(password);
		sessionStorage.setItem(STORAGE_KEY, result.token);
		setToken(result.token);
	}, []);

	const value = useMemo(
		() => ({ token, isAuthenticated: Boolean(token), login, logout }),
		[token, login, logout],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) throw new Error('useAuth must be used inside AuthProvider');
	return context;
}
