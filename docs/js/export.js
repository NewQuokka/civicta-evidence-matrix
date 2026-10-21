window.CIVICTA = window.CIVICTA || {};
(function(api){
 'use strict';
 function csvCell(value){
   let s=String(value??'');
   // Office 스프레드시트에서 사용자 제공 문자열이 수식으로 실행되지 않도록 보호
   if(/^[=+@\-\t\r]/.test(s))s="'"+s;
   return '"'+s.replace(/"/g,'""')+'"';
 }
 // \uBBF8\uBD84\uB958\uB85C \uBC14\uB010 \uC815\uCC45\uB2E8\uACC4\u00B7HCI \uCC28\uC6D0\uC740 normalize.js\uAC00 \uB0A8\uAE34 \uC6D0\uB798 \uAC12(raw_*)\uC73C\uB85C \uB0B4\uBCF4\uB0B8\uB2E4.
 // '\uBBF8\uBD84\uB958'\uB97C \uADF8\uB300\uB85C \uC4F0\uBA74 \uB2E4\uC2DC \uB123\uC744 \uB54C \uC624\uD0C0 \uC6D0\uBB38\uC774 \uC0AC\uB77C\uC9C0\uACE0, \uBE48\uCE78\uC774 '\uBAA9\uB85D \uBC16 \uAC12 \uBBF8\uBD84\uB958' \uACBD\uACE0\uB85C \uBC14\uB010\uB2E4.
 const cellValue=(r,c)=>r[c]==='\uBBF8\uBD84\uB958'&&('raw_'+c) in r?r['raw_'+c]:r[c];
 function toCSV(rows,rules=window.CIVICTA_RULES){
   return '\uFEFF'+[rules.csvColumns.join(','),...rows.map(r=>rules.csvColumns.map(c=>csvCell(cellValue(r,c))).join(','))].join('\r\n');
 }
 // 미분류 사유: normalize.js 경고("ID: 등록되지 않은 정책단계 → 미분류 (값)")가 있으면 그 값을, 없으면 빈칸으로 본다 (Refs #6)
 function unclassifiedReasons(rows,warnings=[]){
   const fields=[['policy_stage','정책단계','정책 단계'],['hci_dimension','HCI 차원','HCI 차원']];
   return rows.filter(r=>r.policy_stage==='미분류'||r.hci_dimension==='미분류').map(r=>{
     const why=fields.filter(([k])=>r[k]==='미분류').map(([k,word,label])=>{
       // normalize.js가 남긴 원래 값(raw_*)을 먼저 본다. 없으면 경고 문구에서 찾는다 (Refs #4)
       const raw=String(r['raw_'+k]??'').trim();
       if(raw&&raw!=='미분류')return `${label}: 목록 밖 값 '${raw}'`;
       const hit=warnings.find(t=>(' '+t).includes(' '+r.id+':')&&t.includes('등록되지 않은 '+word));
       const m=hit&&hit.match(/→ 미분류 \((.*)\)\.?$/);
       return m?`${label}: 목록 밖 값 '${m[1]}'`:`${label}: 빈칸`;
     });
     return {id:r.id,title:r.title,reason:why.join(' · ')};
   });
 }
 const cellText=x=>String(x??'').replace(/\|/g,'\\|').replace(/\r?\n/g,' ');
 function toMarkdown(rows,analysis,rules=window.CIVICTA_RULES,context={}){
   const lines=[`# 시민참여 기술영향평가 문헌 비교`, ``, `- 집계 대상: ${analysis.count}건`,
     `- 주 정책단계·HCI차원이 모두 분류된 문헌: ${analysis.counted}건`, `- 미분류: ${analysis.unclassified}건`,
     `- 표본에서 미관찰된 조합: ${analysis.gaps}개`, `- 정책 반영 근거가 확인되었다고 입력된 건: ${analysis.traceable}건`,
     `- 분류 규칙 버전: ${rules.version}`, ``, `> 주의: ${rules.gapInterpretation}`,
     ...(analysis.demo?['> 주의: 가상 시연 데이터가 포함되어 있습니다. 실증 분석 결과가 아닙니다.']:[]),``,
     `| HCI 차원 / 정책단계 | ${rules.policyStages.join(' | ')} |`,`| --- | ${rules.policyStages.map(()=> '---:').join(' | ')} |`];
   rules.hciDimensions.forEach((h,i)=>lines.push(`| ${h} | ${analysis.cells[i].map(c=>c.length).join(' | ')} |`));
   lines.push('',`## 문헌별 코딩`, '| ID | 제목 | 연도 | 정책단계 | HCI 차원 | 검토 수준 | DOI |', '| --- | --- | --- | --- | --- | --- | --- |');
   rows.forEach(r=>lines.push(`| ${[r.id,r.title,r.year,r.policy_stage,r.hci_dimension,r.verification,r.doi].map(cellText).join(' | ')} |`));
   // 분석 범위·미분류 사유·입력 경고: 정책연구에 다시 쓸 때 결과의 조건을 함께 남긴다
   const f=context.filters||{},show=v=>!v||v==='all'?'전체':v;
   lines.push('','## 분석 범위',
     `- 불러온 문헌: ${context.total??rows.length}건 → 필터 결과(이 보고서의 집계 대상): ${rows.length}건`,
     `- 검색어: ${f.keyword?`'${cellText(f.keyword)}'`:'없음'} · 검토 수준: ${show(f.verification)} · 정책 단계: ${show(f.policy_stage)} · HCI 차원: ${show(f.hci_dimension)}`);
   // 미분류 문헌은 필터에 걸려 빠지기 쉬우므로 불러온 문헌 전체(allRecords)를 기준으로 남긴다
   const un=unclassifiedReasons(context.allRecords||rows,context.warnings||[]);
   lines.push('',`## 미분류 문헌과 사유 (${un.length}건${context.allRecords?', 불러온 문헌 전체 기준':''})`);
   if(un.length){lines.push('| ID | 제목 | 사유 |','| --- | --- | --- |');un.forEach(u=>lines.push(`| ${[u.id,u.title,u.reason].map(cellText).join(' | ')} |`));}
   else lines.push('- 없음');
   const w=context.warnings||[];
   lines.push('',`## 입력 경고 (${w.length}건)`,...(w.length?w.map(t=>`- ${cellText(t)}`):['- 없음']));
   return lines.join('\n');
 }
 api.toCSV=toCSV;api.toMarkdown=toMarkdown;api.unclassifiedReasons=unclassifiedReasons;
})(window.CIVICTA);
