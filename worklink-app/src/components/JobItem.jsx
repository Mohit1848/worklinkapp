import React, { useState } from 'react';
import MapDisplay from './MapDisplay';

const JobItem = ({ job, user, onJobAccepted }) => {
    const [loading, setLoading] = useState(false);
    const isClientJob = job.clientId === user.id;

    const handleAccept = async () => {
        setLoading(true);
        try {
            await onJobAccepted(job.id);
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

export default JobItem;
