import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Calendar, ArrowUpDown, FileText, Mail, Percent, X, Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  status: string;
  createdAt: string;
}

interface Candidate {
  _id: string;
  jobId: string;
  name: string;
  email: string;
  atsScore: number;
  matchExplanation?: string;
  resumeUrl: string;
  resumeText?: string;
  interviewScheduled?: boolean;
  interviewDate?: string;
}

const JobDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [processingStatus, setProcessingStatus] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    processed: number;
    failed: number;
    inProgress: boolean;
  }>({ total: 0, processed: 0, failed: 0, inProgress: false });
  const [sortField, setSortField] = useState<'name' | 'atsScore'>('atsScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Redirect to home if ID is undefined
    if (!id || id === 'undefined') {
      navigate('/');
      return;
    }

    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/jobs/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setUploadError('Job not found');
          } else {
            setUploadError('Error loading job details');
          }
          return;
        }
        
        const data = await response.json();
        setJob(data);
      } catch (error) {
        console.error('Error fetching job details:', error);
        setUploadError('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    const fetchCandidates = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/jobs/${id}/candidates`);
        
        if (!response.ok) {
          console.error('Error fetching candidates:', response.statusText);
          return;
        }
        
        const data = await response.json();
        // Ensure data is an array
        setCandidates(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching candidates:', error);
      }
    };

    fetchJobDetails();
    fetchCandidates();
  }, [id, navigate]);

  // Clean up file previews when component unmounts
  useEffect(() => {
    return () => {
      // Clean up logic if needed
    };
  }, []);

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Convert FileList to array
    const filesArray = Array.from(files);
    
    // Validate maximum 5 files
    if (filesArray.length > 5) {
      setUploadError('Maximum 5 resume files allowed');
      return;
    }
    
    // Validate file types and sizes
    let hasInvalidFile = false;
    filesArray.forEach(file => {
      if (file.type !== 'application/pdf') {
        setUploadError('Only PDF files are allowed');
        hasInvalidFile = true;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('Each file size should not exceed 10MB');
        hasInvalidFile = true;
      }
    });
    
    if (hasInvalidFile) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    setSelectedFiles(filesArray);
    setUploadError('');
  };
  
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleResumeUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadError('Please select at least one resume file');
      return;
    }

    setUploading(true);
    setUploadError('');
    setProcessingStatus('Uploading resumes...');
    setUploadProgress({
      total: selectedFiles.length,
      processed: 0,
      failed: 0,
      inProgress: true
    });

    try {
      const formData = new FormData();
      
      // Append all files to the form data
      selectedFiles.forEach(file => {
        formData.append('resumes', file);
      });
      
      setProcessingStatus(`Processing ${selectedFiles.length} resume(s) with AI...`);
      
      const response = await fetch(`http://localhost:5000/api/jobs/${id}/candidates/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload resumes');
      }

      const result = await response.json();
      
      // Add the new candidates to the list
      if (result.candidates && result.candidates.length > 0) {
        setCandidates(prevCandidates => [...result.candidates, ...prevCandidates]);
      }
      
      setProcessingStatus('');
      setUploadProgress({
        total: result.total,
        processed: result.processed,
        failed: result.failed,
        inProgress: false
      });
      
      // Show error if any files failed
      if (result.failed > 0) {
        setUploadError(`${result.failed} out of ${result.total} resumes failed to process`);
      }
      
      // Reset the form
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error processing resumes:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to process resumes');
      setUploadProgress(prev => ({...prev, inProgress: false}));
    } finally {
      setUploading(false);
    }
  };

  const handleScheduleCall = async (candidate: Candidate) => {
    try {
      // Update the UI to show the call has been scheduled
      setCandidates(prev => 
        prev.map(c => 
          c._id === candidate._id ? { ...c, interviewScheduled: true } : c
        )
      );
      
      // Show success notification
      alert('Interview scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling call:', error);
      alert('Failed to schedule interview. Please try again.');
    }
  };

  const toggleSort = (field: 'name' | 'atsScore') => {
    if (sortField === field) {
      // Toggle order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default order
      setSortField(field);
      setSortOrder(field === 'atsScore' ? 'desc' : 'asc');
    }
  };

  const getSortedCandidates = () => {
    return [...candidates].sort((a, b) => {
      if (sortField === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        return sortOrder === 'asc'
          ? a.atsScore - b.atsScore
          : b.atsScore - a.atsScore;
      }
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 70) return 'bg-blue-600';
    return 'bg-yellow-500';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (uploadError) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-500">
          <h2 className="text-xl font-semibold mb-2">{uploadError}</h2>
          <Button onClick={() => navigate('/')}>Back to Jobs</Button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-500">
          <h2 className="text-xl font-semibold mb-2">Job not found</h2>
          <Button onClick={() => navigate('/')}>Back to Jobs</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <div className="mt-2 flex items-center space-x-4 text-gray-600">
              <span>{job.company}</span>
              <span>•</span>
              <span>{job.location}</span>
              <span>•</span>
              <span className={`capitalize ${
                job.status === 'active' ? 'text-green-600' :
                job.status === 'draft' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {job.status}
              </span>
            </div>
          </div>
        </div>

        <div className="prose max-w-none mt-6">
          <h2 className="text-xl font-semibold mb-2">Job Description</h2>
          <p className="whitespace-pre-wrap">{job.description}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload Resumes</h2>
        <p className="text-gray-600 mb-4">Upload up to 5 resumes at once to be processed by our AI. We'll extract candidate information and match them against the job description.</p>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Upload Resumes (PDF, max 5)</label>
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf"
            onChange={handleFileSelection}
            disabled={uploading}
            multiple
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          
          {/* Selected files list */}
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Selected files ({selectedFiles.length}):</p>
              <ul className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm truncate max-w-xs">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-gray-500 hover:text-red-500"
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {uploadError && (
            <div className="mt-4 p-2 bg-red-50 text-red-700 rounded flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {uploadError}
            </div>
          )}
          
          {processingStatus && (
            <div className="mt-4 p-2 bg-blue-50 text-blue-700 rounded flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
              {processingStatus}
            </div>
          )}
          
          {uploadProgress.inProgress && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${(uploadProgress.processed / uploadProgress.total) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Processing: {uploadProgress.processed} of {uploadProgress.total} resumes
              </p>
            </div>
          )}
          
          {!uploadProgress.inProgress && uploadProgress.processed > 0 && (
            <div className="mt-4 p-2 bg-green-50 text-green-700 rounded flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Successfully processed {uploadProgress.processed} resume(s)
            </div>
          )}
          
          <div className="mt-4">
            <Button 
              onClick={handleResumeUpload} 
              disabled={uploading || selectedFiles.length === 0}
              className="flex items-center"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {uploading ? 'Processing...' : 'Upload Resumes'}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Candidates ({candidates.length})</h2>
          
          {candidates.length > 1 && (
            <div className="flex space-x-2">
              <Button 
                onClick={() => toggleSort('name')}
                className="flex items-center text-sm"
              >
                Name
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </Button>
              <Button 
                onClick={() => toggleSort('atsScore')}
                className="flex items-center text-sm"
              >
                Match Score
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        {candidates && candidates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getSortedCandidates().map((candidate) => (
              <div key={candidate._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col h-full">
                  <div className="flex-grow">
                    <h3 className="font-semibold text-lg">{candidate.name}</h3>
                    <div className="flex items-center text-gray-600 text-sm mt-1">
                      <Mail className="h-4 w-4 mr-1" />
                      <a href={`mailto:${candidate.email}`} className="hover:text-blue-500">{candidate.email}</a>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center">
                        <Percent className="h-4 w-4 mr-1 text-gray-600" />
                        <span className="text-sm font-medium">Match Score:</span>
                        <div className="ml-2 flex-grow bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${getScoreColor(candidate.atsScore)}`}
                            style={{ width: `${candidate.atsScore}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm font-medium">{candidate.atsScore}%</span>
                      </div>
                      {candidate.matchExplanation && (
                        <div className="mt-2 text-sm text-gray-600 italic">
                          "{candidate.matchExplanation}"
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center text-gray-600 text-sm">
                      <FileText className="h-4 w-4 mr-1" />
                      <span>Resume available</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button
                      onClick={() => handleScheduleCall(candidate)}
                      className={`w-full flex items-center justify-center ${
                        candidate.interviewScheduled ? 'bg-green-600 hover:bg-green-700' : ''
                      }`}
                      disabled={candidate.interviewScheduled}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {candidate.interviewScheduled ? 'Interview Scheduled' : 'Schedule Call'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No candidates yet. Upload a resume to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetails;