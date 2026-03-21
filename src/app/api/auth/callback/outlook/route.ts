import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/microsoft-graph';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(new URL(`/integrations?error=${error}`, request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/integrations?error=missing_params', request.url));
  }

  // Extract Firebase uid from state: "fieldops-{uid}"
  const uid = state.replace('fieldops-', '');
  if (!uid) {
    return NextResponse.redirect(new URL('/integrations?error=invalid_state', request.url));
  }

  try {
    await exchangeCodeForTokens(code, uid);
    return NextResponse.redirect(new URL('/integrations?connected=true', request.url));
  } catch (err) {
    console.error('Token exchange error:', err);
    return NextResponse.redirect(new URL('/integrations?error=token_exchange_failed', request.url));
  }
}