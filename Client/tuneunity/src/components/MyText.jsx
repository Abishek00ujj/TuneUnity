import React from 'react';
import { Trash2 } from 'lucide-react';

const MyText = ({ id, text, name, time, showDelete, onDelete }) => {
    return (
        <div className="flex justify-end group"> {/* Added group for hover effect */}
            <div className="bg-green-600 text-white p-2 rounded-lg rounded-br-none max-w-[75%] shadow">
                {/* Optional: Show name for clarity <p className="text-xs font-semibold text-green-100 mb-1">{name}</p> */}
                <p className="text-sm break-words">{text}</p>
                <div className="flex justify-end items-center mt-1 space-x-2">
                     <span className="text-xs text-green-200 opacity-80">{time}</span>
                     {/* Delete Button - appears on hover within the group */}
                     {showDelete && (
                        <button
                            onClick={onDelete}
                            title="Delete message"
                            className="text-green-100 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Delete this message"
                        >
                            <Trash2 size={14} />
                        </button>
                     )}
                 </div>
            </div>
        </div>
    );
};

export default React.memo(MyText); // Memoize for performance