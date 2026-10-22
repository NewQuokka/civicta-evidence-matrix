# 기대 결과를 도구(JS)와 따로 계산한다 — 손 검산 대조용.
# 범주는 docs/rules.js를 손으로 옮겨 적은 것이다. rules.js를 고치면 아래 목록도 같이 고친다.
# 실행: python tools/expected_calc.py   → data/expected.md, docs/real-data.js 갱신
import csv, io, json, os, re, sys
sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

STAGES = ['의제설정', '숙의·공론화', '정책설계·결정', '집행·평가', 'AI 설계·개발']   # 1.2.0
STAGES_110 = STAGES[:4]   # 1.1.0 기준(개정 전) 비교용
HCI = ['접근성·포용성', '정보이해·설명', '숙의·상호작용', '피드백·반영추적', '신뢰·책임성']
REQUIRED = ['id', 'title', 'year', 'policy_stage', 'hci_dimension']


def read(path):
    """CSV를 읽어 (레코드, 제외 메시지)를 돌려준다. 줄 번호는 파일 기준(머리줄=1)."""
    text = open(path, encoding="utf-8-sig").read()
    reader = csv.reader(io.StringIO(text))
    header = next(reader)
    recs, skipped = [], []
    while True:
        start = reader.line_num + 1
        try:
            row = next(reader)
        except StopIteration:
            break
        if not any(c.strip() for c in row):
            continue                                   # 빈 줄은 조용히 건너뜀
        if len(row) != len(header):
            skipped.append(f"{start}줄 열 수 다름"); continue
        r = dict(zip(header, [c.strip() for c in row]))
        if not r['title']:
            skipped.append(f"{start}줄 제목 없음"); continue
        recs.append(r)
    return recs, skipped


def analyze(recs, stages=STAGES):
    cells = {(h, s): [] for h in HCI for s in stages}
    uncl = []
    for r in recs:
        if r['policy_stage'] in stages and r['hci_dimension'] in HCI:
            cells[(r['hci_dimension'], r['policy_stage'])].append(r['id'])
        else:
            uncl.append(r['id'])
    return cells, uncl


def section(title, path):
    recs, skipped = read(path)
    cells, uncl = analyze(recs)
    counted = sum(len(v) for v in cells.values())
    gaps = [f"{h}×{s}" for (h, s), v in cells.items() if not v]
    dois, dup, badfmt, badyear = {}, [], [], []
    for r in recs:
        d = re.sub(r'^https?://(dx\.)?doi\.org/', '', r.get('doi', '').lower())
        if d and not re.match(r'^10\.\d{4,9}/\S+$', d): badfmt.append(r['id'])
        if not (r['year'].isdigit() and 1990 <= int(r['year']) <= 2035): badyear.append(r['id'])
        if d:
            if d in dois: dup.append(f"{r['id']}(= {dois[d]})")
            else: dois[d] = r['id']
    L = [f"## {title} — `{os.path.relpath(path, ROOT).replace(os.sep, '/')}`\n",
         f"- 읽은 문헌: **{len(recs)}**" + (f" · 제외 {len(skipped)}줄 ({', '.join(skipped)})" if skipped else ""),
         f"- 매트릭스 분류 완료: **{counted}** · 미분류: **{len(uncl)}**" + (f" ({', '.join(uncl)})" if uncl else ""),
         f"- 표본 미관찰 조합: **{len(gaps)}/{len(cells)}**",
         f"- 정책 반영 근거 확인: **{sum(r.get('policy_linkage') == '반영 근거 확인' for r in recs)}**",
         f"- 중복 DOI 경고: **{len(dup)}**" + (f" ({', '.join(dup)})" if dup else ""),
         f"- DOI 형식 경고: **{len(badfmt)}**" + (f" ({', '.join(badfmt)})" if badfmt else "")
         + f" · 연도 경고: **{len(badyear)}**" + (f" ({', '.join(badyear)})" if badyear else "") + "\n",
         "| HCI 차원 \\ 정책 단계 | " + " | ".join(STAGES) + " | 행 합 |",
         "|---|" + "---:|" * (len(STAGES) + 1)]
    for h in HCI:
        n = [len(cells[(h, s)]) for s in STAGES]
        L.append(f"| {h} | " + " | ".join(map(str, n)) + f" | {sum(n)} |")
    L.append("| 열 합 | " + " | ".join(str(sum(len(cells[(h, s)]) for h in HCI)) for s in STAGES) + f" | {counted} |\n")
    L.append("칸별 ID: " + "; ".join(f"{h}×{s} = {', '.join(v)}" for (h, s), v in cells.items() if v) + "\n")
    old_cells, old_uncl = analyze(recs, STAGES_110)
    if old_uncl != uncl:
        L.append(f"- 1.1.0 기준(정책 단계 4개)으로는: 분류 **{sum(len(v) for v in old_cells.values())}** · 미분류 **{len(old_uncl)}** ({', '.join(old_uncl)}) · 미관찰 **{sum(1 for v in old_cells.values() if not v)}/{len(old_cells)}**\n")
    return L, recs


out = ["# 기대 결과 (손 검산 대조표)\n",
       "`tools/expected_calc.py`가 도구 코드와 따로 계산한 값이다. 화면 숫자와 내보낸 보고서 숫자가 이 표와 같아야 완료다.\n"]
for title, f in [("실존 문헌 16편 (DOI 확인 · 초록 기준 코딩 초안)", "data/real-literature.csv"),
                 ("가상 예시 12건 (기능 시연용, 실존 논문 아님)", "data/demo-literature.csv"),
                 ("다른 입력 (오류 처리 시험)", "data/other-input.csv"),
                 ("AI 규제·거버넌스 실존 문헌 17편 (DOI 확인 · 초록 기준 코딩 초안)", "data/ai-governance-literature.csv")]:
    L, recs = section(title, os.path.join(ROOT, f))
    out += L
out.append("> 0건 칸은 이 표본에서 관찰되지 않은 조합이다. 해당 연구가 분야 전체에 없다는 뜻이 아니다.")
open(os.path.join(ROOT, "data", "expected.md"), "w", encoding="utf-8").write("\n".join(out) + "\n")
print("\n".join(out))

real = open(os.path.join(ROOT, "data", "real-literature.csv"), encoding="utf-8-sig").read()
real_rows, _ = read(os.path.join(ROOT, "data", "real-literature.csv"))
open(os.path.join(ROOT, "docs", "real-data.js"), "w", encoding="utf-8").write(
    "/* data/real-literature.csv와 같은 내용. 직접 고치지 말고 python tools/expected_calc.py로 다시 만든다.\n"
    "   CIVICTA_REAL_CSV: import.js로 읽는 원문 / CIVICTA_REAL: import.js가 연결되지 않았을 때 쓰는 미리 읽어 둔 값 */\n"
    "window.CIVICTA_REAL_CSV = " + json.dumps(real, ensure_ascii=False) + ";\n"
    "window.CIVICTA_REAL = " + json.dumps(real_rows, ensure_ascii=False, indent=1) + ";\n")
print("\n[docs/real-data.js 갱신]")

aigov = open(os.path.join(ROOT, "data", "ai-governance-literature.csv"), encoding="utf-8-sig").read()
open(os.path.join(ROOT, "docs", "aigov-data.js"), "w", encoding="utf-8").write(
    "/* data/ai-governance-literature.csv와 같은 내용. 직접 고치지 말고 python tools/expected_calc.py로 다시 만든다. */\n"
    "window.CIVICTA_AIGOV_CSV = " + json.dumps(aigov, ensure_ascii=False) + ";\n")
print("[docs/aigov-data.js 갱신]")
