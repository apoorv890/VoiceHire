import { useState } from 'react';
import LiveKitRoom from './LiveKitRoom';

const AudioConferenceExample = () => {
  const [userName, setUserName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  const handleJoin = () => {
    if (userName && roomName) {
      setIsJoined(true);
    }
  };

  const handleLeave = () => {
    setIsJoined(false);
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Audio Conference</h1>
      
      {!isJoined ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          backgroundColor: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <div>
            <label htmlFor="userName" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Your Name:
            </label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
              placeholder="Enter your name"
            />
          </div>
          
          <div>
            <label htmlFor="roomName" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Room Name:
            </label>
            <input
              id="roomName"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
              placeholder="Enter room name"
            />
          </div>
          
          <button
            onClick={handleJoin}
            disabled={!userName || !roomName}
            style={{
              padding: '10px',
              backgroundColor: userName && roomName ? '#4CAF50' : '#cccccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: userName && roomName ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              marginTop: '10px'
            }}
          >
            Join Audio Conference
          </button>
        </div>
      ) : (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px',
            backgroundColor: '#e9f5e9',
            padding: '10px 15px',
            borderRadius: '4px'
          }}>
            <div>
              <span style={{ fontWeight: 'bold' }}>Name:</span> {userName}
            </div>
            <div>
              <span style={{ fontWeight: 'bold' }}>Room:</span> {roomName}
            </div>
            <button
              onClick={handleLeave}
              style={{
                padding: '5px 10px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Leave
            </button>
          </div>
          
          <LiveKitRoom userName={userName} roomName={roomName} />
        </div>
      )}
    </div>
  );
};

export default AudioConferenceExample;
