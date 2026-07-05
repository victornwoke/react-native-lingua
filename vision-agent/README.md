# Lingua Vision Agent

Voice-only AI language teacher service for the Expo app.

## Environment

The service loads environment variables from the parent app `.env` first, then from `vision-agent/.env` if one exists.

Required variables:

- `STREAM_API_KEY`
- `STREAM_API_SECRET`
- `VISION_AGENT_SHARED_SECRET`
- `GEMINI_API_KEY` (or `GOOGLE_API_KEY`)

## Run Locally

```bash
uv sync
uv run agent.py run
```

For HTTP server mode:

```bash
uv run agent.py serve --host 0.0.0.0 --port 8080
```
