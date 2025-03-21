import React, { useState, useEffect } from 'react';
import { LiveKitRoom } from './LiveKitRoom';
import { getApiUrl, getDefaultHeaders } from '@/utils/apiConfig';

interface InterviewModalProps {
  candidateId: string;
  candidateName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const InterviewModal: React.FC<InterviewModalProps> = ({
  candidateId,
  candidateName,
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<{ roomName: string; token: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const setupInterview = async () => {
      try {
        setLoading(true);
        setError(null);

        // Call the backend API to create a room and get tokens
        const response = await fetch(getApiUrl('/api/interview/schedule'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            candidateId,
            candidateName
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to schedule interview');
        }

        const data = await response.json();
        setRoomData({
          roomName: data.roomName,
          token: data.interviewerToken
        });

        // Start the AI agent
        const agentResponse = await fetch(getApiUrl('/api/interview/start-agent'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomName: data.roomName,
            token: data.agentToken
          }),
        });

        if (!agentResponse.ok) {
          console.warn('AI agent may not have started properly');
        }
      } catch (err) {
        console.error('Error setting up interview:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    setupInterview();
  }, [isOpen, candidateId, candidateName]);

  if (!isOpen) return null;

  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-lg font-medium">Setting up your interview...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
            <div className="text-red-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Interview Setup Failed</h3>
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {!loading && !error && roomData && (
        <LiveKitRoom
          roomName={roomData.roomName}
          token={roomData.token}
          onClose={onClose}
        />
      )}
    </>
  );
};
