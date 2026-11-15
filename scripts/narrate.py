"""Pre-generate neural narration + word timings for every story beat.

usage: python scripts/narrate.py beats.json public/audio
beats.json comes from: node scripts/dump-beats.ts > beats.json
"""
import asyncio
import hashlib
import json
import sys
from pathlib import Path

import edge_tts

# one voice per machine, so each sounds like its own character
VOICES = {
    "surveyor": "en-US-ChristopherNeural",
    "eagle": "en-US-GuyNeural",
    "alsep": "en-GB-RyanNeural",
    "lrv": "en-US-BrianNeural",
    "viking": "en-US-EricNeural",
    "sojourner": "en-AU-NatashaNeural",
    "spirit": "en-US-AvaNeural",
    "opportunity": "en-US-EmmaNeural",
    "phoenix": "en-GB-SoniaNeural",
    "insight": "en-US-AriaNeural",
    "ingenuity": "en-US-AndrewNeural",
    "pioneer": "en-US-SteffanNeural",
    "near": "en-AU-WilliamMultilingualNeural",
    "dawn": "en-GB-LibbyNeural",
    "kepler": "en-GB-ThomasNeural",
}
RATE = "-6%"


async def one(item, out: Path, manifest):
    key = f"{item['id']}/{item['i']}"
    voice = VOICES[item["id"]]
    h = hashlib.sha1((voice + RATE + item["text"]).encode()).hexdigest()[:10]
    mp3 = out / item["id"] / f"{item['i']}.mp3"
    if manifest.get(key, {}).get("h") == h and mp3.exists():
        return
    mp3.parent.mkdir(parents=True, exist_ok=True)
    words = []
    audio = bytearray()
    for attempt in range(4):
        try:
            words.clear()
            audio.clear()
            com = edge_tts.Communicate(item["text"], voice, rate=RATE, boundary="WordBoundary")
            async for ch in com.stream():
                if ch["type"] == "audio":
                    audio.extend(ch["data"])
                elif ch["type"] == "WordBoundary":
                    s = ch["offset"] / 1e7
                    words.append([ch["text"], round(s, 3), round(s + ch["duration"] / 1e7, 3)])
            break
        except Exception as e:  # transient network errors
            print("retry", key, e)
            await asyncio.sleep(2 + attempt * 2)
    mp3.write_bytes(bytes(audio))
    manifest[key] = {"h": h, "w": words, "d": words[-1][2] if words else 0}
    print("ok", key, len(audio) // 1024, "KB")


async def main():
    beats = json.loads(Path(sys.argv[1]).read_text(encoding="utf8"))
    out = Path(sys.argv[2])
    mf = out / "captions.json"
    manifest = json.loads(mf.read_text(encoding="utf8")) if mf.exists() else {}
    sem = asyncio.Semaphore(4)

    async def run(it):
        async with sem:
            await one(it, out, manifest)

    await asyncio.gather(*(run(b) for b in beats))
    keep = {f"{b['id']}/{b['i']}" for b in beats}
    manifest = {k: v for k, v in manifest.items() if k in keep}
    mf.write_text(json.dumps(manifest, separators=(",", ":")), encoding="utf8")


asyncio.run(main())
