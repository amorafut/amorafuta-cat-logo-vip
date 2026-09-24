const CART_KEY='amora_fut_cart_v1',WA_CART='5585998022643';
const FREIGHT_API='https://amora-fut-frete.amorafut.workers.dev/';
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function getCart(){try{return JSON.parse(localStorage.getItem(CART_KEY)||'[]')}catch{return[]}}
function saveCart(c){localStorage.setItem(CART_KEY,JSON.stringify(c));clearFreightQuote();renderCart()}
function cartCount(){return getCart().reduce((n,i)=>n+Number(i.qty||0),0)}
function cartTotal(){return getCart().reduce((s,i)=>s+i.price*i.qty,0)}
let freightCep='',freightOptions=[],selectedFreight=null,freightLoading=false,freightError='';
function clearFreightQuote(){freightOptions=[];selectedFreight=null;freightError='';}
function addToCart(p,size,qty=1){const c=getCart(),key=p.id+'::'+(size||'ÚNICO'),max=p.stock&&size?Number(p.stock[size]||0):null,found=c.find(i=>i.key===key);if(found)found.qty=max?Math.min(max,found.qty+qty):found.qty+qty;else c.push({key,id:p.id,name:p.name,team:p.team||'',version:p.version||'',price:Number(p.price||0),size:size||'',qty:Number(qty||1),image:(p.images&&p.images[0])||p.image||'',stock:max});saveCart(c);openCart()}
function changeCart(key,d){const c=getCart(),i=c.findIndex(x=>x.key===key);if(i<0)return;const max=c[i].stock;c[i].qty=max?Math.min(max,c[i].qty+d):c[i].qty+d;if(c[i].qty<=0)c.splice(i,1);saveCart(c)}
function removeCart(key){saveCart(getCart().filter(x=>x.key!==key))}
function setFreightCep(v){freightCep=String(v||'').replace(/\\D/g,'').slice(0,8);const input=document.getElementById('freightCep');if(input){const digits=freightCep;input.value=digits.length>5?digits.slice(0,5)+'-'+digits.slice(5):digits;}clearFreightQuote()}
function shippingPrice(){return selectedFreight?Number(selectedFreight.price||0):0}
function orderTotal(){return cartTotal()+shippingPrice()}
function safeText(v){return String(v==null?'':v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function normalizeQuotes(data){
  let list=data&&data.cotacoes;
  if(!Array.isArray(list)){if(Array.isArray(data))list=data;else if(list&&typeof list==='object')list=Object.values(list);else list=[]}
  return list.map((x,i)=>{
    const raw=x.price??x.valor??x.amount??x.total;
    const price=typeof raw==='string'?Number(raw.replace(/[^0-9,.-]/g,'').replace(',','.')):Number(raw);
    return {...x,_id:String(x.id??x.service_id??x.name??i),_name:String(x.name??x.service_name??x.company?.name??('Opção '+(i+1))),price:Number.isFinite(price)?price:NaN};
  }).filter(x=>Number.isFinite(x.price)&&x.price>=0);
}
async function quoteFreight(){
  const cep=freightCep.replace(/\\D/g,'');
  if(!getCart().length){freightError='Adicione produtos ao carrinho antes de calcular o frete.';renderCart();return}
  if(!/^\\d{8}$/.test(cep)){freightError='Informe um CEP válido com 8 dígitos.';renderCart();return}
  freightLoading=true;freightError='';freightOptions=[];selectedFreight=null;renderCart();
  try{
    const response=await fetch(FREIGHT_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cep,quantidade:cartCount()})});
    let data;try{data=await response.json()}catch{data={message:'Resposta inválida do serviço de frete.'}}
    if(!response.ok||data.error)throw new Error(data.details?.errors?JSON.stringify(data.details.errors):data.error||data.message||('Erro HTTP '+response.status));
    freightOptions=normalizeQuotes(data);
    if(!freightOptions.length)throw new Error('A API não retornou opções de frete com preço reconhecível.');
    selectedFreight=freightOptions[0];
  }catch(e){freightError='Não foi possível calcular o frete. '+(e.message||'Tente novamente.')}
  finally{freightLoading=false;renderCart()}
}
function chooseFreight(id){selectedFreight=freightOptions.find(x=>x._id===String(id))||null;renderCart()}
function checkoutCart(){
 const c=getCart();if(!c.length)return;
 if(!selectedFreight){alert('Informe o CEP e calcule o frete. Depois, selecione uma opção de entrega.');return}
 let t='Olá! Quero fazer um pedido na Amora Fut:\\n\\n';
 c.forEach((i,n)=>t+=(n+1)+'. '+i.name+(i.size?' — tamanho '+i.size:'')+' — '+i.qty+' un. — '+money(i.price*i.qty)+'\\n');
 t+='\\nCEP de entrega: '+freightCep+'\\nFrete ('+selectedFreight._name+'): '+money(shippingPrice())+'\\nSubtotal dos produtos: '+money(cartTotal())+'\\nTotal com frete: '+money(orderTotal())+'\\n\\nGostaria de confirmar disponibilidade e pagamento.';
 window.open('https://wa.me/'+WA_CART+'?text='+encodeURIComponent(t),'_blank','noopener');
}
const CART_ICON='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 6h3l2.2 13.2a2 2 0 0 0 2 1.7h11.9a2 2 0 0 0 1.9-1.5L28 10H8"/><circle cx="12.5" cy="26" r="2"/><circle cx="24" cy="26" r="2"/></svg>';
function cartHTML(){return '<div id="cartOverlay" class="cart-overlay" onclick="if(event.target===this)closeCart()"></div><aside id="cartDrawer" class="cart-drawer"><div class="cart-head"><div><small>AMORA FUT</small><h2>Seu carrinho</h2></div><button class="cart-close" onclick="closeCart()">×</button></div><div id="cartItems" class="cart-items"></div><div class="cart-foot"><div id="cartFreight" class="cart-freight"></div><div class="cart-total"><span>Subtotal</span><strong id="cartSubtotal">R$ 0,00</strong></div><div class="cart-total"><span>Frete</span><strong id="cartShipping">A calcular</strong></div><div class="cart-total cart-grand-total"><span>Total com frete</span><strong id="cartTotal">R$ 0,00</strong></div><button class="cart-checkout" onclick="checkoutCart()">Finalizar pelo WhatsApp</button><button class="cart-continue" onclick="closeCart()">Continuar comprando</button></div></aside><button id="cartFloat" class="cart-float" onclick="openCart()" aria-label="Abrir carrinho">'+CART_ICON+'<b id="cartBadge">0</b></button>'}
function renderFreight(){
 const box=document.getElementById('cartFreight');if(!box)return;
 const options=freightOptions.length?'<div class="freight-options">'+freightOptions.map(x=>'<label class="freight-option"><input type="radio" name="freightOption" value="'+safeText(x._id)+'" '+(selectedFreight&&selectedFreight._id===x._id?'checked':'')+' onchange="chooseFreight(this.value)"><span><b>'+safeText(x._name)+'</b><small>'+(x.delivery_time?'Prazo informado: '+safeText(x.delivery_time)+' dias':'')+'</small></span><strong>'+money(x.price)+'</strong></label>').join('')+'</div>':'';
 box.innerHTML='<div class="freight-title">CALCULAR ENTREGA</div><label class="freight-label" for="freightCep">CEP de destino</label><div class="freight-row"><input id="freightCep" inputmode="numeric" maxlength="9" placeholder="00000-000" value="'+safeText(freightCep.length>5?freightCep.slice(0,5)+'-'+freightCep.slice(5):freightCep)+'" oninput="setFreightCep(this.value)" aria-label="CEP de destino"><button type="button" class="freight-calc" onclick="quoteFreight()" '+(freightLoading?'disabled':'')+'>'+(freightLoading?'Calculando…':'Calcular frete')+'</button></div>'+(freightError?'<p class="freight-error">'+safeText(freightError)+'</p>':'')+options;
}
function renderCart(){
 const box=document.getElementById('cartItems'),badge=document.getElementById('cartBadge'),subtotal=document.getElementById('cartSubtotal'),shipping=document.getElementById('cartShipping'),total=document.getElementById('cartTotal'),headerBadge=document.getElementById('headerCartBadge');if(!box)return;
 const c=getCart();if(badge)badge.textContent=cartCount();if(headerBadge)headerBadge.textContent=cartCount();
 box.innerHTML=c.length?c.map(i=>'<div class="cart-item"><div class="cart-item-img">'+(i.image?'<img src="'+i.image+'" alt="">':'⚽')+'</div><div class="cart-item-main"><strong>'+safeText(i.name)+'</strong><small>'+safeText([i.team,i.size?'Tam. '+i.size:'',i.version].filter(Boolean).join(' • '))+'</small><div class="cart-item-bottom"><div class="qty"><button onclick="changeCart(\''+i.key+'\',-1)">−</button><b>'+i.qty+'</b><button onclick="changeCart(\''+i.key+'\',1)">+</button></div><strong>'+money(i.price*i.qty)+'</strong></div><button class="cart-remove" onclick="removeCart(\''+i.key+'\')">Remover</button></div></div>').join(''):'<div class="cart-empty"><div>🛒</div><strong>Seu carrinho está vazio</strong><span>Adicione suas camisas favoritas.</span></div>';
 renderFreight();if(subtotal)subtotal.textContent=money(cartTotal());if(shipping)shipping.textContent=selectedFreight?money(shippingPrice()):'A calcular';if(total)total.textContent=money(orderTotal());
}
function openCart(){document.body.classList.add('cart-open');renderCart()}function closeCart(){document.body.classList.remove('cart-open')}function initCart(){const r=document.getElementById('cartRoot');if(r)r.innerHTML=cartHTML();renderCart()}document.addEventListener('DOMContentLoaded',initCart);
