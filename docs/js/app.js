(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const api=window.CIVICTA||{}, rules=window.CIVICTA_RULES;
 // 1차 협업 중에는 상대 담당 파일이 아직 없을 수 있다. 없는 모듈은 화면에 알리고 나머지는 계속 동작한다.
 const missing=[['parseCSV','js/import.js (A)'],['validateAndNormalize','js/normalize.js (A)'],['analyze','js/matrix.js (B)'],['toMarkdown','js/export.js (B)']].filter(([fn])=>typeof api[fn]!=='function').map(([,f])=>f);
 // 담당 파일이 연결되지 않아도 예시는 볼 수 있게 하는 임시 대체. 실제 처리는 각 담당 파일이 맡는다.
 const normalize=api.validateAndNormalize||(recs=>({records:recs.map(r=>{const o={...r};if(!rules.policyStages.includes(o.policy_stage))o.policy_stage='미분류';if(!rules.hciDimensions.includes(o.hci_dimension))o.hci_dimension='미분류';return o;}),warnings:['임시 대체: js/normalize.js(A)가 연결되지 않아 범주 확인만 했습니다.']}));
 const filterRecords=api.filterRecords||((recs,p)=>{const q=String(p.keyword||'').toLowerCase();return recs.filter(r=>(!q||[r.title,r.notes,r.doi,r.technology].join(' ').toLowerCase().includes(q))&&(p.verification==='all'||r.verification===p.verification)&&(p.policy_stage==='all'||r.policy_stage===p.policy_stage)&&(!p.hci_dimension||p.hci_dimension==='all'||r.hci_dimension===p.hci_dimension));});
 const analyze=api.analyze||(recs=>{const cells=rules.hciDimensions.map(h=>rules.policyStages.map(s=>recs.filter(r=>r.hci_dimension===h&&r.policy_stage===s)));const counted=cells.flat(2).length;
   return {cells,count:recs.length,counted,unclassified:recs.length-counted,gaps:cells.flat(1).filter(c=>!c.length).length,traceable:recs.filter(r=>r.policy_linkage==='반영 근거 확인').length,demo:recs.some(r=>r.verification==='시연용 가상자료'),countsByHci:rules.hciDimensions.map((name,i)=>({name,value:cells[i].reduce((a,b)=>a+b.length,0)}))};});
 const state={records:[], warnings:[], selected:null, focus:{i:0,j:0}};
 const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const options=(id,values)=>{ const el=$(id);values.forEach(value=>{const node=document.createElement('option');node.value=value;node.textContent=value;el.appendChild(node);});};
 options('verification-filter',rules.verificationStates);
 options('policy-filter',rules.policyStages);
 options('hci-filter',rules.hciDimensions);
 function tell(msg,isError=false){$('status-message').textContent=msg;$('status-message').classList.toggle('error',isError);}
 function load(records,warnings=[],label='사용자 자료'){
   const validated=normalize(records);
   state.records=validated.records;state.warnings=[...warnings,...validated.warnings];state.selected=null;
   $('search').value='';$('policy-filter').value='all';$('hci-filter').value='all';$('verification-filter').value='all';
   // 확인할 항목이 실제로 있을 때만 안내를 붙인다(Refs #20). 경고 0건이면 읽은 건수만 알린다.
   const n=state.warnings.length;
   tell(`${label}: ${state.records.length}건을 읽었습니다.`+(n?` 확인할 항목 ${n}건이 아래에 있습니다.`:''));
   render();
 }
 function currentRows(){return filterRecords(state.records,{keyword:$('search').value,verification:$('verification-filter').value,policy_stage:$('policy-filter').value,hci_dimension:$('hci-filter').value});}
 function renderWarnings(){const box=$('warning-box');box.hidden=!state.warnings.length;$('warning-items').replaceChildren();
   state.warnings.slice(0,25).forEach(t=>{const li=document.createElement('li');li.textContent=t;$('warning-items').appendChild(li);});
   if(state.warnings.length>25){const li=document.createElement('li');li.textContent=`그 외 ${state.warnings.length-25}건`; $('warning-items').appendChild(li);}}
 function render(){
  const rows=currentRows(),result=analyze(rows),empty=rows.length===0;
  $('stat-total').textContent=rows.length;$('stat-classified').textContent=result.counted;
  $('stat-gap').textContent=empty?'—':`${result.gaps}/20`;$('stat-trace').textContent=result.traceable;
  $('data-type').textContent=result.demo?'가상 시연 데이터 포함':state.records.length?'사용자 문헌 데이터':'데이터 대기';
  const head=$('heatmap').querySelector('thead'),body=$('heatmap').querySelector('tbody');
  head.innerHTML='<tr><th scope="col">HCI 차원 ↓ / 정책 →</th>'+rules.policyStages.map(s=>`<th scope="col">${html(s)}</th>`).join('')+'</tr>';
  // 키보드 접근성(Refs #5): 칸은 하나만 Tab으로 들어가고(roving tabindex) 방향키로 옮긴다. 다시 그린 뒤에도 초점을 되돌린다.
  const hadFocus=!!document.activeElement&&document.activeElement.classList.contains('heat-cell');
  body.replaceChildren();
  rules.hciDimensions.forEach((dimension,i)=>{
    const tr=document.createElement('tr');const th=document.createElement('th');th.scope='row';th.textContent=dimension;tr.appendChild(th);
    rules.policyStages.forEach((stage,j)=>{
      const cell=result.cells[i][j],td=document.createElement('td'),button=document.createElement('button');
      button.type='button';button.className='heat-cell level-'+(cell.length===0?0:cell.length===1?1:cell.length===2?2:3);
      button.textContent=String(cell.length);button.title=`${dimension} × ${stage}: ${cell.length}건`;
      button.setAttribute('aria-label',button.title);
      button.setAttribute('aria-pressed',String(!!state.selected && state.selected.stage===stage && state.selected.dimension===dimension));
      button.dataset.i=i;button.dataset.j=j;button.tabIndex=(state.focus.i===i&&state.focus.j===j)?0:-1;
      button.addEventListener('click',()=>{state.focus={i,j};state.selected=state.selected && state.selected.stage===stage && state.selected.dimension===dimension?null:{stage,dimension};render();announce();});
      td.appendChild(button);tr.appendChild(td);
    });body.appendChild(tr);
  });
  if(hadFocus)body.querySelector(`.heat-cell[data-i="${state.focus.i}"][data-j="${state.focus.j}"]`)?.focus();
  const highest=Math.max(1,...result.countsByHci.map(o=>o.value));
  $('bar-chart').innerHTML=result.countsByHci.map(o=>`<div><div class="bar-top"><span>${html(o.name)}</span><strong>${o.value}</strong></div><div class="track"><div class="fill" style="width:${Math.round(o.value/highest*100)}%"></div></div></div>`).join('');
  const visible=state.selected?rows.filter(r=>r.policy_stage===state.selected.stage && r.hci_dimension===state.selected.dimension):rows;
  const count=visible.length;
  $('selection-desc').textContent=state.selected?`${state.selected.dimension} × ${state.selected.stage} — ${count}건의 연결 문헌`:`필터 결과 ${rows.length}건의 문헌을 표시합니다.`;
  $('empty-detail').hidden=count>0;
  const tbody=$('records-table').querySelector('tbody');tbody.replaceChildren();
  visible.forEach(r=>{
    const tr=document.createElement('tr');const cells=[];
    const url=linkFor(r.source_url,r.doi),label=r.source_url?'출처 열기':r.doi?'DOI 열기':'';
    cells.push(`<strong>${html(r.id)}</strong><br>${html(r.year)}`);
    cells.push(`<span class="row-title">${html(r.title)}</span>${url?`<a target="_blank" rel="noopener noreferrer" href="${html(url)}" class="row-source">${html(label)} ↗</a>`:''}<span class="row-notes">${html(r.notes)}</span>`);
    cells.push(html(r.policy_stage));cells.push(html(r.hci_dimension));
    cells.push(`<span class="tag ${r.verification==='시연용 가상자료'?'demo':''}">${html(r.verification)}</span>`);
    cells.push(html(r.policy_linkage));
    tr.innerHTML=cells.map(c=>`<td>${c}</td>`).join('');tbody.appendChild(tr);
  });
  renderWarnings();
 }
 // 선택 결과를 화면 읽기 프로그램에 알린다.
 const live=document.createElement('p');live.className='sr-only';live.setAttribute('aria-live','polite');live.id='matrix-live';
 $('heatmap').parentNode.appendChild(live);
 function announce(){
   const n=state.selected?currentRows().filter(r=>r.policy_stage===state.selected.stage&&r.hci_dimension===state.selected.dimension).length:currentRows().length;
   live.textContent=state.selected?`${state.selected.dimension} × ${state.selected.stage} 선택, 연결 문헌 ${n}건. 아래 근거 표에 표시합니다.`:`선택 해제, 전체 ${n}건 표시.`;
 }
 $('heatmap').querySelector('tbody').addEventListener('keydown',ev=>{
   const b=ev.target.closest('.heat-cell');if(!b)return;
   let i=Number(b.dataset.i),j=Number(b.dataset.j);const H=rules.hciDimensions.length-1,P=rules.policyStages.length-1;
   const moves={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};
   if(moves[ev.key]){i=Math.min(H,Math.max(0,i+moves[ev.key][0]));j=Math.min(P,Math.max(0,j+moves[ev.key][1]));}
   else if(ev.key==='Home'){j=0;}else if(ev.key==='End'){j=P;}else return;
   ev.preventDefault();state.focus={i,j};
   $('heatmap').querySelectorAll('.heat-cell').forEach(x=>{x.tabIndex=(Number(x.dataset.i)===i&&Number(x.dataset.j)===j)?0:-1;});
   $('heatmap').querySelector(`.heat-cell[data-i="${i}"][data-j="${j}"]`).focus();
 });
 function linkFor(url,doi){
   if(doi && /^10\.\d{4,9}\/\S+$/.test(doi))return 'https://doi.org/'+encodeURI(doi);
   try {let u=new URL(url);return /^https?:$/.test(u.protocol)?u.href:'';}catch(e){return '';}
 }
 function download(name,content,type){
   const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),anchor=document.createElement('a');
   anchor.href=url;anchor.download=name;document.body.appendChild(anchor);anchor.click();anchor.remove();
   setTimeout(()=>URL.revokeObjectURL(url),3000);
 }
 $('load-demo').addEventListener('click',()=>load(window.CIVICTA_DEMO,[], '시연용 가상 자료'));
 $('load-real').addEventListener('click',()=>{
   if(typeof api.parseCSV!=='function'){load(window.CIVICTA_REAL,[],'실존 문헌(임시 대체: 미리 읽어 둔 16편)');return;}
   try{const parsed=api.parseCSV(window.CIVICTA_REAL_CSV);load(parsed.records,parsed.warnings,'실존 문헌(초록 기준 코딩 초안)');}catch(e){tell(e.message,true);}
 });
 $('import-text').addEventListener('click',()=>{if(typeof api.parseCSV!=='function'){tell('js/import.js(A)가 아직 없습니다.',true);return;}try{let parsed=api.parseCSV($('csv-text').value);load(parsed.records,parsed.warnings,'붙여넣기 CSV');}catch(e){tell(e.message,true);}});
 $('csv-file').addEventListener('change',async ev=>{
   const file=ev.target.files?.[0];if(!file)return;if(typeof api.parseCSV!=='function'){tell('js/import.js(A)가 아직 없습니다.',true);return;}
   try{const parsed=api.parseCSV(await file.text());load(parsed.records,parsed.warnings,`${file.name}`);}catch(e){tell(e.message,true);}
 });
 // 자동화 패널(auto-panel.js)이 사람이 확정한 문헌을 보내면 지금 자료 뒤에 붙인다.
 window.addEventListener('civicta:add-records',ev=>{const d=ev.detail||{};load([...state.records,...(d.records||[])],[],d.label||'자동화 확정 문헌');});
 $('clear-data').addEventListener('click',()=>{state.records=[];state.warnings=[];state.selected=null;$('csv-text').value='';$('csv-file').value='';tell('자료를 비웠습니다.');render();});
 ['search','verification-filter','policy-filter','hci-filter'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',()=>{state.selected=null;render();}));
 $('reset-selection').addEventListener('click',()=>{state.selected=null;render();announce();});
 $('export-csv').addEventListener('click',()=>{if(typeof api.toCSV!=='function'){tell('js/export.js(B)가 아직 없습니다.',true);return;}const rows=currentRows();if(!rows.length){tell('내보낼 자료가 없습니다.',true);return;}download('civicta-literature.csv',api.toCSV(rows),'text/csv;charset=utf-8');});
 $('export-md').addEventListener('click',()=>{if(typeof api.toMarkdown!=='function'){tell('js/export.js(B)가 아직 없습니다.',true);return;}const rows=currentRows();if(!rows.length){tell('내보낼 자료가 없습니다.',true);return;}download('civicta-evidence-report.md',api.toMarkdown(rows,analyze(rows),rules,{total:state.records.length,allRecords:state.records,warnings:state.warnings,filters:{keyword:$('search').value,verification:$('verification-filter').value,policy_stage:$('policy-filter').value,hci_dimension:$('hci-filter').value}}),'text/markdown;charset=utf-8');});
 render();
 if(missing.length)tell('연결되지 않은 담당 파일: '+missing.join(', ')+' — 예시는 임시 대체로 볼 수 있습니다.',true);
})();
