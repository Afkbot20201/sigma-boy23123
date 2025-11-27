import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext';

export default function ChatPanel({ gameId }) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (payload) => {
      if (payload.gameId !== gameId) return;
      setMessages((prev) => [...prev, payload]);
    };
    const onTyping = (payload) => {
      if (payload.gameId !== gameId) return;
      setTypingUsers((prev) => {
        const exists = prev.includes(payload.userId);
        if (payload.typing && !exists) return [...prev, payload.userId];
        if (!payload.typing && exists) return prev.filter((id) => id !== payload.userId);
        return prev;
      });
    };
    socket.on('chatMessage', onMessage);
    socket.on('typing', onTyping);
    return () => {
      socket.off('chatMessage', onMessage);
      socket.off('typing', onTyping);
    };
  }, [socket, gameId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    socket.emit('sendChat', { gameId, message: input.trim() });
    setInput('');
    socket.emit('typing', { gameId, typing: false });
  };

  const onChange = (e) => {
    setInput(e.target.value);
    if (socket) {
      socket.emit('typing', { gameId, typing: e.target.value.length > 0 });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin text-sm">
        {messages.map((m, idx) => (
          <div key={idx} className="bg-slate-800/80 rounded-xl px-3 py-2">
            <div className="text-[11px] text-emerald-300">{m.from.username}</div>
            <div>{m.message}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="mt-2">
        {typingUsers.length > 0 && (
          <div className="text-[11px] text-slate-400 mb-1">Someone is typing...</div>
        )}
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 rounded-xl bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            value={input}
            onChange={onChange}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Type a message..."
          />
          <button
            onClick={send}
            className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
