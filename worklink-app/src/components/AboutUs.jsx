import React from 'react';

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

export default AboutUs;
