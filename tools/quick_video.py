#!/usr/bin/env python3
"""
SportsLogic Quick Video — Logo + voiceover + subtitles. No gimmicks.

Usage:
    python quick_video.py "Your script here"
    python quick_video.py script.txt -o output.mp4
"""

import argparse
import base64
import os
import subprocess
import sys
from pathlib import Path

import requests

# Load .env file from project root
_env_path = Path(__file__).parent.parent / ".env"
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID", "")  # Liam — young, energetic, social media creator
MODEL_ID = "eleven_turbo_v2_5"

TOOLS_DIR = Path(__file__).parent
PROJECT_DIR = TOOLS_DIR.parent
LOGO_PATH = TOOLS_DIR / "logo_clean.png"
BG_PATH = TOOLS_DIR / "bg_simple.png"
OUTPUT_DIR = TOOLS_DIR / "output"

WIDTH = 1080
HEIGHT = 1920


def make_background():
    from PIL import Image, ImageDraw, ImageFilter, ImageFont

    bg = Image.new("RGB", (WIDTH, HEIGHT), (12, 14, 20))
    draw = ImageDraw.Draw(bg)

    # Dot grid
    for x in range(0, WIDTH, 24):
        for y in range(0, HEIGHT, 24):
            draw.point((x, y), fill=(26, 31, 43))

    cy = int(HEIGHT * 0.36)

    # Green glow at the very top edge — subtle atmospheric wash
    top_glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    tg = ImageDraw.Draw(top_glow)
    tg.ellipse([WIDTH//2-500, -300, WIDTH//2+500, 200], fill=(0, 232, 123, 12))
    top_glow = top_glow.filter(ImageFilter.GaussianBlur(radius=120))
    bg.paste(Image.alpha_composite(Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0)), top_glow).convert("RGB"), (0, 0))

    # Green glow at bottom near subtitles
    bot_glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    bg_d = ImageDraw.Draw(bot_glow)
    bg_d.ellipse([WIDTH//2-400, HEIGHT-500, WIDTH//2+400, HEIGHT+100], fill=(0, 232, 123, 10))
    bot_glow = bot_glow.filter(ImageFilter.GaussianBlur(radius=130))
    bg_rgba = bg.convert("RGBA")
    bg_rgba = Image.alpha_composite(bg_rgba, bot_glow)
    bg = bg_rgba.convert("RGB")
    draw = ImageDraw.Draw(bg)

    # Logo
    if LOGO_PATH.exists():
        logo = Image.open(LOGO_PATH).convert("RGBA")
        scale = 280 / logo.width
        logo = logo.resize((int(logo.width * scale), int(logo.height * scale)), Image.LANCZOS)
        x = (WIDTH - logo.width) // 2
        y = cy - logo.height // 2
        bg.paste(logo, (x, y), logo)
        draw = ImageDraw.Draw(bg)

    # "sportslogic.ai" — large, white, sharp
    try:
        url_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 48)
        tag_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 20)
    except Exception:
        url_font = ImageFont.load_default()
        tag_font = url_font

    url_text = "sportslogic.ai"
    bbox = draw.textbbox((0, 0), url_text, font=url_font)
    tw = bbox[2] - bbox[0]
    draw.text(((WIDTH - tw) // 2, cy + 175), url_text, font=url_font, fill=(255, 255, 255))

    # Tagline in green
    tag = "GRADE ANY BET IN SECONDS"
    tbbox = draw.textbbox((0, 0), tag, font=tag_font)
    ttw = tbbox[2] - tbbox[0]
    draw.text(((WIDTH - ttw) // 2, cy + 240), tag, font=tag_font, fill=(0, 232, 123))

    bg.save(BG_PATH)
    print(f"Background: {BG_PATH}")


def tts(text: str) -> tuple[bytes, list]:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/with-timestamps"
    resp = requests.post(url, headers={
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }, json={
        "text": text,
        "model_id": MODEL_ID,
        "voice_settings": {
            "stability": 0.30,
            "similarity_boost": 0.65,
            "style": 0.5,
            "speed": 1.0,
        },
    })

    if resp.status_code != 200:
        print(f"ERROR: {resp.status_code}\n{resp.text[:300]}")
        sys.exit(1)

    data = resp.json()
    audio = base64.b64decode(data["audio_base64"])

    chars = data["alignment"]["characters"]
    starts = data["alignment"]["character_start_times_seconds"]
    ends = data["alignment"]["character_end_times_seconds"]

    words = []
    buf = ""
    ws = None
    for i, c in enumerate(chars):
        if c in (" ", "\n"):
            if buf:
                words.append({"w": buf, "s": ws, "e": ends[i-1]})
                buf = ""
                ws = None
        else:
            if ws is None:
                ws = starts[i]
            buf += c
    if buf:
        words.append({"w": buf, "s": ws, "e": ends[-1]})

    return audio, words


def build_subs(words: list) -> str:
    """ASS subtitles — 2-3 words at a time, sentence-aware pauses."""
    header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,72,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,5,2,2,40,40,300,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = [header.strip()]

    groups = []
    cur = []
    for word in words:
        cur.append(word)
        ends_sent = word["w"].rstrip().endswith((".", "!", "?"))
        if len(cur) >= 3 or ends_sent:
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)

    for i, g in enumerate(groups):
        start = max(0, g[0]["s"] - 0.05)
        end = g[-1]["e"] + 0.12

        # Tight sentence pause — just a breath
        if g[-1]["w"].rstrip().endswith((".", "!", "?")) and i < len(groups) - 1:
            end += 0.15

        # Don't overlap next
        if i < len(groups) - 1:
            nxt = max(0, groups[i+1][0]["s"] - 0.05)
            end = min(end, nxt - 0.02)

        text = " ".join(w["w"] for w in g).upper()

        def t(s):
            s = max(0, s)
            return f"{int(s//3600)}:{int((s%3600)//60):02d}:{int(s%60):02d}.{int((s%1)*100):02d}"

        lines.append(f"Dialogue: 0,{t(start)},{t(end)},Default,,0,0,0,,{text}")

    return "\n".join(lines)


def render(bg: Path, audio: Path, subs: Path, out: Path):
    ffmpeg = "/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"
    if not os.path.exists(ffmpeg):
        ffmpeg = "ffmpeg"

    ass_esc = str(subs).replace(":", "\\:")
    cmd = [
        ffmpeg, "-y",
        "-loop", "1", "-i", str(bg),
        "-i", str(audio),
        "-vf", f"ass={ass_esc},fps=30",
        "-c:v", "libx264", "-tune", "stillimage",
        "-c:a", "aac", "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-shortest",
        str(out),
    ]

    print("Rendering...")
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"FFmpeg error:\n{r.stderr[-600:]}")
        sys.exit(1)

    mb = out.stat().st_size / (1024 * 1024)
    print(f"Done: {out} ({mb:.1f} MB)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("script", help="Script text or .txt file")
    parser.add_argument("-o", "--output", default="video.mp4")
    args = parser.parse_args()

    try:
        from PIL import Image
    except ImportError:
        print("pip install pillow")
        sys.exit(1)

    p = Path(args.script)
    if p.exists() and p.suffix == ".txt":
        text = p.read_text().strip()
        name = p.stem
    else:
        text = args.script
        name = "video"

    OUTPUT_DIR.mkdir(exist_ok=True)

    if not BG_PATH.exists():
        make_background()

    print(f"Script: {text[:60]}...")
    audio_bytes, words = tts(text)

    audio_path = OUTPUT_DIR / f"{name}_audio.mp3"
    audio_path.write_bytes(audio_bytes)

    subs = build_subs(words)
    subs_path = OUTPUT_DIR / f"{name}_subs.ass"
    subs_path.write_text(subs)
    print(f"Subs: {subs.count('Dialogue:')} groups")

    out = OUTPUT_DIR / args.output
    render(BG_PATH, audio_path, subs_path, out)


if __name__ == "__main__":
    main()
