const WA='5585998022643';
const fmt=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const pix=v=>v*.95;
let state={cat:'Todos',team:'Todos',q:'',sort:'relevantes'};
const $=s=>document.querySelector(s);
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function initials(name){return name.split(/\s+/).slice(0,3).map(x=>x[0]).join('').toUpperCase();}
function isTeam(p,team){ return team==='Todos' || p.team===team; }
function isCat(p,cat){
  if(cat==='Todos') return true;
  if(cat==='Lançamentos') return p.badge==='LANÇAMENTO';
  if(cat==='Ofertas') return !!p.oldPrice || p.badge==='OFERTA';
  return p.category===cat;
}
function visual(p){
  if(p.image) return `<img src="${p.image}" alt="${esc(p.name)}" loading="lazy" onerror="this.remove();this.nextElementSibling.hidden=false">`;
  return '';
}
function card(p){
  const badge=p.badge?`<b class="badge ${p.soldOut?'sold-badge':''}">${esc(p.badge)}</b>`:'';
  return `<article class="card ${p.soldOut?'sold':''}">
    <a class="card-open" href="${p.id}.html" aria-label="Ver ${esc(p.name)}">
      <div class="photo">${visual(p)}<div class="placeholder" ${p.image?'hidden':''}><div class="shirt-mark">${initials(p.name)}</div><span>AMORA FUT</span><small>STREETWEAR</small></div>${badge}<div class="quick">VER DETALHES</div></div>
      <div class="info"><div class="catline">${esc(p.category)} <i>•</i> ${esc(p.version)}</div><h3>${esc(p.name)}</h3>
      <div class="price">${p.oldPrice?`<del>${fmt(p.oldPrice)}</del>`:''}<strong>${fmt(p.price)}</strong></div>
      <div class="pix"><span>PIX</span> ${fmt(pix(p.price))}</div>
      <span class="cta">Consultar tamanhos <b>→</b></span></div>
    </a></article>`;
}
function render(){
 let arr=PRODUCTS.filter(p=>isCat(p,state.cat)&&isTeam(p,state.team)&&(`${p.name} ${p.team||''} ${p.category} ${p.version}`).toLowerCase().includes(state.q));
 if(state.sort==='menor')arr.sort((a,b)=>a.price-b.price);
 if(state.sort==='maior')arr.sort((a,b)=>b.price-a.price);
 $('#grid').innerHTML=arr.map(card).join('')||`<div class="empty"><strong>Nenhum produto encontrado.</strong><span>Tente outro time, coleção ou categoria.</span></div>`;
 $('#count').textContent=`${arr.length} ${arr.length===1?'produto':'produtos'}`;
}
function waLink(p){return 'https://wa.me/'+WA+'?text='+encodeURIComponent(`Olá! Vi no catálogo VIP da Amora Fut e tenho interesse na ${p.name} (${p.version}), por ${fmt(p.price)}. Gostaria de consultar os tamanhos disponíveis.`)}
function openProduct(id){
 const p=PRODUCTS.find(x=>x.id===id); if(!p)return;
 $('#modal').innerHTML=`<div class="modal-bg" onclick="closeProduct(event)"><div class="modal" onclick="event.stopPropagation()"><button class="close" onclick="closeProduct()">×</button>
 <div class="modal-photo">${p.image?`<img src="${p.image}" alt="${esc(p.name)}">`:`<div class="modal-placeholder"><div class="shirt-mark big">${initials(p.name)}</div><span>AMORA FUT</span><small>CATÁLOGO VIP</small></div>`}</div>
 <div class="modal-info"><div class="eyebrow">${esc(p.category)} · ${esc(p.version)}</div><div class="modal-tag">${p.soldOut?'ESGOTADO':(p.badge||'CATÁLOGO VIP')}</div><h2>${esc(p.name)}</h2>
 <div class="modal-price">${p.oldPrice?`<del>${fmt(p.oldPrice)}</del>`:''}<strong>${fmt(p.price)}</strong></div><div class="pix"><span>PIX</span> ${fmt(pix(p.price))} · 5% OFF</div>
 <div class="modal-points"><div>✓ Envio para todo o Brasil</div><div>✓ Consulte tamanhos no WhatsApp</div><div>✓ Atendimento personalizado</div></div>
 <div class="actions"><a class="btn primary ${p.soldOut?'disabled':''}" ${p.soldOut?'aria-disabled="true"':'href="'+waLink(p)+'" target="_blank"'}>${p.soldOut?'Produto esgotado':'Pedir pelo WhatsApp'}</a></div></div></div></div>`;
 $('#modal').classList.add('show');document.body.classList.add('lock');
}
function closeProduct(e){if(e&&e.target!==e.currentTarget)return;$('#modal').classList.remove('show');document.body.classList.remove('lock')}
function setCat(cat){state.cat=cat;document.querySelectorAll('.category-card').forEach(b=>b.classList.toggle('active',b.dataset.cat===cat));render();document.querySelector('#catalogo').scrollIntoView({behavior:'smooth',block:'start'})}
function setTeam(team){state.team=team;document.querySelectorAll('.team-chip').forEach(b=>b.classList.toggle('active',b.dataset.team===team));render();document.querySelector('#catalogo').scrollIntoView({behavior:'smooth',block:'start'})}
function renderTeams(){const box=$('#teamFilters');if(!box)return;const teams=[...new Set(PRODUCTS.map(p=>p.team).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));box.innerHTML='<button class="team-chip active" data-team="Todos">Todos os times</button>'+teams.map(t=>`<button class="team-chip" data-team="${esc(t)}">${esc(t)}</button>`).join('');box.querySelectorAll('.team-chip').forEach(b=>b.addEventListener('click',()=>setTeam(b.dataset.team)));}
function init(){
 renderTeams();
 document.querySelectorAll('.category-card').forEach(b=>b.addEventListener('click',()=>setCat(b.dataset.cat)));
 document.querySelectorAll('[data-nav-cat]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();setCat(a.dataset.navCat)}));
 const sync=e=>{state.q=e.target.value.toLowerCase().trim();document.querySelectorAll('#search,#searchMobile').forEach(x=>{if(x!==e.target)x.value=e.target.value});render()};
 $('#search').addEventListener('input',sync);$('#searchMobile').addEventListener('input',sync);$('#sort').addEventListener('change',e=>{state.sort=e.target.value;render()});
 render();
}
window.openProduct=openProduct;window.closeProduct=closeProduct;window.setTeam=setTeam;document.addEventListener('DOMContentLoaded',init);
