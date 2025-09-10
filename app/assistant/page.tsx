// app/assistant/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';

interface GeminiResponsePart {
  type: 'text' | 'audio';
  content: string; // text content or base64 audio
}

interface InspectionStepData {
  question: string;
  section: string;
  part: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<{ type: 'user' | 'gemini', content: string | GeminiResponsePart[] }[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<InspectionStepData | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:3000/websocket');

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      // Send an initial message to start the inspection
      ws.current?.send('start inspection');
      setMessages((prev) => [...prev, { type: 'user', content: 'Starting inspection...' }]);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data as string);
      console.log('Received from WebSocket:', data);

      if (data.type === 'status') {
        setMessages((prev) => [...prev, { type: 'gemini', content: `Status: ${data.message}` }]);
      } else if (data.type === 'inspectionStep') {
        setCurrentQuestion(data.data);
        setMessages((prev) => [...prev, { type: 'gemini', content: `Next: ${data.data.question}` }]);
      } else if (data.type === 'geminiResponse') {
        setMessages((prev) => [...prev, { type: 'gemini', content: data.data }]);
        data.data.forEach((responsePart: GeminiResponsePart) => {
          if (responsePart.type === 'audio') {
            const audio = new Audio(`data:audio/wav;base64,${responsePart.content}`);
            audio.play().catch(e => console.error("Error playing audio:", e));
          }
        });
      } else if (data.type === 'inspectionComplete') {
        setMessages((prev) => [...prev, { type: 'gemini', content: `Inspection Complete: ${data.message}` }]);
        setCurrentQuestion(null); // Clear current question
      } else if (data.type === 'error') {
        setMessages((prev) => [...prev, { type: 'gemini', content: `Error: ${data.message}` }]);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setCurrentQuestion(null);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const sendMessage = () => {
    if (ws.current?.readyState === WebSocket.OPEN && input.trim()) {
      ws.current.send(input);
      setMessages((prev) => [...prev, { type: 'user', content: input }]);
      setInput('');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Gemini Assistant (Inspection)</h1>
      <p>Connection Status: {isConnected ? 'Connected' : 'Disconnected'}</p>

      {currentQuestion && (
        <div style={{ border: '1px solid #add8e6', padding: '10px', marginBottom: '10px', backgroundColor: '#e0f2f7' }}>
          <h3>Current Inspection Point: {currentQuestion.section} - {currentQuestion.part}</h3>
          <p><strong>Question:</strong> {currentQuestion.question}</p>
        </div>
      )}

      <div style={{ border: '1px solid #ccc', height: '400px', overflowY: 'scroll', marginBottom: '10px', padding: '10px' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '5px', color: msg.type === 'user' ? 'blue' : 'green' }}>
            <strong>{msg.type === 'user' ? 'You:' : 'Assistant:'}</strong>{' '}
            {typeof msg.content === 'string' ? msg.content : (
              <div>
                {msg.content.map((part, partIndex) => (
                  <span key={partIndex}>
                    {part.type === 'text' && part.content}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={currentQuestion ? `Respond to: ${currentQuestion.question}` : "Type your message..."}
        style={{ width: 'calc(100% - 80px)', padding: '8px', marginRight: '10px' }}
        disabled={!isConnected || !currentQuestion}
      />
      <button onClick={sendMessage} disabled={!isConnected || !currentQuestion}>Send</button>

      <div style={{ marginTop: '10px' }}>
        <p>Audio streaming functionality will be added here.</p>
      </div>
    </div>
  );
}
