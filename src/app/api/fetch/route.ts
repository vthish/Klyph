import { NextRequest, NextResponse } from 'next/server';
import { extractMedia } from '@/lib/extractor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'A valid URL is required.' },
        { status: 400 }
      );
    }

    const metadata = await extractMedia(url.trim());
    return NextResponse.json({ success: true, data: metadata });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to extract video details.' },
      { status: 500 }
    );
  }
}