# -*- coding: utf-8 -*-
"""
쇼츠 자료 동기화 — 사이트(GitHub → Vercel)에 올린 자료를 PC로 내려받아 씀

  사이트 public/bgm/list.json            → 분위기별 배경음악 (사이트 'AI 영상생성'과 같은 목록)
  사이트 public/shorts-assets/list.json  → 효과음·짤·엔딩 이미지·얼굴 감지 파일·로고

새로 생기거나 바뀐 파일만 받고, 사이트에서 지운 파일은 PC 보관함에서도 지움.
사이트에 접속이 안 되면 이미 받아둔 자료(assets_cache)와 PC의 assets 폴더로 그대로 진행.
"""
import os
import json
import hashlib
from urllib.parse import urljoin, quote, unquote, urlparse

import requests

BASE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(BASE, "assets_cache")
STATE = os.path.join(CACHE, "_state.json")
MEDIA = (".mp3", ".wav", ".m4a", ".aac", ".ogg")
GIFS = (".gif", ".mp4", ".webm", ".mov", ".png")


def _load_state():
    try:
        return json.load(open(STATE, encoding="utf-8"))
    except Exception:
        return {"bgm": {}, "assets": {}}


def _save_state(st):
    os.makedirs(CACHE, exist_ok=True)
    json.dump(st, open(STATE, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def _sha1(path):
    h = hashlib.sha1()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _get(url, timeout=60):
    r = requests.get(url, timeout=timeout, headers={"User-Agent": "bandphone-shorts"})
    r.raise_for_status()
    return r


def _download(url, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    tmp = dst + ".part"
    with requests.get(url, stream=True, timeout=120, headers={"User-Agent": "bandphone-shorts"}) as r:
        r.raise_for_status()
        with open(tmp, "wb") as f:
            for chunk in r.iter_content(1 << 16):
                f.write(chunk)
    os.replace(tmp, dst)


def sync(cfg, log):
    """사이트 자료를 받아오고, 쓸 경로들을 돌려줌"""
    site = (cfg.get("site_url") or "").rstrip("/")
    st = _load_state()
    got = {"bgm": 0, "assets": 0, "removed": 0}
    bgm_catalog = {}

    if site:
        # 1) 배경음악 (사이트 AI 영상생성과 같은 목록)
        try:
            data = _get(site + "/bgm/list.json").json()
            seen = set()
            for key, c in (data.get("cats") or {}).items():
                tracks = []
                for t in c.get("tracks") or []:
                    url = urljoin(site + "/", t.get("url", ""))
                    name = os.path.basename(unquote(urlparse(url).path))
                    dst = os.path.join(CACHE, "bgm", key, name)
                    seen.add(url)
                    if not (os.path.exists(dst) and st["bgm"].get(url)):
                        try:
                            _download(url, dst)
                            st["bgm"][url] = os.path.getsize(dst)
                            got["bgm"] += 1
                        except Exception as e:
                            log(f"  배경음악 받기 실패: {name} ({str(e)[:60]})")
                            continue
                    tracks.append({"path": dst, "name": t.get("name") or name, "credit": t.get("credit") or ""})
                if tracks:
                    bgm_catalog[key] = {"label": c.get("label") or key, "tracks": tracks}
            for url in [u for u in st["bgm"] if u not in seen]:
                st["bgm"].pop(url, None)
        except Exception as e:
            log(f"사이트 배경음악 목록을 못 읽었어요 → 받아둔 자료로 진행 ({str(e)[:80]})")
            bgm_catalog = _cached_bgm()

        # 2) 쇼츠 자료 (효과음·짤·엔딩·얼굴 감지·로고)
        try:
            data = _get(site + "/shorts-assets/list.json").json()
            want = {}
            for f in data.get("files") or []:
                rel = f["path"]
                want[rel] = f
                dst = os.path.join(CACHE, "shorts", *rel.split("/"))
                if os.path.exists(dst) and st["assets"].get(rel) == f.get("sha1"):
                    continue
                if os.path.exists(dst) and f.get("sha1") and _sha1(dst) == f["sha1"]:
                    st["assets"][rel] = f["sha1"]
                    continue
                try:
                    _download(site + "/shorts-assets/" + quote(rel), dst)
                    st["assets"][rel] = f.get("sha1") or ""
                    got["assets"] += 1
                except Exception as e:
                    log(f"  자료 받기 실패: {rel} ({str(e)[:60]})")
            for rel in [r for r in st["assets"] if r not in want]:  # 사이트에서 지운 파일
                p = os.path.join(CACHE, "shorts", *rel.split("/"))
                try:
                    os.remove(p)
                except OSError:
                    pass
                st["assets"].pop(rel, None)
                got["removed"] += 1
        except Exception as e:
            log(f"사이트 쇼츠 자료 목록을 못 읽었어요 → 받아둔 자료로 진행 ({str(e)[:80]})")
        _save_state(st)
        log(f"사이트 자료 확인: 새로 받은 배경음악 {got['bgm']}곡 · 자료 {got['assets']}개"
            + (f" · 지운 자료 {got['removed']}개" if got["removed"] else ""))
    else:
        bgm_catalog = _cached_bgm()

    shorts = os.path.join(CACHE, "shorts")
    local = os.path.join(BASE, "assets")
    return {
        "bgm_catalog": bgm_catalog,
        "sfx_dirs": [os.path.join(shorts, "sfx"), cfg.get("sfx_dir") or os.path.join(local, "sfx")],
        "gif_dirs": [os.path.join(shorts, "gif"), os.path.join(local, "gif")],
        "ending_dirs": [os.path.join(shorts, "ending"), cfg.get("ending_dir") or os.path.join(local, "ending")],
        "face_model": _first([os.path.join(shorts, "models", "face_yunet.onnx"),
                              os.path.join(local, "models", "face_yunet.onnx")]),
        "logo_full": _first([os.path.join(shorts, "logo_full.png"), cfg.get("logo_path")]),
        "logo_icon": _first([os.path.join(shorts, "logo_icon.png"), cfg.get("logo_icon_path")]),
    }


def _first(paths):
    for p in paths:
        if p and os.path.exists(p):
            return p
    return paths[-1] if paths else None


def _cached_bgm():
    out = {}
    root = os.path.join(CACHE, "bgm")
    if os.path.isdir(root):
        for key in sorted(os.listdir(root)):
            d = os.path.join(root, key)
            if os.path.isdir(d):
                tr = [{"path": os.path.join(d, f), "name": f, "credit": ""}
                      for f in sorted(os.listdir(d)) if f.lower().endswith(MEDIA)]
                if tr:
                    out[key] = {"label": key, "tracks": tr}
    return out


def list_gifs(dirs):
    """{기분: [(파일이름(확장자 제외), 경로)]} — 여러 폴더를 합침"""
    out = {}
    for root in dirs:
        if not root or not os.path.isdir(root):
            continue
        for mood in sorted(os.listdir(root)):
            d = os.path.join(root, mood)
            if not os.path.isdir(d):
                continue
            for f in sorted(os.listdir(d)):
                if f.lower().endswith(GIFS):
                    out.setdefault(mood, []).append((os.path.splitext(f)[0], os.path.join(d, f)))
    return out
