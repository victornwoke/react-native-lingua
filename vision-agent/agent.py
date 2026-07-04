import asyncio
import logging
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import HTTPException, status
from fastapi.responses import Response
from getstream.models import ChannelInput
from google.genai import types as gemini_types
from vision_agents.core.agents.conversation import Message, MessageState
from vision_agents.core import Agent, AgentLauncher, Runner, User
from vision_agents.core.instructions import Instructions
from vision_agents.plugins import gemini, getstream
from vision_agents.plugins.getstream.stream_conversation import StreamConversation


ROOT_DIR = Path(__file__).resolve().parent.parent
AGENT_NAME = "Lingua AI Teacher"
AGENT_USER_ID = "lingua-ai-teacher"
DEFAULT_LANGUAGE_NAME = "the selected language"
DEFAULT_LESSON_TITLE = "today's lesson"
LIVE_SPEECH_EVENT_KIND = "lingua.live_speech"
LIVE_SPEECH_EVENT_TEXT_LIMIT = 1_200

logger = logging.getLogger(__name__)


load_dotenv(ROOT_DIR / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env")


LessonMetadata = dict[str, str]


def get_gemini_api_key() -> str | None:
    return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")


def require_env(keys: tuple[str, ...]) -> None:
    missing_keys = [key for key in keys if not os.getenv(key)]

    if missing_keys:
        missing = ", ".join(missing_keys)
        raise RuntimeError(f"Missing required environment variable(s): {missing}")


def build_teacher_instructions(metadata: LessonMetadata) -> str:
    language_name = metadata.get("languageName") or DEFAULT_LANGUAGE_NAME
    language_code = metadata.get("languageCode") or ""
    lesson_title = metadata.get("lessonTitle") or DEFAULT_LESSON_TITLE
    teacher_persona = metadata.get("teacherPersona") or (
        "You are a friendly, patient AI language teacher."
    )
    audio_instructions = metadata.get("audioInstructions") or (
        "Speak clearly with short pauses. Keep each reply to one or two conversational sentences."
    )
    teaching_objective = metadata.get("teachingObjective") or ""
    correction_style = metadata.get("correctionStyle") or (
        "Correct gently, model one clear example, and invite the learner to try again."
    )
    goals = metadata.get("goals") or ""
    lesson_context = metadata.get("lessonDescription") or ""
    vocabulary = metadata.get("vocabulary") or ""
    phrases = metadata.get("phrases") or ""

    language_label = (
        f"{language_name} ({language_code})" if language_code else language_name
    )

    lines = [
        teacher_persona,
        "",
        f"You are teaching {language_label} through English.",
        f"The current lesson is: {lesson_title}.",
    ]

    if teaching_objective:
        lines += ["", f"Teaching objective: {teaching_objective}"]

    if lesson_context:
        lines += ["", f"Lesson context: {lesson_context}"]

    if goals:
        lines += ["", f"Lesson goals: {goals}"]

    if vocabulary:
        lines += ["", f"Key vocabulary for this lesson: {vocabulary}"]

    if phrases:
        lines += ["", f"Key phrases for this lesson: {phrases}"]

    lines += [
        "",
        "Hard rules:",
        "- Always speak English by default.",
        f"- The selected lesson language is {language_label}. This is the only target language you may teach.",
        "- Never teach or mention Thai, Hindi, Korean, Chinese, Japanese, Spanish, German, or any other language unless that is the selected lesson language.",
        f"- Use English for explanations and only use {language_name} for lesson words and phrases.",
        "- Stay strictly inside the current lesson goal, vocabulary, phrases, and context.",
        "- Do not introduce unrelated topics or extra vocabulary beyond tiny English support words.",
        f"- Teach {language_name} words and phrases slowly, then give the English meaning.",
        "- If the lesson language is missing or unclear, say you need the lesson language instead of choosing another language.",
        "- Sound warm, human, energetic, and lesson-focused. Use natural contractions.",
        "- Keep every response to one or two short conversational sentences.",
        "- Ask for exactly one learner response at the end of each turn, then stop speaking and wait.",
        "- Do not continue the lesson until you hear the learner through the microphone.",
        "- After the learner speaks, react to what they actually said before teaching the next tiny step.",
        f"- Correction style: {correction_style}",
        "- If the learner asks for something outside this lesson, gently bring them back to this lesson.",
        "",
        f"Audio style: {audio_instructions}",
    ]

    return "\n".join(lines)


def build_greeting(metadata: LessonMetadata) -> str:
    language_name = metadata.get("languageName") or DEFAULT_LANGUAGE_NAME
    language_code = metadata.get("languageCode") or ""
    lesson_title = metadata.get("lessonTitle") or DEFAULT_LESSON_TITLE
    conversation_starter = metadata.get("conversationStarter") or ""
    vocabulary = metadata.get("vocabulary") or ""

    language_label = (
        f"{language_name} ({language_code})" if language_code else language_name
    )

    if conversation_starter:
        return (
            "Speak aloud now. "
            f"Warmly welcome the learner to their {lesson_title} lesson in {language_label}. "
            "Mostly in English, teach only this lesson phrase slowly and naturally: "
            f"'{conversation_starter}'. Give its English meaning, encourage them gently, "
            "ask them to repeat it, then stop and wait for their voice. "
            "Do not say words from any other target language."
        )

    if vocabulary:
        first_vocab = vocabulary.split(";")[0].strip()
        return (
            "Speak aloud now. "
            f"Warmly welcome the learner to their {lesson_title} lesson in {language_label}. "
            "Mostly in English, teach only this lesson vocabulary item slowly and naturally: "
            f"'{first_vocab}'. Give its English meaning, encourage them gently, "
            "ask them to repeat it, then stop and wait for their voice. "
            "Do not say words from any other target language."
        )

    return (
        "Speak aloud now. "
        f"Warmly welcome the learner to their {lesson_title} lesson in {language_label}. "
        "Mostly in English, teach one short beginner phrase from this lesson, "
        "give its meaning, ask them to repeat it, then stop and wait for their voice. "
        "Do not say words from any other target language."
    )


class LiveSpeechStreamConversation(StreamConversation):
    def __init__(
        self,
        instructions: str,
        messages: list[Message],
        channel: Any,
        edge: "LiveSpeechStreamEdge",
        call_id: str,
    ) -> None:
        super().__init__(instructions, messages, channel)
        self.edge = edge
        self.call_id = call_id
        self._pending_live_speech_events: set[asyncio.Task[None]] = set()

    async def _sync_to_backend(
        self, message: Message, state: MessageState, completed: bool
    ) -> None:
        await super()._sync_to_backend(message, state, completed)
        self._dispatch_live_speech_event(message, completed)

    async def wait_for_pending_syncs(self) -> None:
        await super().wait_for_pending_syncs()

        if not self._pending_live_speech_events:
            return

        await asyncio.gather(
            *self._pending_live_speech_events,
            return_exceptions=True,
        )

    def _dispatch_live_speech_event(
        self,
        message: Message,
        completed: bool,
    ) -> None:
        if message.role not in ("assistant", "user"):
            return

        text = message.content.strip()

        if not text or not message.id:
            return

        speaker_role = "teacher" if message.role == "assistant" else "learner"
        payload = {
            "callId": self.call_id,
            "completed": completed,
            "kind": LIVE_SPEECH_EVENT_KIND,
            "messageId": message.id,
            "speakerName": "AI Teacher" if speaker_role == "teacher" else "You",
            "speakerRole": speaker_role,
            "text": text[-LIVE_SPEECH_EVENT_TEXT_LIMIT:],
        }

        task = asyncio.create_task(self._send_live_speech_event(payload))
        self._pending_live_speech_events.add(task)
        task.add_done_callback(self._pending_live_speech_events.discard)

    async def _send_live_speech_event(self, payload: dict[str, Any]) -> None:
        try:
            await self.edge.send_custom_event(payload)
        except Exception:
            logger.exception("Could not send realtime speech event.")


class LiveSpeechStreamEdge(getstream.Edge):
    async def create_conversation(self, call: Any, user: User, instructions: str):
        channel = self.client.chat.channel(self.channel_type, call.id)
        await channel.get_or_create(
            data=ChannelInput(created_by_id=user.id),
        )
        self.conversation = LiveSpeechStreamConversation(
            instructions,
            [],
            channel,
            self,
            call.id,
        )
        return self.conversation


async def create_agent(**kwargs: Any) -> Agent:
    require_env(("STREAM_API_KEY", "STREAM_API_SECRET"))

    if not get_gemini_api_key():
        raise RuntimeError(
            "Missing required environment variable(s): GEMINI_API_KEY or GOOGLE_API_KEY"
        )

    instructions = build_teacher_instructions({})

    return Agent(
        edge=LiveSpeechStreamEdge(),
        agent_user=User(name=AGENT_NAME, id=AGENT_USER_ID),
        instructions=instructions,
        llm=gemini.Realtime(
            model=os.getenv(
                "GEMINI_REALTIME_MODEL",
                "gemini-3.1-flash-live-preview",
            ),
            api_key=get_gemini_api_key(),
            config=gemini_types.LiveConnectConfigDict(
                realtime_input_config=gemini_types.RealtimeInputConfigDict(
                    automatic_activity_detection=gemini_types.AutomaticActivityDetectionDict(
                        disabled=True,
                    ),
                    activity_handling=gemini_types.ActivityHandling.START_OF_ACTIVITY_INTERRUPTS,
                    turn_coverage=gemini_types.TurnCoverage.TURN_INCLUDES_ONLY_ACTIVITY,
                ),
            ),
            fps=1,
        ),
    )


async def join_call(agent: Agent, call_type: str, call_id: str, **kwargs: Any) -> None:
    call = await agent.create_call(call_type, call_id)
    metadata = await load_lesson_metadata(call)
    instructions = Instructions(build_teacher_instructions(metadata))
    agent.instructions = instructions
    agent.llm.set_instructions(instructions)

    async with agent.join(call):
        await agent.simple_response(text=build_greeting(metadata))
        await agent.finish()


async def load_lesson_metadata(call: Any) -> LessonMetadata:
    try:
        response = await call.get()
    except Exception:
        logger.exception("Could not load Stream call metadata.")
        return {}

    custom_data = find_custom_data(response)

    if not isinstance(custom_data, dict):
        return {}

    metadata: LessonMetadata = {}

    for key in (
        "audioInstructions",
        "conversationStarter",
        "correctionStyle",
        "goals",
        "languageCode",
        "languageId",
        "languageName",
        "lessonDescription",
        "lessonId",
        "lessonTitle",
        "phrases",
        "teacherPersona",
        "teachingObjective",
        "vocabulary",
    ):
        value = custom_data.get(key)

        if isinstance(value, str) and value.strip():
            metadata[key] = value.strip()

    return metadata


def find_custom_data(value: Any) -> Any:
    if isinstance(value, dict):
        if "custom" in value:
            return value["custom"]

        for key in ("data", "call"):
            nested = value.get(key)
            found = find_custom_data(nested)

            if found is not None:
                return found

        return None

    for attribute in ("custom", "data", "call"):
        if hasattr(value, attribute):
            found = find_custom_data(getattr(value, attribute))

            if found is not None:
                return found

    return None


launcher = AgentLauncher(
    create_agent=create_agent,
    join_call=join_call,
    agent_idle_timeout=90.0,
    max_sessions_per_call=1,
)

runner = Runner(launcher)


@runner.fast_api.post(
    "/calls/{call_id}/sessions/{session_id}/interrupt",
    summary="Interrupt an active agent response",
)
async def interrupt_session(call_id: str, session_id: str) -> Response:
    session = launcher.get_session(session_id)

    if session is None or session.call_id != call_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with id '{session_id}' not found",
        )

    await session.agent._flow.interrupt()
    await send_realtime_activity_signal(session.agent, "activity_start")

    return Response(status_code=status.HTTP_202_ACCEPTED)


@runner.fast_api.post(
    "/calls/{call_id}/sessions/{session_id}/activity-end",
    summary="Mark the end of user activity",
)
async def end_activity(call_id: str, session_id: str) -> Response:
    session = launcher.get_session(session_id)

    if session is None or session.call_id != call_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with id '{session_id}' not found",
        )

    await send_realtime_activity_signal(session.agent, "activity_end")

    return Response(status_code=status.HTTP_202_ACCEPTED)


async def send_realtime_activity_signal(agent: Agent, signal: str) -> None:
    realtime_session = getattr(agent.llm, "_real_session", None)

    if realtime_session is None:
        return

    await realtime_session.send_realtime_input(**{signal: {}})


if __name__ == "__main__":
    runner.cli()
