import React, { useState } from 'react';
import { Upload, UserPlus, X, FileText } from 'lucide-react';

const AddStudentsModal = ({ isOpen, onClose, onAddStudents, subjects }) => {
  const [mode, setMode] = useState('manual'); // 'manual' or 'import'
  const [manualStudents, setManualStudents] = useState([
    { rollNo: '', name: '' }
  ]);
  const [importFile, setImportFile] = useState(null);

  const addManualStudent = () => {
    setManualStudents(prev => [...prev, { rollNo: '', name: '' }]);
  };

  const removeManualStudent = (index) => {
    setManualStudents(prev => prev.filter((_, i) => i !== index));
  };

  const updateManualStudent = (index, field, value) => {
    setManualStudents(prev => prev.map((student, i) => 
      i === index ? { ...student, [field]: value } : student
    ));
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const students = [];
    
    for (let i = 0; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      // Skip header if it exists
      if (i === 0 && (values[0].toLowerCase().includes('roll') || values[0].toLowerCase().includes('name'))) {
        continue;
      }
      
      if (values.length >= 2) {
        students.push({
          id: Date.now() + i,
          rollNo: values[0] || `STU${String(i + 1).padStart(3, '0')}`,
          name: values[1] || `Student ${i + 1}`,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(values[1])}&background=random`,
          marks: {}
        });
      }
    }
    
    return students;
  };

  const handleManualSubmit = () => {
    const validStudents = manualStudents
      .filter(s => s.rollNo.trim() && s.name.trim())
      .map((student, index) => ({
        id: Date.now() + index,
        rollNo: student.rollNo,
        name: student.name,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`,
        marks: {}
      }));

    if (validStudents.length === 0) {
      alert('Please add at least one student');
      return;
    }

    onAddStudents(validStudents);
    onClose();
    setManualStudents([{ rollNo: '', name: '' }]);
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      alert('Please select a file');
      return;
    }

    const text = await importFile.text();
    let students = [];

    if (importFile.name.endsWith('.csv')) {
      students = parseCSV(text);
    } else if (importFile.name.endsWith('.xlsx') || importFile.name.endsWith('.xls')) {
      alert('Excel files require additional library. Please use CSV format.');
      return;
    } else {
      alert('Unsupported file format. Please use CSV.');
      return;
    }

    if (students.length === 0) {
      alert('No valid students found in file');
      return;
    }

    onAddStudents(students);
    onClose();
    setImportFile(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add Students</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Selection */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                mode === 'manual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <UserPlus className="w-5 h-5 inline mr-2" />
              Add Manually
            </button>
            <button
              onClick={() => setMode('import')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                mode === 'import'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Upload className="w-5 h-5 inline mr-2" />
              Import File
            </button>
          </div>

          {mode === 'manual' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Student Details</h3>
                <button
                  onClick={addManualStudent}
                  className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Student
                </button>
              </div>

              <div className="space-y-3">
                {manualStudents.map((student, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={student.rollNo}
                      onChange={(e) => updateManualStudent(index, 'rollNo', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Roll Number"
                    />
                    <input
                      type="text"
                      value={student.name}
                      onChange={(e) => updateManualStudent(index, 'name', e.target.value)}
                      className="flex-2 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Student Name"
                    />
                    {manualStudents.length > 1 && (
                      <button
                        onClick={() => removeManualStudent(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Students
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Student List</h3>
                <p className="text-gray-600 mb-4">
                  Upload a CSV file with student names and roll numbers
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Format: Roll Number, Name (one per line)
                </p>
                
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileImport}
                  className="hidden"
                  id="file-import"
                />
                <label
                  htmlFor="file-import"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </label>
                
                {importFile && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700">
                      Selected: {importFile.name}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Import Students
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddStudentsModal;
