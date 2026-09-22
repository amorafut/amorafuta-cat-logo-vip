const WA='5585998022643';
const fmt=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const pix=v=>Number(v||0)*.95;
let PRODUCTS=[];
let state={cat:'Todos',team:'Todos',q:'',sort:'relevantes'};
const $=s=>document.querySelector(s);
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function initials(name){return String(name||'AF').split(/\s+/).slice(0,3).map(x=>x[0]).join('').toUpperCase();}
function isTeam(p,team){return team==='Todos'||p.team===team;}
function isCat(p,cat){
 if(cat==='Todos')return true;
 if(cat==='Lançamentos')return p.badge==='LANÇAMENTO';
 if(cat==='Ofertas')return !!p.oldPrice||p.badge==='OFERTA';
 return p.category===cat;
}
function visual(p){
 const src=(p.images&&p.images[0])||p.image;
 return src?'<img src="'+esc(src)+'" alt="'+esc(p.name)+'" width="300" height="400" loading="lazy" decoding="async" onerror="this.style.display=\'none\';this.parentElement.classList.add(\'no-image\')">':'';
}
function card(p){
 const badge=p.soldOut?'ESGOTADO':(p.badge||'');
 return '<article class="card '+(p.soldOut?'sold':'')+'"><a class="card-open" href="produto.html?id='+encodeURIComponent(p.id)+'" aria-label="Ver '+esc(p.name)+'"><div class="photo">'+visual(p)+'<div class="placeholder"><div class="shirt-mark">'+initials(p.name)+'</div><span>AMORA FUT</span><small>STREETWEAR</small></div>'+(badge?'<b class="badge '+(p.soldOut?'sold-badge':'')+'">'+esc(badge)+'</b>':'')+'<div class="quick">VER DETALHES</div></div><div class="info"><div class="catline">'+esc(p.team||p.category)+' <i>•</i> '+esc(p.version||'')+'</div><h3>'+esc(p.name)+'</h3><div class="price">'+(p.oldPrice?'<del>'+fmt(p.oldPrice)+'</del>':'')+'<strong>'+fmt(p.price)+'</strong></div><div class="pix"><span>PIX</span> '+fmt(pix(p.price))+'</div><span class="cta">Ver produto <b>→</b></span></div></a></article>';
}
function render(){
 let arr=PRODUCTS.filter(p=>p.published!==false).filter(p=>isCat(p,state.cat)&&isTeam(p,state.team)&&((p.name+' '+(p.team||'')+' '+(p.category||'')+' '+(p.version||'')).toLowerCase().includes(state.q)));
 if(state.sort==='menor')arr.sort((a,b)=>Number(a.price)-Number(b.price));
 if(state.sort==='maior')arr.sort((a,b)=>Number(b.price)-Number(a.price));
 $('#grid').innerHTML=arr.map(card).join('')||'<div class="empty"><strong>Nenhum produto encontrado.</strong><span>Tente outro time, coleção ou categoria.</span></div>';
 $('#count').textContent=arr.length+' '+(arr.length===1?'produto':'produtos');
}
function setCat(cat){state.cat=cat;document.querySelectorAll('.category-card').forEach(b=>b.classList.toggle('active',b.dataset.cat===cat));render();document.querySelector('#catalogo').scrollIntoView({behavior:'smooth',block:'start'});}
function setTeam(team){state.team=team;document.querySelectorAll('.team-chip').forEach(b=>b.classList.toggle('active',b.dataset.team===team));render();document.querySelector('#catalogo').scrollIntoView({behavior:'smooth',block:'start'});}
function renderTeams(){const box=$('#teamFilters');const teams=[...new Set(PRODUCTS.filter(p=>p.published!==false).map(p=>p.team).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));box.innerHTML='<button class="team-chip active" data-team="Todos">Todos os times</button>'+teams.map(t=>'<button class="team-chip" data-team="'+esc(t)+'">'+esc(t)+'</button>').join('');box.querySelectorAll('.team-chip').forEach(b=>b.addEventListener('click',()=>setTeam(b.dataset.team)));}
async function init(){
 try{
  const r=await fetch('data/products.json?v=21',{cache:'force-cache'});if(!r.ok)throw new Error('Falha ao carregar catálogo');PRODUCTS=await r.json();
  renderTeams();
  document.querySelectorAll('.category-card').forEach(b=>b.addEventListener('click',()=>setCat(b.dataset.cat)));
  document.querySelectorAll('[data-nav-cat]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();setCat(a.dataset.navCat)}));
  const sync=e=>{state.q=e.target.value.toLowerCase().trim();document.querySelectorAll('#search,#searchMobile').forEach(x=>{if(x!==e.target)x.value=e.target.value});render();};
  $('#search').addEventListener('input',sync);$('#searchMobile').addEventListener('input',sync);$('#sort').addEventListener('change',e=>{state.sort=e.target.value;render();});
  render();
 }catch(e){$('#grid').innerHTML='<div class="empty"><strong>Não foi possível carregar o catálogo.</strong><span>Tente atualizar a página em alguns segundos.</span></div>';console.error(e);}
}
document.addEventListener('DOMContentLoaded',init);