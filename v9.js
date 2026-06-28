(()=>{
  const qs=s=>document.querySelector(s);
  const qsa=s=>Array.from(document.querySelectorAll(s));
  const euro=(v,d=0)=>(Number(v)||0).toLocaleString('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:d});
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const delay=(fn,t=90)=>setTimeout(fn,t);
  let closed=JSON.parse(localStorage.getItem('budget2026.v9.closedGroups')||'{}');
  let timer=null;

  function hasBudget(){try{return typeof rows==='function'&&Array.isArray(rows())}catch(e){return false}}
  function allRows(){try{return rows()}catch(e){return[]}}
  function activeRows(){return allRows().filter(r=>r.enabled!==false)}
  function value(r){try{return val(r)}catch(e){return Number(r.amount)||0}}
  function compute(){try{return calc()}catch(e){return null}}
  function saveAuto(){try{auto()}catch(e){}}
  function titleFor(id){return {home:'Synthèse',lines:'Lignes',accounts:'Comptes',analysis:'Analyse',more:'Plus'}[id]||'Budget'}
  function getActive(selector,attr){let b=qs(selector+'.on')||qs(selector);return b?b.dataset[attr]:''}
  function saveClosed(){localStorage.setItem('budget2026.v9.closedGroups',JSON.stringify(closed))}

  function installShell(){
    document.body.classList.add('v9');
    const vt=qs('.versionTag'); if(vt)vt.textContent='V9 - cockpit budget premium';
    const nav=qs('nav');
    if(nav&&!nav.dataset.v9){
      nav.dataset.v9='1';
      nav.innerHTML=`
        <button data-go="home" class="on"><span class="navIcon">⌂</span><span class="navLabel">Accueil</span></button>
        <button data-go="lines"><span class="navIcon">☰</span><span class="navLabel">Lignes</span></button>
        <button data-go="accounts"><span class="navIcon">⇄</span><span class="navLabel">Comptes</span></button>
        <button data-go="analysis"><span class="navIcon">◎</span><span class="navLabel">Analyse</span></button>
        <button data-go="more"><span class="navIcon">•••</span><span class="navLabel">Plus</span></button>`;
    }
    qsa('nav button').forEach(b=>b.onclick=()=>{go(b.dataset.go); refreshV9()});
    let h=qs('#home');
    if(h&&!qs('#homeDashboard')){
      h.insertAdjacentHTML('afterbegin',`<div id="homeDashboard" class="v9HomeDashboard">
        <div class="v9SectionTitle"><div><h2>Vue d’ensemble</h2><p>Lecture rapide du budget familial.</p></div><span id="v9Health" class="v9Chip">Analyse</span></div>
        <div id="v9Insights" class="v9InsightGrid"></div>
      </div>`);
    }
    const acc=qs('#accounts');
    if(acc&&!qs('#accountsIntro')){
      acc.insertAdjacentHTML('afterbegin',`<div id="accountsIntro" class="v9SectionTitle"><div><h2>Comptes à alimenter</h2><p>Montants à virer ce mois, répartis entre Laura et Romain.</p></div><span class="v9Chip">Virements</span></div>`);
      acc.classList.add('v9AccountsScreen');
    }
    const ana=qs('#analysis');
    if(ana&&!qs('#formulaAudit')){
      ana.insertAdjacentHTML('beforeend',`<article class="box v9FormulaBox"><div class="v9SectionTitle compact"><div><h2>Formules dynamiques</h2><p>Édite les formules et variables : recalcul immédiat.</p></div><span class="v9Chip">Audit</span></div><div id="formulaAudit" class="v9FormulaGrid"></div></article>`);
    }
    const q=qs('#q'); if(q&&!q.parentElement.classList.contains('v9SearchWrap')) q.outerHTML='<div class="v9SearchWrap"><span>⌕</span>'+q.outerHTML+'</div>';
    const refresh=qs('#refreshApp');
    if(refresh)refresh.onclick=async()=>{try{if('caches'in window){let ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}}catch(e){} location.href=location.pathname+'?v=v9-'+Date.now()};
  }

  function go(id,filter=''){
    qsa('nav button').forEach(b=>b.classList.toggle('on',b.dataset.go===id));
    qsa('.screen').forEach(s=>s.classList.toggle('on',s.id===id));
    const title=qs('#title'); if(title)title.textContent=titleFor(id);
    if(filter&&qs('#q')){qs('#q').value=filter; go('lines'); delay(refreshV9)}
  }

  function groupName(r){
    const s=norm([r.label,r.poste,r.account].join(' '));
    if(r.type==='Revenu')return 'Revenus';
    if(r.type==='Impôt'||/impot|taxe fonciere/.test(s))return 'Impôts';
    if(/rachel|charlie|mam|garde|kangourou|assmat|enfant|cantine|creche|couche/.test(s))return 'Enfants';
    if(/lmnp|pno|copro|expert comptable|location|pret 91806|appartement/.test(s))return 'Patrimoine / LMNP';
    if(/pret|maison|fioul|edf|electricite|eau|gaz|assurance habitation|taxe/.test(s))return 'Logement';
    if(/voiture|tesla|volvo|bmw|carburant|essence|peage|assurance auto|parking/.test(s))return 'Voitures';
    if(/course|alimentaire|supermarche|leclerc|carrefour|intermarche/.test(s))return 'Alimentation';
    if(/vacance|week|booking|loisir|restaurant|sortie|sport|cadeau/.test(s))return 'Loisirs / vacances';
    if(/abonnement|telephone|internet|netflix|spotify|cloud|assurance/.test(s))return 'Abonnements';
    return 'Autres';
  }

  function lineCard(r,i){
    const typeClass=r.type==='Revenu'?'income':r.type==='Impôt'?'tax':'expense';
    const g=groupName(r);
    const icon=r.type==='Revenu'?'€':r.type==='Impôt'?'%':g.startsWith('Enfants')?'👶':g.startsWith('Logement')?'⌂':g.startsWith('Voitures')?'🚗':g.includes('LMNP')?'▦':'•';
    return `<article class="v9Line ${typeClass} ${r.enabled===false?'isOff':''}" data-v9-open="${i}">
      <div class="v9LineMain"><div class="v9Icon">${icon}</div><div class="v9LineText"><h3>${safe(r.label||r.poste||'Sans libellé')}</h3><p>${safe(r.poste||'Sans poste')} · ${safe(r.account||'Sans compte')}</p><div class="v9Badges"><span class="${typeClass}">${safe(r.type||'Dépense')}</span><span>${safe(r.owner||'Commun')}</span>${r.formula?'<span class="formula">Formule</span>':''}</div></div><strong>${euro(value(r),2)}</strong></div>
      <div class="v9LineActions"><button data-tog="${i}">${r.enabled===false?'Activer':'Désactiver'}</button><button data-ed="${i}">Modifier</button></div>
    </article>`;
  }

  function renderLinesV9(){
    const list=qs('#list'); if(!list||!hasBudget())return;
    const owner=getActive('[data-owner]','owner')||'Tous', type=getActive('[data-type]','type')||'Tous', q=norm(qs('#q')?.value||'');
    let items=allRows().map((r,i)=>({r,i,g:groupName(r),v:value(r)})).filter(({r,g})=>{
      if(owner&&owner!=='Tous'&&(r.owner||'Commun')!==owner)return false;
      if(type&&type!=='Tous'&&(r.type||'Dépense')!==type)return false;
      if(q&&!norm([r.label,r.poste,r.account,r.owner,r.type,g,r.formula?'formule':''].join(' ')).includes(q))return false;
      return true;
    });
    const count=qs('#lineCount'); if(count)count.textContent=items.length+' lignes';
    const order=['Revenus','Impôts','Logement','Enfants','Alimentation','Voitures','Patrimoine / LMNP','Loisirs / vacances','Abonnements','Autres'];
    const groups={}; items.forEach(x=>{(groups[x.g]||(groups[x.g]=[])).push(x)});
    list.className='v9GroupedList';
    list.innerHTML=order.filter(g=>groups[g]).map(g=>{
      const arr=groups[g], total=arr.reduce((s,x)=>s+x.v,0), isClosed=!!closed[g];
      return `<section class="v9Group ${isClosed?'closed':''}"><button class="v9GroupHead" data-v9-group="${safe(g)}"><span><b>${safe(g)}</b><em>${arr.length} ligne${arr.length>1?'s':''}</em></span><strong>${euro(total,0)}</strong></button><div class="v9GroupBody">${arr.map(x=>lineCard(x.r,x.i)).join('')}</div></section>`;
    }).join('')||'<article class="box"><h2>Aucune ligne</h2><p class="help">Change les filtres ou la recherche.</p></article>';
  }

  function bars(entries,max){
    max=max||Math.max(1,...entries.map(x=>Math.abs(x.v)));
    return `<div class="v9Bars">${entries.map(x=>`<button class="v9Bar" data-v9-filter="${safe(x.k)}"><span><b>${safe(x.k)}</b><em>${safe(x.s||'')}</em></span><strong>${euro(x.v,0)}</strong><i><u style="width:${Math.max(4,Math.abs(x.v)/max*100)}%"></u></i></button>`).join('')}</div>`;
  }

  function renderHomeV9(c){
    const rem=c.remain.Laura+c.remain.Romain, gap=Math.abs(c.remain.Laura-c.remain.Romain), top=Object.entries(c.post||{}).sort((a,b)=>b[1]-a[1])[0]||['-',0];
    const health=qs('#v9Health'); if(health){health.textContent=rem<0?'Tension':gap>250?'À équilibrer':'Stable'; health.className='v9Chip '+(rem<0?'bad':gap>250?'warn':'good')}
    const box=qs('#v9Insights'); if(box){
      box.innerHTML=`<article class="v9HeroCard"><small>Disponible mensuel</small><strong>${euro(rem,0)}</strong><span>Laura ${euro(c.remain.Laura,0)} · Romain ${euro(c.remain.Romain,0)}</span></article>
      <article class="v9MiniCard"><small>À virer</small><strong>${euro(c.needT,0)}</strong><span>comptes communs</span></article>
      <article class="v9MiniCard"><small>Écart</small><strong>${euro(gap,0)}</strong><span>Laura / Romain</span></article>
      <article class="v9MiniCard"><small>1er poste</small><strong>${safe(top[0])}</strong><span>${euro(top[1],0)} / mois</span></article>`;
    }
    const topBox=qs('#top'); if(topBox){
      const data=Object.entries(c.post||{}).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>({k,v,s:'mensuel'}));
      topBox.innerHTML=bars(data);
    }
    const alerts=qs('#alerts'); if(alerts){
      let al=[]; if(rem<0)al.push({k:'Budget négatif',v:rem,s:'reste disponible'}); if(gap>250)al.push({k:'Écart Laura / Romain',v:gap,s:'à corriger'}); Object.entries(c.need||{}).forEach(([k,v])=>{if(v>1000)al.push({k:'Compte à alimenter fortement',v,s:k})}); activeRows().filter(r=>r.formulaError).slice(0,3).forEach(r=>al.push({k:'Erreur formule',v:0,s:r.label}));
      alerts.innerHTML=al.length?bars(al):'<div class="v9Empty">Aucune alerte forte</div>';
    }
  }

  function renderAccountsV9(c){
    const list=qs('#accountsList'), contrib=qs('#contrib'); if(!list||!contrib)return;
    const acc=Object.entries(c.need||{}).map(([k,v])=>({k,v})).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v)), max=Math.max(1,...acc.map(x=>Math.max(0,x.v)));
    list.innerHTML=acc.map(x=>`<article class="v9Account" data-v9-filter="${safe(x.k)}"><div><h3>${safe(x.k)}</h3><p>Laura ${euro(Math.max(0,x.v)*c.rat.Laura,0)} · Romain ${euro(Math.max(0,x.v)*c.rat.Romain,0)}</p></div><strong>${euro(x.v,0)}</strong><i><u style="width:${Math.max(3,Math.max(0,x.v)/max*100)}%"></u></i></article>`).join('')||'<div class="v9Empty">Aucun compte à alimenter</div>';
    contrib.innerHTML=`<article class="v9Contribution"><span>Contribution Laura</span><strong>${euro(c.out.Laura,0)}</strong><em>commun + personnel</em></article><article class="v9Contribution"><span>Contribution Romain</span><strong>${euro(c.out.Romain,0)}</strong><em>commun + personnel</em></article>`;
  }

  function cost(rx){return activeRows().filter(r=>r.type!=='Revenu'&&rx.test(norm([r.label,r.poste,r.account].join(' ')))).reduce((s,r)=>s+value(r),0)}
  function income(rx){return activeRows().filter(r=>r.type==='Revenu'&&rx.test(norm([r.label,r.poste,r.account].join(' ')))).reduce((s,r)=>s+value(r),0)}

  function renderAnalysisV9(c){
    const p=qs('#analysisPanels'); if(!p)return;
    const rem=c.remain.Laura+c.remain.Romain, gap=Math.abs(c.remain.Laura-c.remain.Romain), child=cost(/rachel|charlie|mam|garde|kangourou|assmat|enfant|cantine|creche/), house=cost(/pret|maison|fioul|electricite|eau|taxe|habitation|copro/), lmnp=cost(/lmnp|pno|copro|expert comptable|pret 91806/)-income(/lmnp|location/);
    p.innerHTML=`
      <article class="v9AnalysisCard"><small>Équité</small><h3>${gap>250?'À ajuster':'Équilibré'}</h3><div>${bars([{k:'Reste Laura',v:c.remain.Laura,s:'mensuel'},{k:'Reste Romain',v:c.remain.Romain,s:'mensuel'},{k:'Écart',v:gap,s:'mensuel'}])}</div></article>
      <article class="v9AnalysisCard"><small>Projection annuelle</small><h3>${euro(rem*12,0)}</h3><p>Disponible annuel estimé</p>${bars([{k:'Enfants',v:child*12,s:'annuel'},{k:'Logement',v:house*12,s:'annuel'},{k:'LMNP net',v:lmnp*12,s:'annuel'}])}</article>
      <article class="v9AnalysisCard"><small>Scénario</small><h3>${euro(rem,0)}</h3><p>Reste disponible mensuel du scénario actif</p><div class="v9Metric"><span>Reste annuel</span><strong>${euro(rem*12,0)}</strong></div></article>`;
    renderFormulaAudit();
  }

  function renderFormulaAudit(){
    const box=qs('#formulaAudit'); if(!box||!hasBudget())return;
    const formulas=allRows().map((r,i)=>({r,i})).filter(x=>x.r.formula);
    box.innerHTML=formulas.map(({r,i})=>{
      const manual=Number(r.amount)||0, calc=value(r), vars=r.variables||{};
      return `<article class="v9Formula"><div class="v9FormulaTop"><div><h3>${safe(r.label||r.poste)}</h3><p>${safe(r.poste||'')} · ${safe(r.owner||'Commun')}</p></div><strong>${euro(calc,2)}</strong></div><label>Formule<textarea data-v9-formula="${i}">${safe(r.formula)}</textarea></label><div class="v9Vars">${Object.keys(vars).map(k=>`<label>${safe(k)}<input data-v9-var="${safe(k)}" data-v9-row="${i}" value="${safe(vars[k])}" inputmode="decimal"></label>`).join('')||'<p class="help">Aucune variable</p>'}</div><div class="v9FormulaMeta"><span>Manuel ${euro(manual,2)}</span><span>Écart ${euro(calc-manual,2)}</span>${r.formulaError?`<span class="err">${safe(r.formulaError)}</span>`:''}</div><div class="v9LineActions"><button data-ed="${i}">Modifier la ligne</button><button class="danger" data-v9-manual="${i}">Passer en manuel</button></div></article>`;
    }).join('')||'<div class="v9Empty">Aucune formule à auditer</div>';
  }

  function refreshV9(){
    installShell();
    const c=compute(); if(!c)return;
    renderHomeV9(c); renderLinesV9(); renderAccountsV9(c); renderAnalysisV9(c);
  }

  document.addEventListener('click',e=>{
    const gh=e.target.closest('[data-v9-group]'); if(gh){closed[gh.dataset.v9Group]=!closed[gh.dataset.v9Group]; saveClosed(); renderLinesV9(); return}
    const f=e.target.closest('[data-v9-filter]'); if(f){go('lines',f.dataset.v9Filter); return}
    const o=e.target.closest('[data-v9-open]'); if(o&&e.target.tagName!=='BUTTON'&&typeof openEdit==='function'){openEdit(+o.dataset.v9Open); return}
    const m=e.target.closest('[data-v9-manual]'); if(m){const r=allRows()[+m.dataset.v9Manual]; if(r){r.amount=value(r); r.formula=''; r.variables={}; saveAuto(); delay(()=>{try{render()}catch(e){} refreshV9()},120)} return}
  });
  document.addEventListener('input',e=>{
    if(e.target.matches('#q')){clearTimeout(timer); timer=delay(renderLinesV9,80)}
    if(e.target.matches('[data-v9-formula]')){const r=allRows()[+e.target.dataset.v9Formula]; if(r){r.formula=e.target.value; saveAuto(); clearTimeout(timer); timer=delay(refreshV9,180)}}
    if(e.target.matches('[data-v9-var]')){const r=allRows()[+e.target.dataset.v9Row], k=e.target.dataset.v9Var; if(r){r.variables=r.variables||{}; const raw=String(e.target.value).replace(',','.'); r.variables[k]=Number.isFinite(Number(raw))?Number(raw):e.target.value; saveAuto(); clearTimeout(timer); timer=delay(refreshV9,180)}}
  });
  document.addEventListener('change',e=>{if(e.target.matches('#scenario'))delay(refreshV9,120)});
  document.addEventListener('click',e=>{if(e.target.closest('[data-owner],[data-type],[data-tog],[data-ed],#ok,#copy,#del,#add,#newSc,#dupSc,#renSc,#delSc,#showFormulaLines'))delay(refreshV9,180)});
  const mo=new MutationObserver(()=>{if(hasBudget())delay(refreshV9,60)}); mo.observe(document.body,{childList:true,subtree:true});
  window.refreshV9=refreshV9;
  addEventListener('load',()=>delay(refreshV9,500));
  if(document.readyState!=='loading')delay(refreshV9,200);
})();
