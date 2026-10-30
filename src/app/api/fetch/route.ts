import { NextRequest, NextResponse } from 'next/server';
import { extractMedia } from '@/lib/extractor';
import { parseFriendlyError } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Please paste a valid video link.',
          errorDetails: {
            title: 'Missing Link',
            message: 'No video link was provided.',
            tip: 'Paste a link into the input box to start downloading.'
          }
        },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    const metadata = await extractMedia(url.trim());
    return NextResponse.json(
      { success: true, data: metadata },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error: any) {
    const rawError = error.message || '';
    const friendly = parseFriendlyError(rawError);

    return NextResponse.json(
      { 
        success: false, 
        error: friendly.message,
        errorDetails: friendly,
        debugError: rawError
      },
      { 
        status: 400,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}
