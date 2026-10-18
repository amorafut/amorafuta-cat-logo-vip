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
 return src?'<img src="'+esc(src)+'" alt="'+esc(p.name)+'" width="300" height="400" loading="lazy" decoding="async" onerror="this.style.display=&quot;none&quot;;this.parentElement.classList.add(&quot;no-image&quot;)">':'';
}
function card(p){
 const badge=p.soldOut?'ESGOTADO':(p.badge||'');
 return '<article class="card '+(p.soldOut?'sold':'')+'"><a class="card-open" href="produto.html?id='+encodeURIComponent(p.id)+'" aria-label="Ver '+esc(p.name)+'"><div class="photo">'+visual(p)+'<div class="placeholder"><div class="shirt-mark">'+initials(p.name)+'</div><span>AMORA FUT</span><small>STREETWEAR</small></div>'+(badge?'<b class="badge '+(p.soldOut?'sold-badge':'')+'">'+esc(badge)+'</b>':'')+(p.version?'<b class="version-badge '+(/jogador/i.test(p.version)?'version-player':(/torcedor/i.test(p.version)?'version-fan':''))+'">VERSÃO '+esc(p.version)+'</b>':'')+'<div class="quick">VER DETALHES</div></div><div class="info"><div class="catline">'+esc(p.team||p.category)+' <i>•</i> '+esc(p.version||'')+'</div><h3>'+esc(p.name)+'</h3><div class="price">'+(p.oldPrice?'<del>'+fmt(p.oldPrice)+'</del>':'')+'<strong>'+fmt(p.price)+'</strong></div>'+(p.wholesalePrice>0?'<div class="wholesale-price">Atacado: <strong>'+fmt(p.wholesalePrice)+'/un.</strong> a partir de 5 peças</div>':'')+'<div class="pix"><span>PIX</span> '+fmt(pix(p.price))+'</div>'+(p.stock&&Object.keys(p.stock).length?'<div class="stock-card">'+(Object.values(p.stock).reduce((a,v)=>a+Number(v||0),0)>0?'<b>ESTOQUE: '+Object.values(p.stock).reduce((a,v)=>a+Number(v||0),0)+' UN.</b>':'<b class="stock-zero">ESGOTADO</b>')+'</div>':'')+'<span class="cta">Ver produto <b>→</b></span></div></a></article>';
}
function render(){
 let arr=PRODUCTS.filter(p=>p.published!==false).filter(p=>isCat(p,state.cat)&&isTeam(p,state.team)&&((p.name+' '+(p.team||'')+' '+(p.category||'')+' '+(p.version||'')).toLowerCase().includes(state.q)));
 if(state.sort==='menor')arr.sort((a,b)=>Number(a.price)-Number(b.price));
 if(state.sort==='maior')arr.sort((a,b)=>Number(b.price)-Number(a.price));
 $('#grid').innerHTML=arr.map(card).join('')||'<div class="empty"><strong>Nenhum produto encontrado.</strong><span>Tente outro time, coleção ou categoria.</span></div>';
 $('#count').textContent=arr.length+' '+(arr.length===1?'produto':'produtos');
}
function syncSearchUI(){
 document.querySelectorAll('#search,#searchMobile').forEach(x=>x.value=state.q);
 document.querySelectorAll('.category-card').forEach(b=>b.classList.toggle('active',!state.q&&state.team==='Todos'&&b.dataset.cat===state.cat));
 document.querySelectorAll('.team-chip').forEach(b=>b.classList.toggle('active',!state.q&&state.cat==='Todos'&&b.dataset.team===state.team));
}
function setCat(cat){
 state.cat=cat;state.team='Todos';state.q='';
 syncSearchUI();render();document.querySelector('#catalogo').scrollIntoView({behavior:'smooth',block:'start'});
}
function setTeam(team){
 state.team=team;state.cat='Todos';state.q='';
 syncSearchUI();render();document.querySelector('#catalogo').scrollIntoView({behavior:'smooth',block:'start'});
}
function setSearch(q){
 state.q=String(q||'').toLowerCase().trim();state.cat='Todos';state.team='Todos';
 syncSearchUI();render();
}
function renderTeams(){const box=$('#teamFilters');const teams=[...new Set(PRODUCTS.filter(p=>p.published!==false).map(p=>p.team).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));box.innerHTML='<button class="team-chip active" data-team="Todos">Todos os times</button>'+teams.map(t=>'<button class="team-chip" data-team="'+esc(t)+'">'+esc(t)+'</button>').join('');box.querySelectorAll('.team-chip').forEach(b=>b.addEventListener('click',()=>setTeam(b.dataset.team)));}
function normalizeSupabaseProduct(p){
 return {id:p.id,name:p.name,team:p.team||'',category:p.category||'Brasileiras',version:p.version||'Torcedor',price:Number(p.price||0),wholesalePrice:Number(p.wholesale_price||0),oldPrice:p.old_price==null?undefined:Number(p.old_price),badge:p.badge||'',description:p.description||'',published:p.published!==false,soldOut:!!p.sold_out,stock:p.stock||{},images:Array.isArray(p.images)?p.images:[],sortOrder:Number(p.sort_order||0)};
}
async function loadProducts(){
 const cfg=window.AMORA_SUPABASE_CONFIG;
 if(!cfg?.url||!cfg?.publishableKey){
  throw new Error('A configuração do Supabase não foi encontrada. Esta versão de teste não carregará silenciosamente os produtos antigos.');
 }
 let r;
 try{
  r=await fetch(cfg.url+'/rest/v1/amora_products?select=*&published=eq.true&order=sort_order.asc,created_at.desc',{
   headers:{apikey:cfg.publishableKey}
  });
 }catch(e){
  throw new Error('Não foi possível conectar ao Supabase. Verifique a conexão e tente novamente. Os produtos antigos não serão exibidos como se fossem os dados novos.');
 }
 if(!r.ok){
  throw new Error('O Supabase respondeu com erro HTTP '+r.status+'. A versão de teste não exibirá o catálogo antigo como substituto.');
 }
 const rows=await r.json();
 if(!Array.isArray(rows))throw new Error('Resposta inesperada do Supabase ao carregar o catálogo.');
 if(rows.length===0)throw new Error('A conexão com o Supabase funcionou, mas ainda não há produtos publicados. Use “Importar catálogo atual” no painel de teste somente depois de confirmar que deseja copiar os produtos e as fotos para o banco novo.');
 return rows.map(normalizeSupabaseProduct);
}
async function init(){
 try{
  PRODUCTS=await loadProducts();
  renderTeams();
  document.querySelectorAll('.category-card').forEach(b=>b.addEventListener('click',()=>setCat(b.dataset.cat)));
  document.querySelectorAll('[data-nav-cat]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();setCat(a.dataset.navCat)}));
  const sync=e=>setSearch(e.target.value);
  $('#search').addEventListener('input',sync);$('#searchMobile').addEventListener('input',sync);$('#sort').addEventListener('change',e=>{state.sort=e.target.value;render();});
  syncSearchUI();render();
 }catch(e){
  const detail=e&&e.message?e.message:'Tente atualizar a página em alguns segundos.';
  $('#grid').innerHTML='<div class="empty"><strong>Não foi possível carregar o catálogo.</strong><span>'+esc(detail)+'</span></div>';
  console.error(e);
 }
}
document.addEventListener('DOMContentLoaded',init);
