const WA='5585998022643';
const fmt=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const params=new URLSearchParams(location.search),id=params.get('id');
function wa(p,size){let t='Olá! Vi no catálogo VIP da Amora Fut e tenho interesse na '+p.name+' ('+(p.version||'')+')';if(size)t+=' no tamanho '+size;t+=', por '+fmt(p.price)+'. Gostaria de confirmar disponibilidade.';return 'https://wa.me/'+WA+'?text='+encodeURIComponent(t);}
function imageGallery(p){
 const imgs=(p.images&&p.images.length?p.images:(p.image?[p.image]:[]));
 if(!imgs.length)return '<div class="product-placeholder"><div class="shirt-mark">'+esc((p.name||'AF').split(/\s+/).map(x=>x[0]).slice(0,3).join('').toUpperCase())+'</div><span>AMORA FUT</span><small>CATÁLOGO VIP</small></div>';
 return '<div class="gallery-main"><img id="mainProductImage" src="'+esc(imgs[0])+'" alt="'+esc(p.name)+'"></div><div class="thumbs">'+imgs.map((x,i)=>'<button class="thumb '+(i===0?'active':'')+'" data-img="'+esc(x)+'"><img src="'+esc(x)+'" alt=""></button>').join('')+'</div>';
}
function sizeButtons(p){
 const s=p.stock||{};const sizes=['P','M','G','GG'];if(!p.stock)return '<div class="stock-note">Consulte os tamanhos disponíveis pelo WhatsApp.</div>';
 return '<div class="sizes">'+sizes.map(x=>{const n=Number(s[x]||0);return '<button class="size '+(!n?'disabled':'')+'" data-size="'+x+'" '+(!n?'disabled':'')+'>'+x+(n?'':'<small>Esgotado</small>')+'</button>';}).join('')+'</div>';
}
function render(p){
 document.title=p.name+' — Amora Fut Streetwear';
 const imgs=(p.images&&p.images.length?p.images:(p.image?[p.image]:[]));
 const badge=p.soldOut?'ESGOTADO':(p.badge||'CATÁLOGO VIP');
 document.querySelector('#productRoot').innerHTML='<div class="product-breadcrumb"><a href="index.html">Início</a> / <a href="index.html#catalogo">Catálogo</a> / '+esc(p.name)+'</div><section class="product-box"><div class="product-media">'+imageGallery(p)+'</div><div class="product-info"><div class="product-tag">'+esc(badge)+'</div><h1>'+esc(p.name)+'</h1><div class="product-meta">'+esc(p.team||'')+' • '+esc(p.category||'')+' • '+esc(p.version||'')+'</div><div class="product-price">'+(p.oldPrice?'<del>'+fmt(p.oldPrice)+'</del>':'')+'<strong>'+fmt(p.price)+'</strong></div><div class="product-pix">PIX · '+fmt(Number(p.price||0)*.95)+' — 5% OFF</div>'+(p.description?'<p class="product-description">'+esc(p.description)+'</p>':'')+'<div class="size-label">TAMANHOS</div>'+sizeButtons(p)+'<div class="product-points"><div>✓ Envio para todo o Brasil</div><div>✓ Atendimento personalizado</div><div>✓ Confirmação de estoque pelo WhatsApp</div></div><div class="product-actions"><a id="waBtn" class="product-btn primary '+(p.soldOut?'disabled':'')+'" '+(p.soldOut?'aria-disabled="true"':'href="'+wa(p)+'" target="_blank" rel="noopener"')+'>'+(p.soldOut?'Produto esgotado':'Pedir pelo WhatsApp')+'</a><a class="product-btn secondary" href="index.html#catalogo">← Voltar ao catálogo</a></div></div></section>';
 document.querySelectorAll('.thumb').forEach(b=>b.addEventListener('click',()=>{document.querySelector('#mainProductImage').src=b.dataset.img;document.querySelectorAll('.thumb').forEach(x=>x.classList.remove('active'));b.classList.add('active');}));
 document.querySelectorAll('.size:not(.disabled)').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.size').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');document.querySelector('#waBtn').href=wa(p,b.dataset.size);}));
}
async function init(){try{const r=await fetch('data/products.json?v='+Date.now(),{cache:'no-store'});const ps=await r.json();const p=ps.find(x=>x.id===id&&x.published!==false);if(!p)throw new Error('Produto não encontrado');render(p);}catch(e){document.querySelector('#productRoot').innerHTML='<div class="empty"><strong>Produto não encontrado.</strong><span><a href="index.html#catalogo">Voltar ao catálogo</a></span></div>';}}
document.addEventListener('DOMContentLoaded',init);