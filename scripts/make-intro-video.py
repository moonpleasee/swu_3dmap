"""Build a narrated website tour from reproducible Playwright screenshots."""

from __future__ import annotations

import json
import math
import subprocess
import wave
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / "work" / "intro-video"
OUTPUT = ROOT / "outputs" / "西大云游-功能介绍.mp4"
W, H = 1920, 1080
FONT_REG = r"C:\Windows\Fonts\msyh.ttc"
FONT_BOLD = r"C:\Windows\Fonts\msyhbd.ttc"
GREEN = (18, 51, 45)
IVORY = (248, 248, 239)
MUTED = (174, 196, 181)
GOLD = (220, 181, 113)

SCENES = [
    {"kind": "desktop", "shots": ["01-desktop-map.png"], "number": "01", "label": "欢迎来到西大云游", "title": ["一座校园，", "万千日常。"], "detail": "西南大学北碚校区三维校园地图", "voice": "这里是西大云游。一张可以走进西南大学北碚校区的三维地图。"},
    {"kind": "desktop", "shots": ["01-desktop-map.png"], "number": "02", "label": "探索地图", "title": ["拖动视角，", "漫游校园。"], "detail": "从全景出发，认识建筑、道路与绿地", "voice": "拖动和缩放地图，从不同角度，重新认识熟悉的校园。"},
    {"kind": "desktop", "shots": ["02-search.png"], "number": "03", "label": "搜索地点", "title": ["输入名称，", "快速找到。"], "detail": "教学楼、图书馆、宿舍等地点可搜索", "voice": "输入建筑名称，就能快速找到教学楼、图书馆和其他地点。"},
    {"kind": "desktop", "shots": ["03-building-forum.png"], "number": "04", "label": "地点讨论", "title": ["点开建筑，", "看见故事。"], "detail": "每个地点都能打开自己的讨论页面", "voice": "点击一栋建筑，就能进入这个地点的专属讨论页面。"},
    {"kind": "desktop", "shots": ["04-night.png"], "number": "05", "label": "不同视角", "title": ["白天与夜晚，", "各有风景。"], "detail": "切换光照模式，感受不一样的校园", "voice": "切换日间、黄昏与夜景，感受同一座校园的不同模样。"},
    {"kind": "desktop", "shots": ["05-layers.png"], "number": "06", "label": "地图图层", "title": ["按你的方式，", "阅读地图。"], "detail": "地图图层与显示选项可以自由调整", "voice": "地图图层和显示选项，也可以按照你的需要调整。"},
    {"kind": "mobile", "shots": ["06-phone-map.png", "07-phone-explore.png"], "number": "07", "label": "手机体验", "title": ["装进口袋的，", "校园探索。"], "detail": "竖屏布局，地图与探索面板随手切换", "voice": "在手机上，地图和探索面板同样可以顺手切换。"},
    {"kind": "mobile", "shots": ["08-phone-forum.png", "09-phone-photos.png"], "number": "08", "label": "留下回忆", "title": ["照片、评分，", "还有讨论。"], "detail": "在地点页面留下你的照片和评价", "voice": "在地点页面，你可以上传照片、评分、写下评价，也可以参与讨论。"},
    {"kind": "end", "shots": ["01-desktop-map.png"], "number": "09", "label": "西大云游", "title": ["把校园的故事，", "留在地图上。"], "detail": "当前照片与讨论仅保存在本机浏览器", "voice": "西大云游，让每一段校园记忆都有位置。目前照片与讨论，保存在当前浏览器中。"},
]


def f(size: int, bold: bool = False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)


def base() -> Image.Image:
    image = Image.new("RGB", (W, H), GREEN)
    d = ImageDraw.Draw(image)
    for i in range(15):
        d.ellipse((1080 - i * 43, -600 - i * 43, 2100 + i * 43, 500 + i * 43), outline=(26 + i, 66 + i, 57 + i), width=2)
    d.ellipse((-250, 770, 270, 1290), outline=(42, 83, 70), width=2)
    d.line((100, 92, 1820, 92), fill=(74, 108, 91), width=2)
    d.text((100, 40), "西大云游", font=f(33, True), fill=IVORY)
    d.text((315, 48), "SWU CAMPUS EXPLORER", font=f(18), fill=MUTED)
    d.line((100, 968, 1820, 968), fill=(74, 108, 91), width=2)
    d.text((100, 995), "西南大学 · 北碚校区", font=f(23), fill=MUTED)
    d.text((1665, 995), "SWU / BEIBEI", font=f(18), fill=MUTED)
    return image


def rounded_screenshot(canvas: Image.Image, shot: Path, box: tuple[int, int, int, int], radius: int = 25):
    x, y, w, h = box
    shadow = Image.new("RGBA", (w + 80, h + 80), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((35, 30, w + 35, h + 30), radius=radius, fill=(0, 0, 0, 125))
    shadow = shadow.filter(ImageFilter.GaussianBlur(20))
    canvas.paste(shadow, (x - 40, y - 25), shadow)
    src = Image.open(shot).convert("RGB")
    scale = max(w / src.width, h / src.height)
    scaled = src.resize((math.ceil(src.width * scale), math.ceil(src.height * scale)), Image.Resampling.LANCZOS)
    crop = scaled.crop(((scaled.width - w) // 2, (scaled.height - h) // 2, (scaled.width + w) // 2, (scaled.height + h) // 2))
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius=radius, fill=255)
    canvas.paste(crop, (x, y), mask)
    ImageDraw.Draw(canvas).rounded_rectangle((x, y, x + w, y + h), radius=radius, outline=(209, 224, 203), width=3)


def draw_scene(index: int, scene: dict) -> Path:
    image = base()
    d = ImageDraw.Draw(image)
    d.text((100, 160), scene["label"].upper(), font=f(25, True), fill=GOLD)
    d.rounded_rectangle((100, 213, 168, 259), radius=22, outline=GOLD, width=2)
    d.text((115, 218), scene["number"], font=f(25, True), fill=GOLD)
    if scene["kind"] == "end":
        rounded_screenshot(image, WORK / scene["shots"][0], (1090, 185, 725, 545), 28)
        d.rectangle((0, 300, 1040, 850), fill=GREEN)
        d.text((100, 340), scene["title"][0], font=f(78, True), fill=IVORY)
        d.text((100, 455), scene["title"][1], font=f(78, True), fill=IVORY)
        d.rounded_rectangle((100, 650, 817, 738), radius=18, fill=(46, 86, 71))
        d.text((130, 674), scene["detail"], font=f(26), fill=MUTED)
    else:
        d.text((100, 328), scene["title"][0], font=f(70, True), fill=IVORY)
        d.text((100, 433), scene["title"][1], font=f(70, True), fill=IVORY)
        d.multiline_text((100, 612), scene["detail"], font=f(29), fill=MUTED, spacing=15)
        d.rectangle((100, 752, 155, 759), fill=GOLD)
        if scene["kind"] == "desktop":
            rounded_screenshot(image, WORK / scene["shots"][0], (630, 151, 1190, 695), 23)
        elif scene["kind"] == "mobile":
            rounded_screenshot(image, WORK / scene["shots"][0], (930, 142, 320, 690), 36)
            rounded_screenshot(image, WORK / scene["shots"][1], (1360, 142, 320, 690), 36)
    d = ImageDraw.Draw(image)
    d.text((100, 875), scene["voice"], font=f(28), fill=IVORY)
    d.text((1745, 924), f"{index + 1:02d}/09", font=f(19), fill=GOLD)
    d.rounded_rectangle((100, 943, 1820, 949), radius=3, fill=(52, 91, 75))
    d.rounded_rectangle((100, 943, 100 + int(1720 * (index + 1) / len(SCENES)), 949), radius=3, fill=GOLD)
    path = WORK / f"slide-{index + 1:02d}.png"
    image.save(path, optimize=True)
    return path


def generate_voice() -> list[Path]:
    lines = [scene["voice"] for scene in SCENES]
    lines_path = WORK / "voice-lines.json"
    lines_path.write_text(json.dumps(lines, ensure_ascii=False, indent=2), encoding="utf-8")
    subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(ROOT / "scripts" / "make-intro-voice.ps1"), "-InputPath", str(lines_path), "-OutputDir", str(WORK / "voice")], check=True)
    return [WORK / "voice" / f"{i + 1:02d}.wav" for i in range(len(SCENES))]


def combine_voice(files: list[Path]) -> list[float]:
    durations = []
    with wave.open(str(files[0]), "rb") as first:
        params = first.getparams()
    with wave.open(str(WORK / "narration.wav"), "wb") as out:
        out.setparams(params)
        for file in files:
            with wave.open(str(file), "rb") as src:
                assert src.getparams()[:3] == params[:3]
                data = src.readframes(src.getnframes())
                voice_seconds = src.getnframes() / src.getframerate()
            duration = max(5.4, voice_seconds + 2.0)
            durations.append(duration)
            before = int(0.65 * params.framerate)
            after = round((duration - voice_seconds) * params.framerate) - before
            out.writeframes(bytes(before * params.sampwidth * params.nchannels))
            out.writeframes(data)
            out.writeframes(bytes(after * params.sampwidth * params.nchannels))
    return durations


def render(slides: list[Path], durations: list[float]):
    list_path = WORK / "slides.txt"
    rows = []
    for slide, duration in zip(slides, durations):
        rows += [f"file '{slide.as_posix()}'", f"duration {duration:.3f}"]
    rows.append(f"file '{slides[-1].as_posix()}'")
    list_path.write_text("\n".join(rows) + "\n", encoding="utf-8")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    total = sum(durations)
    motion = (
        "fps=24,"
        "crop=1860:1046:x='30+20*sin(n/65)':y='17+10*cos(n/83)',"
        "scale=1920:1080,"
        "fade=t=in:st=0:d=0.6,"
        f"fade=t=out:st={total - 0.7:.3f}:d=0.7,"
        "format=yuv420p"
    )
    subprocess.run([
        "ffmpeg", "-hide_banner", "-y", "-f", "concat", "-safe", "0", "-i", str(list_path),
        "-i", str(WORK / "narration.wav"), "-vf", motion,
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", str(OUTPUT)
    ], check=True)


if __name__ == "__main__":
    WORK.mkdir(parents=True, exist_ok=True)
    slides = [draw_scene(i, scene) for i, scene in enumerate(SCENES)]
    durations = combine_voice(generate_voice())
    (WORK / "storyboard.json").write_text(json.dumps({"scenes": SCENES, "durations": durations}, ensure_ascii=False, indent=2), encoding="utf-8")
    render(slides, durations)
    print(f"Video: {OUTPUT} ({sum(durations):.1f} sec)")
