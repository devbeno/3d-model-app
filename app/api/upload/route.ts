import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    if (!file.name.toLowerCase().endsWith('.glb')) {
      return NextResponse.json(
        { error: 'Only GLB files are supported' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Generate unique filename and sanitize it
    const timestamp = Date.now();
    // Sanitize filename: remove/replace spaces and special characters
    // Keep the original extension
    const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const sanitizedName = baseName
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/[^a-zA-Z0-9._-]/g, '') // Remove special characters except . _ -
      .toLowerCase();
    const filename = `${timestamp}_${sanitizedName}${fileExtension}`;
    
    // Get the public/models directory path
    const publicModelsPath = join(process.cwd(), 'public', 'models');
    
    // Create models directory if it doesn't exist
    if (!existsSync(publicModelsPath)) {
      await mkdir(publicModelsPath, { recursive: true });
    }

    // Save file to public/models directory
    const filePath = join(publicModelsPath, filename);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // Create public URL path (relative to public folder)
    // Filename is already sanitized, so no encoding needed
    const publicPath = `/models/${filename}`;

    return NextResponse.json({
      success: true,
      downloadURL: publicPath,
      filename: filename,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload file', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

