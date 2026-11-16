import {scenarios,createState,requestCheck,verify,chooseCandidate,canFinalize,finalize} from './model.js';
const $=id=>document.getElementById(id),stations=['01 · Heat treatment','02 · CNC machining','03 · Optical inspection'];
let state=createState(),history=[],caseNumber=1;
const current=()=>scenarios.find(s=>s.id===state.scenarioId);
function log(action,detail,data={}){
 const event={time:new Date().toISOString(),elapsedMs:Math.round(performance.now()),caseId:caseNumber,scenario:state.scenarioId,mode:state.mode,action,detail,data};history.push(event);
 const li=document.createElement('li'),time=document.createElement('time');time.dateTime=event.time;time.textContent=new Date().toLocaleTimeString();li.append(time,document.createTextNode(detail));$('log').prepend(li);
}
$('scenario').innerHTML=scenarios.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
function render(){
 const s=current();$('station').textContent=stations[s.station];s.metrics.forEach((v,i)=>$('m'+i).textContent=v);document.querySelectorAll('.stations span').forEach((el,i)=>el.classList.toggle('selected',s.station===i));
 $('candidate-options').innerHTML=s.candidates.map((c,i)=>`<article class="candidate"><div class="candidate-title"><span class="rank">0${i+1}</span>${c.name}</div><button class="why-button" data-why="${i}" aria-haspopup="dialog">Why this candidate? <span>↗</span></button><label class="candidate-choice"><input type="radio" name="candidate" value="${i}"> Select candidate ${i+1}</label></article>`).join('')+'<label class="uncertain"><input type="radio" name="candidate" value="uncertain"> Evidence insufficient / neither confirmed</label>';
 document.querySelectorAll('[data-why]').forEach(button=>button.onclick=()=>openExplanation(Number(button.dataset.why)));
 document.querySelectorAll('[name=candidate]').forEach(input=>input.onchange=()=>{const previous=state.candidate;state=chooseCandidate(state,input.value);log('candidate_selected','Selected diagnosis: '+(input.value==='uncertain'?'Evidence insufficient':s.candidates[Number(input.value)].name),{previous,selected:input.value,acknowledged:[...state.verified]});update();});
 $('evidence-list').innerHTML=s.evidence.map(e=>`<li>${e}</li>`).join('');
 $('checks').innerHTML=s.checks.map((c,i)=>`<div class="check"><span class="number">0${i+1}</span><div>${c}<p id="result-${i}" hidden></p><p id="ack-${i}" hidden>Result displayed; acknowledgement pending.</p></div><button data-check="${i}">Request fixture ↗</button></div>`).join('');
 document.querySelectorAll('[data-check]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.check);if(!state.requested.includes(i)){state=requestCheck(state,i);$('result-'+i).hidden=false;$('result-'+i).textContent=s.results[i];$('ack-'+i).hidden=false;b.textContent='Acknowledge result';log('verification_requested','Requested and displayed independent fixture '+(i+1),{checkIndex:i,result:s.results[i]});}else{state=verify(state,i);$('ack-'+i).textContent='Acknowledged by operator · simulated observation';b.textContent='Acknowledged ✓';b.disabled=true;log('verification_acknowledged','Acknowledged independent fixture '+(i+1),{checkIndex:i});}update();});
 $('note').value='';$('note').disabled=false;$('decision').disabled=false;$('decision').value='';$('evidence').open=false;
 $('mode-help').textContent=state.mode==='guided'?'Acknowledge both inspections before recording. Changing scenario or mode starts a new case.':'Inspection is optional; incomplete verification is recorded. Changing scenario or mode starts a new case.';
 update();window.dispatchEvent(new CustomEvent('scenario-change',{detail:s}));
}
function update(){
 $('progress').textContent=`${state.verified.length} / 2 ACKNOWLEDGED`;$('finalize').disabled=!canFinalize(state,$('note').value)||!$('decision').value;
 $('verification-summary').textContent=`${state.requested.length} requested · ${state.verified.length} acknowledged. Explanation viewing is separate from inspection.`;
 $('decision-status').textContent=state.decision?`Recorded: ${state.decision.action.toUpperCase()} · verification ${state.decision.verificationStatus} · simulation only`:state.mode==='explore'&&state.verified.length<2?'Verification incomplete. Exploratory mode allows recording this explicitly.':'Select a diagnosis and disposition, add a rationale'+(state.mode==='guided'?' and acknowledge both checks.':'.');
}
// Native dialog provides modal focus handling, keyboard Escape and focus restoration.
let explanationIndex=null;
const dialog=$('explanation-dialog');
function closeExplanation(reason='close_button'){
 if(!dialog.open)return;
 log('explanation_close','Closed diagnostic explanation',{candidateIndex:explanationIndex,reason});
 dialog.close();explanationIndex=null;
}
function openExplanation(index){
 const s=current(),c=s.candidates[index];explanationIndex=index;
 $('explanation-title').textContent=c.name;
 $('explanation-context').textContent=`${stations[s.station]} / Candidate ${index+1} / ${s.id}`;
 $('explanation-reason').textContent=c.why;
 $('explanation-evidence').replaceChildren(...c.evidenceIds.map(i=>{const li=document.createElement('li');li.textContent=s.evidence[i];return li;}));
 $('explanation-limit').textContent=c.limit;
 $('explanation-next').textContent=c.nextCheck;
 $('explanation-source').textContent=`Source: ${s.id} / src/model.js · fixture v2. Independent inspection results were not used in this suggestion.`;
 $('followup-answer').hidden=true;
 dialog.showModal();
 log('explanation_open','Opened diagnostic explanation: '+c.name,{candidateIndex:index,presentation:'dialog'});
}
$('explanation-close').onclick=()=>closeExplanation();
$('explanation-done').onclick=()=>closeExplanation('return_to_candidates');
// Cancel the default Escape action so it uses the same logging path.
dialog.addEventListener('cancel',event=>{event.preventDefault();closeExplanation('escape');});
dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeExplanation('backdrop');});
const questions={alternative:'What else could explain this?',limits:'What is still uncertain?',check:'How should I check this?'};
document.querySelectorAll('[data-question]').forEach(button=>button.onclick=()=>{
 const s=current(),c=s.candidates[explanationIndex],other=s.candidates[1-explanationIndex],kind=button.dataset.question;
 $('followup-question').textContent=questions[kind];
 $('followup-text').textContent=kind==='alternative'?`${other.name}: ${other.why} ${other.limit}`:kind==='limits'?`${c.limit} This is a fixed teaching scenario, not a measured diagnosis. Opening this explanation does not verify the fault.`:`Request the independent fixtures in the verification panel, including ${c.nextCheck.toLowerCase()}. Read each result, acknowledge it and reconsider your diagnosis. No check has been requested by this explanation.`;
 $('followup-answer').hidden=false;
 log('explanation_followup','Selected scripted follow-up: '+questions[kind],{candidateIndex:explanationIndex,question:kind});
});
$('explanation-verify').onclick=()=>{closeExplanation('go_to_verification');$('verification').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});document.querySelector('[data-check]:not(:disabled)')?.focus({preventScroll:true});};

function newCase(reason){closeExplanation('case_change');state=createState($('scenario').value,$('mode').value);caseNumber++;render();log('case_started',reason,{fixtureVersion:2});}
$('scenario').onchange=()=>newCase('Loaded scenario: '+$('scenario').selectedOptions[0].textContent);$('mode').onchange=()=>newCase('Changed mode; started a fresh case.');$('reset').onclick=()=>newCase('Case reset; prior events retained under their original case ID.');$('note').oninput=update;$('decision').onchange=update;
$('finalize').onclick=()=>{state=finalize(state,$('decision').value,$('note').value);log('decision_recorded',`Operator decision: ${state.decision.action.toUpperCase()} · verification ${state.decision.verificationStatus}`,state.decision);$('note').disabled=true;$('decision').disabled=true;document.querySelectorAll('[name=candidate],[data-check]').forEach(el=>el.disabled=true);update();};
$('fault-marker').onclick=()=>{$('evidence').open=true;$('evidence').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});log('marker','Inspected fault marker: '+stations[current().station]);};
$('evidence').addEventListener('toggle',()=>{if($('evidence').open)log('evidence_open','Viewed scenario evidence');});
$('export').onclick=()=>{log('export','Exported session log');const blob=new Blob([JSON.stringify({prototype:'AXIS Assignment 2',schemaVersion:2,simulation:true,notice:'Scripted teaching fixtures. Explanation opens and acknowledgements do not prove understanding. No measured automation-bias reduction.',history},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='axis-session.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
render();log('case_started','Loaded scenario: '+current().name,{fixtureVersion:2});
import('./scene.js').then(({initScene})=>initScene(current(),log)).catch(error=>{console.error(error);$('scene-status').textContent='3D unavailable: use a WebGL-capable browser and serve this folder over HTTP. Diagnosis and verification remain available.';$('pause').disabled=true;$('camera').disabled=true;});
