'use client';

export default function Preview({ fileName, onDownload }) {
  return (
    <div className="preview-box">
      <h3>Document Ready!</h3>
      <p>Your completed document has been generated.</p>
      <p className="file-name">File: {fileName}</p>
      <button onClick={onDownload} className="download-button">
        Download Completed Document
      </button>
    </div>
  );
}

