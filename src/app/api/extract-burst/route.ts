import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import os from 'os';

export async function POST(req: NextRequest) {
  const binaryPath = path.join(process.cwd(), 'bin', 'extract-frames');

  // Auto-compile binary if not present
  if (!existsSync(binaryPath)) {
    const swiftSource = path.join(process.cwd(), 'native', 'extract-frames.swift');
    if (existsSync(swiftSource)) {
      try {
        const { execSync } = await import('child_process');
        await fs.mkdir(path.join(process.cwd(), 'bin'), { recursive: true });
        execSync(`swiftc -O "${swiftSource}" -o "${binaryPath}"`, { stdio: 'inherit' });
      } catch (compileErr) {
        console.warn('Failed to compile native binary:', compileErr);
      }
    }
  }

  if (!existsSync(binaryPath)) {
    return NextResponse.json(
      { error: 'Native extraction binary not available on this platform' },
      { status: 501 }
    );
  }

  let tempFilePath: string | null = null;
  let targetVideoPath: string | null = null;
  let interval = '0.15';
  let maxFrames = '45';
  let maxWidth = '1080';

  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      if (body.filePath && existsSync(body.filePath)) {
        targetVideoPath = body.filePath;
      }
      if (body.intervalSeconds) interval = String(body.intervalSeconds);
      if (body.maxFrames) maxFrames = String(body.maxFrames);
      if (body.maxWidth) maxWidth = String(body.maxWidth);
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('video') as File | null;
      const intervalParam = formData.get('intervalSeconds') as string | null;
      const maxFramesParam = formData.get('maxFrames') as string | null;
      const maxWidthParam = formData.get('maxWidth') as string | null;

      if (intervalParam) interval = intervalParam;
      if (maxFramesParam) maxFrames = maxFramesParam;
      if (maxWidthParam) maxWidth = maxWidthParam;

      if (!file) {
        return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name) || '.mov';
      const tempFileName = `luxs-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
      tempFilePath = path.join(os.tmpdir(), tempFileName);

      await fs.writeFile(tempFilePath, buffer);
      targetVideoPath = tempFilePath;
    } else {
      return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 400 });
    }

    if (!targetVideoPath) {
      return NextResponse.json({ error: 'Video path could not be resolved' }, { status: 400 });
    }

    // Execute native frame extractor binary
    const results = await new Promise<string>((resolve, reject) => {
      execFile(
        binaryPath,
        [targetVideoPath as string, interval, maxFrames, maxWidth],
        { maxBuffer: 100 * 1024 * 1024 }, // 100MB buffer for base64 JSON
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Extraction failed: ${error.message} (${stderr})`));
            return;
          }
          resolve(stdout);
        }
      );
    });

    const parsedFrames = JSON.parse(results);
    return NextResponse.json({ frames: parsedFrames });
  } catch (err: unknown) {
    console.error('Extraction API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to extract frames' },
      { status: 500 }
    );
  } finally {
    if (tempFilePath && existsSync(tempFilePath)) {
      try {
        await fs.unlink(tempFilePath);
      } catch {
        // ignore cleanup error
      }
    }
  }
}
