import React, { useState, useEffect, useCallback } from 'react';
import MessageCard from './components/MessageCard';
import ClientPostJob from './components/ClientPostJob';
import JobItem from './components/JobItem';
import AuthModal from './components/Auth';
import Home from './components/Home';
import AboutUs from './components/AboutUs';
import ChatBot from './components/ChatBot';

const initialUser = { id: null, role: null, isAuthenticated: false };

const App = () => {
    const [view, setView] = useState('home');
    const [authView, setAuthView] = useState(null);
    const [user, setUser] = useState(initialUser);
    const [isAuthReady, setIsAuthReady] = useState(true); // Always ready without Firebase
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [currentLocation, setCurrentLocation] = useState('Fetching Location...');
    const [locationCoords, setLocationCoords] = useState(null);

    // Geolocation
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

    // Fetch Jobs - mocked to load from local state/storage if we wanted, but we keep it empty initially
    const fetchJobs = useCallback(() => {
        setLoadingJobs(true);
        setTimeout(() => {
            setLoadingJobs(false);
        }, 500);
    }, []);

    useEffect(() => {
        if (user.isAuthenticated) {
            fetchJobs();
        }
    }, [user.isAuthenticated, fetchJobs]);

    const handleLogin = async (role, simulatedUserId, contactInfo, skillData) => {
        setUser({ id: simulatedUserId, role: role, isAuthenticated: true });
        setAuthView(null);
        setView(role);
    };

    const handleLogout = () => {
        setUser(initialUser);
        setView('home');
        setAuthView(null);
    };

    const handleJobPosted = async (newJob) => {
        const jobWithId = { ...newJob, id: Date.now().toString(), createdAt: new Date() };
        setJobs(prev => [jobWithId, ...prev]);
    };

    const handleJobAccepted = async (jobId) => {
        setJobs(prev => prev.map(job => {
            if (job.id === jobId) {
                return { ...job, status: 'Assigned', workerId: user.id, workerName: `Worker ${user.id.substring(0, 4)}` };
            }
            return job;
        }));
    };

    // Render Dashboards
    const renderClientDashboard = () => {
        const myJobs = jobs.filter(job => job.clientId === user.id);
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <ClientPostJob user={user} currentLocation={currentLocation} locationCoords={locationCoords} onJobPosted={handleJobPosted} />
                </div>
                <div className="lg:col-span-2">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-4 border-teal-500 pb-2">My Posted Jobs ({myJobs.length})</h2>
                    {fetchError && <MessageCard title="Error" type="error">{fetchError}</MessageCard>}
                    {loadingJobs ? <MessageCard title="Loading" type="warning">Fetching jobs...</MessageCard> : (
                        <div className="space-y-4">
                            {myJobs.length === 0 ? <MessageCard title="No Jobs" type="info">Post your first job!</MessageCard> : (myJobs.map(job => <JobItem key={job.id} job={job} user={user} onJobAccepted={handleJobAccepted} />))}
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
                        {assignedJobs.length === 0 ? <MessageCard title="No Active Jobs" type="warning">Find opportunities below!</MessageCard> : (assignedJobs.map(job => <JobItem key={job.id} job={job} user={user} onJobAccepted={handleJobAccepted} />))}
                    </div>
                </div>

                <div className='p-6 bg-white rounded-2xl shadow-xl border border-gray-100'>
                    <h2 className="text-3xl font-bold text-teal-800 mb-6 border-b-2 border-teal-500 pb-2">Open Job Board ({openJobs.length})</h2>
                    {fetchError && <MessageCard title="Error" type="error">{fetchError}</MessageCard>}
                    {loadingJobs ? <MessageCard title="Loading" type="info">Searching for jobs...</MessageCard> : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {openJobs.length === 0 ? <MessageCard title="Board Empty" type="info">Check back soon!</MessageCard> : (openJobs.map(job => (<JobItem key={job.id} job={job} user={user} onJobAccepted={handleJobAccepted} />)))}
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
            <AuthModal role={authView} setAuthView={setAuthView} onLogin={handleLogin} />

            <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center flex-wrap gap-4">
                    <div 
                        className="flex items-center text-3xl font-extrabold text-teal-700 cursor-pointer"
                        onClick={() => setView('home')}
                    >
                        <svg className="w-7 h-7 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        WorkLink
                    </div>

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

                    {!user.isAuthenticated ? (
                        <button
                            onClick={() => setAuthView('select')}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-md transition"
                        >
                            Sign In / Up
                        </button>
                    ) : (
                        <div className='flex items-center space-x-4'>
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

            <main className="w-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    {renderContent()}
                </div>
            </main>

            <footer className="w-full bg-gray-900 text-white mt-16 border-t-4 border-amber-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 mb-12">
                        <div>
                            <h3 className="text-lg font-bold text-amber-500 mb-4">Our Mission</h3>
                            <p className="text-gray-400 text-sm">
                                Bridge gap between job sites and skilled workers, ensuring transparency, fair wages, and job security.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-amber-500 mb-4">Platform</h3>
                            <ul className="space-y-3 text-sm">
                                <li><button onClick={() => setView('about')} className="text-gray-400 hover:text-teal-400">About Us</button></li>
                                <li><button onClick={() => setView('home')} className="text-gray-400 hover:text-teal-400">Home</button></li>
                                <li><button onClick={() => setAuthView('select')} className="text-gray-400 hover:text-teal-400">Demo (Sign Up)</button></li>
                            </ul>
                        </div>

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

                    <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
                        © 2024 WorkLink. All rights reserved.
                    </div>
                </div>
            </footer>

            <ChatBot jobs={jobs} user={user} />
        </div>
    );
};

export default App;