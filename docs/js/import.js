window.CIVICTA = window.CIVICTA || {};
(function(api){
  'use strict';
  // CSV 읽기 (A, Refs #4): 따옴표 안 쉼표·줄바꿈·이중 따옴표, BOM, CRLF를 처리하고
  // 각 레코드에 파일 기준 줄 번호(머리줄=1)를 남긴다. 범주 판정은 normalize.js가 맡는다.
  function rows(text){
    const out=[];let row=[],cell='',quoted=false,line=1,start=1;
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(quoted){
        if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else quoted=false;}
        else{if(c==='\n')line++;cell+=c;}
      }else if(c==='"')quoted=true;
      else if(c===','){row.push(cell);cell='';}
      else if(c==='\n'||c==='\r'){
        if(c==='\r'&&text[i+1]==='\n')i++;
        row.push(cell);out.push({line:start,cells:row});row=[];cell='';line++;start=line;
      }else cell+=c;
    }
    if(quoted)throw Error(`${start}줄: 닫히지 않은 따옴표가 있습니다.`);
    if(cell!==''||row.length){row.push(cell);out.push({line:start,cells:row});}
    return out;
  }
  function parseCSV(text,rules=window.CIVICTA_RULES){
    const all=rows(String(text??'').replace(/^﻿/,''));
    const head=all.shift();
    if(!head)throw Error('빈 CSV입니다. 머리줄이 필요합니다.');
    // 열 이름은 대소문자를 가리지 않는다: 엑셀·Zotero 등에서 내보내면 'ID,Title,Year'처럼 첫 글자가 대문자인 경우가 흔하다
    // (규칙의 열 이름이 모두 소문자라 소문자로 맞춰 읽고, 바꿔 읽었으면 경고에 한 줄 남긴다)
    const header=head.cells.map(h=>h.trim().toLowerCase());
    const recased=head.cells.some(h=>h.trim()!==h.trim().toLowerCase());
    const lack=rules.requiredColumns.filter(c=>!header.includes(c));
    if(lack.length)throw Error('필수 열 누락: '+lack.join(', '));
    const records=[],warnings=[];
    if(recased)warnings.push(`1줄: 머리줄 열 이름을 소문자로 맞춰 읽었습니다 (${head.cells.map(h=>h.trim()).join(',')}).`);
    all.forEach(({line,cells})=>{
      if(!cells.some(c=>c.trim()))return;   // 빈 줄은 조용히 건너뜀
      const label=cells[0]&&cells[0].trim()?` ${cells[0].trim()}`:'';
      if(cells.length!==header.length){warnings.push(`${line}줄${label}: 열 수가 다름 (머리줄 ${header.length}개, 이 줄 ${cells.length}개) → 제외.`);return;}
      const r={};header.forEach((h,k)=>{r[h]=cells[k].trim();});
      rules.csvColumns.forEach(c=>{if(!(c in r))r[c]='';});
      if(!r.title){warnings.push(`${line}줄${label}: 제목 없음 → 제외.`);return;}
      r._line=line;records.push(r);
    });
    return {records,warnings};
  }
  api.parseCSV=parseCSV;
})(window.CIVICTA);
