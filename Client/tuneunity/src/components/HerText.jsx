import React from 'react';

const HerText = ({ id, text, name, time }) => {
    return (
        <div className="flex justify-start">
            <div className="bg-gray-700 text-white p-2 rounded-lg rounded-bl-none max-w-[75%] shadow">
                <p className="text-xs font-semibold text-blue-300 mb-1">{name}</p> {/* Show sender name */}
                <p className="text-sm break-words">{text}</p>
                <p className="text-xs text-gray-400 text-right mt-1">{time}</p>
            </div>
        </div>
    );
};

export default React.memo(HerText); // Memoize for performance