from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import os
from datetime import datetime, timedelta
import pytz

SCOPES = ["https://www.googleapis.com/auth/calendar"]

def get_calendar_service():
    creds = None
    token_path = "token.json"

    # Load existing token
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    # Authenticate if token is missing or expired
    if not creds or not creds.valid:
        flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
        creds = flow.run_local_server(port=0)

        # Save credentials
        with open(token_path, "w") as token_file:
            token_file.write(creds.to_json())

    return build("calendar", "v3", credentials=creds)

def create_calendar_event(summary="Interview", description="Scheduled interview with candidate", 
                         location="Online", attendees=None, timezone="Asia/Kolkata"):
    """
    Create a Google Calendar event for March 25th, 2025 at 3:30 PM
    
    Args:
        summary (str): Title of the event
        description (str): Description of the event
        location (str): Location of the event
        attendees (list): List of email addresses of attendees
        timezone (str): Timezone for the event
        
    Returns:
        dict: Created event details
    """
    service = get_calendar_service()
    
    # Set the event date and time (March 25th, 2025 at 3:30 PM)
    start_time = datetime(2025, 3, 25, 15, 30, 0)
    end_time = start_time + timedelta(hours=1)  # Default duration: 1 hour
    
    # Convert to RFC3339 format with timezone
    tz = pytz.timezone(timezone)
    start_time = tz.localize(start_time)
    end_time = tz.localize(end_time)
    
    # Format attendees
    event_attendees = []
    if attendees:
        event_attendees = [{'email': email} for email in attendees]
    
    # Create event body
    event_body = {
        'summary': summary,
        'location': location,
        'description': description,
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
    
    print(f"Event created: {event.get('htmlLink')}")
    return event

# Example usage
if __name__ == "__main__":
    service = get_calendar_service()
    print("OAuth 2.0 Authentication Successful!")
    
    # Create a calendar event for March 25th, 2025 at 3:30 PM
    event = create_calendar_event(
        summary="Interview with Candidate",
        description="Technical interview for software developer position",
        attendees=["candidate@example.com"]
    )
    print(f"Event ID: {event['id']}")
