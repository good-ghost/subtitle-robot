# Subtitle Robot

English | [한국어](README.md)

**Subtitle Robot** (`subtitle-robot`) is a Python CLI and watch daemon that translates subtitles. The source can be any language (English and Japanese have dedicated rules); the target language is Korean by default and can be changed in the settings. Before translating, it analyses the whole title to build a glossary of names and proper nouns, so that **the same character or term is written the same way across a whole TV series**. The LLM is one of Google Gemini (default), NVIDIA NIM, a local llama.cpp `llama-server`, Ollama, OpenRouter, OpenAI (ChatGPT) or Anthropic Claude.

The current version is 0.8.2. Main features:

- Single titles and TV series: a series-wide glossary, previous-episode summaries (`story_so_far`) and repeated-line memory (`phrases`)
- SRT, ASS and VTT input, style-preserving ASS output
- Subtitle-track extraction from videos (MKV, MP4) and automatic translation, a watch daemon for media folders and container operation
- Web console: dashboard, queue, completed list, logs, settings (provider, keys, admin account)
- Automatic source-language detection, configurable target language, source-track choice by the title's original language (TMDB)
- Seven LLM providers, plus Claude and ChatGPT subscription accounts (through the official CLIs)

## How it works

```text
SRT → normalise → [Pass 1] analyse names and proper nouns → glossary (glossary.yaml)
    → group into units → batches → [Pass 2] translate → validate and retry → split back into the original blocks → .<target>.srt + report.json
```

- **The SRT structure is kept.** The number, order and timestamps of blocks never change. The LLM only receives internal numbers and text, never timestamps.
- **The glossary decides the spelling.** Entity IDs (`E0001` …) are issued by the code, and once a spelling is chosen the pipeline does not change it (first wins). Spellings fixed by a person (`manual`) and official spellings (`official`) take priority over LLM suggestions.
- **Japanese names are transliterated deterministically.** The LLM only judges the kana reading; the code produces the Korean spelling of Japanese names (`common` by default: 타나카, `standard`: 다나카). Western names written in katakana (アンジェロ → 안젤로) keep the LLM suggestion fixed in the glossary.
- **Honorifics are handled separately.** The glossary holds only the bare name; honorifics such as さん, 様 and Mr. are added by a policy (`transliterate` by default: 상, 사마 / `translate`: 씨, 님 / `drop`).
- **Dedicated rules come first.** A Japanese source always uses the Japanese rules (kana readings, honorific splitting, speech style from the first-person pronoun); a Korean target always uses the Korean rules (Hangul transliteration, honorific table, particle correction). Languages without dedicated rules use common rules chosen by their script.
- **It does not stop.** Validation errors are retried and then a fallback is applied, marked `needs_review` in the report. After an interruption it resumes from the checkpoint.

## Installation

Python 3.13 and [uv](https://docs.astral.sh/uv/) are required.

```bash
uv sync                      # run from the repository for development: uv run subtitle-robot ...
uv tool install .            # or install the command: subtitle-robot ...
```

## Configuration

Without a configuration file, the Gemini defaults are used (`gemini-3.5-flash`, 5 requests per minute). To change them, copy [examples/config.example.toml](examples/config.example.toml), edit it and pass it with `--config` or the `SUBTITLE_ROBOT_CONFIG` environment variable.

| Provider (`llm.provider`) | Needs | Notes |
|---|---|---|
| Google Gemini (`gemini`, default) | AI Studio API key. Default model `gemini-3.5-flash`, 5 requests per minute | OpenAI-compatible endpoint. Gemini CLI sign-in for personal Google accounts ended on 2026-06-18, so it is not used as a subscription |
| NVIDIA NIM (`nim`) | API key. Default model `deepseek-ai/deepseek-v4.1-flash`, 30 RPM | |
| llama-server (`local`) | `base_url` of a server you start yourself; its key if started with `--api-key` | Uses `/props` and `/tokenize` for context and token counts |
| Ollama (`ollama`) | Server address (default `http://127.0.0.1:11434`), model | Native `/api/chat`. Sends `context_tokens` (default 8192) as `num_ctx`. For thinking models use `extra_body = { think = false }` |
| OpenRouter (`openrouter`) | API key, model | If the model does not accept json_schema, use `response_format = "json_object"` |
| OpenAI (`openai`) | API key or ChatGPT subscription (Codex CLI), model | Sends `max_completion_tokens`; `temperature` is not sent unless set (reasoning models) |
| Anthropic Claude (`claude`) | API key or Claude subscription (Claude Code CLI), model | Messages API. The output schema is given as a tool and that tool call is forced to get JSON |

- **Gemini free-tier limits**: Flash models allow roughly 10–15 requests per minute, 250k–1M tokens per minute and about 1,500 requests per day (they differ per model and Google changes them; see the usage page in AI Studio). The default of 5 requests per minute stays below that. When the daily limit is reached, the daemon recognises it and pauses the queue until the limit resets at midnight Pacific time, then continues (job attempts are not used up). Linking billing raises the limits considerably
- Keys (providers, TMDB) are entered in the **Keys** tab of the web Settings. They are stored in `secrets.toml` in the data folder (mode 600) and only the last 4 characters are shown. **Keys in environment variables are not read**. Only one provider is used and there is no fallback; to change it, edit the settings and restart.
- If you use only the CLI without the web console, create `secrets.toml` yourself in the data folder (`--data` → `SUBTITLE_ROBOT_DATA` → `/data`) and `chmod 600` it:

  ```toml
  [providers.gemini]
  api_key = "AIza..."

  [tmdb]
  api_key = "..."
  ```

- Providers other than Gemini, NIM and llama-server have no default model. Set `[providers.<name>] model`, or pick one with "Model list" in the web Settings. Address and timeout have defaults.
- Time zone: `[system] timezone` (an IANA name such as `Asia/Seoul`) is used for log and queue times. If empty, the `TZ` environment variable is used (search and pick it in the Web tab of Settings).
- Changing the provider makes resumed translations count as "settings changed" (`--redo-stale` / `--accept-stale`).
- Check a provider: `uv run python scripts/llm_smoke.py --data ./data --provider claude --model <model>` (one short structured-output request).

### Subscription accounts (Claude, ChatGPT)

A step-by-step setup guide (image tags, sign-in, troubleshooting) is in [guide/HowToCloud.md](guide/HowToCloud.md) (Korean).

`claude` and `openai` can use a subscription account instead of an API key (`[providers.<name>] auth = "subscription"`, or "Authentication" on the provider card in Settings). The subscription token is never used to call the company API directly; each company's official CLI is run non-interactively for every request. The CLIs are only in the provider-specific image tags (`claude`, `codex`), not in `latest` (see "Image tags"). If you install it yourself, `claude` or `codex` must be on the PATH. The "Authentication" field in Settings appears only in an image that contains that provider's CLI (in `latest` both providers are used with API keys). If a configuration saved with a subscription is started in an image without the CLI, the provider card in Settings and the start-up log name the tag you need.

| Provider | CLI | Sign-in (Settings provider card → Sign in) | Model |
|---|---|---|---|
| `claude` | Claude Code | Run `claude setup-token` on a PC with a Claude subscription and paste the token (valid for one year) | Aliases `sonnet`, `opus`, `haiku`, `fable` or a full name |
| `openai` | Codex | **Sign in with device code**: open the address shown in a browser, sign in to ChatGPT and enter the code. Or paste `~/.codex/auth.json` from a PC where Codex is signed in | Type a model name Codex accepts |

- The CLI uses `subscriptions/<provider>/` in the data folder as its HOME (mode 700), and other key environment variables of the daemon are not passed to it (so it does not switch to API billing). Built-in tools and MCP are off, and the result comes back through an output schema.
- If the sign-in expires or is rejected, the queue pauses; sign in again and restart to continue. If a usage limit is hit, the queue pauses until the limit resets (15 minutes if the reset time is unknown). Limits and terms are those of your account.
- A changed sign-in takes effect after Apply (restart). A daemon started without a sign-in shows only the web console and does not start translation workers.

The target language is set with `[translation] target_language` (ISO 639-1, default `ko`) and can be changed per command with `--target` (`subtitle-robot --target en translate …`). The source is set with `--src` (ISO 639-1 code or English name, default `auto`). `auto` detects the language from the script (Hangul, kana, Han, Cyrillic, Greek, Arabic, Hebrew, Thai, Devanagari) and from function words for Latin-script languages, and assumes English when unsure.

## Single title

```bash
# Keys: secrets.toml in the data folder (Keys tab of the web Settings, or the format above)
subtitle-robot translate movie.ja.srt            # → movie.ko.srt
subtitle-robot translate movie.ja.ass            # → movie.ko.ass (styles and positions kept)
subtitle-robot translate film.fr.srt             # French → film.ko.srt (source detected)
subtitle-robot --target en translate movie.ja.srt   # → movie.en.srt
subtitle-robot analyze movie.en.srt              # build the glossary only
subtitle-robot translate movie.srt --src en -o out.srt --work-dir ./work
```

Input can be SRT, ASS, SSA or WebVTT. ASS input produces a `.ko.ass` in which only the Text of translated dialogue lines is replaced: [Script Info], styles, times, positions, leading override tags and untranslated lines (comments, lines not in the source language) stay as they were. Change the output format with `--format auto|srt|ass` (auto follows the `-o` extension, otherwise the input format). If the original font is Japanese-only, Hangul may fall back to another font; the report says so, and `--ass-font "Noto Sans CJK KR"` changes the style font. Song lines (OP, ED, karaoke) follow the `lyrics` policy.

The work folder (default `.subtitle-robot/<name>/` next to the input, or `<name>-<target>/` for a target other than Korean) holds the glossary, the checkpoint and `report.json`. Running the same command again reuses translated parts without LLM requests. If the model, prompt or settings changed, it stops with exit code 3 and shows the difference; then pass `--redo-stale` (translate again) or `--accept-stale` (keep the previous translation).

## Series

A series is a folder of episode subtitle files that share one master glossary.

```bash
subtitle-robot series init ./MySeries --src ja        # create series.toml and glossary.yaml, find episodes
subtitle-robot series translate ./MySeries            # analyse → translate (out/S01E01.ko.srt …)
subtitle-robot series review ./MySeries               # show the review queue
subtitle-robot series lint ./MySeries                 # check spelling consistency across episodes
```

```text
MySeries/
├── series.toml        series settings (languages, mode, spelling style, honorifics, review)
├── glossary.yaml      master glossary
├── *.srt              episode sources (subfolders are searched too)
├── out/               translations S01E01.ko.srt …
└── work/              per-episode work folders, series_state.json (review queue), index.json (occurrence index)
```

**Episode detection**: reads `S01E01`, `1x01`, `E01`/`EP01`, `第1話` and fansub names (`Show - 01 (`, `Show_-_01_(`) in file names. Files that are not recognised are listed under `[[episodes]]` in `series.toml` with `id` and `file`.

**Modes** (`mode` in `series.toml`):

| Mode | Flow | Use |
|---|---|---|
| `prescan` (default) | analyse all episodes → global reconcile → translate all episodes | finished seasons |
| `incremental` | analyse → translate per episode | series still airing |

`--episodes S01E01-S01E06` limits the range. Episodes already analysed or translated are not requested again.

**Review**: by default (`review = false`) it runs automatically and leaves conflicts, low-confidence readings and entries that look like the same entity (reconcile) in the review queue as suggestions. With `review = true`, episodes containing a new entry are not translated until the entry is confirmed.

```bash
subtitle-robot series review ./MySeries --set E0007=다나카     # change the spelling (locked; the old spelling goes to avoid)
subtitle-robot series review ./MySeries --accept E0003        # confirm the current spelling
subtitle-robot series review ./MySeries --promote E0012       # make it a series-wide main character (scope series)
subtitle-robot series review ./MySeries --dismiss E0010       # close the suggestion only
subtitle-robot series review ./MySeries --accept-all
```

**Partial retranslation**: changing a spelling raises the entity's rev. In episodes already translated, only the units using changed entities are translated again.

```bash
subtitle-robot series retranslate ./MySeries --changed          # units of entities whose rev changed
subtitle-robot series retranslate ./MySeries --entity E0007     # units of this entity even if the spelling did not change
```

**Official names**: import names from an official release as CSV ([examples/official.example.csv](examples/official.example.csv), required columns `source`, `ko`). Spellings fixed by a person are not overwritten.

```bash
subtitle-robot glossary import ./MySeries official.csv
```

**Character relations**: forms of address and speech styles (`해요체`, `해체`, …) between characters in `relations` of `glossary.yaml` are added to batches where both characters appear. See [examples/glossary.example.yaml](examples/glossary.example.yaml).

**Previous-episode summary (`story_so_far`, off by default)**: with `[story] enabled = true` in `series.toml`, a Korean summary of each episode is made from the source right after analysis (`work/<episode>/summary.json`), and the summaries of the previous two episodes are added as context when translating (`episodes`, `max_tokens`). It is off by default because a summary made from subtitles without speaker names can get relationships wrong. Editing a summary makes the parts translated with it targets of `retranslate --changed`.

**Repeated lines (`phrases`)**: the first translation of short lines repeated across episodes (greetings, catchphrases) is collected in `phrases.yaml` and added as a reference to batches containing that line (`[phrases]`). `series lint` warns when a confirmed translation is not used.

```bash
subtitle-robot series review ./MySeries --phrases                   # list repeated lines
subtitle-robot series review ./MySeries --phrase-set P0001=잘 먹겠습니다   # change and confirm a translation
subtitle-robot series review ./MySeries --phrase-accept P0002       # confirm the current translation
```

Episode files can be SRT, ASS, SSA or VTT. An ASS episode produces `out/S01E01.ko.ass` (`exclude_styles` and `font` in `[ass]`).

Each target language has its own glossary, repeated lines and work folder: for Korean `glossary.yaml`, `phrases.yaml`, `work/`; for other targets `glossary.<lang>.yaml`, `phrases.<lang>.yaml`, `work-<lang>/`, with output `out/S01E01.<lang>.srt`. Translating one workspace into several target languages keeps them apart. Spelling fields in glossary entries are `target`, `target_source` and `title_target`.

## Videos (MKV, MP4)

Text subtitle tracks of a video are extracted as sidecars, and if there is no subtitle in the target language, a translation `<video name>.<target>.srt` (default `.ko.srt`) is written next to it. `mkvtoolnix` (mkvmerge, mkvextract) and `ffmpeg` (ffprobe) are required. Video files are only read.

```bash
subtitle-robot probe "Movie (2020).mkv"                 # tracks, external subtitles, processing record
subtitle-robot media "Movie (2020).mkv" --foreground    # process now
subtitle-robot media /media/tv/Show --recursive         # add to the queue (the watch daemon processes it)
subtitle-robot media "Movie (2020).mkv" --force         # again, even with a record or external subtitles
subtitle-robot media revert "Movie (2020).mkv"          # delete subtitles made by the tool, restore renamed ones
```

- **Extraction**: text tracks in `[media] extract_langs` (default en, ja, ko), the target-language, original-language and English tracks, and the first source candidate are extracted as sidecars (`Movie.en.srt`, `Movie.en.2.srt`, `Movie.en.forced.srt`, `Movie.en.sdh.srt`, `Movie.ja.ass`). Image subtitles (PGS, VobSub) are not extracted.
- **Whether to translate**: nothing is translated if there is an embedded track in the target language, an external `*.<target>.*` subtitle (`fr`, `fre`, `fra` and `french` all count), or an external subtitle without a language tag whose content is in the target language (`has_target`).
- **Source track**: the text track in the title's original language (TMDB original language) → if there is none (including when the original language is unknown), the **English** track → if there is none either, the first text track in container order (target language, forced and Signs/Songs tracks excluded). English comes before the first track because multi-language releases often start with, for example, an Arabic track. The verdict reason records why the track was chosen (original-language, English or first track) and the original language.
- **Original language (TMDB)**: used when a TMDB key (v3 API key or v4 read token, Keys tab in Settings) is set. IDs in file or folder names (`{tmdb-123}`, `{tvdb-123}`, `{imdb-tt123}`, the Plex/Jellyfin naming) come first; otherwise it searches by title and year. A movie inside a `Title (Year)` folder (Radarr/Plex naming) is searched by the folder name; otherwise the file name is used up to the year, resolution or release tags (`Godzilla.vs.Kong-2021-1080p…` → Godzilla vs Kong, 2021). Results are kept in `/data/tmdb-cache.json`; titles not found are asked again after a day. Without a key, or if the lookup fails, the original language counts as unknown: the English track is used, otherwise the first text track (`[tmdb]`).
- **Existing external subtitles**: a file with the same name is not overwritten; it is kept by renaming it to `Movie.en.orig.srt` (`[sidecar]`).
- **Series**: if the file name has `S01E02` or similar, a `/data/series/<title>/` workspace is created and the series glossary is used. The title is the name of the folder above the season folder. Season folders are recognised with bracketed tags removed (`Season 01`, `SEASON 02 [Group]`, `Season 1 (BD)`); if the folder above is the watch path, the start of the file name is used (`[Group] Show - S02E01 …` → Show).
- **Output format**: translations are `.<target>.srt` by default (media-server compatible). With `[media] output_format = "ass"`, ASS tracks give a style-preserving `.<target>.ass`; `"both"` writes both.
- **Changing the target language**: applies to videos processed from then on. Videos already processed are translated again after "Process again" in the Completed List (or `ledger forget`).
- **Processing record (ledger)**: processed videos are not looked at again. When Radarr or Sonarr moves or renames a video, it is recognised by its content and only the sidecars are restored.

```bash
subtitle-robot queue list | retry [job] | clear-failed
subtitle-robot ledger list | show <file> | forget <file> | export [file] | import <file>
```

The data folder (state.db, workspaces, backups) is `--data` → `SUBTITLE_ROBOT_DATA` → `/data`. When a job finishes, the video's extracted tracks (`extract/`) and the movie work files (checkpoint, normalised source, translated copy) are deleted; glossaries, reports and the series records (`work/`, `out/`, `episodes/`, read again by repeated-line collection and consistency checks) are kept. Files of failed jobs are kept for diagnosis.

## Watch daemon and container

`subtitle-robot watch` detects new videos in `[[watch.paths]]` and processes them. It waits until copying has finished (`stable_seconds`), and the library present at the first start is processed in order as a backlog (videos with external subtitles are skipped). If a season pack arrives within `series_window`, all episodes are analysed first and then translated.

The image works with both Podman and Docker. Podman ignores HEALTHCHECK in the OCI format, so build in the docker format.

```bash
scripts/build-images.sh latest     # choose an image tag (table below); same as podman build --format docker -t subtitle-robot:latest .
mkdir -p config data && cp examples/config.example.toml config/config.toml
podman compose up -d              # compose.yaml: /media, ./data, ./config volumes
# In the web console (http://<host>:8949), create the admin account, fill in Settings → Keys (or a subscription sign-in), then Apply (restart)
podman exec subtitle-robot subtitle-robot queue list
```

### Image tags

Every tag contains the Python package, mkvtoolnix, ffmpeg and the web console; each subscription CLI goes into its own tag because the CLI binaries are large (measured 2026-10-04). Only the `latest` image is distributed; build `claude` and `codex` from this repository (Docker works too: `CONTAINER_ENGINE=docker scripts/build-images.sh claude`).

| Tag | Dockerfile | Providers | Extra contents | Size |
|---|---|---|---|---|
| `latest` | `Dockerfile` | API keys (NIM, OpenAI, Claude, Gemini, OpenRouter), llama-server, Ollama | none | 258 MB |
| `claude` | `Dockerfile.claude` | Claude subscription (`[providers.claude] auth = "subscription"`) | Claude Code (no Node) | 507 MB |
| `codex` | `Dockerfile.codex` | ChatGPT subscription (`[providers.openai] auth = "subscription"`) | Codex + Node | 767 MB |

```bash
scripts/build-images.sh                # all three tags
scripts/build-images.sh latest claude  # selected tags only
# By hand: podman build --format docker -t subtitle-robot:latest . then -f Dockerfile.claude|.codex -t subtitle-robot:<tag> .
# Pin a CLI version: BUILD_ARGS="--build-arg CLAUDE_CODE_VERSION=2.1.289" scripts/build-images.sh claude
```

- `Dockerfile` builds `latest`; `Dockerfile.claude` and `Dockerfile.codex` add only the CLI layer on top of `latest` (change the base with `--build-arg BASE_IMAGE=…`). The script builds `latest` first when a CLI tag is requested.
- When you switch a provider to a subscription, run the image with that provider's tag (data and config volumes stay the same).
- The daemon runs as the `PUID`/`PGID` user (default 1000). Only `/data` is chowned to that user; media volumes are not touched. That user must be able to write to media folders to create sidecars.
- `subtitle-robot` started with `exec` also drops to the same user (so no root-owned files appear in `/data`).
- The healthcheck looks at the worker heartbeat (`subtitle-robot health`).
- The time zone from the Web tab of Settings (`[system] timezone`) comes first; if empty, the `TZ` environment variable (compose default `Asia/Seoul`). With neither, `queue list` times and logs are in UTC.
- Extraction reads the whole video because subtitle blocks are spread over the file. If the disk is shared with a download tool (SABnzbd etc.), the server slows down, so probing and extraction tools run at low priority (`ionice -c3`, `nice 19`, `[media] tool_priority = "low"` by default). I/O priority only works when the disk scheduler handles it (mq-deadline, BFQ). To protect the whole server, add resource limits to the container (with rootful Quadlet: `CPUQuota`, `MemoryMax`, `IOReadBandwidthMax` in `[Service]`).
- Files in folders that a download tool is still unpacking (`[watch] exclude_dirs`, default `_UNPACK_*`, `_FAILED_*`) are not watched. If the library is large at the first start, set `[watch] scan_existing = false` and register it in parts.
- On stop (`podman stop`), the LLM request in progress is finished and the daemon stops (running probe and extract tools are ended at once); the job continues at the next start. A request can take up to 300 s (default timeout of the cloud providers), so use `podman stop -t 300` (`podman run --stop-timeout 300`, `stop_grace_period: 5m` in compose). With the default 10 s it is killed, but the result is the same because it resumes from the checkpoint.
- A new episode in a series folder waits `[media] series_window` (default 600 s) for other episodes of the same title and is processed with them. While waiting, `queue list` shows `대기 HH:MM:SS까지` (waiting until HH:MM:SS; CLI output is in Korean).
- llama-server is not part of compose; start it separately. Two ways to use it on the same host:
  - If llama-server listens only on `127.0.0.1`, the container cannot reach it through `host.docker.internal` or `host.containers.internal` (confirmed with rootless Podman). Run the container on the host network (`--network host`, `network_mode: host` in compose) with `base_url = "http://127.0.0.1:8080/v1"`.
  - Or start llama-server with `--host 0.0.0.0 --api-key <key>` and use `base_url = "http://host.docker.internal:8080/v1"`, with the key as the llama-server key in the Keys tab.

## Web console

The watch daemon (`watch`) also serves a web console (default port 8949, `[web] enabled`). On the first visit, like Sonarr and Radarr, a **first-run setup** page asks you to create the admin account (user name and a password of at least 8 characters). Until the account exists anyone can open that page, so create it right after starting. The daemon shows the web console even without a provider key (translation workers start after you add the key and restart).

| Menu | Contents |
|---|---|
| Dashboard | Daemon (heartbeat) and provider status, counts of queued, failed and recorded jobs, target language, whether the original-language lookup is used, watch paths |
| Queue List | Queued, running and failed jobs; retry and clear failed; **Register video** (a file or folder inside a watch path) |
| Completed List | Processing records (verdict, reason, output files), details, process again (forget the record) |
| Logs | Daemon log (`/data/logs/daemon.log`, 5 MB × 3 rotated), level filter, auto refresh |
| Settings | Edit and save `config.toml` (comments kept); settings of the chosen provider among seven, pick from the **model list**, **authentication** (API key or subscription) and subscription sign-in; **Translation** tab: target language (searchable), TMDB on/off; **Web** tab: time zone (searchable); **Keys** tab (provider and TMDB keys, only the last 4 characters shown); **Account** tab (change user name and password); **Apply** (restart the daemon) |

- Sign-in uses the user name and password created in the first-run setup (stored as a scrypt hash in `secrets.toml`). The session is a signed HttpOnly cookie kept for `[web] session_hours` (default 168 hours). Changing the password in the Account tab ends all sessions. If you forget the password, delete the `[account]` table in `secrets.toml` in the data folder and run the first-run setup again.
- The console is available in Korean and English with light and dark themes, switched below the menu (stored in the browser).
- To save from Settings, mount the config volume writable (read-only with `:ro`). Settings are read at start, so press **Apply** to restart the daemon. The daemon exits with code 4 and the container restart policy brings it back (`restart: unless-stopped` in compose, `podman run --restart=always`, Quadlet `Restart=always`). Without a restart policy it does not come back.
- HTTPS is left to a reverse proxy (the session cookie has no `Secure` flag, so sign-in works over HTTP on a LAN).
- Verdict reasons, job errors and log messages are Korean sentences written by the daemon, so they stay Korean in the English console.

compose runs it with `ports: ["8949:8949"]` and a writable config volume. With Podman directly (rootless, as the owner of the media files):

```bash
podman run -d --name subtitle-robot --userns=keep-id --restart=always --stop-timeout 300 \
  -e TZ=Asia/Seoul -p 8949:8949 \
  -v /srv/media:/media -v ./data:/data -v ./config:/config \
  subtitle-robot:latest
```

- With rootless Podman, use `--userns=keep-id` instead of `PUID`/`PGID` to run as the same user as the host account (subtitle and config files are owned by that account).
- `--restart=always` brings the daemon back after Apply, but not after a host reboot. To start after a reboot, use a systemd Quadlet (`~/.config/containers/systemd/subtitle-robot.container` with `PublishPort=8949:8949`, `Restart=always`, and `loginctl enable-linger`).
- If the host's inotify watch limit (`fs.inotify.max_user_watches`) is used up by other programs, watching falls back to polling automatically (log `inotify unavailable … falling back to polling`). Polling scans periodically, so detection is a little slower. Raise the limit or use `[watch] polling = true` from the start.

### Deployment example: rootful Quadlet, pod, reverse proxy

A setup used on a server shared with other media containers (Sonarr, Radarr, Bazarr, download tools), 2026-10-04, Debian 13 and Podman 5.4.

```ini
# /etc/containers/systemd/subtitle-robot.container
[Unit]
Description=Subtitle Robot (scanner pod)
After=network-online.target

[Container]
Image=localhost/subtitle-robot:latest
ContainerName=subtitle-robot
# Same pod as Sonarr etc. No published port; the reverse proxy forwards to it
Pod=scanner.pod
Environment=PUID=1000
Environment=PGID=1000
Environment=TZ=Asia/Seoul
Volume=/srv/data1/podman/subtitle-robot/data:/data
Volume=/srv/data1/podman/subtitle-robot/config:/config
# Sonarr and Radarr library (/media/tv, /media/movie)
Volume=/srv/data2/scanner:/media
PidsLimit=512
StopTimeout=300

[Service]
Restart=always
TimeoutStopSec=330
# Share resources with the other services; cap read bandwidth so extraction does not monopolise the media disk
MemoryMax=1G
CPUQuota=100%
CPUWeight=50
IOReadBandwidthMax=/srv/data2 40M

[Install]
WantedBy=multi-user.target
```

- Keep data and config on a different disk from the media; the media disk is often shared with download tools.
- Serve it under a sub-path through the reverse proxy (Caddy). The console uses only relative paths, so strip the prefix (there is no URL Base setting as in Sonarr):

  ```caddy
  redir /subtitle-robot /subtitle-robot/ 308
  handle_path /subtitle-robot/* {
      reverse_proxy scanner:8949
  }
  ```

- If Bazarr manages the same library, `[sidecar] on_conflict = "skip"` (do not write when a subtitle with the same name exists) is recommended.
- The memory limit also counts the file cache from reading videos. The processes themselves use about 60 MB; at the limit only this container's cache is dropped.
- If `localhost` resolves to IPv6 (`::1`) on the host and connections through rootless Podman ports (pasta) are dropped, set `[web] host = ""` (both IPv4 and IPv6).

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Run failed: LLM error, episodes not translated because of pending review, `series lint` errors |
| 2 | Configuration or input error (config file, encoding or language detection failure, missing `series.toml`, invalid arguments) |
| 3 | Stopped resuming because settings changed (`--redo-stale` / `--accept-stale`) |
| 4 | `watch`: ended by Apply (restart) in the web console (the restart policy brings it back) |

## Limitations

- In ASS output, override tags in the middle of a line (`{\i1}…{\i0}`) are not preserved (tags at the start of a line are). In SRT, only ASS override tags at the start of a line are preserved.
- Blocks not in the source language (for example Chinese notes in Japanese subtitles) are left untranslated.
- Speech recognition and OCR of image subtitles are out of scope.

## Documents

The documents below are in Korean.

| Document | Contents |
|---|---|
| `guide/HowToCloud.md` | Cloud LLM account setup (Claude and ChatGPT subscriptions, Gemini API key) |
| `guide/OVERVIEW.md` | Container image introduction and how to run it (Docker Hub overview; English: `OVERVIEW.en.md`) |

## License

[MIT](LICENSE). Third-party software distributed with it (Python packages, the web console bundle, the Alpine packages, mkvtoolnix and ffmpeg in the images, the subscription CLIs) keeps its own licenses: [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

<img src="web/src/assets/tmdb-logo.svg" alt="TMDB" height="14">

This program uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.

## Development

```bash
uv sync
uv run ruff check && uv run ruff format --check
uv run mypy
uv run pytest
uv run python scripts/llm_smoke.py      # one real request to a provider (needs a key or server)
```

The web console (`web/`, Vue 3 + Vite + TypeScript) uses the built distribution of the UI framework vue-smartview (`web/vendor/vue-smartview/dist`). Its source repository is not public; only a build with the elements the console uses is kept here. Using a new element needs the source repository (`scripts/update-smartview.sh <source checkout>`). Only the elements used go into the bundle: when the console uses a new `smartview-*` element, add its entry import to `web/src/elements.ts` (`npm test` finds missing ones).

```bash
cd web && npm ci
npm run typecheck && npm run lint && npm test && npm run build   # output in web/dist (set with [web] static_dir)
npm run dev        # dev server: forwards /api to the daemon at http://127.0.0.1:8949 (SUBTITLE_ROBOT_WEB_URL)
npm run test:e2e   # build + Playwright E2E and recordings (starts the daemon with fresh data). Results in docs/e2e/; still frames: bash e2e/check-freeze.sh (host)
```

Tests use a fake LLM adapter and run without the network.
