import React, { useState } from 'react';

const ChatBot = ({ jobs, user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { from: 'bot', text: 'Hi! Ask me about jobs, skills, wages, or your posted/assigned jobs.' }
    ]);

    const addMessage = (from, text) => {
        setMessages(prev => [...prev, { from, text }]);
    };

    const handleUserMessage = (e) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed) return;
        addMessage('user', trimmed);
        setInput('');
        handleBotLogic(trimmed.toLowerCase());
    };

    const handleBotLogic = (text) => {
        if (!jobs || jobs.length === 0) {
            addMessage('bot', 'There are no jobs in the system yet. Ask a client to post a job first.');
            return;
        }

        if (text.includes('open job') || text.includes('available job') || text.includes('find work')) {
            const openJobs = jobs.filter(j => j.status === 'Open');
            if (openJobs.length === 0) {
                addMessage('bot', 'There are currently no open jobs. Please check again later.');
            } else {
                const summary = openJobs
                    .slice(0, 5)
                    .map(j => `${j.title} (${j.skill}) - ₹${j.offeredWage}/day at ${j.location}`)
                    .join(' | ');
                addMessage('bot', `Here are some open jobs: ${summary}`);
            }
            return;
        }

        const skills = ['mason', 'carpenter', 'plumber', 'electrician', 'general labor', 'painter', 'house helper'];
        const matchedSkill = skills.find(s => text.includes(s.toLowerCase()));
        if (matchedSkill) {
            const skillJobs = jobs.filter(
                j => j.status === 'Open' && j.skill.toLowerCase().includes(matchedSkill.toLowerCase())
            );
            if (skillJobs.length === 0) {
                addMessage('bot', `No open ${matchedSkill} jobs found right now.`);
            } else {
                const summary = skillJobs
                    .slice(0, 5)
                    .map(j => `${j.title} - ₹${j.offeredWage}/day at ${j.location}`)
                    .join(' | ');
                addMessage('bot', `Open ${matchedSkill} jobs: ${summary}`);
            }
            return;
        }

        if (user && user.isAuthenticated && (text.includes('my job') || text.includes('my work'))) {
            if (user.role === 'client') {
                const myJobs = jobs.filter(j => j.clientId === user.id);
                if (myJobs.length === 0) {
                    addMessage('bot', 'You have not posted any jobs yet.');
                } else {
                    const summary = myJobs
                        .slice(0, 5)
                        .map(j => `${j.title} - ${j.status} - ₹${j.offeredWage}/day at ${j.location}`)
                        .join(' | ');
                    addMessage('bot', `Your posted jobs: ${summary}`);
                }
            } else if (user.role === 'worker') {
                const myAssigned = jobs.filter(j => j.workerId === user.id);
                if (myAssigned.length === 0) {
                    addMessage('bot', 'You do not have any assigned jobs yet. Ask for "open jobs" to see opportunities.');
                } else {
                    const summary = myAssigned
                        .slice(0, 5)
                        .map(j => `${j.title} - ${j.status} - ₹${j.offeredWage}/day at ${j.location}`)
                        .join(' | ');
                    addMessage('bot', `Your current/previous jobs: ${summary}`);
                }
            } else {
                addMessage('bot', 'Log in as a client or worker so I can show your jobs.');
            }
            return;
        }

        if (text.includes('help') || text.includes('how') || text.includes('what can you do')) {
            addMessage(
                'bot',
                'You can ask: "show open jobs", "electrician jobs", "my jobs", or "mason work near me".'
            );
            return;
        }

        addMessage(
            'bot',
            'Not sure about that. Try asking for "open jobs", a specific skill like "plumber jobs", or "my jobs".'
        );
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(o => !o)}
                className="fixed bottom-6 right-6 z-30 rounded-full bg-teal-600 hover:bg-teal-700 text-white w-14 h-14 shadow-xl flex items-center justify-center text-2xl"
                aria-label="Chat with WorkLink assistant"
            >
                💬
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-4 sm:right-6 z-30 w-80 sm:w-96 bg-white border border-gray-300 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    <div className="bg-teal-600 text-white px-4 py-3 flex justify-between items-center">
                        <div>
                            <p className="font-bold text-sm">WorkLink Job Assistant</p>
                            <p className="text-xs opacity-90">
                                Ask about open jobs, skills, or your jobs.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white text-lg leading-none"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="flex-1 px-3 py-2 space-y-2 overflow-y-auto max-h-80 bg-gray-50">
                        {messages.map((m, idx) => (
                            <div
                                key={idx}
                                className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`px-3 py-2 rounded-xl text-xs max-w-[80%] ${
                                        m.from === 'user'
                                            ? 'bg-teal-600 text-white rounded-br-sm'
                                            : 'bg-white border border-gray-200 rounded-bl-sm'
                                    }`}
                                >
                                    {m.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleUserMessage} className="border-t border-gray-200 flex">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a question about jobs..."
                            className="flex-1 px-3 py-2 text-sm outline-none"
                        />
                        <button
                            type="submit"
                            className="px-4 text-sm font-semibold text-teal-600 hover:text-teal-700"
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default ChatBot;
