import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Calendar, ArrowUpDown, FileText, Mail, Percent, X, Upload, CheckCircle, AlertCircle, MapPin, Building2, Briefcase, Users, ArrowLeft, Sparkles, Edit3, Send, XCircle } from 'lucide-react';
import { InterviewModal } from './livekit/InterviewModal';
import { useAuth } from '../hooks/useAuth';

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
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
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
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<{
    applied: boolean;
    status: string | null;
  }>({ applied: false, status: null });
  const [applyingForJob, setApplyingForJob] = useState(false);

  // Memoized fetch function for application status
  const fetchApplicationStatus = useCallback(async () => {
    if (!id || id === 'undefined') return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/applications/job/${id}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setApplicationStatus(data);
      }
    } catch (error) {
      console.error('Error fetching application status:', error);
    }
  }, [id]);

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
    
    // Fetch application status for non-admin users
    if (!isAdmin) {
      fetchApplicationStatus();
    }
  }, [id, navigate, isAdmin, fetchApplicationStatus]);

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
      // Set the selected candidate and open the interview modal
      setSelectedCandidate(candidate);
      setInterviewModalOpen(true);
      
      // Update the UI to show the call has been scheduled
      setCandidates(prev => 
        prev.map(c => 
          c._id === candidate._id ? { ...c, interviewScheduled: true } : c
        )
      );
    } catch (error) {
      console.error('Error scheduling call:', error);
      alert('Failed to schedule interview. Please try again.');
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!job) return;
    
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/jobs/${job._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedJob = await response.json();
        setJob(updatedJob);
        setShowStatusDropdown(false);
      } else {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        console.error('Failed to update job status:', error);
        // Silently fail - don't show alert to user
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      // Silently fail - don't show alert to user
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleApplyForJob = async () => {
    if (!job || !id) return;
    
    setApplyingForJob(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/applications/job/${id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchApplicationStatus();
        // Success - UI will update automatically
      } else {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        console.error('Failed to apply for job:', error);
        // Silently fail - don't show alert to user
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      // Silently fail - don't show alert to user
    } finally {
      setApplyingForJob(false);
    }
  };

  const handleWithdrawApplication = async () => {
    if (!job || !id) return;
    
    if (!confirm('Are you sure you want to withdraw your application?')) {
      return;
    }
    
    setApplyingForJob(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/applications/job/${id}/withdraw`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchApplicationStatus();
        // Success - UI will update automatically
      } else {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        console.error('Failed to withdraw application:', error);
        // Silently fail - don't show alert to user
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      // Silently fail - don't show alert to user
    } finally {
      setApplyingForJob(false);
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
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (uploadError) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{uploadError}</h2>
            <Button onClick={() => navigate('/')} className="mt-4 bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Job not found</h2>
            <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/jobs')}
          className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </button>

        {/* Job Header Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-8 mb-6 text-white">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  job.status === 'active' 
                    ? 'bg-green-500 text-white ring-2 ring-green-300' 
                    : job.status === 'closed' 
                    ? 'bg-red-500 text-white ring-2 ring-red-300' 
                    : 'bg-yellow-500 text-white ring-2 ring-yellow-300'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5"></span>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{job.title}</h1>
              <div className="flex flex-wrap gap-4 text-blue-50">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <span className="font-medium">{job.company}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span className="font-medium">{job.location}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {isAdmin && candidates.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5" />
                    <span className="text-sm font-medium">Candidates</span>
                  </div>
                  <div className="text-3xl font-bold">{candidates.length}</div>
                </div>
              )}
              
              {/* Admin Status Update Button */}
              {isAdmin && (
                <div className="relative">
                  <button
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    disabled={updatingStatus}
                    className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-xl px-4 py-3 flex items-center gap-2 transition-all disabled:opacity-50 w-full"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span className="text-sm font-medium">Update Status</span>
                  </button>
                  
                  {showStatusDropdown && (
                    <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-10 min-w-[200px]">
                      {['active', 'draft', 'closed'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(status)}
                          disabled={job.status === status || updatingStatus}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            job.status === status ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              status === 'active' ? 'bg-green-500' :
                              status === 'closed' ? 'bg-red-500' :
                              'bg-yellow-500'
                            }`}></span>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* User Apply/Withdraw Button */}
              {!isAdmin && (
                <div>
                  {applicationStatus.applied ? (
                    <button
                      onClick={handleWithdrawApplication}
                      disabled={applyingForJob}
                      className="bg-red-500/90 backdrop-blur-sm hover:bg-red-600 border border-red-400/50 rounded-xl px-6 py-3 flex items-center gap-2 transition-all disabled:opacity-50 font-medium shadow-lg"
                    >
                      {applyingForJob ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                      Withdraw Application
                    </button>
                  ) : (
                    <button
                      onClick={handleApplyForJob}
                      disabled={applyingForJob || job.status !== 'active'}
                      className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-xl px-6 py-3 flex items-center gap-2 transition-all disabled:opacity-50 font-medium shadow-lg"
                    >
                      {applyingForJob ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                      {job.status !== 'active' ? 'Not Accepting Applications' : 'Apply for Job'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Job Description Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Job Description</h2>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>
        </div>

        {/* Upload Resumes Card */}
        {isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">AI-Powered Resume Screening</h2>
          </div>
          <p className="text-gray-600 mb-6">Upload up to 5 resumes at once. Our AI will extract candidate information and match them against the job requirements.</p>
        
        <div className="mt-4">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition-colors">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Resumes (PDF, max 5)</label>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf"
              onChange={handleFileSelection}
              disabled={uploading}
              multiple
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-3 file:px-6
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700 file:cursor-pointer
                cursor-pointer"
            />
          </div>
          
          {/* Selected files list */}
          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-900 mb-3">Selected files ({selectedFiles.length}):</p>
              <ul className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900 block truncate max-w-xs">{file.name}</span>
                        <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      disabled={uploading}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {uploadError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{uploadError}</span>
            </div>
          )}
          
          {processingStatus && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
              <span className="font-medium">{processingStatus}</span>
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
            <div className="mt-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Successfully processed {uploadProgress.processed} resume(s)</span>
            </div>
          )}
          
          <div className="mt-6">
            <Button 
              onClick={handleResumeUpload} 
              disabled={uploading || selectedFiles.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Upload className="h-5 w-5" />
              )}
              {uploading ? 'Processing Resumes...' : 'Upload & Process Resumes'}
            </Button>
          </div>
        </div>
      </div>
      )}

        {/* Candidates Section */}
        {isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Candidates ({candidates.length})</h2>
            </div>
            
            {candidates.length > 1 && (
              <div className="flex gap-2">
                <Button 
                  onClick={() => toggleSort('name')}
                  className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-medium"
                >
                  Name
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => toggleSort('atsScore')}
                  className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-medium"
                >
                  Match Score
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        
          {candidates && candidates.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {getSortedCandidates().map((candidate) => (
                <div key={candidate._id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                  <div className="flex flex-col h-full">
                    <div className="flex-grow">
                      {/* Candidate Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-xl text-gray-900">{candidate.name}</h3>
                          <div className="flex items-center text-gray-600 text-sm mt-2">
                            <Mail className="h-4 w-4 mr-2" />
                            <a href={`mailto:${candidate.email}`} className="hover:text-blue-600 transition-colors">{candidate.email}</a>
                          </div>
                        </div>
                      </div>

                      {/* Match Score */}
                      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-semibold text-gray-700">Match Score</span>
                          </div>
                          <span className={`text-lg font-bold ${
                            candidate.atsScore >= 80 ? 'text-green-600' :
                            candidate.atsScore >= 70 ? 'text-blue-600' :
                            'text-yellow-600'
                          }`}>{candidate.atsScore}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${getScoreColor(candidate.atsScore)}`}
                            style={{ width: `${candidate.atsScore}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Match Explanation */}
                      {candidate.matchExplanation && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-gray-700 italic">"{candidate.matchExplanation}"</p>
                        </div>
                      )}

                      {/* Resume Badge */}
                      <div className="flex items-center text-gray-600 text-sm">
                        <FileText className="h-4 w-4 mr-2" />
                        <span className="font-medium">Resume available</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-6">
                      <Button
                        onClick={() => handleScheduleCall(candidate)}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                          candidate.interviewScheduled 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                        }`}
                        disabled={candidate.interviewScheduled}
                      >
                        <Calendar className="h-5 w-5" />
                        {candidate.interviewScheduled ? 'Interview Scheduled ✓' : 'Schedule Interview'}
                      </Button>
                    </div>
                  </div>
                </div>
            ))}
          </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates yet</h3>
              <p className="text-gray-600">Upload resumes to start screening candidates with AI</p>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Interview Modal */}
      {isAdmin && selectedCandidate && (
        <InterviewModal
          candidateId={selectedCandidate._id}
          candidateName={selectedCandidate.name}
          isOpen={interviewModalOpen}
          onClose={() => setInterviewModalOpen(false)}
        />
      )}
    </>
  );
};

export default JobDetails;