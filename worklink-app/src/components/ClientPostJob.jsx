import React, { useState, useEffect } from 'react';
import MessageCard from './MessageCard';

const ClientPostJob = ({ user, currentLocation, locationCoords, onJobPosted }) => {
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
            const newJob = {
                title,
                skill,
                description,
                offeredWage: parseFloat(wage),
                clientId: user.id,
                clientName: `Client ${user.id.substring(0, 4)}`,
                status: 'Open',
                location: jobLocation,
                coords: locationCoords,
            };
            await onJobPosted(newJob);

            setSuccessMessage("Job posted successfully!");
            setTitle('');
            setSkill('');
            setDescription('');
            setWage('');
            setJobLocation(currentLocation);
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

export default ClientPostJob;
