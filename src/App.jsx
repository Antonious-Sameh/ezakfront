import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ShopLayout from './components/shop/ShopLayout';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import ShopOverviewPage from './pages/shop/ShopOverviewPage';
import ShopSectionPage from './pages/shop/ShopSectionPage';
import ShopReportsPage from './pages/shop/ShopReportsPage';

function RequireAuth({ children }) {
	const { isAuthenticated } = useAuth();
	const location = useLocation();

	if (!isAuthenticated) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}
	return children;
}

function App() {
	return (
		<Router>
			<AuthProvider>
				<ScrollToTop />
				<Toaster position="top-center" dir="rtl" richColors />
				<Routes>
					<Route path="/login" element={<LoginPage />} />
					<Route
						element={
							<RequireAuth>
								<AppLayout />
							</RequireAuth>
						}
					>
						<Route path="/" element={<OverviewPage />} />
					</Route>
					{/* Shop detail pages (Part 2) — nested under ShopLayout */}
					<Route
						path="/shops/:shopId"
						element={
							<RequireAuth>
								<ShopLayout />
							</RequireAuth>
						}
					>
						<Route index element={<ShopOverviewPage />} />
						<Route path="reports" element={<ShopReportsPage />} />
						<Route path=":section" element={<ShopSectionPage />} />
					</Route>
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</AuthProvider>
		</Router>
	);
}

export default App;
