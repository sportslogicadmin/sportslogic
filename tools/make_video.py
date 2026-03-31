#!/usr/bin/env python3
"""
SportsLogic TikTok Video Generator — Scene-Based

Usage:
    python make_video.py script.json
    python make_video.py script.json --output my_video.mp4

Requires:
    pip install requests pillow
    brew install ffmpeg-full
"""

import argparse
import base64
import json
import math
import os
import subprocess
import sys
from pathlib import Path

import requests

# ──────────────────────────────────────────────
# CONFIGURATION
# ──────────────────────────────────────────────
# Load .env file from project root
_env_path = Path(__file__).parent.parent / ".env"
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
DEFAULT_VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID", "")
MODEL_ID = "eleven_multilingual_v2"

TOOLS_DIR = Path(__file__).parent
PROJECT_DIR = TOOLS_DIR.parent
LOGO_PATH = PROJECT_DIR / "public" / "logo.png"
OUTPUT_DIR = TOOLS_DIR / "output"
FRAMES_DIR = TOOLS_DIR / "frames"

WIDTH = 1080
HEIGHT = 1920
BG_COLOR = (12, 14, 20)  # #0C0E14
DOT_COLOR = (26, 31, 43)  # #1A1F2B
ACCENT = (0, 232, 123)    # #00E87B

# Subtitle timing
PRE_BUFFER = 0.05
POST_BUFFER = 0.15
SENTENCE_PAUSE = 0.4


def hex_to_rgb(h: str) -> tuple:
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def get_font(size: int, bold: bool = False):
    """Load Inter font, fall back to default."""
    from PIL import ImageFont
    # Try common paths for Inter
    for path in [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    # Try Inter from google fonts cache or system
    for path in [
        os.path.expanduser("~/Library/Fonts/Inter-Bold.ttf") if bold else os.path.expanduser("~/Library/Fonts/Inter-Regular.ttf"),
        os.path.expanduser("~/Library/Fonts/Inter-SemiBold.ttf"),
    ]:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def draw_dot_grid(draw):
    for x in range(0, WIDTH, 24):
        for y in range(0, HEIGHT, 24):
            draw.point((x, y), fill=DOT_COLOR)


def generate_hook_frame(text: str, path: Path):
    """Big text centered, green accent, SportsLogic brand feel."""
    from PIL import Image, ImageDraw, ImageFilter

    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    draw_dot_grid(draw)

    # Green glow behind text
    glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse(
        [WIDTH//2 - 200, HEIGHT//2 - 200, WIDTH//2 + 200, HEIGHT//2 + 200],
        fill=(0, 232, 123, 25),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=100))
    img.paste(Image.alpha_composite(Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0)), glow).convert("RGB"),
              (0, 0))
    # Redraw dots on top (they get covered by paste)
    draw = ImageDraw.Draw(img)

    font = get_font(96, bold=True)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (WIDTH - tw) // 2
    y = (HEIGHT - th) // 2 - 40

    # Black outline
    for dx in range(-4, 5):
        for dy in range(-4, 5):
            if dx*dx + dy*dy <= 16:
                draw.text((x+dx, y+dy), text, font=font, fill=(0, 0, 0))
    draw.text((x, y), text, font=font, fill=(255, 255, 255))

    img.save(path)


def generate_team_frame(name: str, grade: str, colors: list[str], path: Path):
    """Team name in large text with team color accents and grade badge."""
    from PIL import Image, ImageDraw, ImageFilter

    primary = hex_to_rgb(colors[0])
    secondary = hex_to_rgb(colors[1]) if len(colors) > 1 else primary

    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    draw_dot_grid(draw)

    # Color glow behind team name
    glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse(
        [WIDTH//2 - 300, HEIGHT//2 - 250, WIDTH//2 + 300, HEIGHT//2 + 100],
        fill=(*primary, 20),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=100))
    img.paste(Image.alpha_composite(Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0)), glow).convert("RGB"),
              (0, 0))
    draw = ImageDraw.Draw(img)

    # Team name — big and bold
    name_font = get_font(108, bold=True)
    bbox = draw.textbbox((0, 0), name, font=name_font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    nx = (WIDTH - tw) // 2
    ny = HEIGHT // 2 - th - 30

    # Black outline
    for dx in range(-4, 5):
        for dy in range(-4, 5):
            if dx*dx + dy*dy <= 16:
                draw.text((nx+dx, ny+dy), name, font=name_font, fill=(0, 0, 0))
    draw.text((nx, ny), name, font=name_font, fill=primary)

    # Colored accent bar under team name
    bar_y = ny + th + 20
    bar_w = min(tw, 600)
    bar_x = (WIDTH - bar_w) // 2
    draw.rectangle([bar_x, bar_y, bar_x + bar_w, bar_y + 4], fill=primary)

    # Grade badge
    grade_font = get_font(80, bold=True)
    gbbox = draw.textbbox((0, 0), grade, font=grade_font)
    gw, gh = gbbox[2] - gbbox[0], gbbox[3] - gbbox[1]
    gx = (WIDTH - gw) // 2
    gy = bar_y + 50

    # Grade color based on letter
    first = grade[0].upper()
    if first == "A":
        grade_color = ACCENT
    elif first == "B":
        grade_color = (0, 200, 120)
    elif first == "C":
        grade_color = (234, 179, 8)
    else:
        grade_color = (239, 68, 68)

    draw.text((gx, gy), grade, font=grade_font, fill=grade_color)

    # "GRADE" label above grade
    label_font = get_font(20, bold=True)
    lbbox = draw.textbbox((0, 0), "GRADE", font=label_font)
    lw = lbbox[2] - lbbox[0]
    draw.text(((WIDTH - lw) // 2, gy - 32), "GRADE", font=label_font, fill=(79, 84, 104))

    # SportsLogic logo small in top right
    if LOGO_PATH.exists():
        logo = Image.open(LOGO_PATH).convert("RGBA")
        logo_h = 48
        logo_scale = logo_h / logo.height
        logo = logo.resize((int(logo.width * logo_scale), logo_h), Image.LANCZOS)
        img.paste(logo, (WIDTH - logo.width - 40, 40), logo)

    img.save(path)


def generate_logo_frame(path: Path):
    """SportsLogic logo centered with green glow — intro/outro frame."""
    from PIL import Image, ImageDraw, ImageFilter

    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    draw_dot_grid(draw)

    if LOGO_PATH.exists():
        logo = Image.open(LOGO_PATH).convert("RGBA")
        scale = 320 / logo.width
        logo = logo.resize((int(logo.width * scale), int(logo.height * scale)), Image.LANCZOS)

        # Green glow
        glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow)
        cx, cy = WIDTH // 2, int(HEIGHT * 0.40)
        glow_draw.ellipse([cx-200, cy-200, cx+200, cy+200], fill=(0, 232, 123, 30))
        glow = glow.filter(ImageFilter.GaussianBlur(radius=80))
        img.paste(Image.alpha_composite(
            Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0)), glow
        ).convert("RGB"), (0, 0))

        draw = ImageDraw.Draw(img)
        x = (WIDTH - logo.width) // 2
        y = int(HEIGHT * 0.40) - logo.height // 2
        img.paste(logo, (x, y), logo)

    # "sportslogic.ai" text below
    font = get_font(36, bold=True)
    text = "SPORTSLOGIC.AI"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    draw.text(((WIDTH - tw) // 2, int(HEIGHT * 0.40) + 200), text, font=font, fill=(226, 228, 234))

    # Tagline
    tag_font = get_font(18, bold=False)
    tag = "GRADE ANY BET IN SECONDS"
    tbbox = draw.textbbox((0, 0), tag, font=tag_font)
    ttw = tbbox[2] - tbbox[0]
    draw.text(((WIDTH - ttw) // 2, int(HEIGHT * 0.40) + 250), tag, font=tag_font, fill=(79, 84, 104))

    img.save(path)


def generate_cta_frame(text: str, path: Path):
    """CTA frame — big text with green accent."""
    from PIL import Image, ImageDraw, ImageFilter

    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    draw_dot_grid(draw)

    # Green glow
    glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([WIDTH//2-250, HEIGHT//2-200, WIDTH//2+250, HEIGHT//2+100], fill=(0, 232, 123, 20))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=100))
    img.paste(Image.alpha_composite(Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0)), glow).convert("RGB"), (0, 0))
    draw = ImageDraw.Draw(img)

    # Logo small above
    if LOGO_PATH.exists():
        logo = Image.open(LOGO_PATH).convert("RGBA")
        logo_scale = 80 / logo.height
        logo = logo.resize((int(logo.width * logo_scale), 80), Image.LANCZOS)
        img.paste(logo, ((WIDTH - logo.width) // 2, HEIGHT // 2 - 160), logo)
        draw = ImageDraw.Draw(img)

    font = get_font(72, bold=True)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (WIDTH - tw) // 2
    y = HEIGHT // 2 - 20

    draw.text((x, y), text, font=font, fill=ACCENT)

    # Subtitle
    sub_font = get_font(22, bold=False)
    sub = "LINK IN BIO"
    sbbox = draw.textbbox((0, 0), sub, font=sub_font)
    sw = sbbox[2] - sbbox[0]
    draw.text(((WIDTH - sw) // 2, y + th + 30), sub, font=sub_font, fill=(138, 143, 163))

    img.save(path)


def call_elevenlabs_tts(text: str, voice_id: str) -> tuple[bytes, list]:
    """Call ElevenLabs TTS with timestamps."""
    if not ELEVENLABS_API_KEY:
        print("ERROR: Set ELEVENLABS_API_KEY in .env file.")
        sys.exit(1)

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps"
    headers = {"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"}
    payload = {
        "text": text,
        "model_id": MODEL_ID,
        "voice_settings": {"stability": 0.25, "similarity_boost": 0.6, "style": 0.55, "speed": 1.0},
    }

    print("Calling ElevenLabs TTS API...")
    resp = requests.post(url, headers=headers, json=payload)
    if resp.status_code != 200:
        print(f"ERROR: ElevenLabs API returned {resp.status_code}\n{resp.text[:500]}")
        sys.exit(1)

    data = resp.json()
    audio_bytes = base64.b64decode(data["audio_base64"])

    chars = data["alignment"]["characters"]
    starts = data["alignment"]["character_start_times_seconds"]
    ends = data["alignment"]["character_end_times_seconds"]

    words = []
    current_word = ""
    word_start = None
    for i, char in enumerate(chars):
        if char in (" ", "\n"):
            if current_word:
                words.append({"word": current_word, "start": word_start, "end": ends[i - 1]})
                current_word = ""
                word_start = None
        else:
            if word_start is None:
                word_start = starts[i]
            current_word += char
    if current_word:
        words.append({"word": current_word, "start": word_start, "end": ends[-1]})

    print(f"Audio: {len(audio_bytes)} bytes, {len(words)} words, ~{words[-1]['end']:.1f}s")
    return audio_bytes, words


def find_word_time(words: list, target: str, after: float = 0) -> float | None:
    """Find the start time of a target word (case-insensitive) appearing after a given time."""
    target_lower = target.lower().rstrip(".,!?")
    for w in words:
        if w["start"] >= after and w["word"].lower().rstrip(".,!?") == target_lower:
            return w["start"]
    return None


def find_phrase_time(words: list, phrase: str, after: float = 0) -> tuple[float, float] | None:
    """Find start/end time of a multi-word phrase."""
    phrase_words = phrase.lower().split()
    for i in range(len(words) - len(phrase_words) + 1):
        if words[i]["start"] < after:
            continue
        match = True
        for j, pw in enumerate(phrase_words):
            if words[i+j]["word"].lower().rstrip(".,!?") != pw.rstrip(".,!?"):
                match = False
                break
        if match:
            return (words[i]["start"], words[i + len(phrase_words) - 1]["end"])
    return None


def resolve_scene_timings(scenes: list, words: list, audio_duration: float) -> list:
    """Resolve each scene's start/end time based on word timestamps."""
    resolved = []
    last_end = 0.0

    for i, scene in enumerate(scenes):
        s_type = scene["type"]
        start = last_end

        # Fixed hold duration — just use that
        if "hold" in scene:
            end = start + scene["hold"]

        # end_trigger — scene ends when this word is spoken
        elif "end_trigger" in scene:
            t = find_phrase_time(words, scene["end_trigger"], after=start)
            if t:
                end = t[1] + 0.3  # linger slightly after the word
            else:
                end = start + 3.0

        # trigger — scene starts when this word is spoken
        elif "trigger" in scene:
            t = find_phrase_time(words, scene["trigger"], after=max(0, last_end - 0.5))
            if t:
                start = max(last_end, t[0] - 0.3)
            if s_type == "cta":
                end = audio_duration + 1.5
            elif i + 1 < len(scenes) and "trigger" in scenes[i + 1]:
                nt = find_phrase_time(words, scenes[i + 1]["trigger"], after=start + 0.5)
                end = nt[0] - 0.15 if nt else start + 4.0
            else:
                end = start + 4.0

        # Default
        else:
            end = start + float(scene.get("duration", 3.0))

        resolved.append({**scene, "start": start, "end": end})
        last_end = end

    return resolved


def build_ass(words: list, words_per_group: int = 3) -> str:
    """Build ASS subtitle file with sentence-aware timing."""
    header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,64,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,4,2,2,40,40,320,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = [header.strip()]
    groups = []
    current_group = []

    for word in words:
        current_group.append(word)
        ends_sentence = word["word"].rstrip().endswith((".", "!", "?"))
        if len(current_group) >= words_per_group or ends_sentence:
            groups.append(current_group)
            current_group = []
    if current_group:
        groups.append(current_group)

    for i, group in enumerate(groups):
        start_time = max(0, group[0]["start"] - PRE_BUFFER)
        end_time = group[-1]["end"] + POST_BUFFER

        last_word = group[-1]["word"].rstrip()
        if last_word.endswith((".", "!", "?")) and i < len(groups) - 1:
            end_time += SENTENCE_PAUSE

        if i < len(groups) - 1:
            next_start = max(0, groups[i + 1][0]["start"] - PRE_BUFFER)
            end_time = min(end_time, next_start - 0.02)

        text = " ".join(w["word"] for w in group).upper()
        lines.append(f"Dialogue: 0,{fmt_ass(start_time)},{fmt_ass(end_time)},Default,,0,0,0,,{text}")

    return "\n".join(lines)


def fmt_ass(seconds: float) -> str:
    seconds = max(0, seconds)
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = int((seconds % 1) * 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def get_ffmpeg():
    ffmpeg = "/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"
    if not os.path.exists(ffmpeg):
        ffmpeg = "ffmpeg"
    try:
        subprocess.run([ffmpeg, "-version"], capture_output=True, check=True)
    except FileNotFoundError:
        print("ERROR: FFmpeg not installed. Run: brew install ffmpeg-full")
        sys.exit(1)
    return ffmpeg


def get_audio_duration(ffmpeg: str, audio_path: Path) -> float:
    """Get audio duration in seconds using ffprobe."""
    ffprobe_full = "/opt/homebrew/opt/ffmpeg-full/bin/ffprobe"
    ffprobe = ffprobe_full if os.path.exists(ffprobe_full) else "ffprobe"
    result = subprocess.run(
        [ffprobe, "-v", "quiet", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(audio_path)],
        capture_output=True, text=True
    )
    return float(result.stdout.strip())


def assemble_video(scenes: list, audio_path: Path, ass_path: Path, output_path: Path):
    """Build video from scene frames + audio + subtitles using FFmpeg concat."""
    ffmpeg = get_ffmpeg()
    ass_escaped = str(ass_path).replace(":", "\\:")

    audio_dur = get_audio_duration(ffmpeg, audio_path)
    total_dur = max(s["end"] for s in scenes)
    total_dur = max(total_dur, audio_dur + 0.5)

    # Build concat file — each scene is an image shown for its duration
    concat_path = FRAMES_DIR / "concat.txt"
    concat_lines = []
    for i, scene in enumerate(scenes):
        frame_path = FRAMES_DIR / f"scene_{i:03d}.png"
        dur = scene["end"] - scene["start"]
        if dur <= 0:
            continue
        concat_lines.append(f"file '{frame_path}'")
        concat_lines.append(f"duration {dur:.4f}")

    # FFmpeg concat needs the last file repeated without duration
    if concat_lines:
        last_file = concat_lines[-2]  # the last 'file' line
        concat_lines.append(last_file)

    concat_path.write_text("\n".join(concat_lines))

    cmd = [
        ffmpeg, "-y",
        "-f", "concat", "-safe", "0", "-i", str(concat_path),
        "-i", str(audio_path),
        "-vf", f"ass={ass_escaped},fps=30",
        "-c:v", "libx264",
        "-c:a", "aac",
        "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-shortest",
        str(output_path),
    ]

    print("Assembling video with FFmpeg...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"ERROR: FFmpeg failed:\n{result.stderr[-1000:]}")
        sys.exit(1)

    size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"Video saved: {output_path} ({size_mb:.1f} MB)")


def main():
    parser = argparse.ArgumentParser(description="SportsLogic TikTok Video Generator")
    parser.add_argument("config", help="Path to JSON config file")
    parser.add_argument("--voice", default=DEFAULT_VOICE_ID, help="ElevenLabs voice ID")
    parser.add_argument("--output", "-o", default=None, help="Output MP4 filename")
    parser.add_argument("--words", type=int, default=3, help="Words per subtitle group")
    args = parser.parse_args()

    try:
        from PIL import Image
    except ImportError:
        print("ERROR: Run: pip install pillow")
        sys.exit(1)

    # Load config
    config_path = Path(args.config)
    if not config_path.exists():
        print(f"ERROR: Config not found: {config_path}")
        sys.exit(1)

    config = json.loads(config_path.read_text())
    script_text = config["script"]
    scenes = config["scenes"]

    print(f"Script: {script_text[:80]}...")
    print(f"Scenes: {len(scenes)}")

    OUTPUT_DIR.mkdir(exist_ok=True)
    FRAMES_DIR.mkdir(exist_ok=True)

    base_name = config_path.stem

    # Step 1: Generate audio + timestamps
    audio_bytes, words = call_elevenlabs_tts(script_text, args.voice)
    audio_path = OUTPUT_DIR / f"{base_name}_audio.mp3"
    audio_path.write_bytes(audio_bytes)
    print(f"Audio saved: {audio_path}")

    audio_dur = get_audio_duration(get_ffmpeg(), audio_path)

    # Step 2: Resolve scene timings from word timestamps
    resolved = resolve_scene_timings(scenes, words, audio_dur)
    for s in resolved:
        print(f"  [{s['start']:.1f}s - {s['end']:.1f}s] {s['type']}: {s.get('name', s.get('text', ''))}")

    # Step 3: Generate frame images for each scene
    print("Generating scene frames...")
    for i, scene in enumerate(resolved):
        frame_path = FRAMES_DIR / f"scene_{i:03d}.png"
        s_type = scene["type"]

        if s_type == "hook":
            generate_hook_frame(scene.get("text", ""), frame_path)
        elif s_type == "team":
            generate_team_frame(scene["name"], scene.get("grade", ""), scene.get("colors", ["#00E87B"]), frame_path)
        elif s_type == "cta":
            generate_cta_frame(scene.get("text", "SPORTSLOGIC.AI"), frame_path)
        elif s_type == "logo":
            generate_logo_frame(frame_path)
        else:
            generate_hook_frame(scene.get("text", ""), frame_path)

        print(f"  Frame {i}: {s_type} -> {frame_path.name}")

    # Step 4: Build ASS subtitles
    ass_content = build_ass(words, words_per_group=args.words)
    ass_path = OUTPUT_DIR / f"{base_name}_subs.ass"
    ass_path.write_text(ass_content)
    print(f"Subtitles: {ass_content.count('Dialogue:')} groups")

    # Step 5: Assemble video
    output_path = OUTPUT_DIR / (args.output or f"{base_name}.mp4")
    assemble_video(resolved, audio_path, ass_path, output_path)

    print("\nDone! Your video is ready for TikTok.")


if __name__ == "__main__":
    main()
