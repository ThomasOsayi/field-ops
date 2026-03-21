'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeProvider';

export default function LoginPage() {
  const { user, loading, loginWithEmail, signupWithEmail, loginWithGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!loading && user) router.replace('/jobs'); }, [user, loading, router]);

  useEffect(() => {
    if (!particlesRef.current) return;
    const container = particlesRef.current;
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.style.cssText = `position:fixed;border-radius:50%;background:rgba(76,158,235,0.3);pointer-events:none;z-index:0;left:${Math.random()*100}%;width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;opacity:${Math.random()*0.4+0.1};animation:particleFloat ${Math.random()*10+12}s linear ${Math.random()*10}s infinite`;
      container.appendChild(p);
    }
    return () => { container.innerHTML = ''; };
  }, []);

  const handleEmailSubmit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields'); return; }
    if (mode === 'signup' && (!firstName.trim() || !lastName.trim())) { setError('Please enter your name'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setSubmitting(true);
    try {
      if (mode === 'login') await loginWithEmail(email, password);
      else await signupWithEmail(email, password, `${firstName.trim()} ${lastName.trim()}`);
      setSuccess(true);
      setTimeout(() => router.replace('/jobs'), 800);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') setError('Invalid email or password');
      else if (e.code === 'auth/email-already-in-use') setError('An account with this email already exists');
      else if (e.code === 'auth/weak-password') setError('Password must be at least 6 characters');
      else setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try { await loginWithGoogle(); setSuccess(true); setTimeout(() => router.replace('/jobs'), 800); }
    catch { setError('Google sign-in failed. Please try again.'); }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-void)', color: 'var(--text-muted)', fontSize: '14px' }}>Loading…</div>;
  if (user) return null;

  return (
    <div className="login-page">
      <div className="bg-grid" />
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
      <div ref={particlesRef} className="login-particles" />

      <button onClick={toggleTheme} className="login-theme-btn" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} type="button">
        {theme === 'dark' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        )}
      </button>

      <div className="brand-panel">
        <div className="brand-logo" style={{ opacity: 0, animation: 'fadeSlideUp 0.6s ease 0.2s forwards' }}>
          <div className="brand-mark">FO<div className="brand-mark-glow" /></div>
          <div>
            <div className="gradient-text brand-name">FieldOps</div>
            <div className="brand-version">v1.0</div>
          </div>
        </div>
        <h1 className="brand-headline" style={{ opacity: 0, animation: 'fadeSlideUp 0.6s ease 0.4s forwards' }}>Manage your<br/>field operations<br/><span className="gradient-text" style={{ position: 'relative', display: 'inline-block' }}>in one place<span className="headline-cursor" /></span></h1>
        <p className="brand-subtitle" style={{ opacity: 0, animation: 'fadeSlideUp 0.6s ease 0.6s forwards' }}>Schedule jobs, sync to Outlook Calendar, manage contacts and documents. All from a single dashboard built for your team.</p>
        <div className="features-list">
          {[
            { icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>, title: 'Outlook Sync', desc: '— Jobs auto-create calendar events', delay: '0.8s', cls: 'feat-blue' },
            { icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>, title: 'Documents', desc: '— Upload, view, and organize field docs', delay: '0.95s', cls: 'feat-green' },
            { icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>, title: 'Contacts', desc: '— Auto-builds your directory from jobs', delay: '1.1s', cls: 'feat-purple' },
          ].map((f, i) => (
            <div key={i} className="feature-card" style={{ animationDelay: f.delay }}>
              <div className={`feature-icon ${f.cls}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>{f.icon}</svg></div>
              <div className="feature-text"><strong>{f.title}</strong> {f.desc}</div>
            </div>
          ))}
        </div>
        <div className="status-bar" style={{ opacity: 0, animation: 'fadeSlideUp 0.5s ease 1.3s forwards' }}>
          <div className="status-item"><div className="status-dot status-dot-green" />Systems operational</div>
          <div className="status-item"><div className="status-dot status-dot-blue" />256-bit encrypted</div>
        </div>
      </div>

      <div className="auth-section">
        <div className="auth-card" style={{ opacity: 0, transform: 'translateY(20px)', animation: 'cardReveal 0.7s ease 0.3s forwards' }}>
          <div className="auth-card-gradient-line" />
          <h2 className="auth-title">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p className="auth-subtitle">{mode === 'login' ? <>Don&apos;t have an account? <span onClick={() => { setMode('signup'); setError(''); }} className="auth-link">Sign up</span></> : <>Already have an account? <span onClick={() => { setMode('login'); setError(''); }} className="auth-link">Sign in</span></>}</p>
          {error && <div className="auth-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px', flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}
          <button onClick={handleGoogle} className="google-btn" type="button"><svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>Continue with Google</button>
          <div className="auth-divider"><div className="auth-divider-line" /><span>or with email</span><div className="auth-divider-line" /></div>
          {mode === 'signup' && <div className="name-row"><div className="field-group"><label className="field-label">First Name</label><input className="field-input" placeholder="Thomas" value={firstName} onChange={e => setFirstName(e.target.value)} /></div><div className="field-group"><label className="field-label">Last Name</label><input className="field-input" placeholder="Osayi" value={lastName} onChange={e => setLastName(e.target.value)} /></div></div>}
          <div className="field-group"><label className="field-label">Email</label><input type="email" className="field-input" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleEmailSubmit(); }} /></div>
          <div className="field-group"><label className="field-label">Password</label><div className="pw-wrapper"><input type={showPw ? 'text' : 'password'} className="field-input field-input-pw" placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleEmailSubmit(); }} /><button onClick={() => setShowPw(!showPw)} className="pw-toggle" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>{showPw ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}</svg></button></div></div>
          <button onClick={handleEmailSubmit} disabled={submitting || success} className={`submit-btn ${success ? 'submit-btn-success' : ''} ${submitting ? 'submit-btn-submitting' : ''}`} type="button">{submitting ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : success ? (mode === 'login' ? '✓ Welcome back!' : '✓ Account created!') : (mode === 'login' ? 'Sign In' : 'Create Account')}</button>
          <div className="auth-footer-text">{mode === 'login' ? <span className="auth-link">Forgot password?</span> : <>By signing up you agree to our <span className="auth-link">Terms</span> and <span className="auth-link">Privacy</span></>}</div>
        </div>
      </div>

      <style>{`
        .login-page { display: flex; width: 100%; min-height: 100vh; background: var(--bg-void); font-family: var(--font); color: var(--text-primary); position: relative; overflow: hidden; transition: background 0.3s, color 0.3s; }
        .login-theme-btn { position: fixed; top: 24px; right: 24px; z-index: 10; width: 44px; height: 44px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; -webkit-tap-highlight-color: transparent; }
        .login-theme-btn:hover { background: var(--bg-elevated); color: var(--text-primary); border-color: var(--border-hover); }

        .bg-grid { position: fixed; inset: 0; pointer-events: none; z-index: 0; background-image: linear-gradient(var(--accent-glow) 1px, transparent 1px), linear-gradient(90deg, var(--accent-glow) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse 80% 60% at 30% 50%, black 20%, transparent 70%); -webkit-mask-image: radial-gradient(ellipse 80% 60% at 30% 50%, black 20%, transparent 70%); opacity: 0.5; }
        .bg-orb { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; }
        .bg-orb-1 { width: 500px; height: 500px; top: -10%; left: -5%; background: radial-gradient(circle, var(--accent-glow-strong) 0%, transparent 70%); animation: orbFloat1 12s ease-in-out infinite; }
        .bg-orb-2 { width: 400px; height: 400px; bottom: -10%; left: 25%; background: radial-gradient(circle, rgba(123,97,255,0.08) 0%, transparent 70%); animation: orbFloat2 15s ease-in-out infinite; }
        .bg-orb-3 { width: 300px; height: 300px; top: 20%; right: 10%; background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%); animation: orbFloat3 18s ease-in-out infinite; }
        [data-theme="light"] .bg-grid { opacity: 1; }
        [data-theme="light"] .bg-orb { opacity: 1; }
        [data-theme="light"] .login-particles { opacity: 1; }

        .brand-panel { width: 48%; display: flex; flex-direction: column; justify-content: center; padding: 60px 72px; position: relative; z-index: 1; }
        .brand-logo { display: flex; align-items: center; gap: 14px; margin-bottom: 56px; }
        .brand-mark { width: 52px; height: 52px; border-radius: 16px; background: var(--gradient-accent); display: flex; align-items: center; justify-content: center; font-family: var(--mono); font-weight: 800; font-size: 20px; color: #fff; box-shadow: 0 8px 32px rgba(76,158,235,0.3); position: relative; flex-shrink: 0; }
        .brand-mark-glow { position: absolute; inset: -3px; border-radius: 19px; background: linear-gradient(135deg, rgba(76,158,235,0.4), rgba(123,97,255,0.4)); z-index: -1; animation: markPulse 3s ease-in-out infinite; }
        .brand-name { font-size: 26px; font-weight: 800; letter-spacing: -0.03em; }
        .brand-version { font-size: 11px; color: var(--text-muted); font-family: var(--mono); margin-top: 2px; }
        .brand-headline { font-size: 44px; font-weight: 800; letter-spacing: -0.04em; line-height: 1.15; margin-bottom: 20px; color: var(--text-primary); }
        .headline-cursor { position: absolute; right: -4px; top: 8px; bottom: 8px; width: 3px; background: var(--accent); border-radius: 2px; animation: blink 1s step-end infinite; }
        .brand-subtitle { font-size: 16px; color: var(--text-secondary); line-height: 1.7; max-width: 420px; margin-bottom: 48px; }

        .features-list { display: flex; flex-direction: column; }
        .feature-card { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border); margin-bottom: 12px; opacity: 0; transform: translateX(-20px); animation: featureSlideIn 0.5s ease forwards; cursor: default; transition: all 0.25s; }
        .feature-card:hover { border-color: var(--border-hover); transform: translateX(4px); }
        .feature-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .feat-blue { background: var(--accent-glow); color: var(--accent); }
        .feat-green { background: var(--success-muted); color: var(--success); }
        .feat-purple { background: var(--purple-muted); color: var(--purple); }
        .feature-text { font-size: 14px; color: var(--text-secondary); font-weight: 600; }
        .feature-text strong { color: var(--text-primary); font-weight: 700; }

        .status-bar { margin-top: 48px; display: flex; align-items: center; gap: 20px; }
        .status-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted); font-family: var(--mono); }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; }
        .status-dot-green { background: var(--success); box-shadow: 0 0 8px var(--success); animation: statusPulse 2s infinite; }
        .status-dot-blue { background: var(--accent); }

        .auth-section { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; position: relative; z-index: 1; }
        .auth-card { width: 100%; max-width: 420px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 40px; box-shadow: 0 24px 80px rgba(0,0,0,0.15); position: relative; overflow: hidden; }
        [data-theme="dark"] .auth-card { box-shadow: 0 24px 80px rgba(0,0,0,0.4); }
        .auth-card-gradient-line { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--accent), transparent); opacity: 0.6; }
        .auth-title { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 6px; color: var(--text-primary); }
        .auth-subtitle { font-size: 14px; color: var(--text-muted); margin-bottom: 28px; }
        .auth-link { color: var(--accent); font-weight: 600; cursor: pointer; }
        .auth-error { display: flex; align-items: center; gap: 8px; padding: 12px 14px; background: var(--danger-muted); border: 1px solid rgba(220,38,38,0.2); border-radius: 10px; font-size: 12px; font-weight: 600; color: var(--danger); margin-bottom: 18px; }
        .google-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 14px; border-radius: 12px; background: var(--bg-surface); border: 1px solid var(--border); font-family: var(--font); font-size: 14px; font-weight: 600; color: var(--text-primary); cursor: pointer; transition: all 0.2s; }
        .google-btn:hover { background: var(--bg-hover); border-color: var(--border-hover); transform: translateY(-1px); }
        .auth-divider { display: flex; align-items: center; gap: 16px; margin: 24px 0; font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
        .auth-divider-line { flex: 1; height: 1px; background: var(--border); }
        .name-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .field-group { margin-bottom: 20px; }
        .name-row .field-group { margin-bottom: 0; }
        .field-label { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; padding-left: 2px; }
        .field-input { width: 100%; background: var(--bg-input); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; font-family: var(--font); font-size: 14px; color: var(--text-primary); outline: none; transition: all 0.2s; }
        .field-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
        .field-input::placeholder { color: var(--text-muted); }
        .field-input-pw { padding-right: 44px; }
        .pw-wrapper { position: relative; }
        .pw-toggle { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; color: var(--text-muted); background: none; border: none; padding: 8px; display: flex; align-items: center; justify-content: center; }
        .submit-btn { width: 100%; padding: 14px; border: none; border-radius: 12px; font-family: var(--font); font-size: 15px; font-weight: 700; color: #fff; cursor: pointer; transition: all 0.2s; background: var(--gradient-accent); box-shadow: 0 4px 20px rgba(76,158,235,0.3); margin-top: 4px; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(76,158,235,0.4); }
        .submit-btn-success { background: var(--success) !important; box-shadow: 0 4px 20px rgba(52,211,153,0.3) !important; }
        .submit-btn-submitting { opacity: 0.7; }
        .auth-footer-text { text-align: center; margin-top: 24px; font-size: 12px; color: var(--text-muted); }

        @keyframes orbFloat1 { 0%, 100% { transform: translate(0,0) scale(1); } 33% { transform: translate(40px,30px) scale(1.05); } 66% { transform: translate(-20px,-20px) scale(0.95); } }
        @keyframes orbFloat2 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-30px,-40px) scale(1.1); } }
        @keyframes orbFloat3 { 0%, 100% { transform: translate(0,0); } 33% { transform: translate(-20px,30px); } 66% { transform: translate(20px,-20px); } }
        @keyframes markPulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.2; transform: scale(1.15); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes featureSlideIn { to { opacity: 1; transform: translateX(0); } }
        @keyframes statusPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes cardReveal { to { opacity: 1; transform: translateY(0); } }
        @keyframes particleFloat { 0% { transform: translateY(100vh) scale(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(-20vh) scale(1); opacity: 0; } }

        @media (max-width: 1024px) { .brand-panel { padding: 40px 48px; width: 45%; } .brand-headline { font-size: 36px; } .brand-subtitle { font-size: 15px; margin-bottom: 36px; } .brand-logo { margin-bottom: 40px; } .status-bar { margin-top: 36px; } .auth-section { padding: 32px; } }
        @media (max-width: 768px) { .login-page { flex-direction: column; min-height: 100dvh; overflow-y: auto; overflow-x: hidden; } .login-theme-btn { top: 16px; right: 16px; width: 40px; height: 40px; border-radius: 10px; } .brand-panel { width: 100%; padding: 24px 24px 0; justify-content: flex-start; flex-shrink: 0; display: contents; } .brand-logo { order: 1; padding: 24px 24px 0; margin-bottom: 24px; } .brand-headline { order: 2; padding: 0 24px; margin-bottom: 12px; } .brand-subtitle { order: 3; padding: 0 24px; margin-bottom: 0; max-width: none; } .auth-section { order: 4; } .features-list { order: 5; padding: 0 24px; } .status-bar { order: 6; padding: 0 24px 32px; } .brand-mark { width: 36px; height: 36px; border-radius: 10px; font-size: 13px; } .brand-mark-glow { border-radius: 13px; } .brand-name { font-size: 16px; } .brand-version { font-size: 10px; } .brand-headline { font-size: 28px; letter-spacing: -0.03em; line-height: 1.15; } .headline-cursor { top: 5px; bottom: 5px; width: 2px; } .brand-subtitle { font-size: 14px; line-height: 1.55; } .feature-card { padding: 14px 16px; transform: none !important; opacity: 1 !important; animation: none !important; } .feature-text { font-size: 13px; } .feature-icon { width: 34px; height: 34px; border-radius: 8px; } .status-bar { margin-top: 8px; justify-content: center; } .auth-section { flex: none; width: 100%; padding: 24px; } .auth-card { max-width: none; padding: 24px 20px; border-radius: 16px; } .auth-title { font-size: 22px; } .auth-subtitle { margin-bottom: 20px; } .field-input { font-size: 16px !important; padding: 12px 14px; } .field-input-pw { padding-right: 48px; } .google-btn { padding: 14px; min-height: 50px; font-size: 14px; } .submit-btn { padding: 16px; min-height: 52px; font-size: 16px; } .pw-toggle { padding: 12px; right: 6px; min-width: 44px; min-height: 44px; } .auth-divider { margin: 18px 0; } .name-row { gap: 10px; } .auth-footer-text { margin-top: 16px; font-size: 13px; } .bg-grid { mask-image: radial-gradient(ellipse 100% 50% at 50% 15%, black 10%, transparent 60%); -webkit-mask-image: radial-gradient(ellipse 100% 50% at 50% 15%, black 10%, transparent 60%); } .bg-orb-1 { width: 300px; height: 300px; top: -15%; left: -15%; } .bg-orb-2 { width: 250px; height: 250px; } .bg-orb-3 { width: 200px; height: 200px; top: 30%; right: -10%; } }
        @media (max-width: 390px) { .brand-logo { padding: 20px 20px 0; } .brand-headline { padding: 0 20px; font-size: 24px; } .brand-subtitle { padding: 0 20px; font-size: 13px; } .auth-section { padding: 20px; } .auth-card { padding: 20px 16px; } .features-list { padding: 0 20px; } .status-bar { padding: 0 20px 28px; } .name-row { grid-template-columns: 1fr; gap: 0; } .name-row .field-group { margin-bottom: 16px; } }
      `}</style>
    </div>
  );
}