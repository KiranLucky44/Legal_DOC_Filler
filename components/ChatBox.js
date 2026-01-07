'use client';

import { useState, useEffect } from 'react';

export default function ChatBox({ placeholders, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (placeholders && placeholders.length > 0 && currentIndex < placeholders.length) {
      const placeholder = placeholders[currentIndex];
      setMessages(prev => [...prev, {
        type: 'question',
        text: `What should replace "${placeholder}"?`
      }]);
    } else if (placeholders && currentIndex >= placeholders.length && placeholders.length > 0) {
      // All questions answered
      const values = placeholders.map(p => answers[p] || '');
      onComplete(values);
    }
  }, [currentIndex, placeholders, answers, onComplete]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentAnswer.trim()) return;

    const placeholder = placeholders[currentIndex];
    const newAnswers = { ...answers, [placeholder]: currentAnswer.trim() };
    setAnswers(newAnswers);
    
    setMessages(prev => [...prev, {
      type: 'answer',
      text: currentAnswer.trim()
    }]);

    setCurrentAnswer('');
    setCurrentIndex(currentIndex + 1);
  };

  if (!placeholders || placeholders.length === 0) {
    return (
      <div className="chat-box">
        <div className="message info">No placeholders found in the document.</div>
      </div>
    );
  }

  if (currentIndex >= placeholders.length) {
    return (
      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.type}`}>
            {msg.type === 'question' ? 'Q: ' : 'A: '}{msg.text}
          </div>
        ))}
        <div className="message info">Processing document...</div>
      </div>
    );
  }

  return (
    <div className="chat-box">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.type}`}>
            <strong>{msg.type === 'question' ? 'Q: ' : 'A: '}</strong>
            {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="chat-form">
        <input
          type="text"
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          placeholder={`Enter value for "${placeholders[currentIndex]}"`}
          className="chat-input"
          autoFocus
        />
        <button type="submit" className="chat-submit">
          Submit
        </button>
      </form>
      <div className="progress">
        Question {currentIndex + 1} of {placeholders.length}
      </div>
    </div>
  );
}

