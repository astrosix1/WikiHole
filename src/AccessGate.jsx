import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

const ESSENTIALS_SLUG = 'basic'; // Essentials plan slug in Supabase projects table

export function AccessGate({ children }) {
  // 'loading' | 'granted' | 'unauthenticated' | 'denied' | 'no-supabase'
  // In local dev, start pre-granted so you can test the UI without a subscription.
  // This flag is stripped out in production builds by Vite.
  const [state, setState] = useState(import.meta.env.DEV ? 'granted' : 'loading');

  useEffect(() => {
    // Hooks must run unconditionally on every render — the dev bypass only
    // decides the *initial* state above, not whether effects run at all.
    if (import.meta.env.DEV) return;
    if (!supabase) { setState('no-supabase'); return; }
    init();
  }, []);

  async function init() {
    try {
      // ── SSO: read tokens from URL hash (passed by LaunchWikiHoleButton) ──
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.slice(1));
        const at = params.get('access_token');
        const rt = params.get('refresh_token');
        if (at && rt) {
          await supabase.auth.setSession({ access_token: at, refresh_token: rt });
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }

      // ── Auth check ──────────────────────────────────────────────────────
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setState('unauthenticated'); return; }

      // ── Subscription check: look for active Essentials (basic) sub ──────
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', ESSENTIALS_SLUG)
        .single();

      if (!project) { setState('denied'); return; }

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .eq('project_id', project.id)
        .maybeSingle();

      const active = sub?.status === 'active' || sub?.status === 'trialing';
      setState(active ? 'granted' : 'denied');
    } catch {
      setState('denied');
    }
  }

  if (state === 'loading') return <Spinner />;
  if (state === 'granted') return children;
  return <Paywall reason={state} />;
}

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f2ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 28, height: 28, border: '2px solid #e0dbd2', borderTop: '2px solid #b8832a', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#aaa' }}>checking access…</p>
    </div>
  );
}

function Paywall({ reason }) {
  const isUnauth = reason === 'unauthenticated';
  return (
    <div style={{ minHeight: '100vh', background: '#f5f2ec', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: 400, textAlign: 'center' }}>
        <p style={{ fontSize: 40, marginBottom: 16 }}>🕳️</p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: '#1c1810', marginBottom: 8 }}>
          {isUnauth ? 'Sign in to continue' : 'WikiHole is included in Essentials'}
        </h1>
        <p style={{ fontFamily: 'monospace', fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: 28 }}>
          {isUnauth
            ? 'Head back to asix.live and log in, then launch WikiHole from your dashboard.'
            : 'Get the Essentials plan for $4.99/mo and unlock WikiHole plus the full toolkit.'}
        </p>
        <a
          href="https://asix.live/projects"
          style={{ display: 'inline-block', padding: '12px 28px', background: '#b8832a', color: '#fff', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
        >
          {isUnauth ? 'Go to asix.live →' : 'Get Essentials →'}
        </a>
      </div>
    </div>
  );
}
