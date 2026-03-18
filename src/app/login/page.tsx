'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!loading && user) router.replace('/jobs'); }, [user, loading, router]);

  // Create floating particles
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

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#06080C', color: '#556277', fontSize: '14px' }}>Loading…</div>;
  if (user) return null;

  const inputStyle: React.CSSProperties = { width: '100%', background: '#0D1117', border: '1px solid #1E2736', borderRadius: '10px', padding: '14px 16px', fontFamily: 'var(--font)', fontSize: '14px', color: '#EAF0F6', outline: 'none', transition: 'all 0.2s' };
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#4C9EEB'; e.target.style.boxShadow = '0 0 0 3px rgba(76,158,235,0.08), 0 0 20px rgba(76,158,235,0.05)'; };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#1E2736'; e.target.style.boxShadow = 'none'; };

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', background: '#06080C', fontFamily: "'DM Sans', sans-serif", color: '#EAF0F6', position: 'relative', overflow: 'hidden' }}>

      {/* ═══ ANIMATED BACKGROUND ═══ */}
      {/* Grid */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(76,158,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(76,158,235,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse 80% 60% at 30% 50%, black 20%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 30% 50%, black 20%, transparent 70%)' }} />
      {/* Orbs */}
      <div style={{ position: 'fixed', width: '500px', height: '500px', top: '-10%', left: '-5%', borderRadius: '50%', filter: 'blur(80px)', background: 'radial-gradient(circle, rgba(76,158,235,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'orbFloat1 12s ease-in-out infinite' }} />
      <div style={{ position: 'fixed', width: '400px', height: '400px', bottom: '-10%', left: '25%', borderRadius: '50%', filter: 'blur(80px)', background: 'radial-gradient(circle, rgba(123,97,255,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'orbFloat2 15s ease-in-out infinite' }} />
      <div style={{ position: 'fixed', width: '300px', height: '300px', top: '20%', right: '10%', borderRadius: '50%', filter: 'blur(80px)', background: 'radial-gradient(circle, rgba(76,158,235,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'orbFloat3 18s ease-in-out infinite' }} />
      {/* Particles container */}
      <div ref={particlesRef} />

      {/* ═══ BRAND PANEL ═══ */}
      <div style={{ width: '48%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 72px', position: 'relative', zIndex: 1 }} className="brand-hide-mobile">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '56px', opacity: 0, animation: 'fadeSlideUp 0.6s ease 0.2s forwards' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #4C9EEB, #7B61FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '20px', color: '#fff', boxShadow: '0 8px 32px rgba(76,158,235,0.3), 0 0 60px rgba(76,158,235,0.15)', position: 'relative' }}>
            FO
            <div style={{ position: 'absolute', inset: '-3px', borderRadius: '19px', background: 'linear-gradient(135deg, rgba(76,158,235,0.4), rgba(123,97,255,0.4))', zIndex: -1, animation: 'markPulse 3s ease-in-out infinite' }} />
          </div>
          <div>
            <div className="gradient-text" style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.03em' }}>FieldOps</div>
            <div style={{ fontSize: '11px', color: '#556277', fontFamily: "'JetBrains Mono', monospace", marginTop: '2px' }}>v1.0</div>
          </div>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: '20px', opacity: 0, animation: 'fadeSlideUp 0.6s ease 0.4s forwards' }}>
          Manage your<br/>field operations<br/>
          <span className="gradient-text" style={{ position: 'relative', display: 'inline-block' }}>
            in one place
            <span style={{ position: 'absolute', right: '-4px', top: '8px', bottom: '8px', width: '3px', background: '#4C9EEB', borderRadius: '2px', animation: 'blink 1s step-end infinite' }} />
          </span>
        </h1>

        <p style={{ fontSize: '16px', color: '#8899AB', lineHeight: 1.7, maxWidth: '420px', marginBottom: '48px', opacity: 0, animation: 'fadeSlideUp 0.6s ease 0.6s forwards' }}>
          Schedule jobs, sync to Outlook Calendar, manage contacts and documents. All from a single dashboard built for your team.
        </p>

        {/* Features */}
        {[
          { icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>, color: '#4C9EEB', bg: 'rgba(76,158,235,0.12)', title: 'Outlook Sync', desc: '— Jobs auto-create calendar events', delay: '0.8s' },
          { icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>, color: '#34D399', bg: 'rgba(52,211,153,0.12)', title: 'Documents', desc: '— Upload, view, and organize field docs', delay: '0.95s' },
          { icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>, color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', title: 'Contacts', desc: '— Auto-builds your directory from jobs', delay: '1.1s' },
        ].map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', borderRadius: '12px', background: 'rgba(22,28,38,0.6)', border: '1px solid rgba(30,39,54,0.6)', backdropFilter: 'blur(8px)', marginBottom: '12px', opacity: 0, transform: 'translateX(-20px)', animation: `featureSlideIn 0.5s ease ${f.delay} forwards`, cursor: 'default', transition: 'all 0.25s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(76,158,235,0.2)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(76,158,235,0.05)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(30,39,54,0.6)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(22,28,38,0.6)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)'; }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: f.bg, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>{f.icon}</svg>
            </div>
            <div style={{ fontSize: '14px', color: '#8899AB', fontWeight: 600 }}><strong style={{ color: '#EAF0F6', fontWeight: 700 }}>{f.title}</strong> {f.desc}</div>
          </div>
        ))}

        {/* Status bar */}
        <div style={{ marginTop: '48px', display: 'flex', alignItems: 'center', gap: '20px', opacity: 0, animation: 'fadeSlideUp 0.5s ease 1.3s forwards' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#556277', fontFamily: "'JetBrains Mono', monospace" }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px #34D399', animation: 'statusPulse 2s infinite' }} />Systems operational
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#556277', fontFamily: "'JetBrains Mono', monospace" }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4C9EEB' }} />256-bit encrypted
          </div>
        </div>
      </div>

      {/* ═══ AUTH CARD ═══ */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: '420px', background: 'rgba(14,18,25,0.7)', border: '1px solid rgba(30,39,54,0.8)', borderRadius: '20px', padding: '40px', backdropFilter: 'blur(20px)', boxShadow: '0 24px 80px rgba(0,0,0,0.4), 0 0 1px rgba(76,158,235,0.1)', opacity: 0, transform: 'translateY(20px)', animation: 'cardReveal 0.7s ease 0.3s forwards', position: 'relative', overflow: 'hidden' }}>
          {/* Top gradient line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #4C9EEB, #7B61FF, transparent)', opacity: 0.6 }} />

          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '6px' }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p style={{ fontSize: '14px', color: '#556277', marginBottom: '28px' }}>
            {mode === 'login'
              ? <>Don&apos;t have an account? <span onClick={() => { setMode('signup'); setError(''); }} style={{ color: '#4C9EEB', fontWeight: 600, cursor: 'pointer' }}>Sign up</span></>
              : <>Already have an account? <span onClick={() => { setMode('login'); setError(''); }} style={{ color: '#4C9EEB', fontWeight: 600, cursor: 'pointer' }}>Sign in</span></>}
          </p>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '10px', fontSize: '12px', fontWeight: 600, color: '#F87171', marginBottom: '18px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px', flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}
            </div>
          )}

          {/* Google */}
          <button onClick={handleGoogle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(22,28,38,0.8)', border: '1px solid #1E2736', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, color: '#EAF0F6', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(30,39,54,0.8)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(76,158,235,0.3)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(22,28,38,0.8)'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#1E2736'; (e.currentTarget as HTMLButtonElement).style.transform = ''; }}>
            <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#1E2736' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#556277', textTransform: 'uppercase', letterSpacing: '0.06em' }}>or with email</span>
            <div style={{ flex: 1, height: '1px', background: '#1E2736' }} />
          </div>

          {mode === 'signup' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8899AB', marginBottom: '8px', paddingLeft: '2px' }}>First Name</label><input style={inputStyle} placeholder="Thomas" value={firstName} onChange={e => setFirstName(e.target.value)} onFocus={handleFocus} onBlur={handleBlur} /></div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8899AB', marginBottom: '8px', paddingLeft: '2px' }}>Last Name</label><input style={inputStyle} placeholder="Osayi" value={lastName} onChange={e => setLastName(e.target.value)} onFocus={handleFocus} onBlur={handleBlur} /></div>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8899AB', marginBottom: '8px', paddingLeft: '2px' }}>Email</label>
            <input type="email" style={inputStyle} placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} onFocus={handleFocus} onBlur={handleBlur} onKeyDown={e => { if (e.key === 'Enter') handleEmailSubmit(); }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8899AB', marginBottom: '8px', paddingLeft: '2px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: '44px' }} placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'} value={password} onChange={e => setPassword(e.target.value)} onFocus={handleFocus} onBlur={handleBlur} onKeyDown={e => { if (e.key === 'Enter') handleEmailSubmit(); }} />
              <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#556277', background: 'none', border: 'none', padding: '4px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                  {showPw ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                </svg>
              </button>
            </div>
          </div>

          <button onClick={handleEmailSubmit} disabled={submitting || success} style={{
            width: '100%', padding: '14px', border: 'none', borderRadius: '12px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 700, color: '#fff', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
            background: success ? '#34D399' : 'linear-gradient(135deg, #4C9EEB, #7B61FF)',
            boxShadow: success ? '0 4px 20px rgba(52,211,153,0.3)' : '0 4px 20px rgba(76,158,235,0.3), 0 0 40px rgba(76,158,235,0.1)',
            opacity: submitting ? 0.7 : 1,
          }}
            onMouseEnter={e => { if (!submitting && !success) { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(76,158,235,0.4), 0 0 60px rgba(76,158,235,0.15)'; } }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = success ? '0 4px 20px rgba(52,211,153,0.3)' : '0 4px 20px rgba(76,158,235,0.3), 0 0 40px rgba(76,158,235,0.1)'; }}>
            {submitting ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : success ? (mode === 'login' ? '✓ Welcome back!' : '✓ Account created!') : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#556277' }}>
            {mode === 'login'
              ? <span style={{ color: '#4C9EEB', cursor: 'pointer', fontWeight: 600 }}>Forgot password?</span>
              : <>By signing up you agree to our <span style={{ color: '#4C9EEB', fontWeight: 600 }}>Terms</span> and <span style={{ color: '#4C9EEB', fontWeight: 600 }}>Privacy</span></>}
          </div>
        </div>
      </div>

      <style>{`
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
        @media (max-width: 900px) { .brand-hide-mobile { display: none !important; } }
      `}</style>
    </div>
  );
}