import React from 'react';
import NotesSection from '../components/NotesSection';

const NotesPage = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">📝 Project Notes & Resources</h1>
                        <p className="mt-2 text-gray-600">
                            Share important documents, links, and notes with your entire team. 
                            All Admins, Project Managers, and Team Members can view and contribute.
                        </p>
                    </div>
                    
                    <NotesSection />
                </div>
            </div>
        </div>
    );
};

export default NotesPage;
