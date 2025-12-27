import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Sparkles, TrendingUp, Package, DollarSign, X, Minimize2, Maximize2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const AIChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickStats, setQuickStats] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosed, setIsClosed] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadQuickStats();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadQuickStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/quick-stats`);
      if (response.ok) {
        const data = await response.json();
        setQuickStats(data);
      }
    } catch (error) {
      console.error('Error loading quick stats:', error);
    }
  };

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim()) return;

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversation_history: messages
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: data.timestamp,
          model: data.model
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestedQuestion = (question) => {
    sendMessage(question);
  };

  if (isClosed) {
    return (
      <button
        onClick={() => setIsClosed(false)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-linear-to-r from-blue-600 to-purple-600 
                   text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300
                   flex items-center justify-center group hover:scale-110 z-50"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
      </button>
    );
  }

  return (
    <div className={`fixed ${isMinimized ? 'bottom-6 right-6' : 'inset-0 md:bottom-6 md:right-6 md:inset-auto'} 
                     ${isMinimized ? 'w-80 h-16' : 'w-full h-full md:w-112.5 md:h-175'} 
                     bg-white rounded-xl shadow-2xl flex flex-col z-50 transition-all duration-300`}>
      
      <div className="bg-linear-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">AI Business Assistant</h3>
            <p className="text-xs text-white/80">Ask me anything about your business</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
          <button
            onClick={() => setIsClosed(true)}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {quickStats && messages.length === 0 && (
            <div className="p-4 bg-linear-to-br from-blue-50 to-purple-50 border-b">
              <p className="text-sm font-semibold text-gray-700 mb-3">Quick Overview</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                  <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Today</p>
                  <p className="font-bold text-sm">₹{quickStats.today.revenue.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                  <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">This Week</p>
                  <p className="font-bold text-sm">₹{quickStats.this_week.revenue.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                  <Package className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Profit</p>
                  <p className="font-bold text-sm">₹{quickStats.today.profit.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-linear-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Ask Me Anything!</h4>
                <p className="text-sm text-gray-600 mb-4">I can help you with sales, profit, inventory, and more</p>
                
                <div className="space-y-2 mt-6">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Try asking:</p>
                  {['How much did I sell today?', 'What are my top products?', 'Show me profit this month'].map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestedQuestion(q)}
                      className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 
                               rounded-lg text-sm text-gray-700 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-linear-to-r from-blue-600 to-purple-600 text-white'
                      : msg.error
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {msg.role === 'assistant' && !msg.error && (
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-600">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t bg-gray-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="px-5 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white 
                         rounded-xl hover:shadow-lg transition-all disabled:opacity-50 
                         disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Powered by AI • Ask about sales, profit, inventory & more
            </p>
          </div>
        </>
      )}
    </div>
  );
};  

export default AIChatbot;