import { NextRequest, NextResponse } from 'next/server';

// Cloudflare R2 Storage API Route
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Missing key parameter' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Missing file' },
        { status: 400 }
      );
    }

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    const result = await uploadToR2(key, arrayBuffer, file.type);

    return NextResponse.json({
      success: true,
      url: `https://r2.armstrong-haulage.com/${key}`,
      key,
      ...result,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Missing key parameter' },
        { status: 400 }
      );
    }

    const file = await getFromR2(key);
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return new Response(file, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve file' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Missing key parameter' },
        { status: 400 }
      );
    }

    const success = await deleteFromR2(key);

    return NextResponse.json({
      success,
      message: success ? 'File deleted' : 'File not found',
    });
  } catch (error) {
    console.error('Deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}

async function uploadToR2(key: string, data: ArrayBuffer, mimeType: string) {
  // Implementation placeholder
  return { size: data.byteLength, mimeType };
}

async function getFromR2(key: string) {
  // Implementation placeholder
  return null;
}

async function deleteFromR2(key: string) {
  // Implementation placeholder
  return true;
}
