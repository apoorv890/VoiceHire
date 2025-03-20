#!/bin/bash

# Check if room and token are provided
if [ "$#" -ne 4 ] || [ "$1" != "--room" ] || [ "$3" != "--token" ]; then
  echo "Usage: $0 --room ROOM_NAME --token TOKEN"
  exit 1
fi

# Extract room and token
ROOM_NAME=$2
TOKEN=$4

# Set environment variables
export LIVEKIT_ROOM=$ROOM_NAME
export LIVEKIT_TOKEN=$TOKEN

echo "Starting agent for room: $ROOM_NAME"

# Change to the agent directory
cd "$(dirname "$0")"

# Run the agent with the connect command
python3 agent.py start
