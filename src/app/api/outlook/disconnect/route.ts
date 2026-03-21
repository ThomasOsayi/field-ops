import { NextRequest, NextResponse } from 'next/server';
import { disconnectOutlook } from '@/lib/microsoft-graph';

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();
    if (!uid) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    await disconnectOutlook(uid);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}