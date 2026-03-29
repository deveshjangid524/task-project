import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import MarksGrid from '../components/MarksGrid';
import { 
  Plus, 
  Save, 
  RefreshCw, 
  Settings,
  Users,
  BookOpen,
  TrendingUp
} from 'lucide-react';

const MarksPage = () => {
  const { user } = useAuth();
  const [saveStatus, setSaveStatus] = useState('saved');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [selectedClass, setSelectedClass] = useState('grade10-sectionb');
  const [selectedExam, setSelectedExam] = useState('midterm-sem1');
  
  // Debounced save timeout
  const saveTimeoutRef = useRef(null);

  // Define subjects for this exam
  const subjects = [
    { name: 'Mathematics', field: 'math' },
    { name: 'Physics', field: 'physics' },
    { name: 'Chemistry', field: 'chemistry' },
    { name: 'Biology', field: 'biology' },
    { name: 'English', field: 'english' },
    { name: 'History', field: 'history' },
    { name: 'Geography', field: 'geography' },
    { name: 'Computer Science', field: 'cs' }
  ];

  // Simulated API calls - in real app, these would be actual API calls
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real app, you'd fetch from API
      // const response = await fetch(`/api/marks/${selectedClass}/${selectedExam}`);
      // const result = await response.json();
      // setData(result.data);
      
      // For now, we'll let the grid generate sample data
      setData([]);
      setSaveStatus('saved');
    } catch (error) {
      console.error('Failed to load data:', error);
      setSaveStatus('error');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedExam]);

  // Debounced save function
  const debouncedSave = useCallback((updatedData) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // In real app, you'd save to API
        // await fetch(`/api/marks/${selectedClass}/${selectedExam}`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ data: updatedData })
        // });
        
        console.log('Data saved:', updatedData);
        setSaveStatus('saved');
      } catch (error) {
        console.error('Failed to save data:', error);
        setSaveStatus('error');
      }
    }, 1000); // 1 second debounce
  }, [selectedClass, selectedExam]);

  // Handle data changes from grid
  const handleDataChange = useCallback((updatedRow) => {
    setData(prevData => {
      const newData = prevData.map(row => 
        row.id === updatedRow.id ? updatedRow : row
      );
      
      // Trigger debounced save
      debouncedSave(newData);
      
      return newData;
    });
  }, [debouncedSave]);

  // Load data on component mount and when selection changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleRefresh = () => {
    loadData();
  };

  const handleManualSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    debouncedSave(data);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Marks Management</h1>
            </div>
            
            {/* Class and Exam Selection */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="grade10-sectionb">Grade 10 - Section B</option>
                <option value="grade10-sectiona">Grade 10 - Section A</option>
                <option value="grade11-sectiona">Grade 11 - Section A</option>
                <option value="grade12-sectionb">Grade 12 - Section B</option>
              </select>
              
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="midterm-sem1">Semester 1 Midterm</option>
                <option value="final-sem1">Semester 1 Final</option>
                <option value="midterm-sem2">Semester 2 Midterm</option>
                <option value="final-sem2">Semester 2 Final</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleManualSave}
              disabled={saveStatus === 'saving'}
              className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Now
            </button>
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button className="flex items-center px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">50</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">72.5%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failing Students</p>
                <p className="text-2xl font-bold text-red-600">8</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">!</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Top Performer</p>
                <p className="text-lg font-bold text-gray-900">Student 12</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600">⭐</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 px-6 pb-6">
        <div className="bg-white rounded-lg shadow h-full">
          <MarksGrid
            data={data}
            subjects={subjects}
            onDataChange={handleDataChange}
            loading={loading}
            saveStatus={saveStatus}
          />
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-blue-50 border-t border-blue-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 text-sm text-blue-800">
            <span><strong>Tip:</strong> Use Tab to move right, Enter to move down</span>
            <span>• Copy/Ctrl+C and Paste/Ctrl+V from Excel</span>
            <span>• Double-click cells to edit</span>
            <span>• Drag to select multiple cells</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarksPage;
