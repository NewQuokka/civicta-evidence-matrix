/*
 * CivicTA Evidence Matrix — 연구자가 검토하고 PR로 변경하는 코딩 기준.
 * 절대 제목 키워드만으로 논문의 내용·정책 반영 여부를 자동 추정하지 않습니다.
 */
window.CIVICTA_RULES = Object.freeze({
  version: '1.2.0',
  name: 'CivicTA 문헌 코딩 프레임',
  policyStages: ['의제설정', '숙의·공론화', '정책설계·결정', '집행·평가', 'AI 설계·개발'],
  hciDimensions: ['접근성·포용성', '정보이해·설명', '숙의·상호작용', '피드백·반영추적', '신뢰·책임성'],
  evidenceTypes: ['실증연구', '사례연구', '문헌연구', '개념·규범연구', '미분류'],
  policyLinkages: ['반영 근거 확인', '반영 주장·근거 불명', '반영 정보 없음', '해당 없음', '미코딩·판정 보류'],
  verificationStates: ['원문 검토', '초록 검토', '서지 확인', '검토 필요', '시연용 가상자료'],
  requiredColumns: ['id', 'title', 'year', 'policy_stage', 'hci_dimension'],
  csvColumns: ['id', 'title', 'year', 'doi', 'technology', 'policy_stage', 'hci_dimension', 'evidence_type', 'policy_linkage', 'verification', 'source_url', 'notes'],
  minYear: 1990,
  maxYear: 2035,
  // 0건은 연구 부재가 아니라 이 표본에서 미관찰된 조합을 뜻함.
  gapInterpretation: '이 자료집에서 관찰되지 않은 조합입니다. 분야 전체에 해당 연구가 없다는 뜻이 아닙니다.',
  codingProtocol: [
    '서지정보(DOI/발행연도)와 논문 내용 코딩을 구분한다.',
    '초록만 본 경우 원문 분석으로 확인한 것처럼 표기하지 않는다.',
    '논문 하나당 1개의 주 정책단계와 1개의 주 HCI차원을 기록한다.',
    '여러 차원을 다룬다면 주차원 선택 근거를 notes에 남긴다.',
    '정책 반영은 보고·제안과 실제 수용 근거를 구별한다.',
    '분류가 불명확한 항목은 추정하지 않고 미분류로 남긴다.',
    '정책 반영은 결정문·회의록·후속 공지처럼 제안과 결과를 잇는 기록이 있을 때만 반영 근거 확인으로 한다.',
    'HCI 차원은 화면·기능의 존재가 아니라 참여자 경험 근거(관찰·설문·인터뷰)를 기준으로 고른다.',
    '참여가 정부 정책 과정이 아니라 AI 시스템을 만드는 기업·연구자의 설계·개발 과정에서 일어나면 정책 단계를 AI 설계·개발로 한다(1.2.0).'
  ]
});
