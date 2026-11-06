const WA='5585998022643';
const fmt=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function calcWholesale(version,price,fallback=0){const v=String(version||'');if(/jogador|retr[oô]/i.test(v))return 110;if(/torcedor/i.test(v))return 90;return Number(fallback||0);}
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const params=new URLSearchParams(location.search),id=params.get('id');
function displayPrice(p){return Number(p.salePrice??75)}
function wa(p,size){let t='Olá! Vi no catálogo VIP da Amora Fut e tenho interesse na '+p.name+' ('+(p.version||'')+')';if(size)t+=' no tamanho '+size;t+=', por '+fmt(displayPrice(p))+'. Gostaria de confirmar disponibilidade.';return 'https://wa.me/'+WA+'?text='+encodeURIComponent(t);}
function imageGallery(p){
 const imgs=(p.images&&p.images.length?p.images:(p.image?[p.image]:[]));
 if(!imgs.length)return '<div class="product-placeholder"><div class="shirt-mark">'+esc((p.name||'AF').split(/\s+/).map(x=>x[0]).slice(0,3).join('').toUpperCase())+'</div><span>AMORA FUT</span><small>CATÁLOGO VIP</small></div>';
 return '<div class="gallery-main"><img id="mainProductImage" src="'+esc(imgs[0])+'" alt="'+esc(p.name)+'" width="900" height="1200" decoding="async"></div><div class="thumbs">'+imgs.map((x,i)=>'<button type="button" class="thumb '+(i===0?'active':'')+'" data-img="'+esc(x)+'"><img src="'+esc(x)+'" alt=""></button>').join('')+'</div>';
}
function sizeButtons(p){
 const stock=p.stock||{},sizes=['P','M','G','GG','3G'],managed=Object.keys(stock).length>0;
 const total=Object.values(stock).reduce((sum,value)=>sum+Math.max(0,Number(value)||0),0);
 if(!managed&&!p.soldOut)return '<div class="sizes">'+sizes.map(size=>'<button class="size" data-size="'+size+'">'+size+'</button>').join('')+'</div><div class="stock-note">Disponibilidade sujeita a confirmação pelo WhatsApp.</div>';
 return '<div class="sizes">'+sizes.map(size=>{
  const quantity=Math.max(0,Number(stock[size]||0));
  const unavailable=p.soldOut||!managed||quantity===0;
  return '<button class="size '+(unavailable?'disabled':'')+'" data-size="'+size+'" '+(unavailable?'disabled aria-disabled="true"':'')+'>'+size+(unavailable?' <small>Esgotado</small>':' <small>('+quantity+' un.)</small>')+'</button>';
 }).join('')+'</div>'+(p.soldOut?'<div class="stock-note sold-out-message">Produto esgotado em todos os tamanhos.</div>':managed?'<div class="stock-total">Estoque total: <b>'+total+' unidades</b></div>':'');
}
function render(p){
 document.title=p.name+' — Amora Fut Streetwear';
 const imgs=(p.images&&p.images.length?p.images:(p.image?[p.image]:[]));
 const badge=p.soldOut?'ESGOTADO':(p.bfMode==='bf2'?'BLACK FRIDAY 2':'BLACK FRIDAY 1');
 const purchaseControls=p.soldOut
  ? '<div class="stock-note sold-out-message">Este produto está esgotado no momento. Não é possível adicioná-lo ao carrinho.</div><div class="product-actions"><a class="product-btn secondary" href="'+wa(p)+'" target="_blank" rel="noopener">Consultar reposição pelo WhatsApp</a><a class="product-btn secondary" href="index.html#catalogo">← Voltar ao catálogo</a></div>'
  : '<div class="product-cart-row"><div class="product-qty"><button type="button" id="qtyMinus">−</button><strong id="qtyValue">1</strong><button type="button" id="qtyPlus">+</button></div><button id="addCartBtn" class="product-btn primary" type="button">🛒 Adicionar ao carrinho</button></div><div class="product-actions"><a id="waBtn" class="product-btn secondary" href="'+wa(p)+'" target="_blank" rel="noopener">Pedir direto pelo WhatsApp</a><a class="product-btn secondary" href="index.html#catalogo">← Voltar ao catálogo</a></div>';
 document.querySelector('#productRoot').innerHTML='<div class="product-breadcrumb"><a href="index.html">Início</a> / <a href="index.html#catalogo">Catálogo</a> / '+esc(p.name)+'</div><section class="product-box"><div class="product-media">'+imageGallery(p)+'</div><div class="product-info"><div class="product-tag">'+esc(badge)+'</div><h1>'+esc(p.name)+'</h1><div class="product-meta">'+esc(p.team||'')+' • '+esc(p.category||'')+' • '+esc(p.version||'')+'</div><div class="product-price">'+'<del>'+fmt(p.price)+'</del><strong>'+fmt(displayPrice(p))+'</strong></div>'+(p.wholesalePrice>0?'<div class="wholesale-price">Atacado: <strong>'+fmt(p.wholesalePrice)+'/un.</strong> a partir de 5 peças no pedido</div>':'')+'<div class="product-pix">PIX · '+fmt(displayPrice(p)*.95)+' — 5% OFF</div>'+(p.description?'<p class="product-description">'+esc(p.description)+'</p>':'')+'<div class="size-label">TAMANHOS</div>'+sizeButtons(p)+'<div class="product-points"><div>✓ Envio para todo o Brasil</div><div>✓ Atendimento personalizado</div><div>✓ Confirmação de estoque pelo WhatsApp</div></div>'+purchaseControls+'</div></section>';
 const mainImage=document.querySelector('#mainProductImage');
 const setGalleryImage=(index)=>{if(!mainImage||!imgs.length)return;const i=(index+imgs.length)%imgs.length;mainImage.src=imgs[i];document.querySelectorAll('.thumb').forEach((x,n)=>x.classList.toggle('active',n===i));};
 document.querySelectorAll('.thumb').forEach((button,index)=>button.addEventListener('click',()=>setGalleryImage(index)));
 if(mainImage&&imgs.length>1){
  let startX=0,startY=0,moved=false;
  mainImage.addEventListener('touchstart',e=>{const t=e.changedTouches[0];startX=t.clientX;startY=t.clientY;moved=false;},{passive:true});
  mainImage.addEventListener('touchmove',e=>{const t=e.changedTouches[0];if(Math.abs(t.clientX-startX)>10)moved=true;},{passive:true});
  mainImage.addEventListener('touchend',e=>{if(!moved)return;const t=e.changedTouches[0],dx=t.clientX-startX,dy=t.clientY-startY;if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy))return;const active=[...document.querySelectorAll('.thumb')].findIndex(x=>x.classList.contains('active'));setGalleryImage(active+(dx<0?1:-1));},{passive:true});
 }
 document.querySelectorAll('.size:not(.disabled)').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('.size').forEach(item=>item.classList.remove('selected'));
  button.classList.add('selected');
  const waButton=document.querySelector('#waBtn');if(waButton)waButton.href=wa(p,button.dataset.size);
 }));
 let qty=1;
 const qv=document.querySelector('#qtyValue'),qm=document.querySelector('#qtyMinus'),qp=document.querySelector('#qtyPlus'),addBtn=document.querySelector('#addCartBtn');
 const selectedSize=()=>document.querySelector('.size.selected')?.dataset.size||'';
 const maxQty=()=>{const size=selectedSize();return p.stock&&size?Number(p.stock[size]||0):null;};
 const syncQty=()=>{const max=maxQty();if(max!==null&&max>0)qty=Math.min(qty,max);if(qv)qv.textContent=qty;};
 qm?.addEventListener('click',()=>{qty=Math.max(1,qty-1);syncQty();});
 qp?.addEventListener('click',()=>{const max=maxQty();if(max===null||qty<max)qty++;syncQty();});
 addBtn?.addEventListener('click',()=>{if(p.soldOut)return;const size=selectedSize();if(p.stock&&Object.keys(p.stock).length&&!size){alert('Selecione um tamanho.');return;}if(p.stock&&size&&Number(p.stock[size]||0)<=0){alert('Este tamanho está esgotado.');return;}addToCart(p,size,qty);});
}
function normalizeSupabaseProduct(p){
 return {id:p.id,name:p.name,team:p.team||'',category:p.category||'Brasileiras',version:p.version||'Torcedor',price:Number(p.price||0),salePrice:(p.bf_mode||'bf1')==='bf2'?Number(p.bf2_price||0):75,bfMode:p.bf_mode||'bf1',bf2Price:p.bf2_price==null?null:Number(p.bf2_price),wholesalePrice:calcWholesale(p.version,p.price,p.wholesale_price),oldPrice:p.old_price==null?undefined:Number(p.old_price),badge:p.badge||'',description:p.description||'',published:p.published!==false,soldOut:!!p.sold_out||((p.stock&&Object.keys(p.stock).length>0)&&Object.values(p.stock).reduce((sum,value)=>sum+Math.max(0,Number(value)||0),0)===0),stock:p.stock||{},images:Array.isArray(p.images)?p.images:[]};
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