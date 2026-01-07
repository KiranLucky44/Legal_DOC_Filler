'use client';

import { useState } from 'react';
import UploadBox from '../components/UploadBox';
import ChatBox from '../components/ChatBox';
import Preview from '../components/Preview';

export default function Home() {
  const [state, setState] = useState('upload'); // upload | chat | preview | generating
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [text, setText] = useState('');
  const [placeholders, setPlaceholders] = useState([]);
  const [completedDocument, setCompletedDocument] = useState(null);

  const handleUpload = (data) => {
    setFileData(data.fileData);
    setFileName(data.fileName);
    setText(data.text);
    setPlaceholders(data.placeholders);
    setState('chat');
  };

  const handleComplete = async (values) => {
    setState('generating');
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileBuffer: fileData,
          placeholders: placeholders,
          values: values,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCompletedDocument(data.document);
        setState('preview');
      } else {
        alert(`Error: ${data.error || 'Failed to generate document'}`);
        setState('chat');
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate document. Please try again.');
      setState('chat');
    }
  };

  const handleDownload = () => {
    if (!completedDocument) return;

    // Convert base64 to blob
    const binaryString = atob(completedDocument);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace('.docx', '_completed.docx') || 'completed_document.docx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setState('upload');
    setFileData(null);
    setFileName('');
    setText('');
    setPlaceholders([]);
    setCompletedDocument(null);
  };

  return (
    <main className="container">
      <div className="header">
        <h1>Legal Document Filler</h1>
        <p>Upload a .docx document with placeholders and fill them in through a guided conversation.</p>
      </div>

      <div className="content">
        {state === 'upload' && (
          <div className="step">
            <h2>Step 1: Upload Document</h2>
            <UploadBox onUpload={handleUpload} disabled={false} />
          </div>
        )}

        {state === 'chat' && (
          <div className="step">
            <h2>Step 2: Fill in Placeholders</h2>
            <ChatBox placeholders={placeholders} onComplete={handleComplete} />
            <button onClick={handleReset} className="reset-button">
              Start Over
            </button>
          </div>
        )}

        {state === 'generating' && (
          <div className="step">
            <h2>Generating Document...</h2>
            <div className="loading">Please wait while we generate your completed document.</div>
          </div>
        )}

        {state === 'preview' && (
          <div className="step">
            <h2>Step 3: Download</h2>
            <Preview fileName={fileName} onDownload={handleDownload} />
            <button onClick={handleReset} className="reset-button">
              Process Another Document
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

