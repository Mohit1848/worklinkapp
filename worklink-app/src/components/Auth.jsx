import React, { useState } from 'react';

const AuthForm = ({ role, onLogin, onBack }) => {
    const [contact, setContact] = useState('');
    const [password, setPassword] = useState('');
    const [skill, setSkill] = useState('');
    const [error, setError] = useState(null);

    const availableSkills = ['Mason', 'Carpenter', 'Plumber', 'Electrician', 'General Labor', 'Painter', 'House Helper'];

    const handleLogin = (e) => {
        e.preventDefault();
        setError(null);

        if (contact.length < 5) {
            setError("Please enter valid contact info.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be 6+ characters.");
            return;
        }
        if (role === 'worker' && !skill) {
            setError("Please select your primary skill.");
            return;
        }

        const uniqueToken = role + "-" + contact.toLowerCase().replace(/[^a-z0-9]/g, '');
        onLogin(role, uniqueToken, contact, skill); 
    };

    const mainColor = role === 'worker' ? 'bg-green-600 hover:bg-green-700' : 'bg-teal-600 hover:bg-teal-700';

    return (
        <div className={`p-8 bg-white rounded-xl shadow-2xl border-t-8 ${role === 'worker' ? 'border-green-500' : 'border-teal-500'} w-full max-w-sm mx-auto`}>
            <div className='flex justify-between items-center mb-4 border-b pb-2'>
                <button 
                    onClick={onBack}
                    className='text-gray-500 hover:text-amber-600 text-sm font-semibold flex items-center'
                >
                    ← Back
                </button>
                <h3 className='text-2xl font-bold text-gray-800'>
                    {role === 'worker' ? 'Worker Login' : 'Client Login'}
                </h3>
            </div>

            <form onSubmit={handleLogin} className='space-y-4'>
                <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Phone or Email"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg text-center"
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (min 6 chars)"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg text-center"
                />
                
                {role === 'worker' && (
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Primary Skill</label>
                        <select
                            value={skill}
                            onChange={(e) => setSkill(e.target.value)}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg text-center bg-white"
                        >
                            <option value="">Select your trade...</option>
                            {availableSkills.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                )}

                {error && <p className='text-red-500 text-xs'>{error}</p>}

                <button
                    type="submit"
                    disabled={!contact || !password || (role === 'worker' && !skill)}
                    className={`w-full py-3 text-white font-bold rounded-lg shadow-lg transition disabled:opacity-50 ${mainColor}`}
                >
                    Login / Register
                </button>
            </form>
        </div>
    );
};

const AuthModal = ({ role, setAuthView, onLogin }) => {
    let content;
    if (role === 'select') {
        content = (
            <div className="p-8 bg-white rounded-xl shadow-2xl w-full max-w-lg text-center">
                <h2 className="text-3xl font-bold text-teal-800 mb-6">Choose Your Role</h2>
                <div className="space-y-4">
                    <button
                        onClick={() => setAuthView('worker')}
                        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg"
                    >
                        I Need Work (Worker)
                    </button>
                    <button
                        onClick={() => setAuthView('client')}
                        className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg"
                    >
                        I Need to Hire (Client)
                    </button>
                </div>
                <button
                    onClick={() => setAuthView(null)}
                    className="mt-6 text-sm text-gray-600 hover:text-red-500"
                >
                    Close
                </button>
            </div>
        );
    } else if (role === 'worker' || role === 'client') {
        content = (
            <AuthForm 
                role={role} 
                onLogin={onLogin} 
                onBack={() => setAuthView('select')} 
            />
        );
    } else {
        return null;
    }

    return (
        <div className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4" onClick={() => setAuthView(null)}>
            <div onClick={(e) => e.stopPropagation()}>
                {content}
            </div>
        </div>
    );
};

export default AuthModal;
