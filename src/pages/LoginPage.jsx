import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Navigate, useNavigate } from 'react-router-dom';
import { CircleAlert, Landmark, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
	const { isAuthenticated, login } = useAuth();
	const navigate = useNavigate();
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	if (isAuthenticated) return <Navigate to="/" replace />;

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!password || loading) return;
		setLoading(true);
		setError('');
		try {
			await login(password);
			navigate('/', { replace: true });
		} catch (err) {
			setError(err?.message || 'كلمة السر غير صحيحة، حاول تاني');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="relative grid min-h-dvh place-items-center overflow-hidden bg-primary px-4 py-10">
			<Helmet>
				<title>تسجيل الدخول — لوحة تحكم المحلات</title>
				<meta name="description" content="سجل الدخول للوحة تحكم المحلات System 5 لمتابعة مبيعات محلاتك الأربعة من مكان واحد." />
			</Helmet>

			{/* Faint ledger-line texture across the ink field — a quiet nod to a
			    ruled account book rather than a flat corporate gradient. */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 opacity-[0.06]"
				style={{ backgroundImage: 'repeating-linear-gradient(hsl(var(--primary-foreground)) 0 1px, transparent 1px 44px)' }}
			/>

			<div className="relative w-full max-w-sm">
				{/* Seal — a bordered mark rather than a filled app-icon tile. */}
				<div className="flex flex-col items-center text-center">
					<span className="grid h-16 w-16 place-items-center rounded-full border border-accent/50 text-accent">
						<Landmark className="h-7 w-7" strokeWidth={1.5} />
					</span>
					<h1 className="mt-5 font-display text-2xl font-semibold text-primary-foreground">لوحة تحكم المحلات</h1>
					<p className="mt-1.5 text-sm text-primary-foreground/60">محلاتك الأربعة، في كشف حساب واحد</p>
				</div>

				<div className="mt-8 rounded-sm border border-primary-foreground/15 bg-card p-7 shadow-[0_1px_0_hsl(var(--primary-foreground)/0.08),0_20px_50px_-15px_rgba(0,0,0,0.6)] sm:p-8">
					<form onSubmit={handleSubmit} className="flex flex-col gap-2.5" noValidate>
						<label htmlFor="password" className="text-sm font-semibold text-foreground">
							كلمة السر
						</label>
						<input
							id="password"
							type="password"
							dir="ltr"
							autoComplete="current-password"
							autoFocus
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder="••••••••"
							className="min-h-12 w-full rounded-sm border border-input bg-background px-3.5 py-2 text-left text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-accent focus:ring-2 focus:ring-accent/25"
						/>
						{error ? (
							<p role="alert" className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
								<CircleAlert className="h-4 w-4 shrink-0" strokeWidth={2} />
								{error}
							</p>
						) : null}
						<button
							type="submit"
							disabled={loading || !password}
							className="mt-3.5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
						>
							{loading ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
									جاري الدخول…
								</>
							) : (
								'دخول'
							)}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
