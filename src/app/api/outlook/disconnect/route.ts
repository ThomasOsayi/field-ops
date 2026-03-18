import { NextResponse } from 'next/server';
import { disconnectOutlook } from '@/lib/microsoft-graph';

export async function POST() {
  try {
    await disconnectOutlook();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}