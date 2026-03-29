import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const CreateAssessmentModal = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class: '',
    section: '',
    examType: 'Other'
  });
  const [subjects, setSubjects] = useState([
    { name: '', field: '', maxMarks: 100, passMarks: 40 }
  ]);

  const examTypes = ['Midterm', 'Final', 'Pre-Board', 'Unit Test', 'Assignment', 'Other'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addSubject = () => {
    setSubjects(prev => [...prev, { name: '', field: '', maxMarks: 100, passMarks: 40 }]);
  };

  const removeSubject = (index) => {
    setSubjects(prev => prev.filter((_, i) => i !== index));
  };

  const updateSubject = (index, field, value) => {
    setSubjects(prev => prev.map((subject, i) => 
      i === index ? { ...subject, [field]: value } : subject
    ));
  };

  const generateField = (name) => {
    return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').trim();
  };

  const validateField = (field) => {
    // Ensure field is a valid identifier (no spaces, special chars)
    return field.replace(/\s+/g, '').replace(/[^a-z0-9_]/g, '').toLowerCase();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.title.trim()) {
      alert('Please enter an assessment title');
      return;
    }
    
    if (!formData.class.trim()) {
      alert('Please enter a class');
      return;
    }
    
    // Validate subjects
    const validSubjects = subjects.filter(s => s.name.trim());
    if (validSubjects.length === 0) {
      alert('Please add at least one subject');
      return;
    }

    // Auto-generate field names if not provided
    const processedSubjects = validSubjects.map(subject => {
      const cleanField = subject.field ? validateField(subject.field) : generateField(subject.name.trim());
      return {
        ...subject,
        name: subject.name.trim(),
        field: cleanField
      };
    });

    const assessmentData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim() || 'No description provided', // Ensure not empty
      class: formData.class.trim(),
      section: formData.section.trim(),
      subjects: processedSubjects,
      students: []
    };

    console.log('📋 Final assessment data:', assessmentData);
    onCreate(assessmentData);
    onClose();
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      class: '',
      section: '',
      examType: 'Other'
    });
    setSubjects([{ name: '', field: '', maxMarks: 100, passMarks: 40 }]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Assessment</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assessment Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 10th Pre Board Exam"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class *
                </label>
                <input
                  type="text"
                  name="class"
                  value={formData.class}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 10th"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section
                </label>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., A, B, C"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Type
                </label>
                <select
                  name="examType"
                  value={formData.examType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {examTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Optional description..."
              />
            </div>

            {/* Subjects */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Subjects</h3>
                <button
                  type="button"
                  onClick={addSubject}
                  className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject
                </button>
              </div>

              <div className="space-y-3">
                {subjects.map((subject, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={subject.name}
                      onChange={(e) => updateSubject(index, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Subject name"
                    />
                    <input
                      type="text"
                      value={subject.field}
                      onChange={(e) => updateSubject(index, 'field', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Field (auto-generated)"
                    />
                    <input
                      type="number"
                      value={subject.maxMarks}
                      onChange={(e) => updateSubject(index, 'maxMarks', parseInt(e.target.value) || 0)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Max"
                    />
                    <input
                      type="number"
                      value={subject.passMarks}
                      onChange={(e) => updateSubject(index, 'passMarks', parseInt(e.target.value) || 0)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Pass"
                    />
                    {subjects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSubject(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Assessment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAssessmentModal;
