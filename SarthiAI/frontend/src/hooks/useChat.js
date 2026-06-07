import { useState, useCallback, useRef } from 'react';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "👋 Hi! I'm your AI travel assistant. Tell me about your dream trip — where you want to go, how many days, your budget, and what you're interested in. I'll help you build the perfect itinerary!",
};

export default function useChat() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [itineraryData, setItineraryData] = useState(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const sendMessage = useCallback(async (text) => {
    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messagesRef.current.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error('Chat failed');

      const data = await res.json();
      const assistantMsg = { role: 'assistant', content: data.message };

      setMessages((prev) => [...prev, assistantMsg]);

      if (data.itinerary) {
        const params = data.parsed || {};
        setItineraryData({
          ...data.itinerary,
          _destination: params.destination || data.itinerary.destination || '',
          _duration: params.duration || 3,
          _params: params,
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I hit an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([INITIAL_MESSAGE]);
    setItineraryData(null);
  }, []);

  return { messages, input, setInput, loading, sendMessage, clearChat, itineraryData };
}
