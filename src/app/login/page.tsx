'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const GRADIENT_ACCENT = 'linear-gradient(135deg, #4C9EEB, #7B61FF)';

export default function LoginPage() {
  const { user, loading, loginWithEmail, signupWithEmail, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace('/jobs');
    }
  }, [user, loading, router]);

  const handleEmailSubmit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (mode === 'signup' && (!firstName.trim() || !lastName.trim())) {
      setError('Please enter your name');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password, `${firstName.trim()} ${lastName.trim()}`);
      }
      setSuccess(true);
      setTimeout(() => router.replace('/jobs'), 800);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (firebaseError.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (firebaseError.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters');
      } else {
        setError('Something went wrong. Please try again.');
      }
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await loginWithGoogle();
      setSuccess(true);
      setTimeout(() => router.replace('/jobs'), 800);
    } catch {
      setError('Google sign-in failed. Please try again.');
    }
  };

  // Show nothing while checking auth
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-void)', color: 'var(--text-muted)', fontSize: '14px' }}>
        Loading…
      </div>
    );
  }

  // Already logged in, redirecting
  if (user) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: '6px', padding: '13px 14px', fontFamily: 'var(--font)', fontSize: '14px',
    fontWeight: 500, color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--border-focus)';
    e.target.style.boxShadow = '0 0 0 3px rgba(76,158,235,0.08)';
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--border)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', background: 'var(--bg-void)' }}>
      {/* ═══ BRAND PANEL ═══ */}
      <div style={{ width: '45%', background: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px', position: 'relative', overflow: 'hidden' }}>
        {/* Glow effects */}
        <div style={{ position: 'absolute', top: '-30%', left: '-20%', width: '80%', height: '80%', background: 'radial-gradient(circle, rgba(76,158,235,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-15%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(123,97,255,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '400px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '48px' }}>
            <div style={{ width: '48px', height: '48px', background: GRADIENT_ACCENT, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontWeight: 800, fontSize: '18px', color: '#fff', boxShadow: '0 8px 32px rgba(76,158,235,0.3)' }}>FO</div>
            <div>
              <div className="gradient-text" style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em' }}>FieldOps</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginTop: '2px' }}>v1.0</div>
            </div>
          </div>

          <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '16px' }}>
            Manage your<br/>field operations<br/>
            <span className="gradient-text">in one place</span>
          </h1>

          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '40px' }}>
            Schedule jobs, sync to Outlook Calendar, manage contacts and documents — all from a single dashboard built for your team.
          </p>

          {/* Features */}
          {[
            { icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>, color: 'var(--accent)', bg: 'var(--accent-glow)', text: 'Auto-sync jobs to Outlook Calendar' },
            { icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>, color: 'var(--success)', bg: 'rgba(52,211,153,0.12)', text: 'Upload and manage field documents' },
            { icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>, color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', text: 'Track contacts and site information' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: f.bg, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>{f.icon}</svg>
              </div>
              {f.text}
            </div>
          ))}
        </div>
      </div>

      {/* ═══ AUTH FORM ═══ */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '6px' }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px' }}>
            {mode === 'login' ? (
              <>Don&apos;t have an account? <span onClick={() => { setMode('signup'); setError(''); }} style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Sign up</span></>
            ) : (
              <>Already have an account? <span onClick={() => { setMode('login'); setError(''); }} style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Sign in</span></>
            )}
          </p>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--danger)', marginBottom: '18px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px', flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* Google */}
          <button onClick={handleGoogle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '13px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
          >
            <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>or with email</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          {/* Name fields (signup only) */}
          {mode === 'signup' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', paddingLeft: '2px' }}>First Name</label>
                <input style={inputStyle} placeholder="Thomas" value={firstName} onChange={e => setFirstName(e.target.value)} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', paddingLeft: '2px' }}>Last Name</label>
                <input style={inputStyle} placeholder="Osayi" value={lastName} onChange={e => setLastName(e.target.value)} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', paddingLeft: '2px' }}>Email</label>
            <input type="email" style={inputStyle} placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} onFocus={handleFocus} onBlur={handleBlur}
              onKeyDown={e => { if (e.key === 'Enter') handleEmailSubmit(); }} />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', paddingLeft: '2px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: '44px' }}
                placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
                value={password} onChange={e => setPassword(e.target.value)} onFocus={handleFocus} onBlur={handleBlur}
                onKeyDown={e => { if (e.key === 'Enter') handleEmailSubmit(); }} />
              <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-muted)', background: 'none', border: 'none', padding: '4px', transition: 'color 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                  {showPw
                    ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                </svg>
              </button>
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleEmailSubmit} disabled={submitting || success} style={{
            width: '100%', padding: '13px 20px', fontFamily: 'var(--font)', fontSize: '14px', fontWeight: 700,
            border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: success ? 'var(--success)' : GRADIENT_ACCENT,
            color: '#fff',
            boxShadow: success ? '0 4px 16px rgba(52,211,153,0.3)' : '0 4px 16px rgba(76,158,235,0.3)',
            opacity: submitting ? 0.7 : 1,
            marginTop: '6px',
          }}>
            {submitting ? (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>{mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
            ) : success ? (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}><polyline points="20 6 9 17 4 12"/></svg>{mode === 'login' ? 'Welcome back!' : 'Account created!'}</>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '12px', color: 'var(--text-muted)' }}>
            {mode === 'login'
              ? <span style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>Forgot password?</span>
              : <>By signing up you agree to our <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Terms</span> and <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Privacy Policy</span></>
            }
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .brand-panel-hide { display: none !important; }
        }
      `}</style>
    </div>
  );
}