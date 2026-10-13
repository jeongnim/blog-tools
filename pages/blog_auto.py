# blog_auto.py — 밴드폰 본사·지점 네이버 블로그 자동 임시저장
# 흐름: (출근일 12:40) blog-tools 사이트에서 글 받기 → OpenAI로 이미지 → 블로그마다 네이버 임시저장 → 결과 메일
# 발행은 하지 않는다. 사람이 임시저장 목록에서 확인하고 직접 발행한다.
#
# 실행:  python blog_auto.py                 (출근일·오늘 미완료분만)
#        python blog_auto.py --test 용인       (요일 무시, 그 블로그 1편만, 제목에 [테스트])
#        python blog_auto.py --dry             (임시저장 없이 글·이미지 파일만 output 폴더에)
#        python blog_auto.py --no-images       (이미지 생성 건너뜀)
import argparse
import base64
import datetime as dt
import io
import json
import random
import re
import smtplib
import sys
import time
import traceback
from email.mime.text import MIMEText
from pathlib import Path

import requests
from PIL import Image
from playwright.sync_api import sync_playwright

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

BASE = Path(__file__).parent
CFG = json.loads((BASE / "config.json").read_text(encoding="utf-8-sig"))
PROFILES = BASE / "profiles"
OUT = BASE / "output"
STATE = BASE / "state"
DEBUG = BASE / "debug"
LOGS = BASE / "logs"
for d in (PROFILES, OUT, STATE, DEBUG, LOGS):
    d.mkdir(exist_ok=True)

# 로그인 아이디 → 블로그 주소 (setup_login.py 가 기록. 둘이 같은 계정은 없을 수도 있음)
try:
    IDMAP = json.loads((PROFILES / "blog_ids.json").read_text(encoding="utf-8"))
except Exception:
    IDMAP = {}


def blog_addr(login_id):
    return IDMAP.get(login_id.lower(), login_id.lower())


KST = dt.timezone(dt.timedelta(hours=9))
NOW = lambda: dt.datetime.now(KST)
TODAY = NOW().date()
LOG_LINES = []


def log(msg):
    line = f"{NOW():%H:%M:%S} {msg}"
    print(line, flush=True)
    LOG_LINES.append(line)
    try:
        with open(LOGS / f"{TODAY}.log", "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass


class LoginNeeded(Exception):
    pass


# ───────────────────────── 출근일 판단 ─────────────────────────
def is_workday(d):
    s = d.isoformat()
    if s in CFG.get("extra_work_days", []):
        return True
    if s in CFG.get("extra_off_days", []):
        return False
    if d.weekday() >= 5:
        return False
    try:
        import holidays
        if d in holidays.KR(years=d.year):
            return False
    except ImportError:
        log("※ holidays 패키지가 없어 공휴일은 못 거름 (pip install holidays)")
    return True


# ───────────────────────── 오늘 진행 기록 ─────────────────────────
STATE_FILE = STATE / f"{TODAY}.json"


def load_state():
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_state(st):
    STATE_FILE.write_text(json.dumps(st, ensure_ascii=False, indent=1), encoding="utf-8")


# ───────────────────────── blog-tools 사이트 ─────────────────────────
def open_site(p):
    ctx = p.chromium.launch_persistent_context(
        str(PROFILES / "site"), channel="chrome",
        headless=CFG.get("site_headless", True), viewport={"width": 1400, "height": 900},
    )
    site = CFG["site_url"].rstrip("/")
    r = ctx.request.post(site + "/api/verify-password", data={"password": CFG["site_password"]})
    try:
        ok = r.json().get("ok")
    except Exception:
        ok = False
    if not ok:
        ctx.close()
        raise RuntimeError(f"사이트 로그인 실패 (HTTP {r.status}) — config.json 의 site_password 확인")
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.on("dialog", lambda d: d.accept())
    page.goto(site, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_function("() => window.__blogAuto && window.__blogAuto.version >= 1", timeout=60000)
    return ctx, page


def site_run(page, args, max_min=40):
    page.evaluate("""(a) => { window.__autoRes = null;
        window.__blogAuto.run(a).then(r => window.__autoRes = r)
          .catch(e => window.__autoRes = { error: String((e && e.message) || e) }); }""", args)
    last, t0 = "", time.time()
    while time.time() - t0 < max_min * 60:
        time.sleep(5)
        res = page.evaluate("window.__autoRes")
        if res:
            return res
        st = page.evaluate("window.__blogAuto.status().step") or ""
        if st and st != last:
            log("   · " + st)
            last = st
    raise RuntimeError(f"사이트 글쓰기 {max_min}분 초과")


# ───────────────────────── 이미지 (OpenAI) ─────────────────────────
def gen_image(prompt, key, path):
    ic = CFG.get("image", {})
    body = {"model": ic.get("model", "gpt-image-1-mini"), "prompt": prompt,
            "size": ic.get("size", "1536x1024"), "quality": ic.get("quality", "medium"), "n": 1}
    last_err = ""
    for attempt in range(2):
        try:
            r = requests.post("https://api.openai.com/v1/images/generations",
                              headers={"Authorization": f"Bearer {key}"}, json=body, timeout=240)
            j = r.json()
            if r.status_code != 200:
                last_err = (j.get("error") or {}).get("message") or r.text[:200]
                if r.status_code in (400, 401, 403):   # 프롬프트 차단·키 문제는 재시도해도 같음
                    break
                time.sleep(5)
                continue
            d = j["data"][0]
            raw = base64.b64decode(d["b64_json"]) if d.get("b64_json") else requests.get(d["url"], timeout=60).content
            Image.open(io.BytesIO(raw)).convert("RGB").save(path, "JPEG", quality=88)
            return True, ""
        except Exception as e:
            last_err = str(e)
            time.sleep(5)
    return False, last_err


# ───────────────────────── 네이버 블로그 임시저장 ─────────────────────────
def naver_ctx(p, blog_id):
    args = ["--disable-blink-features=AutomationControlled"]
    args.append("--start-minimized" if CFG.get("naver_minimized", False) else "--start-maximized")
    return p.chromium.launch_persistent_context(
        str(PROFILES / f"naver_{blog_id}"), channel="chrome", headless=False, viewport=None,
        args=args, ignore_default_args=["--enable-automation"],
    )


def find(page, sel, timeout=15000, last=False):
    """페이지와 모든 iframe에서 보이는 요소를 찾는다 (블로그 에디터는 iframe 안에 있을 수 있음)."""
    end = time.time() + timeout / 1000
    while time.time() < end:
        for fr in page.frames:
            try:
                loc = fr.locator(sel)
                n = loc.count()
                if n:
                    el = loc.nth(n - 1) if last else loc.first
                    if el.is_visible():
                        return el
            except Exception:
                pass
        page.wait_for_timeout(400)
    return None


def find_text(page, tag, pattern, timeout=8000):
    end = time.time() + timeout / 1000
    while time.time() < end:
        for fr in page.frames:
            try:
                loc = fr.locator(tag).filter(has_text=re.compile(pattern))
                for i in range(loc.count()):
                    if loc.nth(i).is_visible():
                        return loc.nth(i)
            except Exception:
                pass
        page.wait_for_timeout(400)
    return None


def count_all(page, sel):
    n = 0
    for fr in page.frames:
        try:
            n += fr.locator(sel).count()
        except Exception:
            pass
    return n


def snap(page, name):
    try:
        page.screenshot(path=str(DEBUG / f"{NOW():%m%d_%H%M%S}_{name}.png"), full_page=False)
    except Exception:
        pass


def step(page, name, fn):
    try:
        return fn()
    except Exception:
        snap(page, "FAIL_" + name)
        raise


def dismiss_popups(page):
    # "작성 중인 글이 있습니다 — 이어서 작성?" → 취소(새 글), 도움말 패널 닫기
    for sel in [".se-popup-button-cancel", "button.se-help-panel-close-button", ".se-help-panel-close-button"]:
        el = find(page, sel, timeout=1500)
        if el:
            try:
                el.click()
                page.wait_for_timeout(700)
            except Exception:
                pass


def type_line(page, text):
    if text:
        page.keyboard.insert_text(text)
    page.keyboard.press("Enter")



def is_logged_in(ctx):
    """네이버 로그인 쿠키(NID_AUT)가 있으면 로그인 상태."""
    try:
        return any(c["name"] == "NID_AUT" and c.get("value") for c in ctx.cookies("https://naver.com"))
    except Exception:
        return False


def my_blog_id(page, wait_s=15):
    """지금 로그인된 계정의 블로그 아이디 (내 블로그 주소로 넘어가는 걸 보고 알아낸다). 모르면 ''."""
    import re as _re
    try:
        page.goto("https://blog.naver.com/MyBlog.naver", wait_until="domcontentloaded", timeout=30000)
    except Exception:
        pass
    end = time.time() + wait_s
    while time.time() < end:
        m = _re.match(r"https://(?:m\.)?blog\.naver\.com/([A-Za-z0-9_-]+)/?(?:[?#].*)?$", page.url)
        if m and m.group(1).lower() not in ("myblog.naver", "postlist.naver", "prologue"):
            return m.group(1).lower()
        if "nid.naver.com" in page.url:
            return ""
        page.wait_for_timeout(500)
    return ""


def write_urls(blog_id):
    return [f"https://blog.naver.com/{blog_id}/postwrite",
            f"https://blog.naver.com/PostWriteForm.naver?blogId={blog_id}",
            f"https://blog.naver.com/{blog_id}?Redirect=Write&"]


def open_editor_page(page, blog_id, wait_s=30):
    """글쓰기 에디터가 뜰 때까지 주소 몇 가지를 차례로 시도. 성공하면 True."""
    for url in write_urls(blog_id):
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
        except Exception as e:
            if "interrupted" not in str(e):
                continue
        end = time.time() + wait_s
        while time.time() < end:
            if "nid.naver.com" in page.url:
                return False
            for fr in page.frames:
                try:
                    if fr.locator(".se-documentTitle, .se-title-text").count():
                        return True
                except Exception:
                    pass
            page.wait_for_timeout(500)
    return False


def writer_id(page):
    """글쓰기 화면이 실제로 어느 블로그 ID로 열렸는지 (주소·iframe 주소에서). 못 찾으면 ''."""
    import re as _re
    for u in [page.url] + [f.url for f in page.frames]:
        m = _re.search(r"[?&]blogId=([A-Za-z0-9_-]+)", u) or _re.search(r"blog\.naver\.com/([A-Za-z0-9_-]+)/postwrite", u)
        if m:
            return m.group(1).lower()
    return ""


# ── 가운데 정렬 (카페 자동화와 같은 방식: 정렬 메뉴 열기 → '가운데') ──
ALIGN_JS = ("c => { const all = [c, ...c.querySelectorAll('*')].map(e => String(e.className || '')).join(' ');"
            " if (/align-?center/.test(all)) return 'center';"
            " if (/align-?(left|right|justify)/.test(all)) return 'side'; return 'unknown'; }")


def set_align_center(page):
    btn = find(page, "button[data-name^='align-drop-down']", timeout=5000)
    if not btn:
        raise RuntimeError("정렬 버튼 없음")
    btn.click()
    page.wait_for_timeout(400)
    opt = find(page, "button.se-toolbar-option-align-center-button, button[data-value='center']", timeout=2000) \
        or find_text(page, "button", "가운데", timeout=2000)
    if not opt:
        raise RuntimeError("가운데 정렬 메뉴 없음")
    opt.click()
    page.wait_for_timeout(300)


def last_in_frames(page, sel):
    for fr in page.frames:
        try:
            loc = fr.locator(sel)
            if loc.count():
                return loc.last
        except Exception:
            pass
    return None


def center_last_image(page):
    """방금 넣은 사진(문서의 마지막 사진)을 가운데 정렬. 성공하면 True."""
    for attempt in range(3):
        comp = last_in_frames(page, ".se-component.se-image")
        if comp is None:
            return False
        try:
            if comp.evaluate(ALIGN_JS) == "center":
                return True
            comp.locator("img").first.click(timeout=5000)
            page.wait_for_timeout(500)
            set_align_center(page)
        except Exception:
            pass
        page.wait_for_timeout(500)
    comp = last_in_frames(page, ".se-component.se-image")
    try:
        return comp is not None and comp.evaluate(ALIGN_JS) == "center"
    except Exception:
        return False


def save_draft(page, blog_id, post, img_paths):
    """post: 사이트가 준 글 / img_paths: {번호: 파일경로}"""
    warns = []

    def open_editor():
        if not open_editor_page(page, blog_id, wait_s=40):
            if "nid.naver.com" in page.url or not is_logged_in(page.context):
                raise LoginNeeded(blog_id)
            raise RuntimeError(f"글쓰기 에디터가 안 열림 ({page.url[:80]})")
        page.wait_for_timeout(1500)
        if not find(page, ".se-documentTitle, .se-title-text", timeout=30000):
            raise RuntimeError("에디터 제목칸을 못 찾음")
        dismiss_popups(page)
    step(page, "1_에디터열기", open_editor)

    def do_title():
        t = find(page, ".se-documentTitle .se-text-paragraph, .se-title-text .se-text-paragraph, .se-title-text")
        t.click()
        page.wait_for_timeout(300)
        page.keyboard.insert_text(post["title"])
    step(page, "2_제목", do_title)

    # 본문: [이미지 N] 자리도 일단 글자로 넣고, 나중에 그 줄을 찾아 사진으로 바꾼다 (순서가 꼬이지 않게)
    def do_body():
        b = find(page, ".se-component:not(.se-documentTitle) .se-text-paragraph")
        if not b:
            raise RuntimeError("본문 입력칸을 못 찾음")
        # 떠 있는 툴바가 클릭을 가로채지 않게
        for fr in page.frames:
            try:
                fr.add_style_tag(content=".se-floating-material-container,.se-flayer-unified-toolbar{pointer-events:none !important;}")
            except Exception:
                pass
        b.click()
        page.wait_for_timeout(300)
        if CFG.get("align_center", True):
            try:
                set_align_center(page)          # 입력 전에 켜두면 Enter로 생기는 문단에도 이어진다
            except Exception as e:
                warns.append(f"가운데 정렬 실패({e})")
                snap(page, "WARN_정렬")
        lines = post["bodyWithImages"].split("\n")
        for i, line in enumerate(lines):
            type_line(page, line.rstrip())
            if i % 15 == 14:
                page.wait_for_timeout(150)
        page.wait_for_timeout(800)
        first = next((l for l in lines if len(l.strip()) > 8 and not l.startswith("[이미지")), "")
        if first and not find_text(page, ".se-text-paragraph", re.escape(first.strip()[:12]), timeout=5000):
            raise RuntimeError("본문 글자가 에디터에 안 들어감")
        if CFG.get("align_center", True):
            n_side = 0
            for fr in page.frames:
                try:
                    n_side += fr.locator(".se-component.se-text .se-text-paragraph:not(.se-text-paragraph-align-center)").count()
                except Exception:
                    pass
            if n_side:
                warns.append(f"가운데 정렬 안 된 문단 {n_side}개")
    step(page, "3_본문", do_body)

    def do_images():
        failed = []
        for n in sorted(img_paths):
            mark = find_text(page, ".se-text-paragraph", rf"^\s*\[이미지 {n}\]\s*$", timeout=4000)
            if not mark:
                failed.append(n)
                continue
            mark.click()
            page.keyboard.press("End")
            page.keyboard.press("Shift+Home")
            page.keyboard.press("Delete")
            before = count_all(page, ".se-component.se-image")
            btn = find(page, 'button[data-name="image"], button.se-image-toolbar-button', timeout=5000)
            if not btn:
                raise RuntimeError("사진 버튼을 못 찾음")
            with page.expect_file_chooser(timeout=15000) as fc:
                btn.click()
            fc.value.set_files(str(img_paths[n]))
            ok = False
            for _ in range(60):
                page.wait_for_timeout(500)
                if count_all(page, ".se-component.se-image") > before:
                    ok = True
                    break
            if not ok:
                failed.append(n)
            page.wait_for_timeout(1200)
            if ok and CFG.get("align_center", True) and not center_last_image(page):
                warns.append(f"사진 {n}번 가운데 정렬 안 됨")
            page.keyboard.press("Escape")
        # 사진을 못 넣은 자리 표시는 지운다
        for _ in range(10):
            left = find_text(page, ".se-text-paragraph", r"^\s*\[이미지 \d+\]\s*$", timeout=800)
            if not left:
                break
            left.click()
            page.keyboard.press("End")
            page.keyboard.press("Shift+Home")
            page.keyboard.press("Delete")
        return failed
    failed_imgs = step(page, "4_사진", do_images) if img_paths else []

    tag_note = ""
    if CFG.get("try_tags", True) and post.get("tags"):
        # 태그는 발행 설정 창에만 있다. 창을 열어 태그칸에만 입력하고 닫는다 (창 안의 '발행' 버튼은 절대 누르지 않음)
        try:
            pub = find_text(page, "button", r"^\s*발행\s*$", timeout=5000)
            if not pub:
                raise RuntimeError("발행 설정 버튼 없음")
            pub.click()
            page.wait_for_timeout(1500)
            tag = find(page, "input#tag-input, input[placeholder*='태그']", timeout=6000)
            if not tag:
                raise RuntimeError("태그 입력칸 없음")
            for t in post["tags"][:10]:
                tag.click()
                page.keyboard.insert_text(t)
                page.keyboard.press("Enter")
                page.wait_for_timeout(250)
            page.keyboard.press("Escape")
            page.wait_for_timeout(800)
            # Esc로 안 닫혔으면 위쪽 발행 버튼(창 열기 버튼)을 한 번 더 눌러 닫는다
            if find(page, "input#tag-input, input[placeholder*='태그']", timeout=800):
                pub.click()
                page.wait_for_timeout(800)
        except Exception as e:
            tag_note = f"태그 자동 입력 실패({e}) — 발행할 때 직접 입력"
            snap(page, "WARN_태그")
            page.keyboard.press("Escape")

    def do_save():
        btn = find(page, "button[class*='save_btn']", timeout=3000) or find_text(page, "button", r"^\s*저장\s*$", timeout=6000)
        if not btn:
            raise RuntimeError("저장 버튼을 못 찾음")
        btn.click()
        page.wait_for_timeout(3500)
        snap(page, f"OK_{blog_id}")
    step(page, "5_임시저장", do_save)
    if warns:
        tag_note = " · ".join(([tag_note] if tag_note else []) + warns)
    return failed_imgs, tag_note


# ───────────────────────── 결과 메일 ─────────────────────────
def send_mail(subject, body):
    m = CFG.get("email", {})
    if not m.get("enabled"):
        return
    try:
        msg = MIMEText(body, _charset="utf-8")
        msg["Subject"], msg["From"], msg["To"] = subject, m["smtp_user"], m["to"]
        with smtplib.SMTP_SSL(m.get("smtp_host", "smtp.gmail.com"), int(m.get("smtp_port", 465)), timeout=30) as s:
            s.login(m["smtp_user"], m["app_password"])
            s.send_message(msg)
    except Exception as e:
        log(f"메일 전송 실패: {e}")


# ───────────────────────── 메인 ─────────────────────────
DEFAULT_SCOPE = ("휴대폰 관련 생활 정보만 — 스마트폰 기능·설정 방법, 안 될 때 해결법, 배터리·카메라·저장공간 활용, "
                 "보안·분실 대처, 데이터·요금제 고르는 법, 새 기종 기능 비교·고르는 법, 기기변경 때 데이터 옮기기, "
                 "유심·eSIM, 보상판매(기존 폰 반납), 휴대폰에서 쓰는 앱·서비스 활용. "
                 "반도체·드론·로봇·AI 산업 같은 기술 산업 일반, 기업 실적·주가 뉴스는 제외")

# 휴대폰 판매점 블로그에 불리한 주제 (config.json 의 "ban_topics" 로 바꿀 수 있음)
DEFAULT_BAN = ["자급제", "알뜰폰", "공기계", "중고폰 구매", "중고폰 싸게", "위약금", "약정 해지", "해지 방법", "해지하는",
               "개통 철회", "개통 취소", "청약철회", "환불", "휴대폰 사기", "성지 사기", "폰팔이", "호갱", "불법 보조금",
               "판매점 피하", "대리점 피하", "오래 쓰는 법", "교체 미루", "바꾸지 마"]


def pick_category(blog, idx):
    cats = blog.get("categories") or CFG.get("default_categories") or ["스마트폰·앱"]
    return cats[(TODAY.toordinal() + idx) % len(cats)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--test", help="블로그 이름 또는 ID 하나만 1편 시험 (요일 무시, 제목에 [테스트])")
    ap.add_argument("--dry", action="store_true", help="임시저장 없이 파일만 만들기")
    ap.add_argument("--no-images", action="store_true")
    a = ap.parse_args()

    if not a.test and not is_workday(TODAY):
        log(f"{TODAY} 출근일 아님 — 종료")
        return

    lock = STATE / "running.lock"
    if lock.exists() and time.time() - lock.stat().st_mtime < 4 * 3600:
        log("이미 실행 중 (state/running.lock) — 종료")
        return
    lock.write_text(str(NOW()))

    blogs = CFG["blogs"]
    if a.test:
        blogs = [b for b in blogs if a.test in (b["name"], b["id"])]
        if not blogs:
            log(f"'{a.test}' 블로그가 config.json 에 없음")
            lock.unlink(missing_ok=True)
            return
    st = {} if (a.test or a.dry) else load_state()
    report = []
    keys = CFG["keys"]
    try:
        with sync_playwright() as p:
            log("사이트 접속")
            site_ctx, page = open_site(p)
            for idx, blog in enumerate(blogs):
                lid, mode = blog["id"], blog.get("mode", "branch")
                bid = blog_addr(lid)   # 블로그 주소 기준으로 글쓰기·프로필·기록
                want = 1 if a.test else int(blog.get("posts", 1))
                done = st.get(bid, {}).get("done", 0)
                need = want - done
                if need <= 0:
                    continue
                cat = pick_category(blog, idx)
                log(f"■ {blog['name']} (@{bid}) {need}편 · {cat}")
                ckey = keys["claude_hq"] if mode == "hq" else keys["claude_branch"]
                okey = keys["openai_hq"] if mode == "hq" else keys["openai_branch"]
                try:
                    res = site_run(page, {"blogId": bid, "mode": mode, "key": ckey, "category": cat, "count": need,
                                          "region": blog.get("region", ""), "regionChance": CFG.get("region_chance", 0.2),
                                          "scope": blog.get("topic_scope") or CFG.get("topic_scope") or DEFAULT_SCOPE,
                                          "maxTries": need + int(CFG.get("extra_tries", 2)),
                                          "banTopics": CFG.get("ban_topics") or DEFAULT_BAN})
                except Exception as e:
                    res = {"error": str(e)}
                if res.get("error"):
                    log(f"  ✗ 글쓰기 실패: {res['error']}")
                    report.append(f"[{blog['name']}] 글쓰기 실패: {res['error']}")
                    continue
                for s in res.get("skipped", []):
                    log(f"  ⏸ 보류: {s.get('mainKeyword')} — {' / '.join(s.get('reasons', []))}")
                    report.append(f"[{blog['name']}] 보류: {s.get('mainKeyword')} — {' / '.join(s.get('reasons', []))}")
                posts = res.get("posts", [])
                if not posts:
                    report.append(f"[{blog['name']}] 통과한 글 없음")
                    continue

                # 글마다 파일 저장 + 이미지 생성
                ready = []
                for k, post in enumerate(posts, 1):
                    d = OUT / str(TODAY) / bid / f"{done + k}"
                    d.mkdir(parents=True, exist_ok=True)
                    if a.test:
                        post["title"] = "[테스트] " + post["title"]
                    (d / "post.json").write_text(json.dumps(post, ensure_ascii=False, indent=1), encoding="utf-8")
                    (d / "post.txt").write_text(f"{post['title']}\n\n{post['bodyWithImages']}\n\n태그: {', '.join(post.get('tags', []))}", encoding="utf-8")
                    imgs, img_fail = {}, []
                    if not a.no_images:
                        for im in post.get("images", []):
                            path = d / f"img_{im['n']}.jpg"
                            ok, err = gen_image(im["prompt"], okey, path)
                            if ok:
                                imgs[im["n"]] = path
                            else:
                                img_fail.append(f"{im['n']}번({err[:80]})")
                        log(f"  이미지 {len(imgs)}/{len(post.get('images', []))}장")
                    ready.append((post, imgs, img_fail))

                if a.dry:
                    for post, imgs, img_fail in ready:
                        report.append(f"[{blog['name']}] (파일만) {post['title']} — {OUT / str(TODAY) / bid}")
                    continue

                ctx = naver_ctx(p, lid)   # 크롬 프로필은 로그인 아이디 기준 폴더
                npage = ctx.pages[0] if ctx.pages else ctx.new_page()
                # 이 크롬 프로필이 정말 이 블로그 계정인지 먼저 확인 (엉뚱한 블로그에 저장 방지)
                me = my_blog_id(npage) if is_logged_in(ctx) else ""
                if not is_logged_in(ctx) or (me and me != bid.lower()):
                    why = "네이버 로그인 풀림" if not is_logged_in(ctx) else f"블로그 주소가 기록(@{bid})과 다름 (@{me}) — 주소를 바꿨거나 다른 계정"
                    log(f"  ✗ @{bid} {why}")
                    report.append(f"[{blog['name']}] ✗ {why} — python setup_login.py {blog['name']} 실행 필요 (글은 output 폴더에 있음)")
                    ctx.close()
                    continue
                try:
                    for post, imgs, img_fail in ready:
                        try:
                            failed_imgs, tag_note = save_draft(npage, bid, post, imgs)
                            done += 1
                            if not a.test:
                                st.setdefault(bid, {"done": 0, "titles": []})
                                st[bid]["done"] = done
                                st[bid]["titles"].append(post["title"])
                                save_state(st)
                            notes = post.get("notes", []) + ([tag_note] if tag_note else [])
                            if img_fail or failed_imgs:
                                notes.append(f"사진 빠짐: {', '.join(img_fail + [str(n) + '번 넣기 실패' for n in failed_imgs])}")
                            log(f"  ✓ 임시저장: {post['title']}")
                            report.append(f"[{blog['name']}] ✓ {post['title']}  (키워드 {post['mainKeyword']}"
                                          f"{', 월 ' + str(post['monthly']) if post.get('monthly') is not None else ''})"
                                          + (f"\n    - " + "\n    - ".join(notes) if notes else "")
                                          + f"\n    태그: {', '.join(post.get('tags', []))}")
                        except LoginNeeded:
                            log(f"  ✗ @{bid} 네이버 로그인 필요")
                            report.append(f"[{blog['name']}] ✗ 네이버 로그인 풀림 — setup_login.py {blog['name']} 실행 필요 (글은 output 폴더에 있음)")
                            break
                        except Exception as e:
                            log(f"  ✗ 임시저장 실패: {e}")
                            report.append(f"[{blog['name']}] ✗ 임시저장 실패: {e} (글은 output 폴더, 화면은 debug 폴더)")
                        gap = random.uniform(*CFG.get("gap_minutes", [1, 3]))
                        time.sleep(gap * 60)
                finally:
                    ctx.close()
            site_ctx.close()
    except Exception as e:
        log("✗ 전체 실패: " + str(e))
        report.append("✗ 전체 실패: " + str(e) + "\n" + traceback.format_exc()[-800:])
    finally:
        lock.unlink(missing_ok=True)

    if report:
        ok_n = sum(1 for r in report if "✓" in r)
        bad = any("✗" in r for r in report)
        subject = f"[블로그 자동화] {TODAY} 임시저장 {ok_n}편" + (" — 확인 필요" if bad else "") + (" (시험)" if a.test else "")
        send_mail(subject, "\n\n".join(report) + "\n\n── 진행 기록 ──\n" + "\n".join(LOG_LINES[-80:]))
    log("끝")


if __name__ == "__main__":
    main()
