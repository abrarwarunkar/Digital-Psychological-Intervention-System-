import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuthStore } from '../state/authStore';
import EmergencyModal from '../components/EmergencyModal';

const Chat = () => {
    const { user } = useAuthStore();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);
    const [riskInfo, setRiskInfo] = useState({ level: 'low', confidence: 0 });
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get('/chat');
                setMessages(response.data);
            } catch (error) {
                console.error('Failed to fetch chat history', error);
            }
        };

        fetchHistory();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setLoading(true);

        // Optimistic update
        const tempId = Date.now();
        setMessages(prev => [...prev, { _id: tempId, message: userMsg, sender: 'user', timestamp: new Date() }]);

        try {
            const response = await api.post('/chat', { message: userMsg });
            // Replace optimistic message with real one and add bot response
            setMessages(prev => [
                ...prev.filter(m => m._id !== tempId),
                response.data.userMessage,
                response.data.botMessage
            ]);

            // Check for emergency
            if (response.data.analysis?.isEmergency || response.data.analysis?.riskLevel === 'emergency') {
                setRiskInfo({
                    level: response.data.analysis.riskLevel,
                    confidence: response.data.analysis.confidence
                });
                setShowEmergencyModal(true);
            }

        } catch (error) {
            console.error('Failed to send message', error);
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m._id !== tempId));
            alert('Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 h-[700px] flex flex-col overflow-hidden">
            <EmergencyModal
                isOpen={showEmergencyModal}
                onClose={() => setShowEmergencyModal(false)}
                riskLevel={riskInfo.level}
                confidence={riskInfo.confidence}
            />

            <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-md z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-lg shadow-md">
                        🤖
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text">AI Support Assistant</h2>
                        <p className="text-xs text-text/60 font-medium">Always here to listen & support you.</p>
                    </div>
                </div>
                <div className="mt-3 text-xs bg-blue-50/50 text-blue-800 p-3 rounded-xl border border-blue-100/50 leading-relaxed">
                    <strong>Note:</strong> I am an AI, not a human doctor. I can provide support, but I cannot diagnose medical conditions. In a crisis, please contact emergency services.
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50/30 scroll-smooth">
                {messages.length === 0 && (
                    <div className="text-center text-text/40 mt-20">
                        <div className="text-4xl mb-4 opacity-50">👋</div>
                        <p>No messages yet. Say "Hello" to start!</p>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div
                        key={msg._id || index}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                    >
                        <div
                            className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${msg.sender === 'user'
                                ? 'bg-primary text-white rounded-br-sm'
                                : 'bg-white text-text border border-slate-100 rounded-bl-sm'
                                }`}
                        >
                            <p className="leading-relaxed">{msg.message}</p>
                            <p className={`text-[10px] mt-2 text-right ${msg.sender === 'user' ? 'text-white/70' : 'text-text/40'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white p-4 rounded-2xl rounded-bl-sm border border-slate-100 shadow-sm">
                            <div className="flex space-x-1.5">
                                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white/50 backdrop-blur-md">
                <div className="flex gap-3 bg-white p-2 rounded-full border border-slate-200 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-grow px-4 py-2 bg-transparent focus:outline-none text-text placeholder:text-text/40"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 disabled:shadow-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat;
