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
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Audio Conference</h2>
      <AudioControls />
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
  
  return (
    <LKRoom
      serverUrl={import.meta.env.VITE_LIVEKIT_URL || "wss://your-livekit-server.com"}
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