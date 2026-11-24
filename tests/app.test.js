import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import * as model from '../src/model.js';

// These tests execute the application handlers with a small DOM adapter.
// They check state-to-view behaviour, not native focus, layout or WebGL.
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const declaredIds=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]));
const code=(await readFile(new URL('../src/app.js',import.meta.url),'utf8'))
 .replace(/^import .*?;\r?\n/,'').split("import('./scene.js')")[0];
function mount(){
 const elements=new Map();let exportedBlob;
 class Element{
  constructor(id=''){this.id=id;this.value='';this.hidden=false;this.disabled=false;this.open=false;this.dataset={};this.handlers={};this.children=[];this.classList={toggle(){}};this.textContent='';}
  addEventListener(name,fn){this.handlers[name]=fn;}
  append(...nodes){this.children.push(...nodes);}prepend(node){this.children.unshift(node);}
  replaceChildren(...nodes){this.children=nodes;}
  showModal(){this.open=true;}close(){this.open=false;}
  scrollIntoView(){this.scrolled=true;}focus(){this.focused=true;}
  click(){if(!this.disabled)this.onclick?.();}
  getBoundingClientRect(){return {left:0,right:100,top:0,bottom:100};}
  setAttribute(name,value){this.attributes??={};this.attributes[name]=value;}
  removeAttribute(name){if(name==='data-verification')delete this.dataset.verification;if(this.attributes)delete this.attributes[name];}
  set innerHTML(value){this.markup=value;if(this.id==='candidate-options')radios.forEach(el=>el.disabled=false);if(this.id==='checks')checks.forEach(el=>el.disabled=false);}
  get innerHTML(){return this.markup??'';}
 }
 const get=id=>{assert.ok(declaredIds.has(id)||/^(result|ack)-[01]$/.test(id),'Unknown DOM ID: '+id);if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);};
 const why=[0,1].map(i=>Object.assign(new Element(),{dataset:{why:String(i)}}));
 const checks=[0,1].map(i=>Object.assign(new Element(),{dataset:{check:String(i)}}));
 const radios=['0','1','uncertain'].map(value=>Object.assign(new Element(),{value}));
 const questions=['alternative','limits','check'].map(question=>Object.assign(new Element(),{dataset:{question}}));
 const doc={getElementById:get,createElement:()=>new Element(),createTextNode:text=>text,
  querySelector:selector=>selector.startsWith('[data-check]')?checks.find(el=>!el.disabled):null,
  querySelectorAll:selector=>selector==='[data-why]'?why:selector==='[data-check]'?checks:selector==='[name=candidate]'?radios:selector==='[data-question]'?questions:selector==='[name=candidate],[data-check]'?[...radios,...checks]:[]};
 get('scenario').value='surface';get('scenario').selectedOptions=[{textContent:'Tread surface anomaly'}];get('mode').value='guided';
 const context=vm.createContext({...model,document:doc,window:{dispatchEvent(){}},CustomEvent:class{},performance:{now:()=>42},matchMedia:()=>({matches:true}),console,Blob,setTimeout:fn=>fn(),URL:{createObjectURL:blob=>{exportedBlob=blob;return 'blob:test';},revokeObjectURL(){}}});
 new vm.Script(code).runInContext(context);
 return {get,checks,radios,why,
  choose:value=>radios.find(el=>el.value===value).onchange(),
  review:i=>{checks[i].click();checks[i].click();},
  record:(action,note)=>{get('decision').value=action;get('decision').onchange();get('note').value=note;get('note').oninput();assert.equal(get('finalize').disabled,false);get('finalize').click();},
  scenario:id=>{get('scenario').value=id;get('scenario').onchange();},
  explore:()=>{get('mode').value='explore';get('mode').onchange();},
  export:async()=>{get('export').click();return JSON.parse(await exportedBlob.text());}
 };
}

test('Guided receipt matches the saved decision and exported event, with literal rationale text',async()=>{
 const app=mount();assert.equal(app.get('decision-summary').hidden,true);
 app.choose('0');app.why[0].click();assert.match(app.get('progress').textContent,/0 \/ 2/);app.get('explanation-done').click();
 app.review(0);app.review(1);
 const note='The indication remains.\n<strong>Hold for inspection.</strong>';
 app.record('hold',note);
 assert.equal(app.get('decision-summary').hidden,false);
 assert.equal(app.get('summary-diagnosis').textContent,'Surface crack indication');
 assert.equal(app.get('summary-disposition').textContent,'Hold wheel for investigation');
 assert.equal(app.get('summary-verification-title').textContent,'Both inspection results acknowledged');
 assert.equal(app.get('summary-checks').textContent,'2 of 2 requested · 2 of 2 acknowledged');
 assert.equal(app.get('summary-rationale').textContent,note);assert.equal(app.get('summary-rationale').innerHTML,'');
 assert.equal(app.get('decision-summary').focused,true);assert.equal(app.get('decision-summary').scrolled,true);
 assert.ok([...app.radios,...app.checks,app.get('note'),app.get('decision'),app.get('finalize')].every(el=>el.disabled));
 const exported=await app.export(),event=exported.history.find(event=>event.action==='decision_recorded');
 assert.equal(exported.simulation,true);assert.equal(event.data.note,app.get('summary-rationale').textContent);assert.equal(event.data.candidate,'0');assert.equal(event.data.verificationStatus,app.get('decision-summary').dataset.verification);
});

test('Counterevidence receipt uses the revised candidate rather than the first suggestion',()=>{
 const app=mount();app.scenario('counter');app.choose('0');app.review(0);app.review(1);app.choose('1');app.record('escalate','Cleaning removed the indication; escalate for confirmation.');
 assert.equal(app.get('summary-diagnosis').textContent,'Optical contamination');assert.equal(app.get('summary-disposition').textContent,'Escalate to specialist');assert.match(app.get('summary-context').textContent,/repeat inspection/);
});

test('Exploratory receipt explicitly preserves insufficient evidence and zero checks',()=>{
 const app=mount();app.scenario('spindle');app.explore();app.choose('uncertain');app.record('escalate','No independent checks yet; refer to a specialist.');
 assert.equal(app.get('summary-diagnosis').textContent,'Evidence insufficient / neither confirmed');assert.equal(app.get('summary-verification-title').textContent,'Verification incomplete');assert.equal(app.get('summary-checks').textContent,'0 of 2 requested · 0 of 2 acknowledged');assert.equal(app.get('decision-summary').dataset.verification,'incomplete');
});

test('Requested inspections are not counted as acknowledgements in the receipt',()=>{
 const app=mount();app.explore();app.choose('0');app.review(0);app.checks[1].click();app.record('hold','One result is still unacknowledged; hold for review.');
 assert.equal(app.get('summary-checks').textContent,'2 of 2 requested · 1 of 2 acknowledged');assert.equal(app.get('summary-verification-title').textContent,'Verification incomplete');
});

test('Reset, mode changes and scenario changes clear the receipt and unlock a fresh case',()=>{
 const app=mount();app.explore();app.choose('uncertain');app.record('escalate','Further inspection is needed.');
 app.get('reset').click();assert.equal(app.get('decision-summary').hidden,true);assert.equal(app.get('summary-rationale').textContent,'');assert.equal(app.get('summary-diagnosis').textContent,'');assert.equal(app.get('decision-summary').dataset.verification,undefined);assert.ok(app.radios.every(el=>!el.disabled));
 app.choose('0');app.record('hold','Hold pending a complete investigation.');app.scenario('thermal');assert.equal(app.get('decision-summary').hidden,true);
 app.choose('1');app.record('escalate','Independent temperature checks are needed.');app.get('mode').value='guided';app.get('mode').onchange();assert.equal(app.get('decision-summary').hidden,true);assert.equal(app.get('finalize').disabled,true);
});

test('Workflow keeps explanations optional and distinguishes guided checks from exploratory skipping',()=>{
 const app=mount();
 assert.equal(app.get('workflow-step-choose').dataset.state,'current');
 assert.equal(app.get('workflow-status-explain').textContent,'Optional');
 app.why[0].click();assert.equal(app.get('workflow-step-explain').dataset.state,'current');
 app.get('explanation-done').click();assert.equal(app.get('workflow-status-explain').textContent,'Viewed · optional');
 assert.equal(app.get('workflow-status-verify').textContent,'0 / 2 acknowledged');
 app.choose('0');assert.equal(app.get('workflow-step-verify').dataset.state,'current');
 app.review(0);assert.equal(app.get('workflow-status-verify').textContent,'1 / 2 acknowledged');
 app.review(1);assert.equal(app.get('workflow-step-record').dataset.state,'current');
 app.record('hold','The indication remains; hold for investigation.');assert.equal(app.get('workflow-status-record').textContent,'Recorded');
 app.explore();assert.equal(app.get('workflow-status-explain').textContent,'Optional');
 assert.match(app.get('workflow-help').textContent,/may skip independent checks/);
 app.choose('uncertain');assert.equal(app.get('workflow-step-verify').dataset.state,'optional');
 assert.equal(app.get('workflow-status-verify').textContent,'Optional · 0 / 2 acknowledged');
 assert.equal(app.get('workflow-step-record').dataset.state,'current');
 app.record('escalate','No checks completed; specialist review is needed.');
 assert.equal(app.get('summary-verification-title').textContent,'Verification incomplete');
 assert.equal(app.get('workflow-step-verify').dataset.state,'optional');
});
