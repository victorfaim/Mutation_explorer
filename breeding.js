(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.BreedingCalculator=api;
  if(root.document)root.addEventListener("DOMContentLoaded",()=>api.mount(root));
})(typeof window!=="undefined"?window:globalThis,function(){
  const fold=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  function createEngine({pals,parentIds,resolveChild,uniquePairs={},genderRules={}}){
    const parents=parentIds.map(id=>pals[id]).filter(p=>p?.name&&p.combiRank&&p.combiRank!==9999&&!p.isBoss);
    const special=(a,b)=>Boolean(uniquePairs[`${a.id}|${b.id}`]||genderRules[`${a.id}|${b.id}`]?.length);
    let reverse=null;
    const result=(aId,bId)=>{
      const a=pals[aId],b=pals[bId];
      if(!a||!b)return null;
      const child=resolveChild(a,b);
      return child?{a,b,child,special:special(a,b)}:null;
    };
    const reverseIndex=()=>{
      if(reverse)return reverse;
      reverse=new Map();
      for(let i=0;i<parents.length;i++)for(let j=i;j<parents.length;j++){
        const row=result(parents[i].id,parents[j].id);
        if(!row)continue;
        if(!reverse.has(row.child.id))reverse.set(row.child.id,[]);
        reverse.get(row.child.id).push(row);
      }
      for(const rows of reverse.values())rows.sort((x,y)=>Number(y.special)-Number(x.special)||Math.abs(x.a.combiRank-x.b.combiRank)-Math.abs(y.a.combiRank-y.b.combiRank)||x.a.name.localeCompare(y.a.name)||x.b.name.localeCompare(y.b.name));
      return reverse;
    };
    return {parents,result,pairsFor:id=>reverseIndex().get(id)||[],fold};
  }

  function mount(w){
    const d=w.document;
    if(!d.getElementById("panel-parents"))return;
    const t=value=>w.PME_I18N?.t(value)||value;
    const engine=createEngine({pals:w.PAL_DATA||{},parentIds:w.PARENT_IDS||[],resolveChild:(a,b)=>w.normalChild? w.normalChild(a,b):normalChild(a,b),uniquePairs:w.UNIQUE_PAIRS||{},genderRules:w.UNIQUE_GENDER_RULES||{}});
    const pals=Object.values(w.PAL_DATA||{}).filter(p=>p?.name).sort((a,b)=>(a.index??9999)-(b.index??9999)||a.name.localeCompare(b.name));
    const state={parent1:null,parent2:null,child:null,shown:40};
    const image=p=>p.icon?`<img src="${palIconUrl(p)}" alt="" loading="lazy">`:"";
    const palLink=(p,label=p.name)=>`<a href="pal.html?id=${encodeURIComponent(p.id)}" class="breeding-pair-pal">${image(p)}<span>${esc(label)}</span></a>`;
    const number=p=>`N-#${p.index??"—"}`;
    const notice=d.getElementById("breeding-notice");
    function url(){
      const u=new URL(location.href);
      ["parent1","parent2","child"].forEach(k=>u.searchParams.delete(k));
      if(state.child)u.searchParams.set("child",state.child);
      else{
        if(state.parent1)u.searchParams.set("parent1",state.parent1);
        if(state.parent2)u.searchParams.set("parent2",state.parent2);
      }
      history.replaceState(null,"",u);
    }
    function makePicker(hostId,title,key,rows){
      const host=d.getElementById(hostId);
      host.innerHTML=`<div class="breeding-picker-head"><h2>${title}</h2><span class="muted" data-count></span></div><label class="breeding-picker-search"><span class="sr-only">${t("Pesquisar")}</span><input type="search" placeholder="${t("Pesquisar por nome ou número")}"></label><div class="breeding-picker-selected" data-selected></div><div class="breeding-pal-list" data-list></div>`;
      const input=host.querySelector("input"),list=host.querySelector("[data-list]");
      const render=()=>{
        const q=fold(input.value);
        const filtered=rows.filter(p=>!q||fold(`${p.name} ${p.id} ${p.index}`).includes(q));
        host.querySelector("[data-count]").textContent=filtered.length;
        host.querySelector("[data-selected]").innerHTML=state[key]?`${image(w.PAL_DATA[state[key]])}<span><strong>${esc(w.PAL_DATA[state[key]].name)}</strong><small>${number(w.PAL_DATA[state[key]])}</small></span>`:`<span>${t("Nenhum Pal selecionado.")}</span>`;
        list.innerHTML=filtered.map(p=>`<button type="button" class="breeding-pal-option${state[key]===p.id?" is-selected":""}" data-id="${esc(p.id)}" title="${esc(palIconTooltip(p))}">${image(p)}<strong>${esc(p.name)}</strong><small>${number(p)}</small></button>`).join("");
        activateAssetFallbacks(list);
      };
      list.addEventListener("click",e=>{
        const button=e.target.closest("[data-id]");if(!button)return;
        state[key]=button.dataset.id;
        if(key==="child"){state.parent1=state.parent2=null;state.shown=40;}
        else state.child=null;
        notice.hidden=true;renderAll();url();
      });
      input.addEventListener("input",render);
      input.addEventListener("keydown",e=>{if(e.key==="Escape"){input.value="";render();}});
      return render;
    }
    const renderP1=makePicker("parent1-picker",t("Pai 1"),"parent1",engine.parents);
    const renderP2=makePicker("parent2-picker",t("Pai 2"),"parent2",engine.parents);
    const renderChild=makePicker("child-picker",t("Filho desejado"),"child",pals);
    function result(){
      const host=d.getElementById("standard-result");
      if(!state.parent1||!state.parent2){host.innerHTML=`<p class="muted">${t("Selecione os dois pais para calcular o filho padrão.")}</p>`;return;}
      const row=engine.result(state.parent1,state.parent2);
      if(!row){host.innerHTML=`<p>${t("Não foi possível calcular esta combinação.")}</p>`;return;}
      host.innerHTML=`<div class="breeding-result-card">${image(row.child)}<div><span class="eyebrow">${t("FILHO PADRÃO")}</span><h2>${esc(row.child.name)} ${row.special?`<span class="badge obtainable">${t("Especial")}</span>`:""}</h2><span class="muted">${number(row.child)}</span><div class="breeding-result-links"><a href="pal.html?id=${encodeURIComponent(row.child.id)}">${t("Ver na Palpedia")}</a><a href="caminho.html?target=${encodeURIComponent(row.child.id)}">${t("Abrir Caminho de Breeding")}</a><a href="reverso.html?target=${encodeURIComponent(row.child.id)}">${t("Abrir Mutação Reversa")}</a></div></div></div>`;
      activateAssetFallbacks(host);
    }
    function reverse(){
      const host=d.getElementById("reverse-results"),summary=d.getElementById("reverse-summary"),more=d.getElementById("more-pairs");
      if(!state.child){host.innerHTML="";summary.textContent=t("Selecione um filho.");more.hidden=true;return;}
      const q=fold(d.getElementById("pair-search").value);
      const hide=d.getElementById("hide-identical").checked;
      const only=d.getElementById("special-only").checked;
      const rows=engine.pairsFor(state.child).filter(r=>(!hide||r.a.id!==r.b.id)&&(!only||r.special)&&(!q||fold(`${r.a.name} ${r.b.name}`).includes(q)));
      summary.textContent=`${rows.length} ${t("casais encontrados")}`;
      host.innerHTML=rows.slice(0,state.shown).map(r=>`<article class="breeding-pair">${palLink(r.a)}<b>+</b>${palLink(r.b)}<div class="breeding-pair-meta"><span>${r.special?`<span class="badge obtainable">${t("Especial")}</span>`:""}</span><button type="button" data-use="${esc(r.a.id)}|${esc(r.b.id)}">${t("Usar estes pais")}</button></div></article>`).join("")||`<p class="muted">${t("Nenhum casal encontrado com os filtros atuais.")}</p>`;
      more.hidden=rows.length<=state.shown;
      activateAssetFallbacks(host);
    }
    function renderAll(){renderP1();renderP2();renderChild();result();reverse();}
    function mode(childMode){
      d.getElementById("panel-parents").hidden=childMode;d.getElementById("panel-child").hidden=!childMode;
      d.getElementById("tab-parents").classList.toggle("is-active",!childMode);d.getElementById("tab-child").classList.toggle("is-active",childMode);
      d.getElementById("tab-parents").setAttribute("aria-selected",String(!childMode));d.getElementById("tab-child").setAttribute("aria-selected",String(childMode));
      d.getElementById("tab-parents").tabIndex=childMode?-1:0;d.getElementById("tab-child").tabIndex=childMode?0:-1;
    }
    const tabs=[d.getElementById("tab-parents"),d.getElementById("tab-child")];
    tabs[0].onclick=()=>mode(false);tabs[1].onclick=()=>mode(true);
    tabs.forEach((tab,index)=>tab.addEventListener("keydown",event=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;event.preventDefault();const next=event.key==="Home"?0:event.key==="End"?1:event.key==="ArrowRight"?(index+1)%2:(index+1)%2;mode(next===1);tabs[next].focus();}));
    d.getElementById("swap-parents").onclick=()=>{[state.parent1,state.parent2]=[state.parent2,state.parent1];renderAll();url();};
    d.getElementById("clear-parents").onclick=()=>{state.parent1=state.parent2=null;renderAll();url();};
    ["pair-search","hide-identical","special-only"].forEach(id=>d.getElementById(id).addEventListener(id==="pair-search"?"input":"change",()=>{state.shown=40;reverse();}));
    d.getElementById("more-pairs").onclick=()=>{state.shown+=40;reverse();};
    d.getElementById("reverse-results").onclick=e=>{const b=e.target.closest("[data-use]");if(!b)return;[state.parent1,state.parent2]=b.dataset.use.split("|");state.child=null;mode(false);renderAll();url();scrollTo({top:0,behavior:"smooth"});};
    const params=new URLSearchParams(location.search),invalid=[];
    for(const key of ["parent1","parent2","child"]){const id=params.get(key);if(id){if(w.PAL_DATA[id])state[key]=id;else invalid.push(id);}}
    if(state.child){state.parent1=state.parent2=null;mode(true);}else mode(false);
    if(invalid.length){notice.hidden=false;notice.textContent=t("Um ou mais Pals informados na URL não foram encontrados.");}
    renderAll();
  }
  return {fold,createEngine,mount};
});
