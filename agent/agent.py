import logging
import argparse
import os
import sys
import asyncio
import json
from dotenv import load_dotenv
from datetime import datetime, timedelta
import pytz
from typing import Annotated, Optional
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
    metrics,
)
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.plugins import cartesia, openai, deepgram, silero, turn_detector
from livekit.plugins.openai import llm as openai_llm

# Load environment variables
load_dotenv(dotenv_path=".env.local")

# Initialize logger
logger = logging.getLogger("voice-agent")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


# Function to store interview details
# Define a class that inherits from llm.FunctionContext for function calling
class InterviewFunctions(llm.FunctionContext):
    @llm.ai_callable()
    async def store_interview_details(
        self,
        date: Annotated[str, llm.TypeInfo(description="The confirmed interview date (e.g., 'Monday', 'Tuesday')")],
        time: Annotated[str, llm.TypeInfo(description="The confirmed interview time (e.g., '11 AM', '2 PM')")]
    ):
        """Stores the confirmed interview date and time"""
        interview_details = {
            "date": date,
            "time": time
        }
        
        # Save to a file (can be replaced with a database later)
        with open("interview_schedule.json", "w") as f:
            json.dump(interview_details, f, indent=4)

        logger.info(f"Interview confirmed: {date} at {time}")
        print(f"Interview confirmed: {date} at {time}")
        return f"Successfully stored interview details for {date} at {time}"
    
    def get_calendar_service(self):
        """Get authenticated Google Calendar service"""
        creds = None
        token_path = "token.json"

        # Load existing token
        if os.path.exists(token_path):
            creds = Credentials.from_authorized_user_file(token_path, ["https://www.googleapis.com/auth/calendar"])

        # Authenticate if token is missing or expired
        if not creds or not creds.valid:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", ["https://www.googleapis.com/auth/calendar"])
            creds = flow.run_local_server(port=0)

            # Save credentials
            with open(token_path, "w") as token_file:
                token_file.write(creds.to_json())

        return build("calendar", "v3", credentials=creds)

    @llm.ai_callable()
    async def schedule_interview_event(
        self,
        date: Annotated[str, llm.TypeInfo(description="The confirmed interview date (e.g., 'Monday', 'Tuesday')")],
        time: Annotated[str, llm.TypeInfo(description="The confirmed interview time (e.g., '11 AM', '2 PM')")],
        candidate_email: Annotated[Optional[str], llm.TypeInfo(description="Email of the candidate for the calendar invite")] = None
    ):
        """Schedule an interview event in Google Calendar based on confirmed date and time
        
        Args:
            date (str): The confirmed interview date (e.g., "Monday", "Tuesday")
            time (str): The confirmed interview time (e.g., "11 AM", "2 PM")
            candidate_email (str, optional): Email of the candidate for the calendar invite
            
        Returns:
            dict: Created event details or error message
        """
        try:
            # Get the calendar service
            service = self.get_calendar_service()
            
            # Parse the date and time to create a datetime object
            # First, convert day name to an actual date
            today = datetime.now()
            days = {"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, 
                    "friday": 4, "saturday": 5, "sunday": 6}
            
            # Normalize the date input (lowercase and remove extra spaces)
            date_lower = date.lower().strip()
            
            # Find the target day of week
            target_day = None
            for day_name, day_num in days.items():
                if day_name in date_lower:
                    target_day = day_num
                    break
            
            if target_day is None:
                logger.error(f"Could not parse date: {date}")
                return {"error": f"Could not parse date: {date}"}
            
            # Calculate days until the next occurrence of target_day
            current_day = today.weekday()
            days_ahead = (target_day - current_day) % 7
            if days_ahead == 0:  # If it's the same day, schedule for next week
                days_ahead = 7
                
            target_date = today + timedelta(days=days_ahead)
            
            # Parse the time (e.g., "11 AM", "2:30 PM")
            time_lower = time.lower().strip()
            hour = 0
            minute = 0
            
            # Handle different time formats
            if "am" in time_lower or "pm" in time_lower:
                # Format like "11 AM" or "2:30 PM"
                time_parts = time_lower.replace("am", "").replace("pm", "").strip().split(":")
                hour = int(time_parts[0])
                minute = int(time_parts[1]) if len(time_parts) > 1 else 0
                
                # Adjust for PM
                if "pm" in time_lower and hour < 12:
                    hour += 12
            else:
                # Format like "11:00" or "14:30"
                time_parts = time_lower.split(":")
                hour = int(time_parts[0])
                minute = int(time_parts[1]) if len(time_parts) > 1 else 0
            
            # Create the datetime for the event
            start_time = datetime(target_date.year, target_date.month, target_date.day, hour, minute, 0)
            end_time = start_time + timedelta(hours=1)  # Default duration: 1 hour
            
            # Convert to RFC3339 format with timezone
            timezone = "Asia/Kolkata"  # Default to Indian timezone
            tz = pytz.timezone(timezone)
            start_time = tz.localize(start_time)
            end_time = tz.localize(end_time)
            
            # Format attendees
            event_attendees = []
            if candidate_email:
                event_attendees = [{'email': candidate_email}]
            
            # Create event body
            event_body = {
                'summary': "Interview with Candidate",
                'location': "Online",
                'description': "Scheduled interview for job application",
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': timezone,
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': timezone,
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                        {'method': 'popup', 'minutes': 30},       # 30 minutes before
                    ],
                },
            }
            
            # Add attendees if provided
            if event_attendees:
                event_body['attendees'] = event_attendees
            
            # Create the event
            event = service.events().insert(calendarId='primary', body=event_body).execute()
            
            logger.info(f"Calendar event created: {event.get('htmlLink')}")
            print(f"Calendar event created: {event.get('htmlLink')}")
            
            return {"success": True, "event_link": event.get('htmlLink'), "event_id": event.get('id')}
            
        except Exception as e:
            error_msg = f"Error scheduling interview event: {str(e)}"
            logger.error(error_msg)
            print(error_msg)
            return {"error": error_msg}


async def entrypoint(ctx: JobContext):
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
            f"""You are a professional AI assistant that schedules interviews for candidates.
            
            - The available slots are Monday and Tuesday from 11 AM to 4 PM.
            - Ask the candidate to confirm a preferred date and time.
            - If the candidate confirms a valid date and time, store this information using the function `store_interview_details(date, time)`.
            - After storing the details, schedule a calendar event using the function `schedule_interview_event(date, time, candidate_email)`.
              If the candidate provides their email, include it in the calendar invite. Otherwise, you can omit the candidate_email parameter.
            - At the end of the call, confirm the scheduled date and time, then log it.
            """
        ),
    )

    logger.info(f"Connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Wait for the first participant to connect
    participant = await ctx.wait_for_participant()
    logger.info(f"Starting voice assistant for participant {participant.identity}")

    # Create function context for the interview functions
    fnc_ctx = InterviewFunctions()

    # Configure AI voice assistant pipeline
    agent = VoicePipelineAgent(
        vad=ctx.proc.userdata["vad"],
        stt=deepgram.STT(),  # Speech-to-text using Deepgram
        llm=openai_llm.LLM.with_groq(model="llama3-8b-8192"),  # LLM with function calling
        tts=deepgram.TTS(),  # Text-to-speech using Deepgram
        turn_detector=turn_detector.EOUModel(),  # Turn detection model
        min_endpointing_delay=0.5,
        max_endpointing_delay=5.0,
        chat_ctx=initial_ctx,
        fnc_ctx=fnc_ctx,  # Add function context for tool calling
    )

    usage_collector = metrics.UsageCollector()

    @agent.on("metrics_collected")
    def on_metrics_collected(agent_metrics: metrics.AgentMetrics):
        metrics.log_metrics(agent_metrics)
        usage_collector.collect(agent_metrics)

    @agent.on("transcript")
    def on_transcript(transcript: str):
        asyncio.create_task(handle_transcript(transcript))

    async def handle_transcript(transcript: str):
        logger.info(f"User: {transcript}")
        print(f"User: {transcript}")

    @agent.on("response")
    def on_response(response: str):
        asyncio.create_task(handle_response(response))

    async def handle_response(response: str):
        logger.info(f"AI: {response}")
        print(f"AI: {response}")

    # Start the AI voice agent
    agent.start(ctx.room, participant)

    # AI greets the user
    ai_greeting = "Hey, how can I help you today?"
    await agent.say(ai_greeting, allow_interruptions=True)
    logger.info(f"AI: {ai_greeting}")
    print(f"AI: {ai_greeting}")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        ),
    )
