import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || 'Klyph_Media';

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL parameter missing' }, { status: 400 });
  }

  try {
    const reqHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
    const rangeHeader = req.headers.get('range');
    if (rangeHeader) {
      reqHeaders['Range'] = rangeHeader;
    }

    const response = await fetch(targetUrl, {
      headers: reqHeaders
    });

    if (!response.ok && response.status !== 206) {
      return NextResponse.redirect(targetUrl);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const cleanFilename = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');

    const resHeaders = new Headers();
    resHeaders.set('Content-Type', contentType);
    resHeaders.set('Content-Disposition', `attachment; filename="${cleanFilename}"`);
    resHeaders.set('Cache-Control', 'no-cache');

    const contentLength = response.headers.get('content-length');
    if (contentLength) resHeaders.set('Content-Length', contentLength);

    const contentRange = response.headers.get('content-range');
    if (contentRange) resHeaders.set('Content-Range', contentRange);

    const acceptRanges = response.headers.get('accept-ranges');
    if (acceptRanges) resHeaders.set('Accept-Ranges', acceptRanges);

    return new Response(response.body, {
      status: response.status,
      headers: resHeaders
    });
  } catch (err) {
    return NextResponse.redirect(targetUrl);
  }
}
