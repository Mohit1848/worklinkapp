import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
    getFirestore, doc, addDoc, collection, query, where, 
    onSnapshot, serverTimestamp, setDoc, updateDoc, writeBatch,
    setLogLevel
} from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// ===== FIREBASE CONFIG (Kept outside for constants, but init logic is moved) =====
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBjdW87NyPDG-kUADfrhGklR31oQeOj_Tg",
    authDomain: "worklink-app-64dd1.firebaseapp.com",
    projectId: "worklink-app-64dd1",
    storageBucket: "worklink-app-64dd1.firebasestorage.app",
    messagingSenderId: "42985181172",
    appId: "1:42985181172:web:4c9fe43c372fa7f62073a1",
    measurementId: "G-S1LNG6CG50"
};

const appId = FIREBASE_CONFIG.projectId;
const initialAuthToken = null;

// The setLogLevel remains here since it's a global setting for Firebase logging
setLogLevel('debug'); 

// --- OLD GLOBAL INIT BLOCK REMOVED/COMMENTED OUT ---
// let app, db, auth, analytics;
// if (FIREBASE_CONFIG.apiKey) {
//     app = initializeApp(FIREBASE_CONFIG);
//     db = getFirestore(app);
//     auth = getAuth(app);
//     try {
//         analytics = getAnalytics(app);
//     } catch (e) {
//         console.warn("Analytics failed:", e.message);
//     }
// }

const initialUser = { id: null, role: null, isAuthenticated: false };
const JOBS_COLLECTION_PATH = `/artifacts/${appId}/public/data/jobs`;
const USERS_COLLECTION_PATH = `/artifacts/${appId}/public/data/users`;
const MAP_IMAGE_BASE_URL = "https://maps.googleapis.com/maps/api/staticmap?zoom=13&size=300x150&markers=color:red%7C";

// ===== MESSAGE CARD COMPONENT (No Change) =====
const MessageCard = ({ title, children, type = 'info' }) => {
    let bgColor = "bg-teal-100 border-teal-400 text-teal-700";
    if (type === 'error') bgColor = "bg-red-100 border-red-400 text-red-700";
    if (type === 'success') bgColor = "bg-green-100 border-green-400 text-green-700";
    if (type === 'warning') bgColor = "bg-amber-100 border-amber-400 text-amber-700";

    return (
        <div className={`p-4 mt-6 border-l-4 rounded-lg shadow-md ${bgColor}`} role="alert">
            <p className="font-bold">{title}</p>
            {children && <p className="text-sm mt-1">{children}</p>}
        </div>
    );
};

// ===== MAP DISPLAY COMPONENT (No Change) =====
const MapDisplay = ({ coords, jobLocation }) => {
    if (!coords || typeof coords.lat === 'undefined' || typeof coords.lng === 'undefined') {
        return <div className="text-center text-gray-500 italic p-4 bg-gray-50 rounded-lg">Location unavailable</div>;
    }

    const mapUrl = `${MAP_IMAGE_BASE_URL}${coords.lat},${coords.lng}`;

    return (
        <div className="mt-4 border border-gray-300 rounded-lg overflow-hidden shadow-inner">
            <img 
                src={mapUrl} 
                alt={`Map of ${jobLocation}`} 
                className="w-full h-auto"
                onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/300x150/F0F4F8/333?text=Map+Unavailable" }}
            />
            <a 
                href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-teal-500 hover:bg-teal-600 text-white text-sm py-2 font-semibold transition"
            >
                Get Directions
            </a>
        </div>
    );
};

// ===== CLIENT JOB POSTING FORM (No Change) =====
const ClientPostJob = ({ user, db, onJobPosted, currentLocation, locationCoords }) => {
    const [title, setTitle] = useState('');
    const [skill, setSkill] = useState('');
    const [description, setDescription] = useState('');
    const [wage, setWage] = useState('');
    const [jobLocation, setJobLocation] = useState(currentLocation);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        setJobLocation(currentLocation);
    }, [currentLocation]);

    const availableSkills = ['Mason', 'Carpenter', 'Plumber', 'Electrician', 'General Labor', 'Painter', 'House Helper'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        if (!title || !skill || !wage || !jobLocation) {
            setError("Please fill in all required fields.");
            setLoading(false);
            return;
        }
        if (!locationCoords) {
            setError("Enable location services in your browser.");
            setLoading(false);
            return;
        }

        try {
            await addDoc(collection(db, JOBS_COLLECTION_PATH), {
                title,
                skill,
                description,
                offeredWage: parseFloat(wage),
                clientId: user.id,
                clientName: `Client ${user.id.substring(0, 4)}`,
                status: 'Open',
                location: jobLocation,
                coords: locationCoords,
                createdAt: serverTimestamp(),
            });

            setSuccessMessage("Job posted successfully!");
            setTitle('');
            setSkill('');
            setDescription('');
            setWage('');
            setJobLocation(currentLocation);
            onJobPosted();
        } catch (err) {
            console.error("Error posting job:", err);
            setError("Failed to post job. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-2xl border border-teal-100">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-4 border-amber-500 pb-2">Create Job Post</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Job Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Bricklaying for shed"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Job Location</label>
                    <input
                        type="text"
                        value={jobLocation}
                        onChange={(e) => setJobLocation(e.target.value)}
                        placeholder="e.g., Sector 14, City Park"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                    />
                    {locationCoords && (
                        <p className='text-xs text-gray-500 mt-1'>Coords: {locationCoords.lat.toFixed(4)}, {locationCoords.lng.toFixed(4)}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Skill Required</label>
                    <select
                        value={skill}
                        onChange={(e) => setSkill(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 bg-white"
                    >
                        <option value="">Select a Trade...</option>
                        {availableSkills.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Job Details</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Scope of work, tools, duration..."
                        rows="3"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Daily Wage (₹)</label>
                    <input
                        type="number"
                        value={wage}
                        onChange={(e) => setWage(e.target.value)}
                        placeholder="Min 500"
                        min="500"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                    />
                </div>

                {error && <MessageCard title="Error" type="error">{error}</MessageCard>}
                {successMessage && <MessageCard title="Success!" type="success">{successMessage}</MessageCard>}

                <button
                    type="submit"
                    disabled={loading || !locationCoords}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg shadow-lg transition disabled:opacity-50"
                >
                    {loading ? 'Posting...' : 'Post Job Offer'}
                </button>
            </form>
        </div>
    );
};

// ===== JOB ITEM COMPONENT (No Change) =====
const JobItem = ({ job, user, db, onJobAccepted }) => {
    const [loading, setLoading] = useState(false);
    const isClientJob = job.clientId === user.id;

    const handleAccept = async () => {
        setLoading(true);
        const jobRef = doc(db, JOBS_COLLECTION_PATH, job.id);
        const batch = writeBatch(db);

        batch.update(jobRef, {
            status: 'Assigned',
            workerId: user.id,
            workerName: `Worker ${user.id.substring(0, 4)}`,
            assignedAt: serverTimestamp(),
        });

        try {
            await batch.commit();
            onJobAccepted(job.id);
        } catch (e) {
            console.error("Error accepting job:", e);
            alert("This job may have been taken. Please refresh.");
        } finally {
            setLoading(false);
        }
    };

    const statusColor = {
        Open: 'bg-green-600',
        Assigned: 'bg-amber-600',
        Completed: 'bg-gray-600'
    }[job.status] || 'bg-gray-400';

    return (
        <div className={`p-5 rounded-xl shadow-lg transition duration-300 ${isClientJob ? 'bg-blue-50 border-blue-200' : 'bg-white border border-gray-200 hover:shadow-xl'}`}>
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-gray-800">{job.title}</h3>
                <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${statusColor}`}>
                    {job.status.toUpperCase()}
                </span>
            </div>

            <div className='flex justify-between items-center text-sm mb-3 border-b pb-2'>
                <p className="font-semibold text-teal-600">{job.skill}</p>
                <p className="text-lg font-extrabold text-amber-700">₹{job.offeredWage}/day</p>
            </div>

            <p className="text-sm text-gray-500 mb-2">📍 {job.location}</p>
            <MapDisplay coords={job.coords} jobLocation={job.location} />

            {(job.status === 'Open' && !isClientJob) && (
                <button
                    onClick={handleAccept}
                    disabled={loading}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
                >
                    {loading ? 'Processing...' : 'APPLY / ACCEPT JOB'}
                </button>
            )}
            {job.status === 'Assigned' && (
                <div className='mt-2 p-2 bg-gray-100 rounded-md text-center text-sm'>
                    {job.workerId === user.id ? (
                        <p className="font-semibold text-amber-700">Assigned to YOU!</p>
                    ) : (
                        <p className="font-semibold text-red-600">Already Assigned</p>
                    )}
                </div>
            )}
        </div>
    );
};

// ===== AUTH FORM COMPONENT - MODIFIED FOR WORKER SKILL & ONLOGIN CALL =====
const AuthForm = ({ role, onLogin, onBack }) => {
    const [contact, setContact] = useState('');
    const [password, setPassword] = useState('');
    const [skill, setSkill] = useState(''); // New state for worker skill
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
        if (role === 'worker' && !skill) { // New validation for worker skill
            setError("Please select your primary skill.");
            return;
        }

        const uniqueToken = role + "-" + contact.toLowerCase().replace(/[^a-z0-9]/g, '');
        // Pass the raw contact info AND skill data up for Firestore profile creation
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
                
                {/* Conditional Skill Dropdown for Workers */}
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

// ===== AUTH MODAL COMPONENT (No Change) =====
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

// ===== HOME PAGE - FIXED (No Change) =====
const Home = ({ openAuthModal, setView }) => {
    return (
        <div className="w-full">
            {/* Hero Section */}
            <div className="bg-white py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto text-center">
                    {/* Headline */}
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mb-6">
                        Your Direct Link to <span className="text-amber-600">Daily Wage Work</span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        Fair connections for construction, trade, and general labor jobs. No middlemen, secure payments.
                    </p>

                    {/* Mission */}
                    <p className="text-lg text-teal-700 font-semibold mb-12 max-w-2xl mx-auto">
                        Our Mission: We bridge the gap between job sites and local skilled workers, ensuring transparency, fair wages, and job security for daily laborers.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-6 justify-center mb-10">
                        <button
                            onClick={() => openAuthModal('client')}
                            className="px-10 py-4 bg-teal-600 hover:bg-teal-700 text-white text-lg font-bold rounded-lg shadow-lg transition hover:shadow-xl flex items-center justify-center"
                        >
                            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.513 23.513 0 0112 15c-3.143 0-6.162-.647-9-1.745M16 16v1a2 2 0 002 2h2a2 2 0 002-2v-4a2 2 0 00-2-2h-3"></path>
                            </svg>
                            Create Job (Client)
                        </button>

                        <button
                            onClick={() => openAuthModal('worker')}
                            className="px-10 py-4 border-2 border-teal-600 hover:bg-teal-50 text-teal-600 text-lg font-bold rounded-lg transition flex items-center justify-center"
                        >
                            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 00-2 2v3m2-3a2 2 0 012 2v3m-4 0v3a2 2 0 002 2h2a2 2 0 002-2v-3m-4 0h4"></path>
                            </svg>
                            Find Work (Worker)
                        </button>
                    </div>

                    {/* Learn More */}
                    <button 
                        onClick={() => setView('about')}
                        className="text-teal-600 hover:text-teal-700 font-semibold text-lg"
                    >
                        Learn More About Our Platform →
                    </button>
                </div>
            </div>
        </div>
    );
};

// ===== ABOUT US PAGE (No Change) =====
const AboutUs = ({ setView }) => (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-4xl font-bold text-teal-800 border-b pb-3 mb-6">About WorkLink</h1>
        <p className="text-lg text-gray-700 mb-4">
            WorkLink was founded on restoring dignity to daily wage labor. We provide direct access to opportunities, eliminate middlemen exploitation, and guarantee secure payments.
        </p>
        <div className="space-y-4 text-gray-600">
            <p><strong>Fair Wages:</strong> Transparency in pricing ensures fair compensation.</p>
            <p><strong>Verified Connections:</strong> Local matching with integrated reviews.</p>
            <p><strong>Local Focus:</strong> Geolocation connects workers to nearby jobs.</p>
        </div>
        <button 
            onClick={() => setView('home')}
            className="mt-8 px-4 py-2 text-white bg-amber-600 hover:bg-amber-700 rounded-md"
        >
            ← Back to Home
        </button>
    </div>
);

// ===== SIMPLE CHATBOT COMPONENT (No Change) =====
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

// ===== MAIN APP COMPONENT - MODIFIED FOR INIT FIX & ENHANCED LOGIN =====
const App = () => {
    const [view, setView] = useState('home');
    const [authView, setAuthView] = useState(null);
    const [user, setUser] = useState(initialUser);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [currentLocation, setCurrentLocation] = useState('Fetching Location...');
    const [locationCoords, setLocationCoords] = useState(null);
    
    // --- NEW STATE FOR FIREBASE INSTANCES ---
    const [firebaseInstances, setFirebaseInstances] = useState({ app: null, db: null, auth: null });

    // Destructure instances for easier use in hooks
    const { db, auth } = firebaseInstances;

    // Geolocation (No Change)
    useEffect(() => {
        if (!navigator.geolocation) {
            setCurrentLocation("Location unavailable");
            return;
        }

        const success = (position) => {
            const { latitude, longitude } = position.coords;
            setLocationCoords({ lat: latitude, lng: longitude });
            setCurrentLocation(`City @ ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        };

        const error = (err) => {
            console.warn(`Location error: ${err.message}`);
            setCurrentLocation("Default: Bengaluru, KA");
        };

        navigator.geolocation.getCurrentPosition(success, error, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    }, []);

    // --- FIREBASE INITIALIZATION AND AUTH FIX ---
    useEffect(() => {
        // Initialize Firebase instances inside the component lifecycle
        if (FIREBASE_CONFIG.apiKey && !firebaseInstances.app) {
            try {
                const firebaseApp = initializeApp(FIREBASE_CONFIG);
                const firestoreDb = getFirestore(firebaseApp);
                const firestoreAuth = getAuth(firebaseApp);
                try {
                    // Initialize analytics, but catch is handled locally
                    getAnalytics(firebaseApp);
                } catch (e) {
                    console.warn("Analytics failed:", e.message);
                }
                
                // Store instances in state
                setFirebaseInstances({ 
                    app: firebaseApp, 
                    db: firestoreDb, 
                    auth: firestoreAuth 
                });
            } catch (e) {
                console.error("Firebase Initialization Error:", e);
                // Fail fast to allow app to render, showing "Connecting..." error
                setIsAuthReady(true);
            }
        }
        
        // Handle Authentication state change once auth instance is ready
        if (auth) {
            const unsubscribe = onAuthStateChanged(auth, (authUser) => {
                // Set isAuthReady to true once the auth state is known, fixing the "Connecting..." loop
                setIsAuthReady(true);
            });

            // Attempt initial anonymous sign-in
            const handleAuth = async () => {
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Firebase Auth Error (Initial Anonymous):", error);
                }
            };
            
            // Only attempt sign-in if the app is not already authenticated
            if (!auth.currentUser) {
                handleAuth();
            }

            return () => unsubscribe();
        }
    }, [firebaseInstances.app, auth]);


    // Fetch Jobs (Modified to depend on new 'db' variable)
    const fetchJobs = useCallback(() => {
        if (!isAuthReady || !db) return; // Use destructured 'db'

        setLoadingJobs(true);
        setFetchError(null);

        const q = query(collection(db, JOBS_COLLECTION_PATH));
        let unsubscribe = () => {};

        const startListening = () => {
            unsubscribe = onSnapshot(q, (snapshot) => {
                const jobsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setJobs(jobsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
                setLoadingJobs(false);
            }, (error) => {
                console.error("Fetch error:", error);
                if (error.code === 'permission-denied') {
                    setFetchError("Permission denied. Please log in correctly.");
                } else {
                    setFetchError(`Error: ${error.message}`);
                }
                setLoadingJobs(false);
            });
        };

        startListening();
        return () => unsubscribe();
    }, [isAuthReady, db]); // ADDED 'db' as dependency

    useEffect(() => {
        if (user.isAuthenticated) {
            fetchJobs();
        }
    }, [user.isAuthenticated, fetchJobs]);

    // --- ENHANCED handleLogin FUNCTION ---
    const handleLogin = async (role, simulatedUserId, contactInfo, skillData) => {
        // 1. Client-side authentication (Simulated)
        setUser({ id: simulatedUserId, role: role, isAuthenticated: true });
        setAuthView(null);
        setView(role);

        // 2. Create/Update User Profile in Firestore
        if (!db) {
            console.error("Firestore database is not initialized. Cannot save profile.");
            return;
        }

        try {
            const userRef = doc(db, USERS_COLLECTION_PATH, simulatedUserId);
            
            const profileData = {
                id: simulatedUserId,
                role: role,
                contact: contactInfo,
                lastLogin: serverTimestamp(),
                profileStatus: 'created', 
            };
            
            // Conditionally add skill for workers
            if (role === 'worker' && skillData) {
                profileData.primarySkill = skillData;
            }
            
            await setDoc(userRef, profileData, { merge: true });
            
            console.log(`User ${role} profile saved/updated in Firestore: ${simulatedUserId}`);

        } catch (error) {
            console.error("Error creating/updating user profile in Firestore:", error);
        }
    };

    const handleLogout = () => {
        setUser(initialUser);
        setView('home');
        setAuthView(null);
    };

    // Render Dashboards (No Change)
    const renderClientDashboard = () => {
        const myJobs = jobs.filter(job => job.clientId === user.id);
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <ClientPostJob user={user} db={db} currentLocation={currentLocation} locationCoords={locationCoords} onJobPosted={() => {}} />
                </div>
                <div className="lg:col-span-2">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-4 border-teal-500 pb-2">My Posted Jobs ({myJobs.length})</h2>
                    {fetchError && <MessageCard title="Error" type="error">{fetchError}</MessageCard>}
                    {loadingJobs ? <MessageCard title="Loading" type="warning">Fetching jobs...</MessageCard> : (
                        <div className="space-y-4">
                            {myJobs.length === 0 ? <MessageCard title="No Jobs" type="info">Post your first job!</MessageCard> : (myJobs.map(job => <JobItem key={job.id} job={job} user={user} db={db} onJobAccepted={() => {}} />))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderWorkerDashboard = () => {
        const openJobs = jobs.filter(job => job.status === 'Open');
        const assignedJobs = jobs.filter(job => job.status === 'Assigned' && job.workerId === user.id);

        return (
            <div className="space-y-10">
                <div className="bg-amber-50 p-6 rounded-2xl shadow-xl border-t-8 border-amber-500">
                    <h2 className="text-3xl font-bold text-amber-800 mb-4">My Current Engagements ({assignedJobs.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {assignedJobs.length === 0 ? <MessageCard title="No Active Jobs" type="warning">Find opportunities below!</MessageCard> : (assignedJobs.map(job => <JobItem key={job.id} job={job} user={user} db={db} onJobAccepted={() => {}} />))}
                    </div>
                </div>

                <div className='p-6 bg-white rounded-2xl shadow-xl border border-gray-100'>
                    <h2 className="text-3xl font-bold text-teal-800 mb-6 border-b-2 border-teal-500 pb-2">Open Job Board ({openJobs.length})</h2>
                    {fetchError && <MessageCard title="Error" type="error">{fetchError}</MessageCard>}
                    {loadingJobs ? <MessageCard title="Loading" type="info">Searching for jobs...</MessageCard> : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {openJobs.length === 0 ? <MessageCard title="Board Empty" type="info">Check back soon!</MessageCard> : (openJobs.map(job => (<JobItem key={job.id} job={job} user={user} db={db} onJobAccepted={(id) => alert('Job accepted!')} />)))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (!isAuthReady) {
            return <MessageCard title="Connecting..." type="info">Initializing secure connection...</MessageCard>;
        }

        switch (view) {
            case 'home':
                return <Home openAuthModal={setAuthView} setView={setView} />;
            case 'about':
                return <AboutUs setView={setView} />;
            case 'client':
                return !user.isAuthenticated ? <MessageCard title="Access Denied" type="error">Log in as Client</MessageCard> : renderClientDashboard();
            case 'worker':
                return !user.isAuthenticated ? <MessageCard title="Access Denied" type="error">Log in as Worker</MessageCard> : renderWorkerDashboard();
            default:
                return <Home openAuthModal={setAuthView} setView={setView} />;
        }
    };

    return (
        <div className="min-h-screen bg-white font-inter">
            {/* Auth Modal */}
            <AuthModal role={authView} setAuthView={setAuthView} onLogin={handleLogin} />

            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center flex-wrap gap-4">
                    {/* Logo */}
                    <div 
                        className="flex items-center text-3xl font-extrabold text-teal-700 cursor-pointer"
                        onClick={() => setView('home')}
                    >
                        <svg className="w-7 h-7 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        WorkLink
                    </div>

                    {/* Nav */}
                    <nav className="flex space-x-6 text-sm font-medium">
                        <button 
                            onClick={() => setView('home')}
                            className={`px-3 py-1 rounded-lg ${view === 'home' ? 'bg-gray-200 text-teal-700 font-semibold' : 'text-gray-600 hover:text-teal-700'}`}
                        >
                            Home
                        </button>
                        <button 
                            onClick={() => user.isAuthenticated ? setView(user.role) : setAuthView('select')}
                            className={`px-3 py-1 rounded-lg ${view === 'worker' || view === 'client' ? 'bg-gray-200 text-teal-700 font-semibold' : 'text-gray-600 hover:text-teal-700'}`}
                        >
                            Jobs
                        </button>
                        <button 
                            onClick={() => setView('about')}
                            className={`px-3 py-1 rounded-lg ${view === 'about' ? 'bg-gray-200 text-teal-700 font-semibold' : 'text-gray-600 hover:text-teal-700'}`}
                        >
                            About Us
                        </button>
                    </nav>

                    {/* Auth Button */}
                    {!user.isAuthenticated ? (
                        <button
                            onClick={() => setAuthView('select')}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-md transition"
                        >
                            Sign In / Up
                        </button>
                    ) : (
                        <div className='flex items-center space-x-4'>
                            {/* Display User Role/ID in Header */}
                            <div className={`px-3 py-1 text-sm font-semibold rounded-full 
                                ${user.role === 'client' ? 'bg-teal-100 text-teal-800' : 'bg-green-100 text-green-800'}`}>
                                {user.role === 'worker' ? `Worker (${user.id.substring(0, 4)})` : `Client (${user.id.substring(0, 4)})`}
                            </div>
                            
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="w-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    {renderContent()}
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full bg-gray-900 text-white mt-16 border-t-4 border-amber-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 mb-12">
                        {/* Mission */}
                        <div>
                            <h3 className="text-lg font-bold text-amber-500 mb-4">Our Mission</h3>
                            <p className="text-gray-400 text-sm">
                                Bridge gap between job sites and skilled workers, ensuring transparency, fair wages, and job security.
                            </p>
                        </div>

                        {/* Platform */}
                        <div>
                            <h3 className="text-lg font-bold text-amber-500 mb-4">Platform</h3>
                            <ul className="space-y-3 text-sm">
                                <li><button onClick={() => setView('about')} className="text-gray-400 hover:text-teal-400">About Us</button></li>
                                <li><button onClick={() => setView('home')} className="text-gray-400 hover:text-teal-400">Home</button></li>
                                <li><button onClick={() => setAuthView('select')} className="text-gray-400 hover:text-teal-400">Demo (Sign Up)</button></li>
                            </ul>
                        </div>

                        {/* Connect */}
                        <div>
                            <h3 className="text-lg font-bold text-amber-500 mb-4">Connect</h3>
                            <div className="flex flex-col space-y-3 text-sm">
                                <a href="#" className="flex items-center space-x-2 text-gray-400 hover:text-blue-500">
                                    <span>Facebook</span>
                                </a>
                                <a href="#" className="flex items-center space-x-2 text-gray-400 hover:text-blue-400">
                                    <span>Twitter/X</span>
                                </a>
                                <a href="#" className="flex items-center space-x-2 text-gray-400 hover:text-pink-500">
                                    <span>Instagram</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
                        © 2024 WorkLink. All rights reserved.
                    </div>
                </div>
            </footer>

            {/* Floating ChatBot */}
            <ChatBot jobs={jobs} user={user} />
        </div>
    );
};

export default App;