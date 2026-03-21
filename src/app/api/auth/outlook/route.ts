import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/microsoft-graph';

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get('uid');
  if (!uid) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const authUrl = getAuthUrl(uid);
  return NextResponse.redirect(authUrl);
}