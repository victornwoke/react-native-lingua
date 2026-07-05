import asyncio
import logging
import os
import secrets
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import HTTPException, Request, status
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
VISION_AGENT_AUTH_PREFIX = "Bearer "

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


def require_agent_control_auth(request: Request) -> None:
    expected_token = os.getenv("VISION_AGENT_SHARED_SECRET")

    if not expected_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vision Agent control auth is not configured",
        )

    authorization = request.headers.get("authorization")

    if not authorization or not authorization.startswith(VISION_AGENT_AUTH_PREFIX):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Vision Agent control token",
        )

    token = authorization[len(VISION_AGENT_AUTH_PREFIX) :].strip()

    if not secrets.compare_digest(token, expected_token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Vision Agent control token",
        )


def build_teacher_instructions(metadata: LessonMetadata) -> str:
    if not has_required_lesson_metadata(metadata):
        return "\n".join(
            [
                "You are the Lingua AI Teacher, but the selected lesson metadata did not load.",
                "Do not guess the learner's language.",
                "Do not teach Spanish, French, German, Japanese, Thai, Hindi, or any other language.",
                "Say only: I couldn't load this lesson. Please go back and reopen it.",
                "Then stop speaking and wait.",
            ]
        )

    language_name = metadata.get("languageName") or DEFAULT_LANGUAGE_NAME
    language_code = metadata.get("languageCode") or ""
    language_native_name = metadata.get("languageNativeName") or ""
    lesson_title = metadata.get("lessonTitle") or DEFAULT_LESSON_TITLE
    lesson_level = metadata.get("lessonLevel") or "beginner"
    estimated_minutes = metadata.get("estimatedMinutes") or ""
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
    activities = metadata.get("activities") or ""

    language_label = build_language_label(
        language_name,
        language_code,
        language_native_name,
    )

    lines = [
        teacher_persona,
        "",
        "The learner already selected their language in the app and opened this lesson from the lesson/practice screen.",
        "Do not ask which language they want to learn, what lesson they want, or what they clicked.",
        f"You are teaching {language_label} through English.",
        f"The current lesson is: {lesson_title}. Level: {lesson_level}.",
    ]

    if estimated_minutes:
        lines += ["", f"Expected lesson length: {estimated_minutes}"]

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

    if activities:
        lines += ["", f"Practice activities from the lesson screen: {activities}"]

    lines += [
        "",
        "Hard rules:",
        "- Always speak English by default.",
        f"- The selected lesson language is {language_label}. This is the only target language you may teach.",
        "- The lesson and practice context above is authoritative. Welcome the learner directly into it.",
        "- Never ask what language the learner wants to study; that was already selected in the app.",
        "- Never teach or mention Thai, Hindi, Korean, Chinese, Japanese, Spanish, German, or any other language unless that is the selected lesson language.",
        f"- Use English for explanations and {language_name} only for target words, phrases, examples, and short role-play lines.",
        "- Treat the lesson as the starting point, not a rigid script.",
        f"- If the learner asks for a new topic, pivot inside {language_name} with one beginner-friendly mini example.",
        f"- You may introduce one adjacent {language_name} word or phrase when it helps the learner's request.",
        "- Do not jump to another language, and do not invent advanced vocabulary lists.",
        f"- Teach {language_name} words and phrases slowly, then give the English meaning.",
        "",
        "Interactive teaching mode:",
        "- Listen to the learner's actual words and respond to their intent first.",
        "- If the learner is confused, simplify, give a shorter example, and ask one tiny follow-up.",
        "- If the learner is doing well, offer a choice: repeat, role-play, pronunciation, or one new phrase.",
        "- If the learner asks a question, answer it briefly before returning to practice.",
        "- Do not end the lesson after two or three turns. Keep the conversation alive until the learner ends the call.",
        "- Never decide that the lesson is complete on your own.",
        "- Never stop because the planned lesson content has been covered.",
        "- If the learner finishes one mini-practice, immediately offer the next branch: role-play, pronunciation, quiz, personal example, review, or one new phrase.",
        "- If the learner says they want something different, follow their request inside the selected language instead of forcing the original phrase.",
        "- If the learner is quiet or gives a short answer, invite them into an easy next step instead of wrapping up.",
        "- Only give a goodbye or final recap after the learner clearly says they are done, goodbye, stop, or ends the call.",
        "- Avoid final-sounding phrases like 'great job, that's all' unless the learner says they are done.",
        "- Sound warm, human, energetic, and lesson-focused. Use natural contractions.",
        "- Keep most responses under 34 words unless the learner asks for an explanation.",
        "- Ask one clear learner response at the end of each turn, then stop speaking and wait.",
        "- Do not continue the lesson until you hear the learner through the microphone.",
        "- After the learner speaks, react to what they actually said before teaching the next tiny step.",
        f"- Correction style: {correction_style}",
        f"- If the learner asks for something outside this lesson, adapt it into a tiny {language_name} practice moment when possible.",
        "",
        f"Audio style: {audio_instructions}",
    ]

    return "\n".join(lines)


def build_greeting(metadata: LessonMetadata) -> str:
    if not has_required_lesson_metadata(metadata):
        return (
            "Speak aloud now. Say exactly: I couldn't load this lesson. "
            "Please go back and reopen it. Then stop."
        )

    language_name = metadata.get("languageName") or DEFAULT_LANGUAGE_NAME
    language_code = metadata.get("languageCode") or ""
    language_native_name = metadata.get("languageNativeName") or ""
    lesson_title = metadata.get("lessonTitle") or DEFAULT_LESSON_TITLE
    lesson_context = metadata.get("lessonDescription") or ""
    conversation_starter = metadata.get("conversationStarter") or ""
    vocabulary = metadata.get("vocabulary") or ""
    activities = metadata.get("activities") or ""
    phrases = metadata.get("phrases") or ""

    language_label = build_language_label(
        language_name,
        language_code,
        language_native_name,
    )
    activity_note = (
        f" Use these practice activities silently as your roadmap: {activities}"
        if activities
        else ""
    )
    context_note = f" Lesson focus: {lesson_context}" if lesson_context else ""
    phrase_note = f" Lesson phrases: {phrases}" if phrases else ""

    if conversation_starter:
        return (
            "Speak aloud now. "
            "The learner already selected this lesson in the app. "
            f"Welcome them to {lesson_title}, their {language_label} lesson. "
            f"{context_note}{phrase_note}{activity_note} "
            f"Start immediately with '{conversation_starter}', give its English meaning, "
            "ask them to repeat it, then listen and adapt. Keep the spoken greeting under 24 words."
        )

    if vocabulary:
        first_vocab = vocabulary.split(";")[0].strip()
        return (
            "Speak aloud now. "
            "The learner already selected this lesson in the app. "
            f"Welcome them to {lesson_title}, their {language_label} lesson. "
            f"{context_note}{activity_note} "
            f"Start immediately with '{first_vocab}', give its English meaning, "
            "ask them to repeat it, then listen and adapt. Keep the spoken greeting under 24 words."
        )

    return (
        "Speak aloud now. "
        "The learner already selected this lesson in the app. "
        f"Welcome them to {lesson_title}, their {language_label} lesson. "
        f"{context_note}{activity_note} "
        "Teach one short phrase from this lesson, ask them to repeat it, then listen and adapt. "
        "Keep the spoken greeting under 24 words."
    )


def build_language_label(
    language_name: str,
    language_code: str,
    language_native_name: str,
) -> str:
    if language_code and language_native_name:
        return f"{language_name} ({language_native_name}, {language_code})"

    if language_native_name:
        return f"{language_name} ({language_native_name})"

    if language_code:
        return f"{language_name} ({language_code})"

    return language_name


def has_required_lesson_metadata(metadata: LessonMetadata) -> bool:
    return bool(
        metadata.get("languageName")
        and metadata.get("languageId")
        and metadata.get("lessonId")
        and metadata.get("lessonTitle")
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
        "activities",
        "audioInstructions",
        "conversationStarter",
        "correctionStyle",
        "estimatedMinutes",
        "goals",
        "languageCode",
        "languageId",
        "languageName",
        "languageNativeName",
        "lessonDescription",
        "lessonId",
        "lessonLevel",
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
    for path in (
        ("call", "custom"),
        ("data", "call", "custom"),
        ("call", "data", "custom"),
        ("data", "custom"),
        ("custom",),
    ):
        candidate = get_nested_value(value, path)

        if looks_like_lesson_custom_data(candidate):
            return candidate

    logger.warning("Stream call metadata did not include lesson custom data.")
    return None


def get_nested_value(value: Any, path: tuple[str, ...]) -> Any:
    current = value

    for key in path:
        if current is None:
            return None

        if isinstance(current, dict):
            current = current.get(key)
            continue

        current = getattr(current, key, None)

    return current


def looks_like_lesson_custom_data(value: Any) -> bool:
    if not isinstance(value, dict):
        return False

    return all(
        isinstance(value.get(key), str) and value[key].strip()
        for key in ("languageId", "languageName", "lessonId", "lessonTitle")
    )


launcher = AgentLauncher(
    create_agent=create_agent,
    join_call=join_call,
    agent_idle_timeout=3_600.0,
    max_sessions_per_call=1,
)

runner = Runner(launcher)


@runner.fast_api.post(
    "/calls/{call_id}/sessions/{session_id}/interrupt",
    summary="Interrupt an active agent response",
)
async def interrupt_session(
    call_id: str, session_id: str, request: Request
) -> Response:
    require_agent_control_auth(request)

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
    "/calls/{call_id}/sessions/{session_id}/activity-start",
    summary="Mark the start of user activity",
)
async def start_activity(
    call_id: str, session_id: str, request: Request
) -> Response:
    require_agent_control_auth(request)

    session = launcher.get_session(session_id)

    if session is None or session.call_id != call_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with id '{session_id}' not found",
        )

    await send_realtime_activity_signal(session.agent, "activity_start")

    return Response(status_code=status.HTTP_202_ACCEPTED)


@runner.fast_api.post(
    "/calls/{call_id}/sessions/{session_id}/activity-end",
    summary="Mark the end of user activity",
)
async def end_activity(call_id: str, session_id: str, request: Request) -> Response:
    require_agent_control_auth(request)

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
