(async function appMain(){
  const CARDS = await fetch("cards.json",{cache:"no-store"}).then(r=>{
    if(!r.ok) throw new Error("Falha ao carregar cards");
    return r.json();
  });
  const ICONS=["","🧠","🧩","⚖️","🧭","🎓","📊","🤝","✍️","🌐","🔬"];
  const STORAGE_KEY="pdfStudyMapV1";
  const DAY=86400000;
  const MODULES=Array.from({length:10},(_,i)=>{
    const number=i+1;
    const cards=CARDS.filter(c=>c.module===number);
    return {number,title:cards[0].category,icon:ICONS[number],cards};
  });
  const defaults={mastery:{},quiz:{answered:0,correct:0},quizByModule:{},lastModule:1,lastCard:1,lastView:"home"};
  const el=id=>document.getElementById(id);
  const clone=o=>JSON.parse(JSON.stringify(o));
  let state;
  try{
    const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");
    state={...defaults,...raw,mastery:{...(raw.mastery||{})},quiz:{...defaults.quiz,...(raw.quiz||{})},quizByModule:{...(raw.quizByModule||{})}};
  }catch{state=clone(defaults)}
  let activeModule=state.lastModule||1;
  let cardPool=[...CARDS];
  let cardIndex=Math.max(0,cardPool.findIndex(c=>c.id===(state.lastCard||1)));
  let quizSession=null;
  let deferredInstall=null;
  let dialogCardId=null;

  function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
  function mastery(id){return state.mastery[id]||null}
  function scoreFor(id){
    const level=mastery(id)?.level;
    if(level==="remembered")return 1;
    if(level==="almost")return .55;
    if(level==="missed")return .15;
    return 0;
  }
  function modulePercent(n){
    const list=MODULES[n-1].cards;
    return Math.round(list.reduce((s,c)=>s+scoreFor(c.id),0)/list.length*100);
  }
  function shuffle(list){
    const a=[...list];
    for(let i=a.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }
  function dueCards(){
    const now=Date.now();
    return CARDS.filter(c=>{
      const m=mastery(c.id);
      return !m||!m.nextReview||m.nextReview<=now;
    });
  }
  function setMastery(id,level){
    const old=mastery(id)||{reviews:0};
    const reviews=(old.reviews||0)+1;
    const delay=level==="missed"?2*60*60*1000:level==="almost"?DAY:(reviews>1?14*DAY:7*DAY);
    state.mastery[id]={level,reviews,lastReview:Date.now(),nextReview:Date.now()+delay};
    state.lastCard=id;
    save();
    window.dispatchEvent(new Event("pdf-progress-updated"));
    renderHome();
    renderProgress();
  }
  function go(view){
    document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));
    el("view-"+view)?.classList.remove("hidden");
    document.querySelectorAll(".navbtn").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
    state.lastView=view;
    save();
    if(view==="home")renderHome();
    if(view==="read")renderReading();
    if(view==="maps")renderMindmap();
    if(view==="cards")renderCard();
    if(view==="progress")renderProgress();
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function moduleButtons(targetId){
    const target=el(targetId);
    target.innerHTML=MODULES.map(m=>`<button data-module="${m.number}" class="${m.number===activeModule?"active":""}">${m.icon} ${m.number}</button>`).join("");
    target.querySelectorAll("[data-module]").forEach(b=>b.onclick=()=>setModule(Number(b.dataset.module)));
  }
  function setModule(n){
    activeModule=Math.min(10,Math.max(1,n));
    state.lastModule=activeModule;
    save();
    moduleButtons("readSelector");
    moduleButtons("mapSelector");
    renderReading();
    renderMindmap();
  }
  function renderHome(){
    el("metricModules").textContent=MODULES.length;
    el("metricCards").textContent=CARDS.length;
    el("metricQuestions").textContent=CARDS.length;
    el("metricRemembered").textContent=Object.values(state.mastery).filter(x=>x.level==="remembered").length;
    const due=dueCards();
    el("dueTitle").textContent=due.length?`${due.length} card${due.length===1?"":"s"} para revisar.`:"Ciclo do momento concluído.";
    el("dueText").textContent=due.length?"Cards novos e cards que voltaram ao ciclo aparecem primeiro.":"Você pode avançar nos módulos ou refazer questões.";
    const wrap=el("homeModules");
    wrap.innerHTML=MODULES.map(m=>`
      <button class="module-card" data-module="${m.number}">
        <span class="icon">${m.icon}</span>
        <span>
          <b>${m.title}</b>
          <small>Cards ${String(m.cards[0].id).padStart(2,"0")}–${String(m.cards.at(-1).id).padStart(2,"0")} • ${modulePercent(m.number)}% de domínio</small>
          <span class="mini"><i style="width:${modulePercent(m.number)}%"></i></span>
        </span>
        <span class="arrow">→</span>
      </button>`).join("");
    wrap.querySelectorAll("[data-module]").forEach(b=>b.onclick=()=>{
      setModule(Number(b.dataset.module));
      go("read");
    });
  }
  function renderReading(){
    const mod=MODULES[activeModule-1];
    el("readIcon").textContent=mod.icon;
    el("readModuleTitle").textContent=mod.title;
    el("readModuleMeta").textContent=`8 tópicos essenciais • Cards ${String(mod.cards[0].id).padStart(2,"0")}–${String(mod.cards.at(-1).id).padStart(2,"0")}`;
    el("readingContent").innerHTML=mod.cards.map((c,i)=>`
      <details ${i===0?"open":""}>
        <summary>${String(c.id).padStart(2,"0")} • ${c.question}</summary>
        <div class="reading-body">
          <p>${c.answer}</p>
          <div class="trap"><strong>⚠ Pegadinha:</strong> ${c.trap}</div>
        </div>
      </details>`).join("");
  }
  function nodePosition(i,total){
    const angle=-Math.PI/2+(Math.PI*2/total)*i;
    return {x:50+Math.cos(angle)*35,y:50+Math.sin(angle)*35};
  }
  function renderMindmap(){
    const mod=MODULES[activeModule-1];
    const nodes=mod.cards.map((c,i)=>({...c,...nodePosition(i,mod.cards.length)}));
    el("mindmapStage").innerHTML=`
      <svg class="connections" viewBox="0 0 100 100" preserveAspectRatio="none">
        ${nodes.map(n=>`<line x1="50" y1="50" x2="${n.x}" y2="${n.y}"/>`).join("")}
      </svg>
      <div class="map-center"><div><span>MÓDULO ${String(mod.number).padStart(2,"0")}</span><b>${mod.icon} ${mod.title}</b></div></div>
      ${nodes.map(n=>`<button class="map-node" data-card="${n.id}" style="left:${n.x}%;top:${n.y}%"><small>RAMO ${String(n.id).padStart(2,"0")}</small><b>${n.question}</b></button>`).join("")}`;
    el("mindmapStage").querySelectorAll("[data-card]").forEach(b=>b.onclick=()=>openDetail(Number(b.dataset.card)));
  }
  function openDetail(id){
    const c=CARDS.find(x=>x.id===id);
    dialogCardId=id;
    el("dialogTag").textContent=c.category;
    el("dialogTitle").textContent=c.question;
    el("dialogAnswer").textContent=c.answer;
    el("dialogTrap").innerHTML=`<strong>⚠ Pegadinha:</strong> ${c.trap}`;
    el("detailDialog").showModal();
  }
  function fillCardSelect(){
    el("cardModuleSelect").innerHTML='<option value="all">Todos os módulos</option>'+MODULES.map(m=>`<option value="${m.number}">${m.number}. ${m.title}</option>`).join("");
    el("cardModuleSelect").onchange=()=>{
      const v=el("cardModuleSelect").value;
      cardPool=v==="all"?[...CARDS]:CARDS.filter(c=>c.module===Number(v));
      cardIndex=0;
      renderCard();
    };
  }
  function currentCard(){return cardPool[cardIndex]||CARDS[0]}
  function renderCard(){
    const c=currentCard();
    el("flashModule").textContent=`${ICONS[c.module]} ${c.category}`;
    el("flashCount").textContent=`${cardIndex+1} / ${cardPool.length}`;
    el("flashQuestion").textContent=c.question;
    el("flashAnswer").textContent=c.answer;
    el("flashTrap").innerHTML=`<strong>⚠ Pegadinha:</strong> ${c.trap}`;
    el("flashcard").classList.remove("flipped");
    document.querySelectorAll(".mastery [data-level]").forEach(b=>b.classList.toggle("selected",mastery(c.id)?.level===b.dataset.level));
    state.lastCard=c.id;
    state.lastModule=c.module;
    activeModule=c.module;
    save();
  }
  function moveCard(step){
    cardIndex=(cardIndex+step+cardPool.length)%cardPool.length;
    renderCard();
  }
  function jumpToCard(id){
    el("cardModuleSelect").value="all";
    cardPool=[...CARDS];
    cardIndex=Math.max(0,cardPool.findIndex(c=>c.id===id));
    go("cards");
  }
  function startDueReview(){
    const due=dueCards();
    cardPool=due.length?due:[...CARDS];
    cardIndex=0;
    el("cardModuleSelect").value="all";
    go("cards");
  }
  function fillQuizModules(){
    el("quizModuleSelect").innerHTML='<option value="all">Todos os módulos</option>'+MODULES.map(m=>`<option value="${m.number}">${m.number}. ${m.title}</option>`).join("");
  }
  function buildOptions(card){
    let source=CARDS.filter(c=>c.module===card.module&&c.id!==card.id);
    if(source.length<3)source=CARDS.filter(c=>c.id!==card.id);
    const distractors=shuffle(source).slice(0,3).map(c=>c.answer);
    return shuffle([{text:card.answer,correct:true},...distractors.map(text=>({text,correct:false}))]);
  }
  function startQuiz(moduleOverride=null){
    const choice=moduleOverride??el("quizModuleSelect").value;
    const pool=choice==="all"?CARDS:CARDS.filter(c=>c.module===Number(choice));
    const amount=Math.min(Number(el("quizAmount").value)||10,pool.length);
    const chosen=shuffle(pool).slice(0,amount).map(c=>({...c,options:buildOptions(c)}));
    quizSession={cards:chosen,index:0,correct:0,locked:false};
    el("quizSetup").classList.add("hidden");
    el("quizResult").classList.add("hidden");
    el("quizPlay").classList.remove("hidden");
    renderQuizQuestion();
  }
  function renderQuizQuestion(){
    const s=quizSession;
    const c=s.cards[s.index];
    s.locked=false;
    el("quizProgress").textContent=`Questão ${s.index+1} de ${s.cards.length}`;
    el("quizScore").textContent=`${s.correct} acerto${s.correct===1?"":"s"}`;
    el("quizBar").style.width=`${Math.round(s.index/s.cards.length*100)}%`;
    el("quizTag").textContent=c.category;
    el("quizPrompt").textContent=c.question;
    el("quizFeedback").classList.add("hidden");
    el("quizNext").classList.add("hidden");
    const letters=["A","B","C","D"];
    el("quizOptions").innerHTML=c.options.map((o,i)=>`<button data-i="${i}"><strong>${letters[i]})</strong> ${o.text}</button>`).join("");
    el("quizOptions").querySelectorAll("button").forEach(b=>b.onclick=()=>answerQuiz(Number(b.dataset.i)));
  }
  function answerQuiz(i){
    const s=quizSession;
    const c=s.cards[s.index];
    if(s.locked)return;
    s.locked=true;
    const chosen=c.options[i];
    [...el("quizOptions").querySelectorAll("button")].forEach((b,j)=>{
      b.disabled=true;
      if(c.options[j].correct)b.classList.add("correct");
      else if(j===i)b.classList.add("wrong");
    });
    if(chosen.correct){
      s.correct++;
      state.quiz.correct=(state.quiz.correct||0)+1;
    }
    state.quiz.answered=(state.quiz.answered||0)+1;
    const modStat=state.quizByModule[c.module]||{answered:0,correct:0};
    modStat.answered++;
    if(chosen.correct)modStat.correct++;
    state.quizByModule[c.module]=modStat;
    save();
    window.dispatchEvent(new Event("pdf-progress-updated"));
    el("quizFeedback").classList.remove("hidden");
    el("quizFeedback").innerHTML=`<strong>${chosen.correct?"✓ Acertou":"✕ Revise este ponto"}</strong><span>${c.answer}</span><div class="trap" style="margin-top:10px"><strong>⚠ Pegadinha:</strong> ${c.trap}</div>`;
    el("quizScore").textContent=`${s.correct} acerto${s.correct===1?"":"s"}`;
    el("quizNext").textContent=s.index===s.cards.length-1?"Ver resultado":"Próxima questão";
    el("quizNext").classList.remove("hidden");
  }
  function nextQuiz(){
    const s=quizSession;
    if(s.index<s.cards.length-1){
      s.index++;
      renderQuizQuestion();
      return;
    }
    el("quizPlay").classList.add("hidden");
    el("quizResult").classList.remove("hidden");
    const pct=Math.round(s.correct/s.cards.length*100);
    el("quizResult").innerHTML=`
      <p class="eyebrow">TREINO CONCLUÍDO</p>
      <div class="bigscore">${pct}%</div>
      <h2>${s.correct} de ${s.cards.length} questões corretas</h2>
      <p>Use o resultado para decidir quais cards e mapas devem voltar para sua revisão.</p>
      <div class="dialog-actions" style="justify-content:center">
        <button id="repeatQuiz" class="secondary">Novo treino</button>
        <button id="resultProgress" class="primary">Ver progresso</button>
      </div>`;
    el("repeatQuiz").onclick=()=>{
      el("quizResult").classList.add("hidden");
      el("quizSetup").classList.remove("hidden");
    };
    el("resultProgress").onclick=()=>go("progress");
    renderHome();
    renderProgress();
  }
  function renderProgress(){
    const values=Object.values(state.mastery);
    const remembered=values.filter(x=>x.level==="remembered").length;
    const almost=values.filter(x=>x.level==="almost").length;
    const missed=values.filter(x=>x.level==="missed").length;
    const pct=Math.round(CARDS.reduce((s,c)=>s+scoreFor(c.id),0)/CARDS.length*100);
    el("masteryPercent").textContent=pct+"%";
    el("masteryRing").style.background=`conic-gradient(var(--red) ${pct}%,#eadfda ${pct}%)`;
    el("masteryText").textContent=pct<35?"Construa sua base: leia, visualize e marque os primeiros cards.":pct<75?"Boa evolução. Priorize os cards em “quase” e “não lembrei”.":"Você já consolidou grande parte da trilha. Reforce os intervalos e as questões.";
    el("pRemembered").textContent=remembered;
    el("pAlmost").textContent=almost;
    el("pMissed").textContent=missed;
    el("pQuiz").textContent=state.quiz.answered?Math.round(state.quiz.correct/state.quiz.answered*100)+"%":"0%";
    el("moduleProgress").innerHTML=MODULES.map(m=>`
      <div class="module-progress-row">
        <span class="icon">${m.icon}</span>
        <span>
          <b>${m.number}. ${m.title}</b>
          <small>${m.cards.filter(c=>mastery(c.id)).length}/8 cards revisados</small>
          <span class="rowbar"><i style="width:${modulePercent(m.number)}%"></i></span>
        </span>
        <strong>${modulePercent(m.number)}%</strong>
      </div>`).join("");
  }
  function bind(){
    document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.view)));
    document.querySelectorAll("[data-jump]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.jump)));
    el("continueBtn").onclick=()=>dueCards().length?startDueReview():(setModule(state.lastModule||1),go("read"));
    el("reviewDueBtn").onclick=startDueReview;
    el("flashcard").onclick=()=>el("flashcard").classList.toggle("flipped");
    document.querySelectorAll(".mastery [data-level]").forEach(b=>b.onclick=()=>{
      setMastery(currentCard().id,b.dataset.level);
      moveCard(1);
    });
    el("prevCard").onclick=()=>moveCard(-1);
    el("nextCard").onclick=()=>moveCard(1);
    el("shuffleCards").onclick=()=>{
      cardPool=shuffle(cardPool);
      cardIndex=0;
      renderCard();
    };
    el("startQuiz").onclick=()=>startQuiz();
    el("quizNext").onclick=nextQuiz;
    el("closeDialog").onclick=()=>el("detailDialog").close();
    el("dialogCard").onclick=()=>{
      el("detailDialog").close();
      jumpToCard(dialogCardId);
    };
    el("dialogQuiz").onclick=()=>{
      const c=CARDS.find(x=>x.id===dialogCardId);
      el("detailDialog").close();
      go("quiz");
      el("quizModuleSelect").value=String(c.module);
      startQuiz(String(c.module));
    };
    el("resetProgress").onclick=()=>{
      if(!confirm("Zerar todo o progresso de mapas, flashcards e questões?"))return;
      localStorage.removeItem(STORAGE_KEY);
      state=clone(defaults);
      activeModule=1;
      cardPool=[...CARDS];
      cardIndex=0;
      renderHome();
      renderProgress();
      renderCard();
    };
    window.addEventListener("beforeinstallprompt",event=>{
      event.preventDefault();
      deferredInstall=event;
      el("installBtn").classList.remove("hidden");
    });
    el("installBtn").onclick=async()=>{
      if(!deferredInstall)return;
      deferredInstall.prompt();
      await deferredInstall.userChoice;
      deferredInstall=null;
      el("installBtn").classList.add("hidden");
    };
  }


  /* SMART_STUDY_REMINDER */
  const REMINDER_KEY="pdfStudyReminderV1";
  const AUTO_KEY="pdfStudyReminderAutoV1";
  let reminderTimer=null;

  function readReminder(){
    try{return JSON.parse(localStorage.getItem(REMINDER_KEY)||"{}")}catch{return {}}
  }
  function writeReminder(r){localStorage.setItem(REMINDER_KEY,JSON.stringify(r))}
  function weakModule(){
    const ranked=MODULES.map(m=>{
      const reviewed=m.cards.filter(c=>mastery(c.id)).length;
      const master=modulePercent(m.number);
      const q=state.quizByModule?.[m.number]||{answered:0,correct:0};
      const qPct=q.answered?Math.round(q.correct/q.answered*100):null;
      const touched=reviewed>0||q.answered>0;
      const score=qPct===null?master:(reviewed?Math.round((master+qPct)/2):qPct);
      return {...m,reviewed,qAnswered:q.answered||0,score,touched};
    });
    const touched=ranked.filter(x=>x.touched);
    return (touched.length?touched:ranked.filter(x=>x.number===(state.lastModule||1)))
      .sort((a,b)=>a.score-b.score)[0]||ranked[0];
  }
  function formatRemaining(ms){
    if(ms<=0)return "AGORA";
    const total=Math.ceil(ms/60000);
    if(total<60)return total+" min";
    const h=Math.floor(total/60),m=total%60;
    if(h<24)return h+"h"+(m?(" "+m+"min"):"");
    const d=Math.floor(h/24),rh=h%24;
    return d+" dia"+(d>1?"s":"")+(rh?(" "+rh+"h"):"");
  }
  async function systemNotify(topic){
    if(!("Notification" in window)||Notification.permission!=="granted")return;
    try{
      const reg=await navigator.serviceWorker.ready;
      await reg.showNotification("📚 Hora de estudar!",{
        body:"Seu foco agora: "+topic+". Faça uma revisão curta antes de avançar.",
        icon:"/assets/logo-pdf-concurso.png",
        badge:"/assets/logo-pdf-concurso.png",
        tag:"pdf-study-reminder",
        renotify:true,
        data:{url:"/mapas/"}
      });
    }catch{}
  }
  function renderStudyReminder(){
    const weak=weakModule();
    const weakText=el("studyWeakText");
    if(weakText)weakText.textContent="Seu ponto mais fraco agora é “"+weak.title+"” ("+weak.score+"% de domínio estimado).";
    const r=readReminder();
    const count=el("studyCountdown"),status=el("studyReminderStatus");
    if(!count)return;
    if(!r.dueAt){
      count.textContent="Não programado";
      if(status)status.textContent="Escolha um intervalo e programe sua próxima revisão.";
      return;
    }
    const left=r.dueAt-Date.now();
    count.textContent=formatRemaining(left);
    if(status)status.textContent=left>0
      ? "Lembrete programado para "+new Date(r.dueAt).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})+"."
      : "Está na hora de revisar "+(r.topic||weak.title)+".";
    if(left<=0&&r.firedFor!==r.dueAt){
      r.firedFor=r.dueAt;writeReminder(r);
      el("studyAlert")?.classList.add("due");
      systemNotify(r.topic||weak.title);
    }else if(left>0){
      el("studyAlert")?.classList.remove("due");
    }
  }
  function scheduleStudyReminder(minutes,automatic=false){
    const weak=weakModule();
    writeReminder({dueAt:Date.now()+minutes*60000,topic:weak.title,module:weak.number,createdAt:Date.now(),automatic,firedFor:null});
    renderStudyReminder();
  }
  async function enableStudyNotifications(){
    const btn=el("enableStudyNotifications"),status=el("studyReminderStatus");
    if(!("Notification" in window)){
      if(status)status.textContent="Este navegador não oferece notificações do sistema.";
      return;
    }
    const permission=await Notification.requestPermission();
    if(permission==="granted"){
      if(btn)btn.textContent="Notificações ativas ✓";
      if(status)status.textContent="Notificações ativadas. O temporizador também continua visível no app.";
    }else if(status){
      status.textContent="Notificações não autorizadas. O temporizador continuará visível quando você abrir o app.";
    }
  }
  function openWeakModule(){
    const weak=weakModule();
    setModule(weak.number);
    go("read");
  }

  el("scheduleStudyReminder")?.addEventListener("click",()=>scheduleStudyReminder(Number(el("studyDelay")?.value)||60,false));
  el("enableStudyNotifications")?.addEventListener("click",enableStudyNotifications);
  el("studyWeakNow")?.addEventListener("click",openWeakModule);

  window.addEventListener("appinstalled",()=>{
    localStorage.setItem(AUTO_KEY,"1");
    if(!readReminder().dueAt)scheduleStudyReminder(60,true);
    renderStudyReminder();
  });
  const standalone=window.matchMedia?.("(display-mode: standalone)")?.matches||window.navigator.standalone===true;
  if(standalone&&!localStorage.getItem(AUTO_KEY)){
    localStorage.setItem(AUTO_KEY,"1");
    if(!readReminder().dueAt)scheduleStudyReminder(60,true);
  }
  window.addEventListener("pdf-progress-updated",()=>{
    const r=readReminder(),weak=weakModule();
    if(r.dueAt){r.topic=weak.title;r.module=weak.number;writeReminder(r)}
    renderStudyReminder();
  });
  if("Notification" in window&&Notification.permission==="granted"){
    const btn=el("enableStudyNotifications");if(btn)btn.textContent="Notificações ativas ✓";
  }
  renderStudyReminder();
  reminderTimer=setInterval(renderStudyReminder,30000);
  window.addEventListener("pagehide",()=>reminderTimer&&clearInterval(reminderTimer),{once:true});

  fillCardSelect();
  fillQuizModules();
  moduleButtons("readSelector");
  moduleButtons("mapSelector");
  bind();
  renderHome();
  renderReading();
  renderMindmap();
  renderCard();
  renderProgress();
  if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(()=>{});
  const allowed=["home","read","maps","cards","quiz","planner","progress"];
  const hashView=location.hash==="#cronograma"?"planner":null;
  go(hashView|| (allowed.includes(state.lastView)?state.lastView:"home"));
})();