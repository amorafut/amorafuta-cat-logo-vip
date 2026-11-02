const WA='5585998022643';
const fmt=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function calcWholesale(version,price,fallback=0){const v=String(version||'');if(/jogador|retr[oô]/i.test(v))return 110;if(/torcedor/i.test(v))return 90;return Number(fallback||0);}
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const params=new URLSearchParams(location.search),id=params.get('id');
function wa(p,size){let t='Olá! Vi no catálogo VIP da Amora Fut e tenho interesse na '+p.name+' ('+(p.version||'')+')';if(size)t+=' no tamanho '+size;t+=', por '+fmt(p.price)+'. Gostaria de confirmar disponibilidade.';return 'https://wa.me/'+WA+'?text='+encodeURIComponent(t);}
function imageGallery(p){
 const imgs=(p.images&&p.images.length?p.images:(p.image?[p.image]:[]));
 if(!imgs.length)return '<div class="product-placeholder"><div class="shirt-mark">'+esc((p.name||'AF').split(/\s+/).map(x=>x[0]).slice(0,3).join('').toUpperCase())+'</div><span>AMORA FUT</span><small>CATÁLOGO VIP</small></div>';
 return '<div class="gallery-main"><img id="mainProductImage" src="'+esc(imgs[0])+'" alt="'+esc(p.name)+'" width="900" height="1200" decoding="async"></div><div class="thumbs">'+imgs.map((x,i)=>'<button type="button" class="thumb '+(i===0?'active':'')+'" data-img="'+esc(x)+'"><img src="'+esc(x)+'" alt=""></button>').join('')+'</div>';
}
function sizeButtons(p){
 const s=p.stock||{};const sizes=['P','M','G','GG','3G'];const managed=Object.keys(s).length>0;const total=Object.values(s).reduce((a,v)=>a+Math.max(0,Number(v)||0),0);
 if(!managed)return '<div class="sizes">'+sizes.map(x=>'<button class="size" data-size="'+x+'">'+x+'</button>').join('')+'</div><div class="stock-note">Disponibilidade sujeita a confirmação pelo WhatsApp.</div>';
 return '<div class="sizes">'+sizes.map(x=>{const n=Math.max(0,Number(s[x]||0));const unavailable=p.soldOut||n===0;return '<button class="size '+(unavailable?'disabled':'')+'" data-size="'+x+'" '+(unavailable?'disabled aria-disabled="true"':'')+'>'+x+(unavailable?' <small>Esgotado</small>':' <small>('+n+' un.)</small>')+'</button>';}).join('')+'</div>'+(p.soldOut?'<div class="stock-note sold-out-message">Produto esgotado em todos os tamanhos.</div>':'<div class="stock-total">Estoque total: <b>'+total+' unidades</b></div>');
}
function render(p){
 document.title=p.name+' — Amora Fut Streetwear';
 const imgs=(p.images&&p.images.length?p.images:(p.image?[p.image]:[]));
 const badge=p.soldOut?'ESGOTADO':(p.badge||'CATÁLOGO VIP');
 const purchaseControls=p.soldOut?'<div class="stock-note sold-out-message">Este produto está esgotado no momento. Não é possível adicioná-lo ao carrinho.</div><div class="product-actions"><a class="product-btn secondary" href="index.html#catalogo">← Voltar ao catálogo</a></div>':''+purchaseControls+'</div></section>';
 const mainImage=document.querySelector('#mainProductImage');
 const setGalleryImage=(index)=>{if(!mainImage||!imgs.length)return;const i=(index+imgs.length)%imgs.length;mainImage.src=imgs[i];document.querySelectorAll('.thumb').forEach((x,n)=>x.classList.toggle('active',n===i));};
 document.querySelectorAll('.thumb').forEach((b,i)=>b.addEventListener('click',()=>setGalleryImage(i)));
 if(mainImage&&imgs.length>1){
  let startX=0,startY=0,moved=false;
  mainImage.addEventListener('touchstart',e=>{const t=e.changedTouches[0];startX=t.clientX;startY=t.clientY;moved=false},{passive:true});
  mainImage.addEventListener('touchmove',e=>{const t=e.changedTouches[0];if(Math.abs(t.clientX-startX)>10)moved=true;},{passive:true});
  mainImage.addEventListener('touchend',e=>{if(!moved)return;const t=e.changedTouches[0];const dx=t.clientX-startX;const dy=t.clientY-startY;if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy))return;const active=[...document.querySelectorAll('.thumb')].findIndex(x=>x.classList.contains('active'));setGalleryImage(active+(dx<0?1:-1));},{passive:true});
 }
 document.querySelectorAll('.size:not(.disabled)').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.size').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');document.querySelector('#waBtn').href=wa(p,b.dataset.size);}));let qty=1;const qv=document.querySelector('#qtyValue'),qm=document.querySelector('#qtyMinus'),qp=document.querySelector('#qtyPlus'),addBtn=document.querySelector('#addCartBtn');const selectedSize=()=>document.querySelector('.size.selected')?.dataset.size||'';const maxQty=()=>{const s=selectedSize();return p.stock&&s?Number(p.stock[s]||0):null};const syncQty=()=>{const m=maxQty();if(m!==null&&m>0)qty=Math.min(qty,m);qv.textContent=qty};qm?.addEventListener('click',()=>{qty=Math.max(1,qty-1);syncQty()});qp?.addEventListener('click',()=>{const m=maxQty();if(m===null||qty<m)qty++;syncQty()});addBtn?.addEventListener('click',()=>{if(p.soldOut)return;const s=selectedSize();if(p.stock&&Object.keys(p.stock).length&&!s){alert('Selecione um tamanho.');return}addToCart(p,s,qty)});
}
function normalizeSupabaseProduct(p){
 return {id:p.id,name:p.name,team:p.team||'',category:p.category||'Brasileiras',version:p.version||'Torcedor',price:Number(p.price||0),wholesalePrice:calcWholesale(p.version,p.price,p.wholesale_price),oldPrice:p.old_price==null?undefined:Number(p.old_price),badge:p.badge||'',description:p.description||'',published:p.published!==false,soldOut:!!p.sold_out||((p.stock&&Object.keys(p.stock).length>0)&&Object.values(p.stock).reduce((a,v)=>a+Math.max(0,Number(v)||0),0)===0),stock:p.stock||{},images:Array.isArray(p.images)?p.images:[]};
}
async function init(){
 try{
  const cfg=window.AMORA_SUPABASE_CONFIG;
  if(!cfg?.url||!cfg?.publishableKey)throw new Error('Configuração do Supabase ausente nesta versão de teste.');
  let r;
  try{
   r=await fetch(cfg.url+'/rest/v1/amora_products?select=*&id=eq.'+encodeURIComponent(id)+'&published=eq.true&limit=1',{headers:{apikey:cfg.publishableKey}});
  }catch(e){throw new Error('Não foi possível conectar ao Supabase. Os dados antigos não serão usados como substitutos.');}
  if(!r.ok)throw new Error('O Supabase respondeu com erro HTTP '+r.status+'.');
  const rows=await r.json();
  if(!Array.isArray(rows)||!rows.length)throw new Error('Este produto ainda não está publicado no banco novo. Volte ao catálogo de teste ou importe os produtos pelo painel após confirmar a migração.');
  const p=rows.map(normalizeSupabaseProduct).find(x=>x.id===id&&x.published!==false);
  if(!p)throw new Error('Produto não encontrado no catálogo novo.');
  render(p);
 }catch(e){
  const root=document.querySelector('#productRoot');
  root.innerHTML='<div class="empty"><strong>Não foi possível carregar este produto.</strong><span>'+esc(e&&e.message?e.message:'Tente atualizar a página.')+' <a href="index.html#catalogo">Voltar ao catálogo</a></span></div>';
 }
}
document.addEventListener('DOMContentLoaded',init);