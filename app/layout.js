import './globals.css';

export const metadata = {
  title: 'Legal Document Filler',
  description: 'Fill in legal document placeholders through a guided conversation',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

