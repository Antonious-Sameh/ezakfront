import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Navigate, useNavigate } from 'react-router-dom';
import { CircleAlert, Loader2, Store } from 'lucide-react';
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

			{/* Cropped display word at the container edge — brand device */}
			<span
				aria-hidden="true"
				className="pointer-events-none absolute -bottom-10 -start-6 select-none font-display text-[34vw] font-extrabold leading-none text-primary-foreground/10 md:text-[22vw]"
			>
				دخول
			</span>

			<div className="relative w-full max-w-sm rounded-lg border border-border bg-card p-7 shadow-2xl sm:p-9">
				<div className="flex flex-col items-center text-center">
					<span className="grid h-14 w-14 place-items-center rounded-lg bg-primary text-primary-foreground">
						<Store className="h-7 w-7" strokeWidth={1.75} />
					</span>
					<h1 className="mt-4 font-display text-xl font-extrabold text-foreground">لوحة تحكم المحلات</h1>
					<p className="mt-1 text-sm text-muted-foreground">System 5 — محلاتك الأربعة في شاشة واحدة</p>
				</div>

				<form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-2" noValidate>
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
						className="min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-left text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30"
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
						className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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
	);
}
