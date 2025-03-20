import React, { useState } from 'react';
import {
  LiveKitRoom as LiveKitRoomComponent,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
  ControlBarProps,
  AgentState,
} from '@livekit/components-react';
import { NoAgentNotification } from './NoAgentNotification';
import { CloseIcon } from './CloseIcon';
import '@livekit/components-styles';
import './LiveKitRoom.css';

interface LiveKitRoomProps {
  roomName: string;
  token: string;
  onClose: () => void;
}

export const LiveKitRoom: React.FC<LiveKitRoomProps> = ({ token, onClose }) => {
  const [agentState] = useState<AgentState>('connecting');

  // Custom control bar with close button
  const CustomControlBar: React.FC<ControlBarProps> = (props) => {
    return (
      <div className="lk-control-bar-container">
        <ControlBar {...props} />
        <button onClick={onClose} className="lk-button close-button">
          <CloseIcon />
          <span>End Call</span>
        </button>
      </div>
    );
  };

  return (
    <div className="livekit-container">
      <div className="livekit-room-wrapper">
        <LiveKitRoomComponent
          data-lk-theme="default"
          serverUrl={import.meta.env.VITE_LIVEKIT_URL || 'wss://hr-portal-livekit.livekit.cloud'}
          token={token}
          connect={true}
          audio={true}
          video={true}
        >
          <VideoConference />
          <RoomAudioRenderer />
          <NoAgentNotification state={agentState} />
          <CustomControlBar />
        </LiveKitRoomComponent>
      </div>
    </div>
  );
};
