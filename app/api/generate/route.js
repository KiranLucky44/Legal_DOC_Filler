import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export async function POST(request) {
  try {
    const body = await request.json();
    const { fileBuffer, placeholders, values } = body;

    if (!fileBuffer || !placeholders || !values) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // Convert base64 buffer back to Buffer
    const buffer = Buffer.from(fileBuffer, 'base64');

    // Extract text from the original document
    const textResult = await mammoth.extractRawText({ buffer });
    let text = textResult.value;

    // Replace placeholders with user-provided values
    placeholders.forEach((placeholder, index) => {
      const regex = new RegExp(`{{${placeholder}}}`, 'g');
      const value = values[index] || '';
      text = text.replace(regex, value);
    });

    // Split text into paragraphs and create docx document
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
    
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs.map(para => 
            new Paragraph({
              children: [
                new TextRun({
                  text: para,
                  size: 24, // 12pt in half-points
                }),
              ],
            })
          ),
        },
      ],
    });

    // Generate document buffer
    const docBuffer = await Packer.toBuffer(doc);

    // Convert to base64 for JSON response
    const base64Doc = docBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      document: base64Doc,
      message: 'Document generated successfully'
    });

  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate document', details: error.message },
      { status: 500 }
    );
  }
}

