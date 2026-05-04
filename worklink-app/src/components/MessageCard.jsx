import React from 'react';

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

export default MessageCard;
