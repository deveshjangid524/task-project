import React, { useState, useRef, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { 
  Download, 
  Upload, 
  Save, 
  Filter, 
  Search,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  Plus,
  Users
} from 'lucide-react';
import { assessmentService } from '../services/assessmentService';
import AddStudentsModal from './AddStudentsModal';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

const MarksGrid = ({ 
  assessment = null, 
  onDataChange, 
  loading = false,
  saveStatus = 'saved', // 'saved', 'saving', 'error'
  onSave = null,
  onStudentsAdded = null
}) => {
  const gridRef = useRef();
  const [searchText, setSearchText] = useState('');
  const [showOnlyFailing, setShowOnlyFailing] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState(new Set());
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [localSaveStatus, setLocalSaveStatus] = useState(saveStatus);
  
  // Extract subjects and data from assessment
  const subjects = assessment?.subjects || [];
  const initialData = assessment?.students || [];

  // Generate sample data if empty and no assessment
  const sampleData = useMemo(() => {
    if (initialData.length > 0) return initialData;
    if (assessment) return []; // Don't generate sample if we have an assessment
    
    return Array.from({ length: 50 }, (_, i) => {
      const student = {
        id: i + 1,
        rollNo: `STU${String(i + 1).padStart(3, '0')}`,
        name: `Student ${i + 1}`,
        avatar: `https://ui-avatars.com/api/?name=Student+${i + 1}&background=random`
      };
      
      // Add marks for each subject
      subjects.forEach(subject => {
        student[subject.field] = Math.floor(Math.random() * 101);
      });
      
      return student;
    });
  }, [initialData, subjects, assessment]);

  // Calculate derived values
  const processedData = useMemo(() => {
    return sampleData.map(student => {
      const subjectMarks = subjects.map(s => {
        // For assessment data, marks are stored in marks Map
        if (assessment && student.marks) {
          return student.marks.get(s.field) || 0;
        }
        // For sample data, marks are directly on student object
        return student[s.field] || 0;
      });
      const total = subjectMarks.reduce((sum, mark) => sum + mark, 0);
      const maxMarks = subjects.reduce((sum, s) => sum + (s.maxMarks || 100), 0);
      const percentage = maxMarks > 0 ? (total / maxMarks * 100).toFixed(1) : 0;
      
      return {
        ...student,
        total,
        percentage: parseFloat(percentage),
        grade: getGrade(percentage),
        status: percentage < 40 ? 'Failing' : 'Passing'
      };
    });
  }, [sampleData, subjects, assessment]);

  function getGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    if (percentage >= 40) return 'E';
    return 'F';
  }

  // Define column definitions
  const columnDefs = useMemo(() => {
    const subjectColumns = subjects.map(subject => ({
      headerName: subject.name,
      field: subject.field,
      editable: true,
      type: 'numericColumn',
      width: 100,
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: {
        min: 0,
        max: 100,
        precision: 0,
        step: 1
      },
      valueParser: params => {
        const value = parseFloat(params.newValue);
        if (isNaN(value) || value < 0 || value > 100) {
          return params.oldValue;
        }
        return value;
      },
      cellClassRules: {
        'failing-marks': params => params.value < 40,
        'excellent-marks': params => params.value >= 90,
        'average-marks': params => params.value >= 40 && params.value < 90
      },
      headerClass: 'subject-header'
    }));

    return [
      {
        headerName: 'Roll No',
        field: 'rollNo',
        width: 100,
        pinned: 'left',
        lockPinned: true,
        cellClass: 'roll-no-cell',
        headerClass: 'pinned-header'
      },
      {
        headerName: 'Student',
        field: 'name',
        width: 200,
        pinned: 'left',
        lockPinned: true,
        cellRenderer: params => (
          <div className="flex items-center">
            <img 
              src={params.data.avatar} 
              alt={params.value}
              className="w-8 h-8 rounded-full mr-2"
            />
            <span>{params.value}</span>
            {params.data.status === 'Failing' && (
              <AlertCircle className="w-4 h-4 text-red-500 ml-2" />
            )}
          </div>
        ),
        headerClass: 'pinned-header'
      },
      ...subjectColumns,
      {
        headerName: 'Total',
        field: 'total',
        width: 100,
        pinned: 'right',
        lockPinned: true,
        type: 'numericColumn',
        cellClass: 'calculated-cell',
        headerClass: 'calculated-header',
        valueGetter: params => {
          const subjectMarks = subjects.map(s => {
            if (assessment && params.data.marks) {
              return params.data.marks.get(s.field) || 0;
            }
            return params.data[s.field] || 0;
          });
          return subjectMarks.reduce((sum, mark) => sum + mark, 0);
        }
      },
      {
        headerName: 'Percentage',
        field: 'percentage',
        width: 120,
        pinned: 'right',
        lockPinned: true,
        type: 'numericColumn',
        cellClass: params => `calculated-cell ${params.value < 40 ? 'failing-percentage' : 'passing-percentage'}`,
        headerClass: 'calculated-header',
        valueGetter: params => {
          const subjectMarks = subjects.map(s => {
            if (assessment && params.data.marks) {
              return params.data.marks.get(s.field) || 0;
            }
            return params.data[s.field] || 0;
          });
          const total = subjectMarks.reduce((sum, mark) => sum + mark, 0);
          const maxMarks = subjects.reduce((sum, s) => sum + (s.maxMarks || 100), 0);
          return maxMarks > 0 ? (total / maxMarks * 100).toFixed(1) : 0;
        },
        valueFormatter: params => `${params.value}%`
      },
      {
        headerName: 'Grade',
        field: 'grade',
        width: 80,
        pinned: 'right',
        lockPinned: true,
        cellClass: params => `grade-cell grade-${params.value.toLowerCase()}`,
        headerClass: 'calculated-header',
        valueGetter: params => getGrade(
          params.data.percentage || 0
        )
      },
      {
        headerName: 'Rank',
        field: 'rank',
        width: 80,
        pinned: 'right',
        lockPinned: true,
        type: 'numericColumn',
        cellClass: 'calculated-cell rank-cell',
        headerClass: 'calculated-header',
        valueGetter: params => {
          let allStudents = [];
          params.api.forEachNode((node) => {
            allStudents.push(node.data);
          });
          const sortedStudents = [...allStudents].sort((a, b) => {
            const aTotal = subjects.reduce((sum, s) => {
              if (assessment && a.marks) {
                return sum + (a.marks.get(s.field) || 0);
              }
              return sum + (a[s.field] || 0);
            }, 0);
            const bTotal = subjects.reduce((sum, s) => {
              if (assessment && b.marks) {
                return sum + (b.marks.get(s.field) || 0);
              }
              return sum + (b[s.field] || 0);
            }, 0);
            return bTotal - aTotal;
          });
          return sortedStudents.findIndex(student => student.id === params.data.id) + 1;
        }
      }
    ];
  }, [subjects]);

  // Grid options
  const gridOptions = {
    defaultColDef: {
      resizable: true,
      sortable: true,
      filter: true,
      floatingFilter: false,
      suppressMenu: false
    },
    enableRangeSelection: true,
    enableFillHandle: true,
    enableCellChangeFlash: true,
    animateRows: true,
    rowSelection: 'multiple',
    suppressRowClickSelection: true,
    enableCharts: false,
    enableRangeHandle: true,
    undoRedoCellEditing: true,
    undoRedoCellEditingLimit: 20,
    onCellValueChanged: useCallback((params) => {
      if (assessment && params.colDef.field && subjects.some(s => s.field === params.colDef.field)) {
        // Update the marks Map for assessment data
        const updatedStudent = {
          ...params.data,
          marks: new Map(params.data.marks || [])
        };
        updatedStudent.marks.set(params.colDef.field, params.newValue);
        
        if (onDataChange) {
          onDataChange(updatedStudent);
        }
      } else if (onDataChange) {
        onDataChange(params.data);
      }
      
      // Mark as unsaved
      setLocalSaveStatus('unsaved');
    }, [assessment, subjects, onDataChange]),
    onGridReady: useCallback((params) => {
      params.api.sizeColumnsToFit();
    }, []),
    suppressColumnVirtualisation: false,
    suppressRowVirtualisation: false,
    pagination: true,
    paginationPageSize: 25,
    paginationPageSizeSelector: [10, 25, 50, 100]
  };

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let filtered = processedData;
    
    if (searchText) {
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(searchText.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    if (showOnlyFailing) {
      filtered = filtered.filter(student => student.status === 'Failing');
    }
    
    return filtered;
  }, [processedData, searchText, showOnlyFailing]);

  // Save assessment
  const saveAssessment = useCallback(async () => {
    if (!assessment || !onSave) return;
    
    try {
      setLocalSaveStatus('saving');
      
      // Get all current data from grid
      const allStudents = [];
      gridRef.current.api.forEachNode((node) => {
        const studentData = { ...node.data };
        
        // Convert marks back to Map for backend
        if (studentData.marks && typeof studentData.marks === 'object') {
          studentData.marks = new Map(Object.entries(studentData.marks));
        }
        
        allStudents.push(studentData);
      });
      
      const updatedAssessment = {
        ...assessment,
        students: allStudents
      };
      
      await assessmentService.updateAssessment(assessment._id, updatedAssessment);
      setLocalSaveStatus('saved');
      
      if (onSave) {
        onSave(updatedAssessment);
      }
    } catch (error) {
      console.error('Failed to save assessment:', error);
      setLocalSaveStatus('error');
    }
  }, [assessment, onSave]);

  // Handle students added
  const handleStudentsAdded = useCallback((newStudents) => {
    if (onStudentsAdded) {
      onStudentsAdded(newStudents);
    }
    setLocalSaveStatus('unsaved');
  }, [onStudentsAdded]);

  // Export to CSV
  const exportToCsv = useCallback(() => {
    gridRef.current.api.exportDataAsCsv({
      fileName: assessment ? `${assessment.title.replace(/[^a-z0-9]/gi, '_')}.csv` : 'student-marks.csv',
      columnSeparator: ','
    });
  }, [assessment]);

  // Import from CSV (simplified - in real app, you'd parse the file)
  const importFromCsv = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // In real implementation, you'd parse the file here
        alert('File import functionality would be implemented here');
      }
    };
    input.click();
  }, []);

  // Toggle column visibility
  const toggleColumn = useCallback((field) => {
    const newHidden = new Set(hiddenColumns);
    if (newHidden.has(field)) {
      newHidden.delete(field);
    } else {
      newHidden.add(field);
    }
    setHiddenColumns(newHidden);
    
    // Only call setColumnsVisible if grid is ready
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.setColumnsVisible([field], !newHidden.has(field));
    }
  }, [hiddenColumns]);

  return (
    <div className="h-full flex flex-col">
      {/* Action Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {assessment ? assessment.title : 'Grade 10 > Section B > Semester 1 Midterms'}
            </h2>
            {assessment && (
              <span className="text-sm text-gray-600">
                Class {assessment.class} {assessment.section && `- Section ${assessment.section}`}
              </span>
            )}
            <div className="flex items-center space-x-2">
              {localSaveStatus === 'saving' && (
                <span className="text-sm text-blue-600 flex items-center">
                  <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                  Saving...
                </span>
              )}
              {localSaveStatus === 'saved' && (
                <span className="text-sm text-green-600">All changes saved</span>
              )}
              {localSaveStatus === 'unsaved' && (
                <span className="text-sm text-orange-600">Unsaved changes</span>
              )}
              {localSaveStatus === 'error' && (
                <span className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Save failed
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {assessment && (
              <>
                <button
                  onClick={() => setShowAddStudents(true)}
                  className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Add Students
                </button>
                {localSaveStatus === 'unsaved' && (
                  <button
                    onClick={saveAssessment}
                    className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </button>
                )}
              </>
            )}
            <button
              onClick={exportToCsv}
              className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={importFromCsv}
              className="flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filters */}
            <button
              onClick={() => setShowOnlyFailing(!showOnlyFailing)}
              className={`flex items-center px-3 py-2 text-sm rounded-md ${
                showOnlyFailing 
                  ? 'bg-red-100 text-red-700 border border-red-300' 
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showOnlyFailing ? 'Showing Failing' : 'All Students'}
            </button>

            {/* Column Toggle */}
            <div className="flex items-center space-x-2">
              {subjects.map(subject => (
                <button
                  key={subject.field}
                  onClick={() => toggleColumn(subject.field)}
                  className="flex items-center px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                  title={hiddenColumns.has(subject.field) ? 'Show' : 'Hide'}
                >
                  {hiddenColumns.has(subject.field) ? (
                    <EyeOff className="w-3 h-3 mr-1" />
                  ) : (
                    <Eye className="w-3 h-3 mr-1" />
                  )}
                  {subject.name}
                </button>
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {filteredData.length} students
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 bg-white">
        <div className="ag-theme-alpine" style={{ height: '100%', width: '100%' }}>
          <AgGridReact
            ref={gridRef}
            rowData={filteredData}
            columnDefs={columnDefs}
            gridOptions={gridOptions}
            loading={loading}
            suppressContextMenu={false}
          />
        </div>
      </div>
      
      {/* Add Students Modal */}
      {assessment && (
        <AddStudentsModal
          isOpen={showAddStudents}
          onClose={() => setShowAddStudents(false)}
          onAddStudents={handleStudentsAdded}
          subjects={subjects}
        />
      )}
    </div>
  );
};

// Add custom styles to document head
const customStyles = `
  .pinned-header {
    background-color: #f8fafc !important;
    font-weight: 600;
    border-right: 2px solid #e2e8f0;
  }
  
  .calculated-header {
    background-color: #f1f5f9 !important;
    font-weight: 600;
    border-left: 2px solid #e2e8f0;
  }
  
  .subject-header {
    background-color: #fef3c7 !important;
    font-weight: 500;
  }
  
  .roll-no-cell {
    background-color: #f8fafc !important;
    font-weight: 500;
    border-right: 2px solid #e2e8f0;
  }
  
  .calculated-cell {
    background-color: #f8fafc !important;
    font-weight: 500;
    border-left: 2px solid #e2e8f0;
  }
  
  .failing-marks {
    background-color: #fee2e2 !important;
    color: #dc2626;
    font-weight: 600;
  }
  
  .excellent-marks {
    background-color: #dcfce7 !important;
    color: #16a34a;
    font-weight: 600;
  }
  
  .average-marks {
    background-color: #fef3c7 !important;
    color: #d97706;
  }
  
  .failing-percentage {
    background-color: #fee2e2 !important;
    color: #dc2626;
    font-weight: 600;
  }
  
  .passing-percentage {
    background-color: #dcfce7 !important;
    color: #16a34a;
    font-weight: 600;
  }
  
  .grade-cell {
    text-align: center;
    font-weight: 600;
    border-radius: 4px;
  }
  
  .grade-a+ { background-color: #dcfce7; color: #166534; }
  .grade-a { background-color: #bbf7d0; color: #15803d; }
  .grade-b { background-color: #fef3c7; color: #a16207; }
  .grade-c { background-color: #fed7aa; color: #c2410c; }
  .grade-d { background-color: #fecaca; color: #dc2626; }
  .grade-e { background-color: #e0e7ff; color: #3730a3; }
  .grade-f { background-color: #fee2e2; color: #b91c1c; }
  
  .rank-cell {
    text-align: center;
    font-weight: 600;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 4px;
  }
`;

// Inject styles into document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = customStyles;
  if (!document.head.querySelector('#marks-grid-styles')) {
    styleElement.id = 'marks-grid-styles';
    document.head.appendChild(styleElement);
  }
}

export default MarksGrid;
