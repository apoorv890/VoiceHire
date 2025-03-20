import logging
import os
import json
import asyncio
from datetime import datetime, timedelta
import pytz
from typing import Optional
from dotenv import load_dotenv
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
from livekit.plugins import deepgram, silero, turn_detector
from livekit.plugins.openai import llm as openai_llm

# Load environment variables
load_dotenv(dotenv_path=".env.local")

# Initialize logger
logger = logging.getLogger("voice-agent")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


class InterviewFunctions(llm.FunctionContext):
    def get_calendar_service(self):
        """Authenticate and return Google Calendar API service"""
        creds = None
        token_path = "token.json"
        scopes = ["https://www.googleapis.com/auth/calendar"]

        if os.path.exists(token_path):
            creds = Credentials.from_authorized_user_file(token_path, scopes)

        if not creds or not creds.valid:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", scopes)
            creds = flow.run_local_server(port=0)

            with open(token_path, "w") as token_file:
                token_file.write(creds.to_json())

        return build("calendar", "v3", credentials=creds)

    @llm.ai_callable()
    async def schedule_interview_event(self, date: str, time: str, candidate_email: Optional[str] = None):
        """Schedule an interview in Google Calendar and respond accordingly"""
        try:
            service = self.get_calendar_service()
            today = datetime.now()
            days = {
                "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
                "friday": 4, "saturday": 5, "sunday": 6
            }

            date_lower = date.lower().strip()
            target_day = next((num for day, num in days.items() if day in date_lower), None)

            if target_day is None:
                return "I couldn't recognize the date. Please provide a valid day of the week."

            days_ahead = (target_day - today.weekday()) % 7 or 7
            target_date = today + timedelta(days=days_ahead)

            time_parts = time.lower().replace("am", "").replace("pm", "").strip().split(":")
            hour = int(time_parts[0])
            minute = int(time_parts[1]) if len(time_parts) > 1 else 0
            if "pm" in time.lower() and hour < 12:
                hour += 12

            timezone = "Asia/Kolkata"
            tz = pytz.timezone(timezone)
            start_time = tz.localize(datetime(target_date.year, target_date.month, target_date.day, hour, minute, 0))
            end_time = start_time + timedelta(hours=1)

            event_body = {
                'summary': "Interview with Candidate",
                'location': "Online",
                'description': "Scheduled interview for job application",
                'start': {'dateTime': start_time.isoformat(), 'timeZone': timezone},
                'end': {'dateTime': end_time.isoformat(), 'timeZone': timezone},
                'reminders': {'useDefault': False, 'overrides': [{'method': 'email', 'minutes': 1440}, {'method': 'popup', 'minutes': 30}]},
            }
            if candidate_email:
                event_body['attendees'] = [{'email': candidate_email}]

            event = service.events().insert(calendarId='primary', body=event_body).execute()

            if event and "id" in event:
                event_link = event.get('htmlLink')
                logger.info(f"✅ Successfully scheduled interview: {event_link}")
                return f"The interview has been successfully scheduled for {date} at {time}. Here is the calendar link: {event_link}"
            else:
                logger.error("❌ Google Calendar API did not return an event ID.")
                return "Something went wrong while scheduling the interview. Please try again."

        except Exception as e:
            error_msg = f"❌ Error scheduling event: {str(e)}"
            logger.error(error_msg)
            return "I encountered an issue while booking the interview. Please try again later."


async def entrypoint(ctx: JobContext):
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
            "You are an AI assistant that schedules interviews.\n"
            "- Available slots: Monday & Tuesday (11 AM - 4 PM).\n"
            "- Confirm date and time with candidate.\n"
            "- If event is booked successfully, share the calendar link.\n"
            "- If booking fails, apologize and suggest trying again later."
        ),
    )

    logger.info(f"🔄 Connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    participant = await ctx.wait_for_participant()

    fnc_ctx = InterviewFunctions()

    agent = VoicePipelineAgent(
        vad=ctx.proc.userdata["vad"],
        stt=deepgram.STT(),
        llm=openai_llm.LLM.with_groq(model="llama3-8b-8192"),
        tts=deepgram.TTS(),
        turn_detector=turn_detector.EOUModel(),
        min_endpointing_delay=0.5,
        max_endpointing_delay=5.0,
        chat_ctx=initial_ctx,
        fnc_ctx=fnc_ctx,
    )

    usage_collector = metrics.UsageCollector()

    @agent.on("metrics_collected")
    def on_metrics_collected(agent_metrics: metrics.AgentMetrics):
        metrics.log_metrics(agent_metrics)
        usage_collector.collect(agent_metrics)

    @agent.on("transcript")
    def handle_transcript(transcript: str):
        logger.info(f"👤 User: {transcript}")

    @agent.on("response")
    def handle_response(response: str):
        logger.info(f"🤖 AI: {response}")

    agent.start(ctx.room, participant)

    ai_greeting = "Hello! I can schedule an interview for you. What date and time work best?"
    await agent.say(ai_greeting, allow_interruptions=True)
    logger.info(f"🤖 AI: {ai_greeting}")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        ),
    )
