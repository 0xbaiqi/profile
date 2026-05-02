import { useState, useRef, useEffect } from 'react';

export default function ChatDialog() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'agent'; text: string }[]>([
    { role: 'agent', text: 'Agent分身生成中，暂未上线，有事邮件联系' },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [
      ...prev,
      { role: 'user', text },
      { role: 'agent', text: '分身尚未就绪，请稍后再试 🔧' },
    ]);
    setInput('');
  };

  return (
    <>
      {/* Toggle button — styled same as nav links */}
      <button className="chat-btn" onClick={() => setOpen(v => !v)}>
        {open ? '✕  关闭对话' : '💬  与白起对话'}
      </button>

      {/* Dialog */}
      {open && (
        <div className="chat-dialog">
          <div className="chat-header">与白起对话</div>
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role}`}>
                {m.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="发送消息…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button className="chat-send" onClick={handleSend}>发送</button>
          </div>
        </div>
      )}
    </>
  );
}
