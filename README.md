# CivicTA Evidence Matrix

**신흥기술 영향평가의 시민참여·사용자 경험·정책 반영성에 관한 근거 기반 연구공백 분석 도구**
*Participatory Technology Assessment × Human–Computer Interaction × Science & Technology Policy*

「신흥기술영향평가세미나」 7주차 2인 1조 실습 · 도구 ② 문헌 비교 매트릭스

> 신흥기술 영향평가에서 시민의 참여를 지원하는 디지털 플랫폼은 얼마나 접근 가능하고 숙의를 지원하며 시민의 의견이 실제 과학기술정책에 반영되는 과정을 얼마나 투명하게 보여 주는가?

문헌 목록 CSV를 넣으면 `docs/rules.js`의 코딩 기준대로 정리해 **HCI 차원(5) × 정책 단계(4)** 매트릭스를 만듭니다. 칸을 누르면 근거 문헌이 나오고 CSV·마크다운으로 내보낼 수도 있습니다.

## 배포 주소
- 소유자(morins): https://morins.github.io/civicta-evidence-matrix/ — 확인 완료(2026-10-18, main `/docs`)
- 팀원(NewQuokka, fork): https://newquokka.github.io/civicta-evidence-matrix/ — 확인 완료(2026-10-18)

## 설명영상 (30초 안팎)
배포 주소를 그대로 녹화하고, 내레이션은 팀원 목소리로 넣었습니다. 실존 문헌 16편 → 매트릭스 → 키보드로 칸 선택 → 자동화 견본을 사람이 고쳐 확정 → 보고서 내보내기 순서입니다.

https://github.com/user-attachments/assets/8801d966-0ebd-42ee-9c01-b200677fb4e6

- 위 재생기는 GitHub에 올린 같은 영상입니다(저장소 안 mp4는 GitHub가 재생하지 않음). 원본 파일: [media/intro.mp4](media/intro.mp4) (1280×720, 10MB 이하) · 대본: [reports/시연영상_스토리보드.md](reports/시연영상_스토리보드.md)

## 두 가지 예시 입력
| 버튼 | 파일 | 성격 |
|---|---|---|
| **실존 문헌 16편** | `data/real-literature.csv` | DOI 16건 모두 Crossref에서 실재 확인(2026-10-17). 코딩은 **초록 기준 초안**(`초록 검토`)이며 원문 검토 전이다 |
| 가상 예시 12건 | `data/demo-literature.csv` | 화면·기능 시연용 **모의 자료**. 실존 논문이 아니다 |
| (다른 입력) | `data/other-input.csv` | 빈 줄·제목 없음·열 수 오류·미지의 범주·중복 DOI·DOI 형식·연도 오류 시험 |

기대 결과는 `data/expected.md`에 있습니다. 도구 코드와 별개로 `python tools/expected_calc.py`가 계산한 값입니다. 화면 숫자가 이 표와 같아야 완료입니다.

**실존 16편 요약** — 분류 16 · 표본 미관찰 12/20칸 · 손 검산 칸: 숙의·상호작용×숙의·공론화 = 5, 신뢰·책임성×정책설계·결정 = 3, 피드백·반영추적×집행·평가 = 1

> 0건 칸은 **이 표본에서 관찰되지 않은 조합**입니다. 분야 전체에 연구가 없다는 뜻이 아닙니다.

## 실행
1. `docs/index.html`을 더블클릭하거나 배포 주소를 엽니다. 서버가 없고, 기본 화면은 외부 요청이나 AI 호출 없이 동작합니다.
2. **실존 문헌 16편 불러오기** → 매트릭스 → 칸 클릭 → 근거 문헌 확인
3. 내 자료는 **CSV 파일 선택** 또는 붙여넣기
4. **문헌 CSV 다운로드** · **분석 보고서(.md) 다운로드**
5. 검사: `node tests/test.js` (필요한 담당 파일이 아직 병합 전이면 그 검사는 SKIP)

## 자동화 두 가지 방식
화면의 **01-B 자동화** 패널에서 고릅니다. 어느 쪽이든 AI는 코딩을 **제안**만 하고, 사람이 표에서 확인·수정해 체크한 문헌만 매트릭스에 들어갑니다.

| 방식 | 필요한 것 | 하는 일 |
|---|---|---|
| ① 샘플 보기 | 없음 (API 키·네트워크 불필요) | 실존 6편에 대한 AI 제안 **견본**(`docs/ai-sample.js`)을 불러와 사람 코딩과 비교하고 확정해 본다. 견본은 실제 API 호출 결과가 아니다 |
| ② 실제 자동화 | 각자 본인의 Anthropic API 키 | DOI 목록 → 공개 API(OpenAlex·Crossref)로 서지·초록 수집(키 불필요) → Claude가 `rules.js` 범주로 코딩 제안 → 사람이 확정 |

- 모델: 기본 `claude-opus-5-5`. 화면에서 Sonnet 5.5·Haiku 5.5로 바꿀 수 있다. 예상 비용과 실제 사용 비용이 화면에 뜬다.
- 응답은 JSON 스키마로 받고, 범주가 `rules.js` 목록 밖이면 `미분류`로 바꾼다. 거절·잘림은 오류로 표시한다.
- **API 키 관리**: 키는 각자 화면에 직접 넣는다. 저장소·CSV·보고서 어디에도 남지 않고, 이 브라우저에서 Anthropic API로만 전송된다. '이 탭을 닫을 때까지만 기억'을 고르면 sessionStorage에만 둔다. 공용 PC·화면 녹화·화면 공유 중에는 넣지 않는다. 비용은 키 주인 계정에 청구된다.
- 확정한 문헌은 검토 수준 `초록 검토`로 들어가고, 메모에 AI 제안 모델·확신도·근거와 사람이 범주를 고쳤는지가 남는다. '제안 CSV 내보내기'는 확정 전 자료라 `검토 필요`로 내보낸다.
- 검사: `node tests/ai.test.js` (가짜 응답으로 검사, 키·네트워크 불필요)

## CSV 형식
필수 열: `id,title,year,policy_stage,hci_dimension`
```csv
id,title,year,doi,technology,policy_stage,hci_dimension,evidence_type,policy_linkage,verification,source_url,notes
```
- 정책 단계: 의제설정 / 숙의·공론화 / 정책설계·결정 / 집행·평가
- HCI 차원: 접근성·포용성 / 정보이해·설명 / 숙의·상호작용 / 피드백·반영추적 / 신뢰·책임성
- 등록되지 않은 값은 추정하지 않고 **미분류**로 남긴 뒤 경고합니다. 정의는 `planning/분류_코드북.md`

## 2인 협업
| 역할 | 누구 | 저장소 | 맡은 파일 | 하는 일 |
|---|---|---|---|---|
| **A** 과학기술정책 | NewQuokka | 팀원 (fork로 배포) | `docs/js/import.js` · `docs/js/normalize.js` | 문헌 입력·데이터 정제·분류 기준 검증 |
| **B** HCI | morins | 소유자 | `docs/js/matrix.js` · `docs/js/export.js` | 비교 매트릭스·시각화·결과 내보내기 |
| 공동 | 두 사람 | | `planning/기획안.md` · `docs/rules.js` · `docs/index.html` · `docs/js/app.js` · README | 기획안·처리 규칙·기본 화면·설명 |

- 기준(`docs/rules.js`)을 바꿀 때는 브랜치 → PR → 상대 리뷰 → 병합. 내 PR은 내가 승인하지 않습니다.
- 커밋·PR에는 `Refs #이슈번호`를 쓰고 완료 조건을 확인한 뒤 이슈를 닫습니다.
- `main`은 보호 브랜치입니다. PR → 상대 승인 1명 → 테스트(GitHub Actions `tests`) 통과 뒤에만 병합되고, 강제 푸시와 삭제는 막혀 있습니다. 검사는 `node tests/test.js`·`node tests/ai.test.js`와 같습니다.

## 인접 팀에 보낸 개선 제안
- 받은 팀 저장소: [LoveEvaLee/ai-trend-monitor](https://github.com/LoveEvaLee/ai-trend-monitor) (AI 동향 모니터)
- 보낸 PR: https://github.com/LoveEvaLee/ai-trend-monitor/pull/29
- 제안 한 줄: 머리글 없는 CSV나 열 순서가 다른 CSV를 넣으면 기사가 경고 없이 빠지는 문제를, 열 이름으로 칸을 찾고 달리 읽은 경우 알리도록 고침
- 자세한 기록: [reports/인접팀_피드백_양식.md](reports/인접팀_피드백_양식.md)

## 파일
```
docs/            GitHub Pages (main /docs)
  index.html     화면 [공동]
  rules.js       코딩 기준 [공동]
  real-data.js   실존 16편 (tools/expected_calc.py가 생성)
  demo-data.js   가상 12건
  js/import.js   CSV 읽기·줄 번호 [A]
  js/normalize.js 기준 적용·미분류·경고 [A]
  js/matrix.js   집계·필터 [B]
  js/export.js   CSV·마크다운 [B]
  js/app.js      화면 연결 [공동]
  js/ai.js       자동화: 초록 수집·Claude 호출·응답 검사 [B]
  js/auto-panel.js 자동화 화면: 샘플/실제 모드·확정 표 [B]
  ai-sample.js   자동화 견본 6편 (API 호출 아님)
data/            예시 입력 3종과 기대 결과
planning/        기획안 · 분류 코드북 · 고도화 이슈
reports/         발표·영상·인접 팀·제출 양식
tools/           기대 결과 계산
tests/           node 검사
```

## 연구 윤리와 한계
- 기본 화면과 샘플 모드는 AI를 호출하지 않습니다. 실제 자동화는 사용자가 본인 API 키를 넣고 실행할 때만 Claude API를 부르며, 결과는 제안일 뿐 사람이 확정해야 집계에 들어갑니다.
- DOI 실재 확인과 내용 코딩은 별개입니다. 실존 16편의 코딩은 초록만 읽은 초안이므로 연구 결론에 쓰려면 원문 검토가 필요합니다.
- 주 정책 단계 1개·주 HCI 차원 1개만 부여합니다. 부차 측면은 `notes`에 남깁니다.
- 공개 저장소에는 서지정보와 팀의 코딩만 둡니다. 초록 전문·비공개 자료·개인정보는 올리지 않습니다.

## 출발점 문헌
- OECD (2022), *OECD Guidelines for Citizen Participation Processes*. https://doi.org/10.1787/f765caf6-en
- Kaplan et al. (2021), *Designing Participatory Technology Assessments*. https://doi.org/10.1016/j.techfore.2021.120974
- Shin et al. (2024), *A systematic analysis of digital tools for citizen participation*. https://doi.org/10.1016/j.giq.2024.101954
- Yang et al. (2024), *The Future of HCI-Policy Collaboration*. arXiv:2409.19738 (프리프린트)
