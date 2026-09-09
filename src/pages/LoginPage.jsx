import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Navigate, useNavigate } from 'react-router-dom';
import { CircleAlert, Landmark, Loader2, Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const { isAuthenticated, login } = useAuth();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
        <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 font-sans selection:bg-accent/30 selection:text-accent">
            <Helmet>
                <title>تسجيل الدخول — لوحة تحكم المحلات</title>
                <meta name="description" content="سجل الدخول للوحة تحكم المحلات System 5 لمتابعة مبيعات محلاتك الأربعة من مكان واحد." />
            </Helmet>

            {/* Ambient Animated Glow / Background Effects */}
            <div 
                aria-hidden="true" 
                className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-accent/20 blur-[120px] transition-all duration-700" 
            />
            <div 
                aria-hidden="true" 
                className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/30 blur-[140px] transition-all duration-700" 
            />

            {/* Grid Mesh Pattern */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary-foreground)) 1px, transparent 0)`,
                    backgroundSize: '32px 32px'
                }}
            />

            <div className="relative w-full max-w-md">
                {/* Branding & Header */}
                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl transition-transform duration-300 hover:scale-105">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/20 to-transparent opacity-50" />
                        <Landmark className="relative h-10 w-10 text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.5)]" strokeWidth={1.5} />
                    </div>

                    <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        لوحة تحكم المحلات
                    </h1>
                    <p className="mt-2 text-sm font-medium text-slate-400">
                        محلاتك الأربعة، في كشف حساب واحد
                    </p>
                </div>

                {/* Form Card */}
                <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:p-9">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                        <div className="space-y-2">
                            <label htmlFor="password" className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-300">
                                <span>كلمة السر</span>
                                <Lock className="h-3.5 w-3.5 text-slate-500" />
                            </label>

                            <div className="relative flex items-center">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    dir="ltr"
                                    autoComplete="current-password"
                                    autoFocus
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="••••••••"
                                    className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/50 pl-4 pr-11 text-left text-sm text-white placeholder-slate-600 outline-none transition-all duration-200 focus:border-accent/60 focus:bg-slate-950/80 focus:ring-4 focus:ring-accent/10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 text-slate-500 transition-colors hover:text-slate-300 focus:outline-none"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-400 animate-in fade-in-50 slide-in-from-top-1">
                                <CircleAlert className="h-4 w-4 shrink-0" strokeWidth={2} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="group relative mt-2 inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-accent px-5 font-semibold text-slate-950 shadow-lg transition-all duration-200 hover:bg-accent/90 hover:shadow-accent/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                                    <span>جاري الدخول…</span>
                                </>
                            ) : (
                                <>
                                    <span>دخول</span>
                                    <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" strokeWidth={2.5} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Quiet Footer */}
                <p className="mt-8 text-center text-xs text-slate-500">
                    System 5 Dashboard &copy; {new Date().getFullYear()} — جميع الحقوق محفوظة
                </p>
            </div>
        </div>
    );
}