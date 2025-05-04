import React from 'react';

const AdminText = ({ id, text }) => {
    return (
        <div className="text-center my-2">
            <span className="text-xs text-gray-400 italic bg-gray-800 px-2 py-1 rounded">
                {text}
            </span>
        </div>
    );
};

export default React.memo(AdminText); // Memoize for performance