(()=>{
const K='pdfPlannerV1',EK='pdfErrorNotebookV1',DAY=86400000,$=id=>document.getElementById(id),q=(s,r=document)=>[...r.querySelectorAll(s)],BANK_CATALOG=window.PEDAGOGO_CATALOG||[];
const DAYS=[['sun','Domingo',0,'09:00',180],['mon','Segunda-feira',1,'19:00',120],['tue','Terça-feira',2,'19:00',120],['wed','Quarta-feira',3,'19:00',120],['thu','Quinta-feira',4,'19:00',120],['fri','Sexta-feira',5,'19:00',120],['sat','Sábado',6,'09:00',180]];
const PED=[
['Autores e Pensadores','Paulo Freire|Dermeval Saviani|José Carlos Libâneo|Cipriano Luckesi|Philippe Perrenoud|Maria Montessori|Emília Ferreiro|Magda Soares',5,3,1],
['Psicologia e Aprendizagem','Piaget: assimilação e acomodação|Estágios de Piaget|Vygotsky: ZDP|Mediação e linguagem|Henri Wallon|Ausubel|Behaviorismo|Construtivismo e sociointeracionismo',5,4,2],
['LDB e Legislação','Princípios da educação|Organização da educação nacional|Educação básica|Profissionais da educação|ECA e direito à educação|Constituição e educação|Gestão democrática|Responsabilidades dos sistemas',5,4,3],
['BNCC e Currículo','Competências gerais|Direitos de aprendizagem|Currículo formal, real e oculto|Planejamento curricular|Interdisciplinaridade|Competências e habilidades|Avaliação curricular|Contextualização',5,3,4],
['Didática e Tendências','Didática e processo de ensino|Planejamento|Objetivos e conteúdos|Métodos de ensino|Tendências pedagógicas|Metodologias ativas|Sequência didática|Relação professor-aluno',5,4,5],
['Avaliação da Aprendizagem','Avaliação diagnóstica|Avaliação formativa|Avaliação somativa|Instrumentos avaliativos|Critérios e feedback|Erro e aprendizagem|Recuperação contínua|Luckesi e avaliação',5,4,6],
['Inclusão e Gestão Escolar','Educação inclusiva|AEE|Acessibilidade|Gestão democrática|Projeto político-pedagógico|Coordenação pedagógica|Participação da comunidade|Diversidade',4,3,7],
['Alfabetização e Letramento','Psicogênese da escrita|Hipóteses de escrita|Alfabetização e letramento|Consciência fonológica|Práticas sociais de leitura|Produção textual|Avaliação na alfabetização|Intervenções pedagógicas',4,4,8],
['Políticas e Temas Atuais','PNE|Financiamento da educação|FUNDEB|Políticas de formação docente|Tecnologias educacionais|Educação integral|Equidade|Indicadores educacionais',4,3,9],
['Metodologia e ABNT','Pesquisa científica|Problema e objetivos|Tipos de pesquisa|Citação direta e indireta|Referências|Plágio e ética|Estrutura do trabalho acadêmico|Normas ABNT',3,3,10]];
const pad=n=>String(n).padStart(2,'0'),uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7),esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dkey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,sod=(d=new Date())=>new Date(d.getFullYear(),d.getMonth(),d.getDate()),add=(d,n)=>{let x=new Date(d);x.setDate(x.getDate()+n);return x},mof=t=>{let[a,b]=t.split(':').map(Number);return a*60+b},tof=m=>`${pad(Math.floor(m/60))}:${pad(m%60)}`,ts=(ds,t)=>{let[y,m,d]=ds.split('-').map(Number),[h,mi]=t.split(':').map(Number);return new Date(y,m-1,d,h,mi).getTime()},fh=m=>(m/60).toLocaleString('pt-BR',{maximumFractionDigits:1})+'h';
const dayKey=d=>DAYS.find(x=>x[2]===d.getDay())[0],fmt=ds=>{let[y,m,d]=ds.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'})};
let P=(()=>{try{return JSON.parse(localStorage.getItem(K)||'null')}catch{return null}})(),step=1,alarmId=null,timer=null;
const save=()=>{if(P){P.updatedAt=Date.now();localStorage.setItem(K,JSON.stringify(P))}},errs=()=>{try{return JSON.parse(localStorage.getItem(EK)||'[]')}catch{return[]}},putErr=e=>{localStorage.setItem(EK,JSON.stringify(e));window.dispatchEvent(new Event('pdf-errors-updated'))};
const prog=()=>({topicIndex:0,stage:0,completedTopics:[],reviews:[]});

function availability(){
 const r=$('plannerAvailability'); if(!r)return;
 r.innerHTML=DAYS.map(([k,l,,st,min])=>`<div class="availability-row" data-day="${k}"><label class="availability-check"><input class="day-enabled" type="checkbox" ${k==='sun'?'':'checked'}> <strong>${l}</strong></label><label>Início<input class="day-start" type="time" value="${st}"></label><label>Tempo disponível<select class="day-minutes">${[30,60,90,120,150,180,240,300].map(v=>`<option value="${v}" ${v===min?'selected':''}>${v<60?v+' min':(v/60).toLocaleString('pt-BR',{maximumFractionDigits:1})+' h'}</option>`).join('')}</select></label></div>`).join('');
}
const dayOpts=s=>DAYS.map(([k,l])=>`<option value="${k}" ${k===s?'selected':''}>${l}</option>`).join('');
function row(s={}){
 let topics=Array.isArray(s.topics)?s.topics.join('\n'):(s.topics||'');
 return `<article class="subject-row" data-subject-row data-id="${s.id||uid()}"><div class="subject-row-top"><label>Disciplina<input class="subject-name" type="text" value="${esc(s.name||'')}" placeholder="Ex.: Língua Portuguesa"></label><label>Importância<select class="subject-importance">${[1,2,3,4,5].map(v=>`<option value="${v}" ${(s.importance||3)===v?'selected':''}>${v}</option>`).join('')}</select></label><label>Dificuldade<select class="subject-difficulty">${[1,2,3,4,5].map(v=>`<option value="${v}" ${(s.difficulty||3)===v?'selected':''}>${v}</option>`).join('')}</select></label><button type="button" class="subject-remove ghost">×</button></div><label>Tópicos na ordem de estudo<textarea class="subject-topics" rows="3" placeholder="Um tópico por linha">${esc(topics)}</textarea></label></article>`;
}
function bindRemove(){q('.subject-remove',$('plannerSubjects')).forEach(b=>b.onclick=()=>b.closest('[data-subject-row]').remove())}
function addSub(s){$('plannerSubjects').insertAdjacentHTML('beforeend',row(s));bindRemove()}
function catalogEntry(name){return BANK_CATALOG.find(x=>x.name===name)}
function catalogTopics(name){return (catalogEntry(name)?.topics||[]).map(x=>x.name)}
function addCatalogSubject(name,importance,difficulty,moduleNumber=null){
  const topics=catalogTopics(name);
  if(topics.length)addSub({name,topics,importance,difficulty,moduleNumber});
}
function samples(){
  $('plannerSubjects').innerHTML='';
  if(BANK_CATALOG.length){
    addCatalogSubject('Língua Portuguesa',5,3);
    addCatalogSubject('Raciocínio Lógico',5,4);
    addCatalogSubject('Conhecimentos Pedagógicos',5,4,1);
    addCatalogSubject('Legislação Educacional',5,4,3);
  }else{
    addSub({name:'Língua Portuguesa',importance:5,difficulty:3,topics:['Interpretação de texto','Verbos','Concordância','Regência','Crase']});
    addSub({name:'Raciocínio Lógico',importance:5,difficulty:4,topics:['Proposições','Equivalência','Sequências','Probabilidade']});
    addSub({name:'Conhecimentos Pedagógicos',importance:5,difficulty:4,topics:['Didática','Planejamento','Avaliação da Aprendizagem','LDB','BNCC']});
  }
}
function pedagogy(){
  $('plannerSubjects').innerHTML='';
  if(BANK_CATALOG.length){
    addCatalogSubject('Língua Portuguesa',5,3);
    addCatalogSubject('Raciocínio Lógico',5,4);
    addCatalogSubject('Conhecimentos Pedagógicos',5,4,1);
    addCatalogSubject('Legislação Educacional',5,4,3);
    const est=catalogEntry('Legislação Estadual');if(est?.count>0)addCatalogSubject('Legislação Estadual',3,3);
  }else PED.forEach(([name,t,i,d,m])=>addSub({name,topics:t.split('|'),importance:i,difficulty:d,moduleNumber:m}));
}
function mapOldSubjectName(name){
  if(name==='Português'||name==='Lingua Portuguesa')return'Língua Portuguesa';
  if(name==='Didática')return'Conhecimentos Pedagógicos';
  return name;
}
function migrateCatalogPlan(){
  if(!P||!BANK_CATALOG.length||P.catalogVersion===2)return;
  const old=P.subjects||[],main=['Língua Portuguesa','Raciocínio Lógico','Conhecimentos Pedagógicos','Legislação Educacional'];
  const rebuilt=[];
  for(const name of main){
    const oldMatch=old.find(s=>mapOldSubjectName(s.name)===name);
    const topics=catalogTopics(name);
    if(!topics.length)continue;
    let progress=oldMatch?.progress||prog();
    if(oldMatch&&progress.topicIndex>0){
      const oldTopic=oldMatch.topics?.[Math.min(progress.topicIndex,Math.max(0,(oldMatch.topics?.length||1)-1))];
      const idx=topics.findIndex(t=>t.toLocaleLowerCase('pt-BR')===String(oldTopic||'').toLocaleLowerCase('pt-BR'));
      if(idx>=0)progress={...progress,topicIndex:idx};
    }
    rebuilt.push({id:oldMatch?.id||uid(),name,importance:oldMatch?.importance||5,difficulty:oldMatch?.difficulty||(name==='Língua Portuguesa'?3:4),topics,moduleNumber:oldMatch?.moduleNumber||null,progress});
  }
  for(const s of old){
    if(!main.includes(mapOldSubjectName(s.name))&&s.name!=='Didática')rebuilt.push(s);
  }
  P.subjects=rebuilt;
  P.catalogVersion=2;
  P.sessions=generate(P.config,P.subjects);
  save();
}
function showStep(){q('.planner-step',$('plannerWizard')).forEach(x=>x.classList.toggle('hidden',+x.dataset.step!==step));$('plannerWizardTitle').textContent=['','1. Objetivo e ritmo','2. Dias e horários','3. Disciplinas e tópicos','4. Revisões, erros e simulados'][step];$('plannerStepBar').style.width=step*25+'%';$('plannerPrevStep').classList.toggle('hidden',step===1);$('plannerNextStep').classList.toggle('hidden',step===4);$('plannerGenerate').classList.toggle('hidden',step!==4)}
function populate(){
 const c=P.config;$('plannerGoal').value=c.goal||'';$('plannerExamDate').value=c.examDate||'';$('plannerLevel').value=c.level||'intermediario';$('plannerBlockMinutes').value=c.blockMinutes||50;$('plannerBreakMinutes').value=c.breakMinutes||10;$('plannerDailyReview').value=c.dailyReview||20;$('plannerReviewDay').innerHTML=dayOpts(c.reviewDay||'sun');$('plannerErrorDay').innerHTML=dayOpts(c.errorDay||'wed');$('plannerErrorMinutes').value=c.errorMinutes||30;$('plannerSimulationMinutes').value=c.simulationMinutes||120;$('plannerSimSat').checked=(c.simDays||[]).includes('sat');$('plannerSimSun').checked=(c.simDays||[]).includes('sun');$('plannerAutoCarry').checked=c.autoCarry!==false;$('plannerAskNotifications').checked=c.askNotifications!==false;
 q('[data-day]',$('plannerAvailability')).forEach(r=>{let a=c.availability?.[r.dataset.day];if(a){r.querySelector('.day-enabled').checked=a.enabled;r.querySelector('.day-start').value=a.start;r.querySelector('.day-minutes').value=a.minutes}});
 $('plannerSubjects').innerHTML='';P.subjects.forEach(addSub)
}
function openWizard(){step=1;availability();$('plannerReviewDay').innerHTML=dayOpts('sun');$('plannerErrorDay').innerHTML=dayOpts('wed');P?populate():samples();showStep();$('plannerWizard').showModal()}
function subjects(){
 return q('[data-subject-row]',$('plannerSubjects')).map(r=>{let old=P?.subjects?.find(x=>x.id===r.dataset.id);return{id:r.dataset.id,name:r.querySelector('.subject-name').value.trim(),importance:+r.querySelector('.subject-importance').value||3,difficulty:+r.querySelector('.subject-difficulty').value||3,topics:r.querySelector('.subject-topics').value.split(/\n|;/).map(x=>x.trim()).filter(Boolean),moduleNumber:old?.moduleNumber||null,progress:old?.progress||prog()}}).filter(x=>x.name&&x.topics.length)
}
function config(){
 let av={};q('[data-day]',$('plannerAvailability')).forEach(r=>av[r.dataset.day]={enabled:r.querySelector('.day-enabled').checked,start:r.querySelector('.day-start').value||'19:00',minutes:+r.querySelector('.day-minutes').value||120});let sim=[];if($('plannerSimSat').checked)sim.push('sat');if($('plannerSimSun').checked)sim.push('sun');
 return{goal:$('plannerGoal').value.trim(),examDate:$('plannerExamDate').value,level:$('plannerLevel').value,blockMinutes:+$('plannerBlockMinutes').value||50,breakMinutes:+$('plannerBreakMinutes').value||10,availability:av,dailyReview:+$('plannerDailyReview').value||0,reviewDay:$('plannerReviewDay').value,errorDay:$('plannerErrorDay').value,errorMinutes:+$('plannerErrorMinutes').value||30,simulationMinutes:+$('plannerSimulationMinutes').value||120,simDays:sim,autoCarry:$('plannerAutoCarry').checked,askNotifications:$('plannerAskNotifications').checked}
}
function weak(s){
 let w=0;try{let z=JSON.parse(localStorage.getItem('pdfQuiz')||'{}');let hit=Object.entries(z.byCategory||{}).find(([n])=>n.toLowerCase().includes(s.name.toLowerCase())||s.name.toLowerCase().includes(n.toLowerCase()));if(hit&&hit[1].answered)w=Math.max(w,1-(hit[1].correct||0)/hit[1].answered)}catch{}
 if(s.moduleNumber)try{let z=JSON.parse(localStorage.getItem('pdfStudyMapV1')||'{}'),tot=0,n=0,a=(s.moduleNumber-1)*8+1,b=s.moduleNumber*8;for(let i=a;i<=b;i++){let l=z.mastery?.[i]?.level;tot+=l==='remembered'?1:l==='almost'?.55:l==='missed'?.15:0;n++}w=Math.max(w,1-(tot/(n||1)))}catch{}return w
}
const priority=s=>Math.max(1,s.importance*1.5+s.difficulty+weak(s)*4),finished=s=>(s.progress?.topicIndex||0)>=s.topics.length;
function pick(list,assigned,last){let active=list.filter(x=>!finished(x)),pool=active.length?active:list;if(!pool.length)return null;let rank=pool.map(s=>({s,r:(assigned[s.id]||0)/priority(s)})).sort((a,b)=>a.r-b.r);return rank.find(x=>x.s.id!==last)?.s||rank[0].s}
function sess(date,start,min,type,extra={}){return{id:uid(),date:dkey(date),start:tof(start),minutes:min,type,status:'pending',...extra}}
function generate(c,subs){
 let out=[],as={},last=null,today=sod();for(let off=0;off<28;off++){let date=add(today,off),key=dayKey(date),a=c.availability[key];if(!a?.enabled)continue;let rem=a.minutes,cur=mof(a.start);
 const put=(m,t,e={})=>{m=Math.min(m,rem);if(m<10)return;out.push(sess(date,cur,m,t,e));rem-=m;cur+=m+c.breakMinutes};
 if(c.dailyReview&&rem>=c.dailyReview+20)put(c.dailyReview,'daily-review');
 if(c.simDays.includes(key)&&rem>=45)put(Math.min(c.simulationMinutes,rem),key==='sat'?'simulation-theme':'simulation-general');
 if(key===c.reviewDay&&rem>=30)put(Math.min(c.blockMinutes,rem),'weekly-review');
 if(key===c.errorDay&&rem>=20)put(Math.min(c.errorMinutes,rem),'error-notebook');
 while(rem>=25){let s=pick(subs,as,last);if(!s)break;let m=Math.min(c.blockMinutes,rem);if(m<25)break;put(m,'adaptive',{subjectId:s.id});as[s.id]=(as[s.id]||0)+m;last=s.id}
 }return out
}
const weekAvail=c=>Object.values(c.availability).filter(x=>x.enabled).reduce((s,x)=>s+x.minutes,0);
function need(){if(!P)return 0;let cost=P.subjects.reduce((a,s)=>a+Math.max(0,s.topics.length-(s.progress?.topicIndex||0))*((P.config.blockMinutes||50)*2+20),0);if(!P.config.examDate)return weekAvail(P.config);let [y,m,d]=P.config.examDate.split('-').map(Number),weeks=Math.max(1,Math.ceil((new Date(y,m-1,d)-sod())/(7*DAY)));return Math.ceil(cost/weeks)}
const topic=s=>s.topics[s.progress?.topicIndex||0]||'Revisão final da disciplina';
const dueReview=(s,at)=>s.progress?.reviews?.find(r=>!r.done&&r.dueAt<=at);
function task(x){
 if(x.type==='adaptive'){let s=P.subjects.find(a=>a.id===x.subjectId);if(!s)return{title:'Estudo programado',topic:'',recipe:[]};let rv=dueReview(s,Math.max(Date.now(),ts(x.date,x.start)));if(rv)return{title:'Revisão espaçada — '+s.name,topic:rv.topic,subject:s,reviewId:rv.id,mode:'review',recipe:['Recupere o conteúdo sem consultar','Confira mapa/flashcards','Resolva 5 a 10 questões']};if(finished(s))return{title:'Manutenção — '+s.name,topic:'Revisão final',subject:s,mode:'maintenance',recipe:['Revisão ativa','Questões mistas','Atualize o caderno de erros']};let t=topic(s);return(s.progress?.stage||0)===0?{title:s.name+' — '+t,topic:t,subject:s,mode:'theory',recipe:['Teoria do tópico','Anotações ou mapa mental','5 questões de fixação']}:{title:'Questões — '+s.name,topic:t,subject:s,mode:'questions',recipe:['Questões do tópico','Registre erros e dúvidas','Releia só os pontos fracos']}}
 if(x.type==='daily-review')return{title:'Revisão de 24 horas',topic:'Conteúdo recente',recipe:['Recupere o que estudou ontem','Flashcards difíceis','Erros recentes']};
 if(x.type==='weekly-review')return{title:'Revisão semanal',topic:'Conteúdo da semana',recipe:['Resumos e mapas','Refaça erros','Marque fragilidades']};
 if(x.type==='error-notebook')return{title:'Caderno de erros',topic:errs().filter(e=>!e.resolved).length+' erro(s) pendente(s)',recipe:['Leia o motivo do erro','Explique a resposta correta','Refaça questão semelhante']};
 if(x.type==='simulation-theme')return{title:'Simulado temático',topic:'Conteúdo da semana',recipe:['Sem consulta','Controle o tempo','Corrija e registre erros']};
 if(x.type==='simulation-general')return{title:'Simulado geral + análise',topic:'Visão global',recipe:['Condição de prova','Corrija por disciplina','Replaneje pelos pontos fracos']};
 return{title:'Estudo programado',topic:'',recipe:[]}
}
const when=x=>x.snoozedUntil||ts(x.date,x.start),done=x=>x.status==='completed';
function next(){return P?.sessions.filter(x=>!done(x)).sort((a,b)=>when(a)-when(b))[0]||null}
function complete(x){if(!x||done(x))return;let t=task(x);x.status='completed';x.completedAt=Date.now();if(x.type==='adaptive'&&t.subject){let s=t.subject;s.progress=s.progress||prog();if(t.mode==='review'){let r=s.progress.reviews?.find(a=>a.id===t.reviewId);if(r)r.done=true}else if(t.mode==='theory')s.progress.stage=1;else if(t.mode==='questions'){let tp=topic(s);if(!s.progress.completedTopics.includes(tp))s.progress.completedTopics.push(tp);s.progress.reviews=s.progress.reviews||[];s.progress.reviews.push({id:uid(),topic:tp,dueAt:Date.now()+DAY,done:false},{id:uid(),topic:tp,dueAt:Date.now()+7*DAY,done:false});s.progress.topicIndex=Math.min(s.topics.length,(s.progress.topicIndex||0)+1);s.progress.stage=0}}save();render()}
function bounds(){let t=sod(),diff=(t.getDay()+6)%7,start=add(t,-diff);return{start,end:add(start,6)}}
function week(){let b=bounds();return P.sessions.filter(x=>{let d=new Date(x.date+'T12:00:00');return d>=b.start&&d<=b.end})}
function render(){
 if(!P){$('plannerEmpty').classList.remove('hidden');$('plannerDashboard').classList.add('hidden');$('plannerReplanBtn').classList.add('hidden');return}
 $('plannerEmpty').classList.add('hidden');$('plannerDashboard').classList.remove('hidden');$('plannerReplanBtn').classList.remove('hidden');
 let past=P.sessions.filter(x=>when(x)<=Date.now()),cmp=past.filter(done);$('plannerWeeklyHours').textContent=fh(weekAvail(P.config));$('plannerNeededHours').textContent=fh(need());$('plannerAdherence').textContent=past.length?Math.round(cmp.length/past.length*100)+'%':'0%';$('plannerErrorCount').textContent=errs().filter(e=>!e.resolved).length;
 let n=next();if(n){let t=task(n),over=when(n)<Date.now();$('plannerNextTitle').textContent=t.title;$('plannerNextMeta').textContent=`${fmt(n.date)} • ${n.start} • ${n.minutes} min${over?' • PENDENTE':''}`;$('plannerNextRecipe').innerHTML=`<strong>${esc(t.topic)}</strong>${t.recipe.map((r,i)=>`<span>${i+1}. ${esc(r)}</span>`).join('')}`;$('plannerNextCard').classList.toggle('planner-overdue',over);['plannerStartTask','plannerCompleteTask','plannerSnoozeTask'].forEach(id=>$(id).dataset.session=n.id)}else{$('plannerNextTitle').textContent='Planejamento concluído';$('plannerNextMeta').textContent='Replaneje para abrir um novo ciclo';$('plannerNextRecipe').innerHTML=''}
 let b=bounds(),ws=week();$('plannerWeekTitle').textContent=b.start.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+' a '+b.end.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
 let order=[1,2,3,4,5,6,0];$('plannerWeek').innerHTML=order.map(day=>{let D=add(b.start,(day+6)%7),key=dkey(D),items=ws.filter(x=>x.date===key).sort((a,b)=>a.start.localeCompare(b.start)),label=D.toLocaleDateString('pt-BR',{weekday:'long'});return`<article class="planner-day ${key===dkey(new Date())?'today':''}"><header><b>${label}</b><span>${D.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</span></header><div>${items.length?items.map(x=>{let t=task(x),ov=!done(x)&&when(x)<Date.now();return`<button class="planner-session ${done(x)?'done':''} ${ov?'overdue':''}" data-session="${x.id}"><time>${x.start}</time><span><b>${esc(t.title)}</b><small>${esc(t.topic)} • ${x.minutes} min</small></span><em>${done(x)?'✓':ov?'!':'›'}</em></button>`}).join(''):'<p class="planner-no-session">Sem estudo programado.</p>'}</div></article>`}).join('');
 q('[data-session]',$('plannerWeek')).forEach(b=>b.onclick=()=>{let x=P.sessions.find(s=>s.id===b.dataset.session),t=task(x);alert(t.title+'\n'+t.topic+'\n'+fmt(x.date)+' às '+x.start+' • '+x.minutes+' min\n\n'+t.recipe.join('\n'))});
 $('plannerRoadmap').innerHTML=P.subjects.map(s=>{let i=s.progress?.topicIndex||0,p=Math.round(Math.min(1,i/Math.max(1,s.topics.length))*100);return`<div class="roadmap-row"><div class="roadmap-top"><b>${esc(s.name)}</b><span>${p}%</span></div><div class="roadmap-bar"><i style="width:${p}%"></i></div><small><strong>Agora:</strong> ${esc(s.topics[i]||'Concluído')} · <strong>Depois:</strong> ${esc(s.topics[i+1]||'Revisão/manutenção')}</small></div>`}).join('');
 let planned=ws.reduce((a,x)=>a+x.minutes,0),dm=ws.filter(done).reduce((a,x)=>a+x.minutes,0),ov=ws.filter(x=>!done(x)&&when(x)<Date.now()).length,by={};ws.filter(x=>x.subjectId).forEach(x=>{let s=P.subjects.find(a=>a.id===x.subjectId);if(s)by[s.name]=(by[s.name]||0)+x.minutes});$('plannerReport').innerHTML=`<div class="report-kpis"><div><b>${fh(planned)}</b><span>planejadas</span></div><div><b>${fh(dm)}</b><span>concluídas</span></div><div><b>${ov}</b><span>pendências</span></div></div><div class="report-list">${Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([n,m])=>`<div><span>${esc(n)}</span><b>${fh(m)}</b></div>`).join('')}</div><p class="planner-report-note">${need()>weekAvail(P.config)?'⚠️ Sua carga atual está abaixo da estimativa para concluir todos os tópicos até a prova.':'✓ Sua carga semanal está compatível com o ritmo estimado.'}</p>`;
 renderErrors()
}
function renderErrors(){let e=errs(),open=e.filter(x=>!x.resolved),root=$('plannerErrors');root.innerHTML=open.length?open.slice(-30).reverse().map(x=>`<article class="planner-error"><div><span>${esc(x.subject||'Geral')}</span><b>${esc(x.question||'Questão registrada')}</b><small>${esc(x.explanation||x.correct||'Revise a explicação e refaça a questão.')}</small></div><button class="secondary compact" data-resolve="${x.id}">Revisado ✓</button></article>`).join(''):'<p>Nenhum erro pendente. Os erros das questões aparecerão aqui automaticamente.</p>';q('[data-resolve]',root).forEach(b=>b.onclick=()=>{let list=errs(),it=list.find(x=>x.id===b.dataset.resolve);if(it){it.resolved=true;it.resolvedAt=Date.now();putErr(list);render()}})}
function build(e){e.preventDefault();let c=config(),s=subjects();if(!Object.values(c.availability).some(x=>x.enabled)){alert('Marque pelo menos um dia de estudo.');step=2;showStep();return}if(!s.length){alert('Cadastre pelo menos uma disciplina com tópico.');step=3;showStep();return}P={version:1,createdAt:P?.createdAt||Date.now(),config:c,subjects:s,sessions:generate(c,s)};save();$('plannerWizard').close();render();if(c.askNotifications&&'Notification'in window&&Notification.permission==='default')Notification.requestPermission().catch(()=>{})}
function replan(){if(!P)return;let completed=P.sessions.filter(done);P.sessions=completed.concat(generate(P.config,P.subjects).filter(x=>when(x)>Date.now()-60000));save();render()}
function bankTarget(subject,topic){
  let discipline=mapOldSubjectName(subject?.name||'');
  if(!catalogEntry(discipline)){
    const hit=BANK_CATALOG.find(d=>(d.topics||[]).some(t=>t.name.toLocaleLowerCase('pt-BR')===String(topic||'').toLocaleLowerCase('pt-BR')));
    if(hit)discipline=hit.name;
  }
  let targetTopic=topic||'';
  const entry=catalogEntry(discipline);
  if(entry&&targetTopic){
    const exact=entry.topics.find(t=>t.name.toLocaleLowerCase('pt-BR')===targetTopic.toLocaleLowerCase('pt-BR'));
    if(exact)targetTopic=exact.name;
  }
  return{discipline,topic:targetTopic};
}
function start(id){let x=P?.sessions.find(s=>s.id===id);if(!x)return;x.status='started';x.startedAt=Date.now();x.endsAt=Date.now()+x.minutes*60000;save();render();let t=task(x);if(['theory','questions','review','maintenance'].includes(t.mode)&&t.subject){let target=bankTarget(t.subject,t.topic);location.href='/?discipline='+encodeURIComponent(target.discipline)+(target.topic?'&topic='+encodeURIComponent(target.topic):'')}}
function snooze(id,min){let x=P?.sessions.find(s=>s.id===id);if(!x)return;x.snoozedUntil=Date.now()+min*60000;x.notifiedAt=null;save();render()}
async function notify(x){let t=task(x);if('Notification'in window&&Notification.permission==='granted')try{let r=await navigator.serviceWorker.ready;r.showNotification('📚 '+t.title,{body:(t.topic||'Hora de estudar')+' • '+x.minutes+' min',icon:'/assets/logo-pdf-concurso.png',badge:'/assets/logo-pdf-concurso.png',tag:'planner-'+x.id,renotify:true,data:{url:'/mapas/#cronograma'}})}catch{}}
function alarms(){if(!P)return;let now=Date.now(),x=P.sessions.filter(s=>!done(s)&&s.status!=='started').sort((a,b)=>when(a)-when(b)).find(s=>when(s)<=now&&(!s.notifiedAt||now-s.notifiedAt>6*60*60*1000));if(x){x.notifiedAt=now;save();notify(x);if(!$('plannerAlertDialog').open){let t=task(x);alarmId=x.id;$('plannerAlertTitle').textContent=t.title;$('plannerAlertText').textContent=(t.topic||'')+' • '+x.minutes+' minutos. '+(t.recipe[0]||'Comece agora.');$('plannerAlertDialog').showModal()}}render()}
function bind(){
 $('plannerSetupBtn').onclick=openWizard;$('plannerEmptyStart').onclick=openWizard;$('plannerReplanBtn').onclick=replan;$('plannerWizardClose').onclick=()=>$('plannerWizard').close();$('plannerPrevStep').onclick=()=>{step=Math.max(1,step-1);showStep()};$('plannerNextStep').onclick=()=>{step=Math.min(4,step+1);showStep()};$('plannerAddSubject').onclick=()=>addSub({importance:3,difficulty:3,topics:[]});$('plannerLoadPedagogy').onclick=pedagogy;$('plannerWizardForm').onsubmit=build;
 $('plannerStartTask').onclick=e=>start(e.currentTarget.dataset.session);$('plannerCompleteTask').onclick=e=>complete(P?.sessions.find(x=>x.id===e.currentTarget.dataset.session));$('plannerSnoozeTask').onclick=e=>snooze(e.currentTarget.dataset.session,30);
 $('plannerTodayBtn').onclick=()=>document.querySelector('.planner-day.today')?.scrollIntoView({behavior:'smooth',inline:'center'});$('plannerAlertSnooze').onclick=()=>{snooze(alarmId,10);$('plannerAlertDialog').close()};$('plannerAlertStart').onclick=()=>{let id=alarmId;$('plannerAlertDialog').close();document.querySelector('[data-view="planner"]')?.click();start(id)};
 $('plannerClearResolvedErrors').onclick=()=>{putErr(errs().filter(x=>!x.resolved));render()};window.addEventListener('pdf-errors-updated',render);window.addEventListener('storage',e=>{if([K,EK,'pdfQuiz','pdfStudyMapV1'].includes(e.key))render()})
}
availability();$('plannerReviewDay').innerHTML=dayOpts('sun');$('plannerErrorDay').innerHTML=dayOpts('wed');samples();migrateCatalogPlan();bind();render();alarms();timer=setInterval(alarms,30000);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
})();