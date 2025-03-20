import logging
import argparse
import os
import sys

from dotenv import load_dotenv
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


load_dotenv(dotenv_path=".env.local")
logger = logging.getLogger("voice-agent")


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
            f"""You are a professional and highly efficient AI voice assistant designed specifically to help candidates schedule interviews. Your sole purpose is to collect four key pieces of information in a structured and precise manner. You must strictly follow this process and ask only the following questions—nothing more, nothing less:

            "What is your full name?"
            "What is your email address?" (Ensure clarity and confirmation if needed.)
            "Which company are you applying to?"
            "When would you like to schedule the interview?" (Confirm date and time.)

            After gathering these details, politely conclude by confirming that the interview scheduling process is complete. Do not ask any additional questions, provide extra information, or engage in casual conversation.

            Your tone should be polite, professional, and concise, ensuring a smooth experience for the candidate. If a candidate provides incomplete or unclear information, kindly prompt them to repeat or clarify without deviating from the script.

            Once all responses are received, simply say:
            "Thank you! Your interview has been scheduled. You will receive a confirmation shortly." and end the conversation.

            ⚠️ Important:

            Do not ask any irrelevant questions.
            Do not engage in small talk.
            Do not provide additional details or explanations.
            Strictly follow the outlined sequence and purpose.
            You are a structured and efficient AI assistant, ensuring a seamless interview scheduling experience!
            """
        ),
    )

    logger.info(f"connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Wait for the first participant to connect
    participant = await ctx.wait_for_participant()
    logger.info(f"starting voice assistant for participant {participant.identity}")

    # This project is configured to use Deepgram STT, OpenAI LLM and Cartesia TTS plugins
    # Other great providers exist like Cerebras, ElevenLabs, Groq, Play.ht, Rime, and more
    # Learn more and pick the best one for your app:
    # https://docs.livekit.io/agents/plugins
    agent = VoicePipelineAgent(
        vad=ctx.proc.userdata["vad"],
        stt=deepgram.STT(),
        llm=openai_llm.LLM.with_groq(model="llama3-8b-8192"),
        tts=deepgram.TTS(),
        turn_detector=turn_detector.EOUModel(),
        # minimum delay for endpointing, used when turn detector believes the user is done with their turn
        min_endpointing_delay=0.5,
        # maximum delay for endpointing, used when turn detector does not believe the user is done with their turn
        max_endpointing_delay=5.0,
        chat_ctx=initial_ctx,
    )

    usage_collector = metrics.UsageCollector()

    @agent.on("metrics_collected")
    def on_metrics_collected(agent_metrics: metrics.AgentMetrics):
        metrics.log_metrics(agent_metrics)
        usage_collector.collect(agent_metrics)

    agent.start(ctx.room, participant)

    # The agent should be polite and greet the user when it joins :)
    await agent.say("Hey, how can I help you today?", allow_interruptions=True)


if __name__ == "__main__":
    # Use the LiveKit CLI to run the agent
    # The CLI will handle the command line arguments and environment variables
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        ),
    )
