import { NextResponse } from 'next/server';
import mammoth from 'mammoth';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from .docx using mammoth
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    // Extract placeholders using regex
    const placeholderRegex = /{{(.*?)}}/g;
    const placeholders = [];
    const placeholderSet = new Set();
    
    let match;
    while ((match = placeholderRegex.exec(text)) !== null) {
      const placeholderName = match[1].trim();
      // Add to set to track unique placeholders
      if (!placeholderSet.has(placeholderName)) {
        placeholderSet.add(placeholderName);
        placeholders.push(placeholderName);
      }
    }

    // Return extracted text and placeholders
    return NextResponse.json({
      success: true,
      text: text,
      placeholders: placeholders,
      message: placeholders.length > 0 
        ? `Found ${placeholders.length} placeholder(s)` 
        : 'No placeholders found in document'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process document', details: error.message },
      { status: 500 }
    );
  }
}

