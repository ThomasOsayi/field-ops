import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/microsoft-graph';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('OAuth error:', error, searchParams.get('error_description'));
    return NextResponse.redirect(new URL('/integrations?error=auth_failed', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/integrations?error=no_code', request.url));
  }

  try {
    await exchangeCodeForTokens(code);
    return NextResponse.redirect(new URL('/integrations?connected=true', request.url));
  } catch (err) {
    console.error('Token exchange error:', err);
    return NextResponse.redirect(new URL('/integrations?error=token_failed', request.url));
  }
}