const WA='5585998022643';
const fmt=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const pix=v=>Number(v||0)*.95;
function calcWholesale(version,price,fallback=0){const v=String(version||'');const p=Number(price||0);if(/jogador/i.test(v))return Math.round(p*0.6875*100)/100;if(/torcedor/i.test(v))return Math.round(p*0.69231*100)/100;return Number(fallback||0);}
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
function productImages(p){
 const raw=Array.isArray(p.images)?p.images:[];
 const all=raw.concat(p.image||[]).filter(x=>typeof x==='string'&&x.trim());
 return [...new Set(all)].slice(0,3);
}
function visual(p){
 const imgs=productImages(p),src=imgs[0]||'';
 return src?'<img class="card-photo-image" src="'+esc(src)+'" alt="'+esc(p.name)+'" width="300" height="400" loading="lazy" decoding="async" onerror="this.style.display=&quot;none&quot;;this.parentElement.classList.add(&quot;no-image&quot;)">':'';
}
function card(p){
 const badge=p.soldOut?'ESGOTADO':(p.badge||''),imgs=productImages(p),href='produto.html?id='+encodeURIComponent(p.id);
 const photoControls=imgs.length>1?'<button type="button" class="photo-step photo-prev" data-photo-step="-1" aria-label="Foto anterior">‹</button><button type="button" class="photo-step photo-next" data-photo-step="1" aria-label="Próxima foto">›</button><div class="photo-dots" aria-label="Fotos do produto">'+imgs.map((_,i)=>'<span class="photo-dot '+(i===0?'active':'')+'"></span>').join('')+'</div><span class="photo-count">1/'+imgs.length+'</span>':'';
 return '<article class="card '+(p.soldOut?'sold':'')+'"><div class="photo" data-images="'+esc(JSON.stringify(imgs))+'" data-photo-index="0"><a class="photo-link" href="'+href+'" aria-label="Ver '+esc(p.name)+'">'+visual(p)+'<div class="placeholder"><div class="shirt-mark">'+initials(p.name)+'</div><span>AMORA FUT</span><small>STREETWEAR</small></div>'+(badge?'<b class="badge '+(p.soldOut?'sold-badge':'')+'">'+esc(badge)+'</b>':'')+(p.version?'<b class="version-badge '+(/jogador/i.test(p.version)?'version-player':(/torcedor/i.test(p.version)?'version-fan':''))+'">VERSÃO '+esc(p.version)+'</b>':'')+'<div class="quick">VER DETALHES</div></a>'+photoControls+'</div><a class="card-open" href="'+href+'"><div class="info"><div class="catline">'+esc(p.team||p.category)+' <i>•</i> '+esc(p.version||'')+'</div><h3>'+esc(p.name)+'</h3><div class="price">'+(p.oldPrice?'<del>'+fmt(p.oldPrice)+'</del>':'')+'<strong>'+fmt(p.price)+'</strong></div>'+(p.wholesalePrice>0?'<div class="wholesale-price">Atacado: <strong>'+fmt(p.wholesalePrice)+'/un.</strong> a partir de 5 peças</div>':'')+'<div class="pix"><span>PIX</span> '+fmt(pix(p.price))+'</div>'+(p.stock&&Object.keys(p.stock).length?'<div class="stock-card">'+(Object.values(p.stock).reduce((a,v)=>a+Number(v||0),0)>0?'<b>ESTOQUE: '+Object.values(p.stock).reduce((a,v)=>a+Number(v||0),0)+' UN.</b>':'<b class="stock-zero">ESGOTADO</b>')+'</div>':'')+'<span class="cta">Ver produto <b>→</b></span></div></a></article>';
}
function setCardPhoto(photo,next){
 let imgs;try{imgs=JSON.parse(photo.dataset.images||'[]')}catch{return}
 if(imgs.length<2)return;
 const idx=(Number(photo.dataset.photoIndex||0)+next+imgs.length)%imgs.length;
 photo.dataset.photoIndex=String(idx);
 const img=photo.querySelector('.card-photo-image');if(img){img.src=imgs[idx];img.style.display='';}
 photo.querySelectorAll('.photo-dot').forEach((dot,i)=>dot.classList.toggle('active',i===idx));
 const count=photo.querySelector('.photo-count');if(count)count.textContent=(idx+1)+'/'+imgs.length;
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
 return {id:p.id,name:p.name,team:p.team||'',category:p.category||'Brasileiras',version:p.version||'Torcedor',price:Number(p.price||0),wholesalePrice:calcWholesale(p.version,p.price,p.wholesale_price),oldPrice:p.old_price==null?undefined:Number(p.old_price),badge:p.badge||'',description:p.description||'',published:p.published!==false,soldOut:!!p.sold_out,stock:p.stock||{},images:Array.isArray(p.images)?p.images:[],sortOrder:Number(p.sort_order||0)};
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
  let detail='', raw='', contentType=r.headers.get('content-type')||'não informado';
  try{raw=await r.text();}catch(_e){}
  try{
   const body=JSON.parse(raw);
   detail=body.message||body.msg||body.error_description||body.error||body.hint||body.details||'';
   if(!detail)detail=JSON.stringify(body);
  }catch(_e){detail=raw;}
  detail=String(detail||'Sem mensagem no corpo da resposta.').replace(/[<>]/g,' ').slice(0,700);
  const requestId=r.headers.get('x-request-id')||r.headers.get('sb-request-id')||'não informado';
  throw new Error('Diagnóstico Supabase: HTTP '+r.status+'. Tipo de resposta: '+contentType+'. Detalhe: '+detail+'. ID da requisição: '+requestId+'. URL do projeto: '+String(cfg.url).replace(/^https?:\/\//,'').replace(/\/$/,'')+'. A chave pública está presente (prefixo '+String(cfg.publishableKey).slice(0,15)+'…). Nenhuma chave completa será exibida.');
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
  const grid=$('#grid');
  grid.addEventListener('click',e=>{const btn=e.target.closest('[data-photo-step]');if(!btn)return;e.preventDefault();e.stopPropagation();setCardPhoto(btn.closest('.photo'),Number(btn.dataset.photoStep));});
  let swipeStart=null;
  grid.addEventListener('touchstart',e=>{const photo=e.target.closest('.photo');if(photo&&productImages({images:JSON.parse(photo.dataset.images||'[]')}).length>1)swipeStart={photo,x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};},{passive:true});
  grid.addEventListener('touchend',e=>{if(!swipeStart)return;const dx=e.changedTouches[0].clientX-swipeStart.x,dy=e.changedTouches[0].clientY-swipeStart.y;if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy))setCardPhoto(swipeStart.photo,dx<0?1:-1);swipeStart=null;},{passive:true});
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
