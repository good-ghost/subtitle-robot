# Subtitle Robot

**Subtitle Robot** watches your movie and TV folders, pulls the text subtitle tracks out of new MKV/MP4 files and writes a translated subtitle next to each video (`Movie (2020).ko.srt`). Korean is the default target language; you can change it in the settings.

It translates with an LLM. Before it translates, it reads the whole title and builds a glossary of names and proper nouns. That way **a character or place keeps the same spelling across an entire TV series**.

- **Watches folders.** It picks up new videos once copying has finished. It works alongside Sonarr, Radarr and download tools, and skips videos that already have a subtitle in the target language.
- **Keeps timing.** The number, order and timestamps of subtitle blocks never change. SRT, ASS and VTT sources are supported.
- **Leaves videos untouched.** Video files are only read. If an external subtitle with the same name already exists, it is renamed to `*.orig.srt`, not overwritten.
- **Web console** on port 8949, in Korean or English with light or dark themes:
  - dashboard
  - queue (retry, register a video)
  - completed list
  - logs
  - settings (provider, model, API keys, account)
- **LLM providers:** Google Gemini (default), NVIDIA NIM, a local llama.cpp `llama-server`, Ollama, OpenRouter, OpenAI and Anthropic Claude. Claude and ChatGPT **subscription accounts** can be used through their official CLIs.

Current version: **0.8.2**

## Image tags

Only the `latest` image is distributed (258 MB). It contains the app, the web console, mkvtoolnix and ffmpeg, and translates with API keys (NIM, OpenAI, Claude, Gemini, OpenRouter), llama-server or Ollama.

To use a **Claude or ChatGPT subscription**, build an image with the subscription CLI from the source (https://github.com/good-ghost/subtitle-robot). Each CLI goes in its own tag because the CLI binaries are large.

```bash
git clone https://github.com/good-ghost/subtitle-robot.git && cd subtitle-robot
scripts/build-images.sh claude     # Claude subscription (Claude Code, 507 MB). ChatGPT subscription: codex (767 MB)
# Docker: CONTAINER_ENGINE=docker scripts/build-images.sh claude
```

The built image is `localhost/subtitle-robot:claude` (Podman) or `subtitle-robot:claude` (Docker). These tags also work with API keys.

## 1. Load the image

The image comes as a compressed archive. Load the `latest` archive:

```bash
sha256sum -c SHA256SUMS                                   # optional: check the downloads

podman load -i subtitle-robot-0.8.2-latest.tar.gz         # Podman
docker load -i subtitle-robot-0.8.2-latest.tar.gz         # Docker
# Loaded image: localhost/subtitle-robot:latest
```

The image name is `localhost/subtitle-robot:latest`. The examples below use that name.

## 2. Prepare folders and a config file

```bash
mkdir -p subtitle-robot/config subtitle-robot/data
cd subtitle-robot
```

Create `config/config.toml` with at least the folders to watch. Everything else can be changed later from the web console.

```toml
# config/config.toml
[[watch.paths]]
path = "/media/movies"
kind = "movie"      # movie | series | auto (series when the file name has S01E01)

[[watch.paths]]
path = "/media/tv"
kind = "series"
```

If there is no config file, the daemon still runs with defaults. However, nothing is watched and the Settings page is read-only.

### Volumes, port and environment

| Container path | Contents | Notes |
|---|---|---|
| `/media` | Your library. New videos are found here and translated subtitles are written next to them | Must be writable by the daemon user |
| `/data` | Queue and processing records (`state.db`), glossaries, logs, keys (`secrets.toml`, mode 600) | Keep it; it holds all state |
| `/config` | `config.toml` | Writable if you want to save from the web console |

| Setting | Default | Meaning |
|---|---|---|
| Port `8949` | | Web console |
| `PUID` / `PGID` | `1000` | User the daemon runs as. Match the owner of your media files |
| `TZ` | UTC | Time zone for logs and the queue, for example `Asia/Seoul`. The time zone in Settings → Web takes priority |

API keys are **not** read from environment variables. Enter them in the web console (step 4).

## 3. Run

### Podman (rootless)

`--userns=keep-id` runs the daemon as your own user, so subtitle files are owned by you. Do not set `PUID`/`PGID` in this case.

```bash
podman run -d --name subtitle-robot --userns=keep-id \
  --restart=always --stop-timeout 300 \
  -e TZ=Asia/Seoul -p 8949:8949 \
  -v /srv/media:/media \
  -v ./data:/data \
  -v ./config:/config \
  localhost/subtitle-robot:latest
```

### Docker

The container starts as root, gives `/data` to `PUID:PGID` and drops to that user. It does not change the ownership of your media.

```bash
docker run -d --name subtitle-robot \
  --restart unless-stopped --stop-timeout 300 \
  -e PUID=1000 -e PGID=1000 -e TZ=Asia/Seoul \
  -p 8949:8949 \
  --add-host host.docker.internal:host-gateway \
  -v /srv/media:/media \
  -v ./data:/data \
  -v ./config:/config \
  localhost/subtitle-robot:latest
```

### Compose (Docker Compose or `podman compose`)

```yaml
services:
  subtitle-robot:
    image: localhost/subtitle-robot:latest
    container_name: subtitle-robot
    restart: unless-stopped
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Asia/Seoul
    volumes:
      - /srv/media:/media
      - ./data:/data
      - ./config:/config
    ports:
      - "8949:8949"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    stop_grace_period: 5m
```

Notes:

- **Use a restart policy.** The **Apply (restart)** button in Settings ends the daemon and relies on the restart policy to bring it back.
- **Allow a long stop timeout.** On stop, the daemon finishes the LLM request in progress, which can take up to 300 s. The job then continues at the next start. If the container is killed sooner, nothing is lost; the job resumes from its checkpoint.
- **Healthcheck.** The image has a healthcheck (`subtitle-robot health`) based on the worker heartbeat.

## 4. First start

1. Open `http://<host>:8949`. On the first visit you create the **admin account** (user name and a password of at least 8 characters). Until it exists anyone can open that page, so create it right away.
2. Go to **Settings → Provider**, choose the provider and model. The default is Google Gemini (`gemini-3.5-flash`, 5 requests per minute), so leave it as is to use Gemini. **Model list** shows the models your key can use.
3. Go to **Settings → Keys** and enter the API key (only the last 4 characters are shown again).
4. Press **Save**, then **Apply (restart)**.

The log should then show `daemon started: 1 workers`. Without a key, the daemon shows only the web console and does not start translation workers.

New videos are processed automatically. To process a video now, use **Queue → Register video**. From the command line:

```bash
podman exec subtitle-robot subtitle-robot queue list       # or docker exec …
podman exec subtitle-robot subtitle-robot probe "/media/movies/Movie (2020)/Movie (2020).mkv"
```

## Provider sign-in

Only one provider is used at a time, and there is no fallback. Keys are stored in `/data/secrets.toml` and never written to logs.

| Provider | Image | How to authenticate |
|---|---|---|
| **Google Gemini** (default) | `latest` | API key from Google AI Studio (`AIza…`). Default model `gemini-3.5-flash`, 5 requests per minute |
| **NVIDIA NIM** | `latest` | API key (`nvapi-…`) from build.nvidia.com. Default model `deepseek-ai/deepseek-v4.1-flash`, limited to 30 requests per minute |
| **llama-server** (local llama.cpp) | `latest` | No key needed. Set the address in Settings, for example `http://host.docker.internal:8080/v1` (Docker) or `http://host.containers.internal:8080/v1` (Podman). If the server was started with `--api-key`, enter that key |
| **Ollama** | `latest` | No key. Set the address (for example `http://host.docker.internal:11434`) and the model |
| **OpenRouter** | `latest` | API key and model |
| **OpenAI** | `latest` | API key and model |
| **OpenAI – ChatGPT subscription** | self-built `codex` | Authentication: subscription. **Sign in** on the provider card shows a device code. Open the address in a browser, sign in to ChatGPT and enter the code (it expires after 15 min). Or paste `~/.codex/auth.json` from a PC where Codex is signed in. Type the model name Codex accepts |
| **Anthropic Claude** | `latest` | API key and model |
| **Claude subscription** | self-built `claude` | Authentication: subscription. On any PC with Claude Code and your Claude account, run `claude setup-token` and paste the token (valid for one year). Model `sonnet`, `opus`, `haiku` or a full model name |

Provider notes:

- **Subscriptions.** The daemon runs the official CLI for each request. It does not take the subscription token and call the API directly. Usage limits and terms are those of your account.
  - When a limit is reached, the queue pauses until it resets.
  - When a sign-in expires, sign in again and press Apply.
  - The **Authentication** field appears only in the image that contains that CLI.
- **Gemini free tier.**
  - Flash models allow roughly 10–15 requests per minute, 250k–1M tokens per minute and about 1,500 requests per day (they differ per model and Google changes them). The default **Requests per minute** of `5` stays below that.
  - When the daily limit is reached, the daemon recognises it and pauses the queue until the limit resets at midnight Pacific time, then continues. Linking billing raises the limits considerably.
  - Some models in the list are not available to new accounts (HTTP 404). Others can be temporarily overloaded (HTTP 503). If that happens, pick another model; `gemini-3.5-flash` worked in testing.
- **llama-server on the same host.** If it listens only on `127.0.0.1`, the container cannot reach it through `host.docker.internal`. In that case, either run the container with `--network host` and use `http://127.0.0.1:8080/v1`, or start llama-server with `--host 0.0.0.0 --api-key <key>`.
- **Original language (optional).** A TMDB key in **Settings → Keys** lets the daemon look up each title's original language and translate from that track. Without it, the English track is used, otherwise the first text track.

## Upgrading

Load the new archive and recreate the container with the same volumes. The queue, records, glossaries, keys and account are in `/data` and `/config` and are kept.

```bash
podman load -i subtitle-robot-<version>-latest.tar.gz
podman stop -t 300 subtitle-robot && podman rm subtitle-robot
podman run …                     # the same command as before
```

## What gets written

| File | When |
|---|---|
| `<video>.ko.srt` (target language) | The video has no subtitle in the target language |
| `<video>.en.srt`, `<video>.ja.ass`, … | Text subtitle tracks extracted from the video (`[media] extract_langs`) |
| `<video>.en.orig.srt` | An existing external subtitle that had the same name, kept by renaming |

Image-based subtitles (PGS, VobSub) are not extracted. Daemon messages, verdict reasons and errors are written in Korean, even in the English console.

## License

Subtitle Robot is MIT licensed. Third-party software in the images (Python packages, the web console bundle, Alpine packages and GPL/LGPL programs such as mkvtoolnix and ffmpeg, the subscription CLIs) keeps its own licenses. Claude Code in the self-built `claude` tag is proprietary software of Anthropic and is subject to Anthropic's terms.

<img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" alt="TMDB" height="14">

This program uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.
