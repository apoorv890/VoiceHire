import { useEffect, useState } from 'react';
import { 
  LiveKitRoom as LKRoom, 
  RoomAudioRenderer,
  useLocalParticipant,
  useTrackToggle
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

interface LiveKitRoomProps {
  userName: string;
  roomName: string;
}

// AI Agent Prompt component
const AIAgentPrompt = () => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setIsProcessing(true);
    try {
      // Send the prompt to your backend
      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process prompt');
      }
      
      const data = await response.json();
      setResponse(data.response);
    } catch (error) {
      console.error('Error processing prompt:', error);
      setResponse('Error processing your prompt. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      marginTop: '20px',
      padding: '15px',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }}>
      <h3 style={{ marginBottom: '10px', color: '#333' }}>AI Assistant</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a prompt for the AI assistant..."
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              minHeight: '80px',
              resize: 'vertical'
            }}
          />
        </div>
        <button
          type="submit"
          disabled={isProcessing || !prompt.trim()}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#4CAF50',
            color: 'white',
            fontWeight: 'bold',
            cursor: isProcessing || !prompt.trim() ? 'not-allowed' : 'pointer',
            opacity: isProcessing || !prompt.trim() ? 0.7 : 1
          }}
        >
          {isProcessing ? 'Processing...' : 'Send to AI Assistant'}
        </button>
      </form>
      
      {response && (
        <div style={{ 
          marginTop: '15px',
          padding: '10px',
          borderRadius: '4px',
          backgroundColor: '#e8f5e9',
          border: '1px solid #c8e6c9'
        }}>
          <h4 style={{ marginBottom: '5px', color: '#2e7d32' }}>AI Response:</h4>
          <p style={{ margin: 0, color: '#333' }}>{response}</p>
        </div>
      )}
    </div>
  );
};

// Custom audio controls component
const AudioControls = () => {
  const { localParticipant } = useLocalParticipant();
  const { toggle: toggleMicrophone, enabled: micEnabled } = useTrackToggle({ source: Track.Source.Microphone });
  
  const disconnectAll = () => {
    if (localParticipant) {
      // Access the room through the localParticipant
      const room = (localParticipant as any).room;
      if (room) {
        room.disconnect();
      }
    }
  };
  
  return (
    <div className="audio-controls" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      alignItems: 'center',
      padding: '20px',
      borderRadius: '8px',
      backgroundColor: '#f5f5f5',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }}>
      <button 
        onClick={() => toggleMicrophone()}
        style={{
          padding: '10px 20px',
          borderRadius: '20px',
          border: 'none',
          backgroundColor: micEnabled ? '#4CAF50' : '#f44336',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '150px'
        }}
      >
        <span>{micEnabled ? '🎙️ Mute' : '🔇 Unmute'}</span>
      </button>
      <button 
        onClick={disconnectAll}
        style={{
          padding: '10px 20px',
          borderRadius: '20px',
          border: 'none',
          backgroundColor: '#2196F3',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '150px'
        }}
      >
        <span>🔌 Disconnect</span>
      </button>
    </div>
  );
};

// Custom audio conference component that only shows audio controls
const CustomAudioConference = () => {
  return (
    <div className="audio-conference" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Audio Conference</h2>
      <AudioControls />
      <AIAgentPrompt />
    </div>
  );
};

function LiveKitRoom({ userName, roomName }: LiveKitRoomProps) {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchToken = async () => {
      try {
        setIsLoading(true);
        // Use the endpoint we created in the server
        const response = await fetch(`/api/livekit/token?identity=${encodeURIComponent(userName)}&room=${encodeURIComponent(roomName)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch token');
        }
        
        const data = await response.json();
        setToken(data.token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('Error fetching token:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchToken();
  }, [roomName, userName]);
  
  if (isLoading) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '200px',
      color: '#666'
    }}>
      Connecting to audio conference...
    </div>
  );
  
  if (error) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '200px',
      color: '#f44336'
    }}>
      Error: {error}
    </div>
  );
  
  if (!token) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '200px',
      color: '#f44336'
    }}>
      Could not generate access token
    </div>
  );

  // Make sure VITE_LIVEKIT_URL is set in your .env file
  const serverUrl = import.meta.env.VITE_LIVEKIT_URL;
  if (!serverUrl) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        color: '#f44336'
      }}>
        Error: LiveKit server URL not configured
      </div>
    );
  }
  
  return (
    <LKRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      audio={true}
      video={false} // Disable video since we only want audio
      data-lk-theme="default"
    >
      <CustomAudioConference />
      <RoomAudioRenderer /> {/* This renders the audio but doesn't show any UI */}
    </LKRoom>
  );
}

export default LiveKitRoom;