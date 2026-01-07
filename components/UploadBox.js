'use client';

export default function UploadBox({ onUpload, disabled }) {
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      alert('Please upload a .docx file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Store file in memory for later use (convert to base64)
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        
        onUpload({
          fileData: base64,
          fileName: file.name,
          text: data.text,
          placeholders: data.placeholders,
        });
      } else {
        alert(`Error: ${data.error || 'Failed to process file'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
    }
  };

  return (
    <div className="upload-box">
      <label className="upload-label">
        <input
          type="file"
          accept=".docx"
          onChange={handleFileChange}
          disabled={disabled}
          style={{ display: 'none' }}
        />
        <div className="upload-button">
          {disabled ? 'Processing...' : 'Upload .docx File'}
        </div>
      </label>
    </div>
  );
}

