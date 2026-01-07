# Legal Document Filler

A web application that allows users to upload a legal document (.docx) with placeholders and fill them in through a guided conversational flow.

## Features

- Upload .docx documents with placeholders in the format `{{PLACEHOLDER_NAME}}`
- Automatic placeholder detection
- Guided conversational flow to fill in placeholders
- Generate completed document
- Download the completed .docx file

## Tech Stack

- Next.js 14 (App Router)
- React 18
- mammoth (for parsing .docx files)
- docx (for generating .docx files)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Deployment to Vercel

This application is ready to deploy to Vercel:

1. Push your code to GitHub
2. Import your repository in Vercel
3. Deploy (no additional configuration needed)

## Usage

1. Upload a .docx file containing placeholders like `{{CLIENT_NAME}}`, `{{EFFECTIVE_DATE}}`, etc.
2. Answer the questions for each placeholder in the conversational interface
3. Download your completed document

## Project Structure

```
/app
  /api
    /upload/route.js      # Handles file upload and placeholder extraction
    /generate/route.js    # Generates completed .docx
  page.js                 # Main UI component
  layout.js               # Root layout
  globals.css             # Global styles
/components
  UploadBox.js            # File upload component
  ChatBox.js              # Conversational interface component
  Preview.js              # Download preview component
```

## Notes

- Placeholders must be in the format: `{{PLACEHOLDER_NAME}}`
- The application processes documents in memory (no database required)
- Document structure is preserved as much as possible during regeneration

