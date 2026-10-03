import React, { Suspense } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation, useParams } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import PageFallback from './components/PageFallback';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
// Every page and layout is its own lazily-loaded chunk (see routes/lazyPages.js).
import {
	AppLayout,
	ShopLayout,
	LoginPage,
	OverviewPage,
	ShopSummaryPage,
	ShopSectionPage,
} from './routes/lazyPages';

function ReportsRedirect() {
	const { shopId } = useParams();
	return <Navigate to={`/shops/${shopId}`} replace />;
}

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
				{/* Outer boundary: only hit on the very first load of a layout (or the
				    login page). Inner pages have their own boundary inside each layout's
				    <Outlet>, so the header/sidebar stay on screen while a page loads. */}
				<Suspense fallback={<PageFallback fullScreen />}>
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
						<Route index element={<ShopSummaryPage />} />
						{/* Reports are part of the summary now; keep old links / bookmarks working. */}
						<Route path="reports" element={<ReportsRedirect />} />
						<Route path=":section" element={<ShopSectionPage />} />
					</Route>
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
				</Suspense>
			</AuthProvider>
		</Router>
	);
}

export default App;
