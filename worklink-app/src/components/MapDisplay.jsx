import React from 'react';

const MAP_IMAGE_BASE_URL = "https://maps.googleapis.com/maps/api/staticmap?zoom=13&size=300x150&markers=color:red%7C";

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

export default MapDisplay;
