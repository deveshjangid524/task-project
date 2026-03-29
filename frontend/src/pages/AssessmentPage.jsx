import React, { useState, useEffect } from 'react';
import { assessmentService } from '../services/assessmentService';
import AssessmentDashboard from '../components/AssessmentDashboard';
import CreateAssessmentModal from '../components/CreateAssessmentModal';
import MarksGrid from '../components/MarksGrid';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';

const AssessmentPage = () => {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'editor'
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');

  // Handle creating new assessment
  const handleCreateAssessment = async (assessmentData) => {
    try {
      setLoading(true);
      console.log('🚀 Frontend sending assessment data:', JSON.stringify(assessmentData, null, 2));
      const newAssessment = await assessmentService.createAssessment(assessmentData);
      console.log('✅ Assessment created successfully:', newAssessment);
      setCurrentAssessment(newAssessment);
      setCurrentView('editor');
      setSaveStatus('saved');
    } catch (error) {
      console.error('❌ Failed to create assessment:', error);
      console.error('❌ Error response:', error.response?.data);
      alert(`Failed to create assessment: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle selecting existing assessment
  const handleSelectAssessment = async (assessment) => {
    try {
      setLoading(true);
      const fullAssessment = await assessmentService.getAssessment(assessment._id);
      setCurrentAssessment(fullAssessment);
      setCurrentView('editor');
      setSaveStatus('saved');
    } catch (error) {
      console.error('Failed to load assessment:', error);
      alert('Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  // Handle assessment save
  const handleSave = (updatedAssessment) => {
    setCurrentAssessment(updatedAssessment);
    setSaveStatus('saved');
  };

  // Handle students added
  const handleStudentsAdded = (newStudents) => {
    setCurrentAssessment(prev => ({
      ...prev,
      students: [...prev.students, ...newStudents]
    }));
  };

  // Handle data change
  const handleDataChange = (updatedStudent) => {
    setCurrentAssessment(prev => ({
      ...prev,
      students: prev.students.map(student => 
        student.id === updatedStudent.id ? updatedStudent : student
      )
    }));
    setSaveStatus('unsaved');
  };

  // Back to dashboard
  const handleBackToDashboard = () => {
    if (saveStatus === 'unsaved') {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        setCurrentView('dashboard');
        setCurrentAssessment(null);
      }
    } else {
      setCurrentView('dashboard');
      setCurrentAssessment(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {currentView === 'dashboard' ? (
        <AssessmentDashboard
          onSelectAssessment={handleSelectAssessment}
          onCreateNew={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center px-3 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </button>
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-gray-900">
                  {currentAssessment?.title}
                </h1>
                <p className="text-sm text-gray-600">
                  Class {currentAssessment?.class} {currentAssessment?.section && `- Section ${currentAssessment?.section}`}
                </p>
              </div>
              {saveStatus === 'unsaved' && (
                <div className="flex items-center text-sm text-orange-600">
                  <Save className="w-4 h-4 mr-1" />
                  Unsaved changes
                </div>
              )}
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1">
            <MarksGrid
              assessment={currentAssessment}
              onDataChange={handleDataChange}
              onSave={handleSave}
              onStudentsAdded={handleStudentsAdded}
              saveStatus={saveStatus}
            />
          </div>
        </div>
      )}

      {/* Create Assessment Modal */}
      <CreateAssessmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateAssessment}
      />
    </div>
  );
};

export default AssessmentPage;
