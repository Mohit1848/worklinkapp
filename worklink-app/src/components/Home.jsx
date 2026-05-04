import React from 'react';

const Home = ({ openAuthModal, setView }) => {
    return (
        <div className="w-full">
            <div className="bg-white py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto text-center">
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mb-6">
                        Your Direct Link to <span className="text-amber-600">Daily Wage Work</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        Fair connections for construction, trade, and general labor jobs. No middlemen, secure payments.
                    </p>

                    <p className="text-lg text-teal-700 font-semibold mb-12 max-w-2xl mx-auto">
                        Our Mission: We bridge the gap between job sites and local skilled workers, ensuring transparency, fair wages, and job security for daily laborers.
                    </p>

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

export default Home;
