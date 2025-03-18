import { useState } from 'react';
import LiveKitRoom from './livekit/LiveKitRoom';
import { Button } from './ui/button';

function LiveKitPage() {
  const [isJoined, setIsJoined] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');

  const handleJoinRoom = () => {
    if (roomName && userName) {
      setIsJoined(true);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Audio Conference</h1>
          
          {!isJoined ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="room-name" className="block text-sm font-medium text-gray-700">
                  Room Name:
                </label>
                <input
                  id="room-name"
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter room name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="user-name" className="block text-sm font-medium text-gray-700">
                  Your Name:
                </label>
                <input
                  id="user-name"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <Button 
                onClick={handleJoinRoom} 
                disabled={!roomName || !userName}
                className="w-full"
              >
                Join Audio Conference
              </Button>
              
              <p className="text-sm text-gray-500 mt-2 text-center">
                Join an audio-only conference room to communicate with others
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4 p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">Room:</span> {roomName}
                </div>
                <div>
                  <span className="font-medium">User:</span> {userName}
                </div>
                <Button 
                  onClick={() => setIsJoined(false)} 
                  className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1"
                >
                  Leave
                </Button>
              </div>
              
              <LiveKitRoom userName={userName} roomName={roomName} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LiveKitPage;