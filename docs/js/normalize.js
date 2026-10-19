window.CIVICTA = window.CIVICTA || {};
(function(api){
  'use strict';
  // 기준 적용 (A, Refs #4): rules.js 목록 밖 범주는 추정하지 않고 '미분류'로 남긴다.
  // 원래 값은 raw_policy_stage·raw_hci_dimension에 보관해 보고서가 미분류 사유를 읽게 한다(#12 검토).
  // DOI 중복·형식, 발행연도는 경고만 하고 자동 삭제·수정하지 않는다.
  const DOI=/^10\.\d{4,9}\/\S+$/;
  // 한글 문서에서 흔한 가운뎃점 변형(ㆍU+318D ‧U+2027 ・U+30FB)은 rules.js의 ·(U+00B7)로 맞춰 비교한다(Refs #19).
  // 맞춘 뒤 목록에 있을 때만 바꾸고 경고로 알린다. 원래 값은 raw_*에 그대로 남긴다.
  const DOTS=/[ㆍ‧・]/g;
  function cleanDoi(s){return String(s||'').trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i,'').toLowerCase();}
  function validateAndNormalize(records,rules=window.CIVICTA_RULES){
    const warnings=[],seenDoi=new Map(),seenId=new Set();
    const out=(records||[]).map(src=>{
      const r={...src};
      rules.csvColumns.forEach(c=>{r[c]=String(r[c]??'').trim();});
      const at=(r._line?`${r._line}줄 `:'')+(r.id||'(ID 없음)');
      const warn=t=>warnings.push(`${at}: ${t}`);
      const dotted=[];
      const matchDots=(k,word,list)=>{const v=r[k].replace(DOTS,'·');if(v!==r[k]&&list.includes(v)){dotted.push(`${word} '${r[k]}'`);r[k]=v;}};
      // 주 정책단계·HCI 차원: 빈칸은 경고 없이 미분류, 목록 밖 값은 경고하고 미분류
      [['policy_stage','정책단계',rules.policyStages],['hci_dimension','HCI 차원',rules.hciDimensions]].forEach(([k,word,list])=>{
        r['raw_'+k]=r[k];
        matchDots(k,word,list);
        if(list.includes(r[k]))return;
        if(r[k])warn(`등록되지 않은 ${word} → 미분류 (${r[k]}).`);
        r[k]='미분류';
      });
      // 보조 코드: 목록 밖 값은 정해진 보류 값으로 바꾸고 알린다. 빈칸은 그대로 둔다.
      [['evidence_type','연구 유형',rules.evidenceTypes,'미분류'],['policy_linkage','정책 반영 근거',rules.policyLinkages,'미코딩·판정 보류'],
       ['verification','검토 수준',rules.verificationStates,'검토 필요']].forEach(([k,word,list,fallback])=>{
        matchDots(k,word,list);
        if(r[k]&&!list.includes(r[k])){warn(`등록되지 않은 ${word} → ${fallback} (${r[k]}).`);r[k]=fallback;}
      });
      if(dotted.length)warn(`가운뎃점을 ·로 맞춰 읽었습니다 (${dotted.join(', ')}).`);
      if(!/^\d{4}$/.test(r.year)||+r.year<rules.minYear||+r.year>rules.maxYear)
        warn(`발행연도 확인 필요 (${r.year||'빈칸'}, 허용 ${rules.minYear}–${rules.maxYear}) — 집계는 함.`);
      const doi=cleanDoi(r.doi);
      if(doi){
        if(!DOI.test(doi))warn(`DOI 형식 확인 필요 (${r.doi}) — 10.으로 시작하는 DOI만 링크합니다.`);
        else if(doi!==r.doi)r.doi=doi;   // https://doi.org/ 접두·대문자만 정리
        if(seenDoi.has(doi))warn(`중복 DOI (${doi}, 먼저 나온 ${seenDoi.get(doi)}) — 자동 삭제하지 않음.`);
        else seenDoi.set(doi,r.id);
      }
      if(r.id){if(seenId.has(r.id))warn('중복 ID — 칸별 근거가 섞일 수 있습니다.');else seenId.add(r.id);}
      return r;
    });
    return {records:out,warnings};
  }
  api.validateAndNormalize=validateAndNormalize;
})(window.CIVICTA);
