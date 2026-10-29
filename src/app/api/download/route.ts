import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || 'Klyph_Media';

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL parameter missing' }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!response.ok) {
      return NextResponse.redirect(targetUrl);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const cleanFilename = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');

    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${cleanFilename}"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (err) {
    return NextResponse.redirect(targetUrl);
  }
}