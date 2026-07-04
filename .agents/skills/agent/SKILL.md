---
name: Agent
description: Use when building real-time voice and video AI agents, deploying conversational AI to production, integrating with phone networks, adding computer vision to agents, or connecting to external tools and knowledge bases. Agents handle call lifecycle, audio/video routing, turn-taking, and deployment automatically.
metadata:
    mintlify-proj: agent
    version: "1.0"
---

# Vision Agents Skill

## Product Summary

Vision Agents is an open-source Python framework for building real-time voice and video AI applications. You write an `Agent` class that joins a call, connects to AI providers through swappable plugins (35+ integrations), and responds in real time. The framework handles call lifecycle, audio/video routing, turn-taking, and deployment. Key files: `agent.py` (your agent definition), `pyproject.toml` (dependencies), `.env` (API keys). CLI: `uv run agent.py run` (console mode), `uv run agent.py serve` (HTTP server). Scaffold new projects with `uvx vision-agents init my-agent`. Primary docs: https://visionagents.ai

## When to Use

Reach for this skill when:
- Building voice agents that listen, reason, and speak in real time
- Creating video agents that analyze camera feeds with computer vision or VLMs
- Deploying agents to production with Docker, Kubernetes, or HTTP servers
- Connecting agents to phone networks (PSTN) via Twilio or Telnyx
- Adding function calling, RAG, or external tools via MCP servers
- Swapping AI providers (LLM, STT, TTS, vision models) without rewriting agent logic
- Testing agent behavior with pytest before deployment
- Scaling agents horizontally across multiple servers with Redis

## Quick Reference

### Agent Modes

| Mode | Best For | Setup |
|------|----------|-------|
| **Realtime** | Lowest latency, simplest setup | Single provider (OpenAI, Gemini, Qwen) handles speech end-to-end |
| **Custom Pipeline** | Full control, mixed providers | Separate STT, LLM, TTS components |

### Core Agent Constructor

```python
from vision_agents.core import Agent, User
from vision_agents.plugins import getstream, gemini, deepgram, elevenlabs

# Realtime mode (simplest)
agent = Agent(
    edge=getstream.Edge(),
    agent_user=User(name="Assistant", id="agent"),
    instructions="You're a helpful voice assistant.",
    llm=gemini.Realtime(),  # Handles speech natively
)

# Custom pipeline (full control)
agent = Agent(
    edge=getstream.Edge(),
    agent_user=User(name="Assistant", id="agent"),
    instructions="You're a helpful voice assistant.",
    llm=gemini.LLM(),        # Text-only LLM
    stt=deepgram.STT(),      # Speech-to-text
    tts=elevenlabs.TTS(),    # Text-to-speech
)
```

### Essential Methods

| Method | Purpose |
|--------|---------|
| `await agent.create_call(call_type, call_id)` | Create a call on the edge provider |
| `async with agent.join(call):` | Join a call (must be async context manager) |
| `await agent.simple_response(text)` | Send text to LLM, speak response via TTS |
| `await agent.say(text)` | Speak text directly, bypassing LLM |
| `await agent.finish()` | Wait for call to end gracefully |
| `await agent.close()` | Clean up resources (called automatically on context exit) |
| `@agent.llm.register_function()` | Register a Python function as a tool for the LLM |

### Plugin Categories (35+ integrations)

| Category | Examples | Install |
|----------|----------|---------|
| **Realtime** | OpenAI, Gemini, Qwen, xAI, Inworld | `uv add vision-agents[openai]` |
| **LLM** | Anthropic, OpenRouter, Kimi, MiniMax | `uv add vision-agents[anthropic]` |
| **STT** | Deepgram, ElevenLabs, Cartesia, Fast-Whisper | `uv add vision-agents[deepgram]` |
| **TTS** | ElevenLabs, Cartesia, Kokoro, Pocket | `uv add vision-agents[elevenlabs]` |
| **Vision** | YOLO, Moondream, NVIDIA, Roboflow, TwelveLabs | `uv add vision-agents[ultralytics]` |
| **Avatars** | Anam, LiveAvatar, LemonSlice | `uv add vision-agents[anam]` |
| **Telephony** | Twilio, Telnyx | `uv add vision-agents[twilio]` |

### Deployment Modes

| Mode | Use Case | Command |
|------|----------|---------|
| **Console** | Local dev, testing | `uv run agent.py run` |
| **HTTP Server** | Single container, multi-session | `uv run agent.py serve --host 0.0.0.0 --port 8080` |
| **Docker** | Cloud deployment | Build with `Dockerfile` (CPU) or `Dockerfile.gpu` |
| **Kubernetes** | Horizontal scaling, production | Use Helm chart + Redis session registry |

## Decision Guidance

### Realtime vs Custom Pipeline

| Decision | Realtime | Custom Pipeline |
|----------|----------|-----------------|
| **Latency** | Lowest (single connection) | Slightly higher (STT → LLM → TTS chain) |
| **Setup** | One line: `llm=gemini.Realtime()` | Three lines: STT, LLM, TTS |
| **Provider Mix** | Single provider only | Mix any STT, LLM, TTS |
| **Function Calling** | Limited (provider-dependent) | Full support via `@llm.register_function()` |
| **Turn Detection** | Built-in | Separate plugin or provider-built-in |
| **When to Use** | Prototyping, demos, lowest latency | Production, custom tools, multi-provider |

### STT Provider Choice

| Provider | Best For | Notes |
|----------|----------|-------|
| **Deepgram** | General purpose | Built-in turn detection, eager mode reduces latency |
| **ElevenLabs** | High quality | Built-in VAD, ~150ms latency |
| **Fast-Whisper** | Local, no API key | CPU/GPU accelerated, runs on your machine |
| **Cartesia** | Low latency | Streaming PCM, turn detection |

### TTS Provider Choice

| Provider | Best For | Notes |
|----------|----------|-------|
| **ElevenLabs** | Natural voices | Highly realistic, multilingual |
| **Cartesia** | Ultra-low latency | Sonic model, ~100ms |
| **Kokoro** | Local, free | Runs on CPU, no API key |
| **OpenAI** | Simplicity | gpt-4o-mini-tts, streaming |

### Video Agent Approach

| Approach | Best For | Setup |
|----------|----------|-------|
| **Realtime with fps** | Native video streaming | `llm=gemini.Realtime(fps=3)` |
| **VLM** | Video understanding, analysis | `llm=nvidia.VLM(fps=1, frame_buffer_seconds=10)` |
| **Processors** | Detection, pose, segmentation | `processors=[ultralytics.YOLOPoseProcessor()]` |

## Workflow

### 1. Scaffold a New Agent

```bash
uvx vision-agents init my-agent && cd my-agent
cp .env.example .env
# Fill in API keys: STREAM_API_KEY, STREAM_API_SECRET, GOOGLE_API_KEY, etc.
```

### 2. Define Your Agent

Edit `agent.py`:

```python
from dotenv import load_dotenv
from vision_agents.core import Agent, AgentLauncher, User, Runner
from vision_agents.plugins import getstream, gemini, deepgram, elevenlabs

load_dotenv()

async def create_agent(**kwargs) -> Agent:
    llm = gemini.LLM()
    
    @llm.register_function(description="Get weather for a location")
    async def get_weather(location: str) -> dict:
        return {"temp": "72F", "condition": "sunny"}
    
    return Agent(
        edge=getstream.Edge(),
        agent_user=User(name="Assistant", id="agent"),
        instructions="You're a helpful voice assistant.",
        llm=llm,
        stt=deepgram.STT(eager_turn_detection=True),
        tts=elevenlabs.TTS(),
    )

async def join_call(agent: Agent, call_type: str, call_id: str, **kwargs) -> None:
    call = await agent.create_call(call_type, call_id)
    async with agent.join(call):
        await agent.simple_response("Hello! How can I help?")
        await agent.finish()

if __name__ == "__main__":
    Runner(AgentLauncher(create_agent=create_agent, join_call=join_call)).cli()
```

### 3. Test Locally

```bash
uv run agent.py run
```

Opens a browser demo. Join and talk to your agent.

### 4. Add Tools (Optional)

Register functions with `@llm.register_function()`. The LLM calls them automatically when relevant.

### 5. Deploy

**Single container:**
```bash
docker buildx build --platform linux/amd64 -t my-agent .
docker run -e STREAM_API_KEY=... -p 8080:8080 my-agent
```

**Multiple replicas:**
Add Redis session registry (see Horizontal Scaling guide).

**Kubernetes:**
Use Helm chart with Prometheus + Grafana monitoring.

### 6. Monitor

Access metrics at `/calls/{call_id}/sessions/{session_id}/metrics` or via OpenTelemetry.

## Common Gotchas

- **Do not reuse Agent instances.** Create a new agent for each call. Calling `join()` twice on the same agent raises `RuntimeError`.
- **STT/TTS auto-disabled in Realtime mode.** When using `AudioLLM` (Realtime), STT, TTS, and turn detection are automatically disabled. Don't pass them.
- **Only async functions in `@register_function()`.** Synchronous functions raise `ValueError`. Use `async def`.
- **Agent must join as async context manager.** `async with agent.join(call):` is required. The context manager calls `close()` automatically.
- **Instructions support `@file.md` references.** Load instructions from markdown files: `instructions="@instructions.md"`.
- **Turn detection conflicts.** If your STT plugin has built-in turn detection (Deepgram, ElevenLabs), don't pass a separate `turn_detection` parameter — the Agent skips it automatically.
- **Video override only works with avatar or video processor.** Set `agent.set_video_track_override_path()` before `join()` if using video.
- **Realtime models don't support `say()`.** In Realtime mode, `agent.say()` logs a warning and does nothing. Use `simple_response()` instead.
- **Session limits in HTTP server.** Set `max_concurrent_sessions`, `max_sessions_per_call`, and `agent_idle_timeout` to prevent resource exhaustion.
- **MCP servers connect on `join()`.** Tools are discovered and registered when the agent joins a call, not during agent creation.

## Verification Checklist

Before submitting agent code:

- [ ] Agent created with `async def create_agent()` returning an `Agent` instance
- [ ] `join_call()` defined as `async def join_call(agent, call_type, call_id, **kwargs)`
- [ ] `Runner(AgentLauncher(...)).cli()` entry point configured
- [ ] All API keys in `.env` (STREAM_API_KEY, STREAM_API_SECRET, provider keys)
- [ ] Tested locally with `uv run agent.py run` — agent joins and responds
- [ ] Instructions are clear and concise (system prompt)
- [ ] All registered functions are `async def` with descriptions
- [ ] STT/TTS not passed when using Realtime LLM
- [ ] Turn detection not passed if STT has built-in detection
- [ ] Docker image builds: `docker buildx build --platform linux/amd64 -t agent .`
- [ ] Environment variables set in deployment (not hardcoded)
- [ ] Metrics endpoint accessible if using HTTP server mode
- [ ] Tests pass: `uv run pytest tests/` (if using testing module)

## Resources

**Comprehensive navigation:** https://visionagents.ai/llms.txt

**Critical docs:**
- [Quickstart](/introduction/quickstart) — 5-minute setup
- [Voice Agents](/introduction/voice-agents) — Realtime vs custom pipeline, function calling
- [Integrations](/integrations/introduction-to-integrations) — 35+ provider plugins
- [Deployment Overview](/guides/deploying-overview) — Local → Docker → Kubernetes
- [HTTP Server](/guides/http-server) — Multi-session, authentication, scaling
- [MCP & Function Calling](/guides/mcp-tool-calling) — Tools, external services
- [Testing](/guides/testing) — pytest patterns for agent behavior
- [Telemetry](/core/telemetry) — Metrics, OpenTelemetry, Prometheus

---

> For additional documentation and navigation, see: https://visionagents.ai/llms.txt