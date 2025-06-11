import { useState, useRef, useEffect } from 'react';
import OpenAI from 'openai';

export default function AIBookBot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Ask me for book recommendations! Try: 'Find mystery books' or 'Suggest books like Harry Potter'",
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedIndexes, setExpandedIndexes] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const botRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 380, height: 500 });

  // Handle drag resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setDimensions(prev => ({
        width: Math.max(300, prev.width - e.movementX),
        height: Math.max(350, prev.height - e.movementY)
      }));
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    const resizer = document.getElementById('top-left-resizer');
    if (resizer) {
      resizer.onmousedown = (e) => {
        e.preventDefault();
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      };
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');

    try {
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_KEY,
        dangerouslyAllowBrowser: true
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Recommend 3 books with this format:
1. Title: [Book Title] by [Author]
   Reason: [Reason]
   Genre: [Genre]`
          },
          { role: "user", content: input }
        ]
      });

      const reply = completion.choices[0]?.message?.content || "No recommendations found";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error("API Error:", error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "⚠️ API connection failed. Please check:\n1. Your .env file has VITE_OPENAI_KEY\n2. The key is valid\n3. You've restarted the dev server"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseMessage = (msg: string, index: number) => {
    const lines = msg.split(/\n+/);
    return lines.map((line, i) => {
      const isExpanded = expandedIndexes.includes(index);
      if (!isExpanded && i > 2) return null;

      const formatted = line
        .replace(/^(\d+\.)\s*Title:\s*/i, '<strong>$1 Title:</strong> ')
        .replace(/^\s*Reason:\s*/i, '<strong>Reason:</strong> ')
        .replace(/^\s*Genre:\s*/i, '<strong>Genre:</strong> ');

      return (
        <p
          key={i}
          dangerouslySetInnerHTML={{ __html: formatted }}
          style={{ margin: '0.5rem 0', color: '#111827', fontSize: '15px' }}
        />
      );
    });
  };

  const toggleExpand = (index: number) => {
    setExpandedIndexes(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div
      ref={botRef}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: `${dimensions.width}px`,
        height: isOpen ? `${dimensions.height}px` : '42px',
        backgroundColor: '#f9fafb',
        border: '1px solid #cbd5e0',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        zIndex: 1000,
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Resizer (top-left) */}
      <div
        id="top-left-resizer"
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '12px',
          height: '12px',
          cursor: 'nwse-resize',
          zIndex: 1001,
          background: '#888',
          borderBottomRightRadius: '3px'
        }}
      />

      {/* Toggle Bar */}
      <div
        style={{
          background: '#3b82f6',
          color: 'white',
          padding: '10px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        AIBookBot <span>{isOpen ? '▾' : '▸'}</span>
      </div>

      {isOpen && (
        <>
          {/* Message Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '15px',
            background: '#fff'
          }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  margin: '10px 0',
                  padding: '12px',
                  borderRadius: '8px',
                  background: msg.role === 'user' ? '#3b82f6' : '#f3f4f6',
                  color: msg.role === 'user' ? 'white' : '#111827',
                  border: msg.role === 'user' ? 'none' : '1px solid #e5e7eb'
                }}
              >
                {msg.role === 'assistant'
                  ? <>
                      {parseMessage(msg.content, index)}
                      {msg.content.split('\n').length > 4 && (
                        <button
                          onClick={() => toggleExpand(index)}
                          style={{
                            marginTop: '0.5rem',
                            fontSize: '13px',
                            padding: '2px 6px',
                            border: 'none',
                            borderRadius: '4px',
                            backgroundColor: '#e0e0e0',
                            color: '#333',
                            cursor: 'pointer'
                          }}
                        >
                          {expandedIndexes.includes(index) ? 'Show Less ▲' : 'Show More ▼'}
                        </button>
                      )}
                    </>
                  : msg.content}
              </div>
            ))}
            {isLoading && (
              <div style={{
                padding: '10px',
                color: '#4b5563',
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                Searching books...
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{
            display: 'flex',
            padding: '12px',
            borderTop: '1px solid #e5e7eb',
            background: '#fff'
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your request..."
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                marginRight: '10px',
                backgroundColor: '#fff',
                color: '#111827',
                fontSize: '14px'
              }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              style={{
                padding: '10px 16px',
                background: isLoading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
