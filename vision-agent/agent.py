import logging
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from vision_agents.core import Agent, AgentLauncher, Runner, User
from vision_agents.core.instructions import Instructions
from vision_agents.plugins import getstream, openai


ROOT_DIR = Path(__file__).resolve().parent.parent
AGENT_NAME = "Lingua AI Teacher"
AGENT_USER_ID = "lingua-ai-teacher"
DEFAULT_LANGUAGE_NAME = "the selected language"
DEFAULT_LESSON_TITLE = "today's lesson"

logger = logging.getLogger(__name__)


load_dotenv(ROOT_DIR / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env")


LessonMetadata = dict[str, str]


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
        "Speak clearly with short pauses. Keep each turn easy to repeat."
    )

    return "\n".join(
        [
            teacher_persona,
            "",
            f"You are teaching {language_name} through English.",
            f"The current lesson is: {lesson_title}.",
            "",
            "Hard rules:",
            "- Always speak English by default.",
            f"- Teach {language_name} words and phrases by explaining them in English.",
            "- Keep every response short, warm, and beginner-friendly.",
            "- Ask the learner to repeat or answer one small thing at a time.",
            "- If the learner makes a mistake, correct gently and model the right phrase once.",
            "- Do not switch into a full lesson in the target language unless the learner asks.",
            "",
            f"Audio style: {audio_instructions}",
        ],
    )


def build_greeting(metadata: LessonMetadata) -> str:
    language_name = metadata.get("languageName") or DEFAULT_LANGUAGE_NAME
    lesson_title = metadata.get("lessonTitle") or DEFAULT_LESSON_TITLE

    return (
        f"Welcome the learner to their {language_name} lesson, {lesson_title}. "
        "Say that you will teach through English, then ask them to repeat one "
        "short beginner phrase from the lesson."
    )


async def create_agent(**kwargs: Any) -> Agent:
    require_env(("STREAM_API_KEY", "STREAM_API_SECRET", "OPENAI_API_KEY"))

    instructions = build_teacher_instructions({})

    return Agent(
        edge=getstream.Edge(),
        agent_user=User(name=AGENT_NAME, id=AGENT_USER_ID),
        instructions=instructions,
        llm=openai.Realtime(
            model=os.getenv("OPENAI_REALTIME_MODEL", "gpt-realtime-2"),
            voice=os.getenv("OPENAI_REALTIME_VOICE", "marin"),
            send_video=False,
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
        "languageId",
        "languageName",
        "lessonId",
        "lessonTitle",
        "teacherPersona",
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
