import logging
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from vision_agents.core import Agent, AgentLauncher, Runner, User
from vision_agents.core.instructions import Instructions
from vision_agents.plugins import gemini, getstream


ROOT_DIR = Path(__file__).resolve().parent.parent
AGENT_NAME = "Lingua AI Teacher"
AGENT_USER_ID = "lingua-ai-teacher"
DEFAULT_LANGUAGE_NAME = "the selected language"
DEFAULT_LESSON_TITLE = "today's lesson"

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

    lines = [
        teacher_persona,
        "",
        f"You are teaching {language_name} through English.",
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
        f"- Only teach {language_name} for this lesson. Do not switch to another language.",
        "- Stay strictly inside the current lesson goal, vocabulary, phrases, and context.",
        "- Do not introduce unrelated topics or extra vocabulary beyond tiny English support words.",
        f"- Teach {language_name} words and phrases slowly, then give the English meaning.",
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
    lesson_title = metadata.get("lessonTitle") or DEFAULT_LESSON_TITLE
    conversation_starter = metadata.get("conversationStarter") or ""
    vocabulary = metadata.get("vocabulary") or ""

    if conversation_starter:
        return (
            "Speak aloud now. "
            f"Warmly welcome the learner to their {lesson_title} lesson in {language_name}. "
            "Mostly in English, teach only this lesson phrase slowly and naturally: "
            f"'{conversation_starter}'. Give its English meaning, encourage them gently, "
            "ask them to repeat it, then stop and wait for their voice."
        )

    if vocabulary:
        first_vocab = vocabulary.split(";")[0].strip()
        return (
            "Speak aloud now. "
            f"Warmly welcome the learner to their {lesson_title} lesson in {language_name}. "
            "Mostly in English, teach only this lesson vocabulary item slowly and naturally: "
            f"'{first_vocab}'. Give its English meaning, encourage them gently, "
            "ask them to repeat it, then stop and wait for their voice."
        )

    return (
        "Speak aloud now. "
        f"Warmly welcome the learner to their {lesson_title} lesson in {language_name}. "
        "Mostly in English, teach one short beginner phrase from this lesson, "
        "give its meaning, ask them to repeat it, then stop and wait for their voice."
    )


async def create_agent(**kwargs: Any) -> Agent:
    require_env(("STREAM_API_KEY", "STREAM_API_SECRET"))

    if not get_gemini_api_key():
        raise RuntimeError(
            "Missing required environment variable(s): GEMINI_API_KEY or GOOGLE_API_KEY"
        )

    instructions = build_teacher_instructions({})

    return Agent(
        edge=getstream.Edge(),
        agent_user=User(name=AGENT_NAME, id=AGENT_USER_ID),
        instructions=instructions,
        llm=gemini.Realtime(
            model=os.getenv(
                "GEMINI_REALTIME_MODEL",
                "gemini-3.1-flash-live-preview",
            ),
            api_key=get_gemini_api_key(),
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


runner = Runner(
    AgentLauncher(
        create_agent=create_agent,
        join_call=join_call,
        agent_idle_timeout=90.0,
        max_sessions_per_call=1,
    ),
)


if __name__ == "__main__":
    runner.cli()
