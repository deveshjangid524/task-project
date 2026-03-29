import React, { useState, useEffect } from 'react';
import { assessmentService } from '../services/assessmentService';
import { Plus, Search, Eye, Edit, Trash2, Calendar, Users, FileText } from 'lucide-react';

const AssessmentDashboard = ({ onSelectAssessment, onCreateNew }) => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const data = await assessmentService.getAssessments();
      setAssessments(data);
    } catch (error) {
      console.error('Failed to load assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this assessment?')) {
      try {
        await assessmentService.deleteAssessment(id);
        setAssessments(prev => prev.filter(a => a._id !== id));
      } catch (error) {
        console.error('Failed to delete assessment:', error);
        alert('Failed to delete assessment');
      }
    }
  };

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'templates' && assessment.isTemplate) ||
                         (filter === 'assessments' && !assessment.isTemplate);
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getExamTypeColor = (type) => {
    const colors = {
      'Midterm': 'bg-blue-100 text-blue-800',
      'Final': 'bg-red-100 text-red-800',
      'Pre-Board': 'bg-purple-100 text-purple-800',
      'Unit Test': 'bg-green-100 text-green-800',
      'Assignment': 'bg-yellow-100 text-yellow-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors['Other'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading assessments...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assessment Management</h1>
          <p className="text-gray-600 mt-2">Create and manage student assessments</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Assessment
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {['all', 'assessments', 'templates'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 rounded-md capitalize ${
                  filter === filterType
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterType === 'all' ? 'All' : filterType.slice(0, -1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assessment Grid */}
      {filteredAssessments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || filter !== 'all' ? 'No assessments found' : 'No assessments yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Create your first assessment to get started'
            }
          </p>
          {!searchTerm && filter === 'all' && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Assessment
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map((assessment) => (
            <div
              key={assessment._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {assessment.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Class {assessment.class} {assessment.section && `- Section ${assessment.section}`}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getExamTypeColor(assessment.examType)}`}>
                    {assessment.examType}
                  </span>
                </div>

                {assessment.description && (
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                    {assessment.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {assessment.students?.length || 0} students
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(assessment.createdAt)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {assessment.subjects?.slice(0, 3).map((subject, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {subject.name}
                      </span>
                    ))}
                    {assessment.subjects?.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        +{assessment.subjects.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <button
                    onClick={() => onSelectAssessment(assessment)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Open
                  </button>
                  <button
                    onClick={() => {/* Edit functionality */}}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(assessment._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssessmentDashboard;
