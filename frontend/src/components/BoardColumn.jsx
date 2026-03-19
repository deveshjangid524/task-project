import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableTaskItem from './SortableTaskItem';

const BoardColumn = ({ title, tasks, onTaskClick, onStatusChange }) => {
    const { setNodeRef } = useDroppable({
        id: title,
    });

    
    return (
        <div className="bg-gray-100 flex-shrink-0 w-80 rounded-lg flex flex-col max-h-full">
            <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 flex justify-between">
                    {title}
                    <span className="bg-gray-200 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                        {tasks.length}
                    </span>
                </h3>
            </div>

            <div
                ref={setNodeRef}
                className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[150px]"
            >
                <SortableContext
                    items={tasks.map(t => t._id)}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.map((task) => (
                        <SortableTaskItem
                            key={task._id}
                            task={task}
                            onClick={() => onTaskClick(task)}
                            onStatusChange={onStatusChange}
                        />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
};

export default BoardColumn;
