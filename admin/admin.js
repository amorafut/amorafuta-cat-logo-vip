let db=null,products=[],currentId=null,pendingFiles=[],pendingByProduct={},pendingFilesByProduct={},slugManuallyEdited=false;
const $=s=>document.querySelector(s);
function calcWholesale(version,price,fallback=0){const v=String(version||'');if(/jogador|retr[oô]/i.test(v))return 110;if(/torcedor/i.test(v))return 90;return Number(fallback||0);}
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function msg(t,ok=true){$('#authMsg').textContent=t;$('#status').textContent=t;$('#authMsg').style.color=ok?'var(--green)':'var(--danger)';}
function fromRow(r){return {id:r.id,name:r.name,team:r.team||'',category:r.category||'Brasileiras',version:r.version||'Torcedor',price:Number(r.price||0),wholesalePrice:calcWholesale(r.version,r.price,r.wholesale_price),oldPrice:r.old_price==null?'':Number(r.old_price),badge:r.badge||'',description:r.description||'',published:r.published!==false,soldOut:!!r.sold_out,stock:r.stock||{P:0,M:0,G:0,GG:0,'3G':0},images:Array.isArray(r.images)?r.images:[],sortOrder:Number(r.sort_order||0)};}
function toRow(p){return {id:p.id,name:p.name,team:p.team||'',category:p.category||'Brasileiras',version:p.version||'Torcedor',price:Number(p.price||0),wholesale_price:calcWholesale(p.version,p.price,p.wholesalePrice),old_price:p.oldPrice===''||p.oldPrice==null?null:Number(p.oldPrice),badge:p.badge||'',description:p.description||'',published:p.published!==false,sold_out:!!p.soldOut,stock:p.stock||{},images:p.images||[],sort_order:Number(p.sortOrder||0),updated_at:new Date().toISOString()};}
async function loadData(){const {data,error}=await db.from('amora_products').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false});if(error)throw error;products=(data||[]).map(fromRow);pendingByProduct={};pendingFilesByProduct={};renderList();updateStats();if(typeof renderSaleProducts==='function')renderSaleProducts();if(typeof renderSales==='function')renderSales();}
function updateStats(){
 const sizes=['P','M','G','GG','3G'];
 const validProducts=Array.isArray(products)?products:[];
 const teams=new Set(validProducts.map(p=>String(p.team||'').trim().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLocaleLowerCase('pt-BR')).filter(Boolean));
 const units=validProducts.reduce((sum,p)=>{
  let stock=p.stock||{};
  if(typeof stock==='string'){try{stock=JSON.parse(stock)}catch(e){stock={}}}
  return sum+sizes.reduce((n,size)=>n+Math.max(0,Number(stock&&stock[size]||0)||0),0);
 },0);
 const productEl=$('#statProducts'),teamEl=$('#statTeams'),stockEl=$('#statStock');
 if(productEl)productEl.textContent=String(validProducts.length);
 if(teamEl)teamEl.textContent=String(teams.size);
 if(stockEl)stockEl.textContent=String(units);
}
function thumb(p){const src=(p.images&&p.images[0])||p.image;return src?'<img src="'+esc(src)+'" alt="">':'<span>⚽</span>';}
function normalizeSearch(value){return String(value||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();}
function renderList(){const q=normalizeSearch($('#filter').value);const arr=products.filter(p=>normalizeSearch(p.name+' '+(p.team||'')).includes(q));$('#list').innerHTML=arr.map(p=>'<div class="list-item '+(p.id===currentId?'active':'')+'" data-id="'+esc(p.id)+'"><div class="list-thumb">'+thumb(p)+'</div><div><strong>'+esc(p.name)+'</strong><small>'+esc(p.team||'')+' · '+esc(p.version||'')+'</small><span class="pill">'+(p.published===false?'RASCUNHO':(p.soldOut?'ESGOTADO':'PUBLICADO'))+'</span></div></div>').join('');document.querySelectorAll('.list-item').forEach(x=>x.onclick=()=>edit(x.dataset.id));}
function blank(){return {id:'',team:'',name:'',category:'Brasileiras',version:'Torcedor',price:'',wholesalePrice:'',oldPrice:'',badge:'',description:'',published:true,soldOut:false,stock:{P:0,M:0,G:0,GG:0,'3G':0},images:[]};}
function setForm(p){if(currentId&&currentId!==(p&&p.id))captureDraft();const d=p&&p.id?pendingByProduct[p.id]:null;if(d&&d.product)p=d.product;currentId=p.id||null;slugManuallyEdited=!!p.id;pendingFiles=pendingFilesByProduct[p.id]?[...pendingFilesByProduct[p.id]]:[];$('#emptyEditor').classList.add('hidden');$('#form').classList.remove('hidden');$('#editMode').textContent=p.id?'EDITAR PRODUTO':'NOVO PRODUTO';$('#formTitle').textContent=p.name||'Novo produto';$('#fId').value=p.id||'';$('#fName').value=p.name||'';$('#fTeam').value=p.team||'';$('#fCategory').value=p.category||'Brasileiras';$('#fVersion').value=p.version||'Torcedor';$('#fPrice').value=p.price??'';$('#fWholesalePrice').value=calcWholesale(p.version,p.price,p.wholesalePrice).toFixed(2);$('#fWholesalePrice').value=calcWholesale(p.version,p.price,p.wholesalePrice).toFixed(2);$('#fOldPrice').value=p.oldPrice??'';$('#fBadge').value=p.badge||'';$('#fDescription').value=p.description||'';$('#fPublished').checked=p.published!==false;$('#fSold').checked=!!p.soldOut;const s=p.stock||{};['P','M','G','GG','3G'].forEach(x=>$('#s'+x).value=Number(s[x]||0));renderPreviews(p.images||[]);$('#delete').style.visibility=p.id?'visible':'hidden';renderList();}
function captureDraft(){if(!currentId)return;try{pendingByProduct[currentId]={product:readForm()};pendingFilesByProduct[currentId]=[...pendingFiles];}catch(e){}}
function readForm(){const p={id:$('#fId').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-'),name:$('#fName').value.trim(),team:$('#fTeam').value.trim(),category:$('#fCategory').value,version:$('#fVersion').value,price:Number($('#fPrice').value||0),wholesalePrice:calcWholesale($('#fVersion').value,$('#fPrice').value,$('#fWholesalePrice').value),badge:$('#fBadge').value||'',published:$('#fPublished').checked,soldOut:$('#fSold').checked,stock:{P:Number($('#sP').value||0),M:Number($('#sM').value||0),G:Number($('#sG').value||0),GG:Number($('#sGG').value||0),'3G':Number($('#s3G').value||0)},description:$('#fDescription').value.trim()};const old=Number($('#fOldPrice').value||0);if(old)p.oldPrice=old;const existing=products.find(x=>x.id===currentId);p.images=(existing&&existing.images)||[];return p;}
function edit(id){const p=products.find(x=>x.id===id);if(p)setForm(p);}
function newProduct(){if(currentId)captureDraft();pendingFiles=[];setForm(blank());}
function renderPreviews(existing=[]){const list=[...existing.map((x,i)=>({url:x,name:'Imagem '+(i+1),kind:'existing',index:i})),...pendingFiles.map((x,i)=>({url:x.url,name:x.file.name,kind:'pending',index:i}))];$('#previews').innerHTML=list.map(x=>'<div class="preview"><img src="'+esc(x.url)+'" alt=""><span>'+esc(x.name)+'</span><button type="button" class="remove-photo" data-kind="'+x.kind+'" data-index="'+x.index+'">×</button></div>').join('');document.querySelectorAll('.remove-photo').forEach(b=>b.onclick=()=>{const kind=b.dataset.kind,i=Number(b.dataset.index);if(kind==='pending'){const item=pendingFiles[i];if(item&&item.url)URL.revokeObjectURL(item.url);pendingFiles.splice(i,1);}else{const p=products.find(x=>x.id===currentId);if(p&&p.images)p.images.splice(i,1);}const p=products.find(x=>x.id===currentId);renderPreviews(p?p.images||[]:[]);});}
$('#photos').addEventListener('change',e=>{pendingFiles=[...pendingFiles,...[...e.target.files].map(file=>({file,url:URL.createObjectURL(file)}))];renderPreviews((products.find(x=>x.id===currentId)||{}).images||[]);e.target.value='';});
async function uploadPending(p){const imgs=[...(p.images||[])];for(const item of pendingFiles){const ext=(item.file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';const path=p.id+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.'+ext;const {error}=await db.storage.from(window.AMORA_SUPABASE_CONFIG.bucket).upload(path,item.file,{upsert:false,contentType:item.file.type||'image/jpeg'});if(error)throw error;const {data}=db.storage.from(window.AMORA_SUPABASE_CONFIG.bucket).getPublicUrl(path);imgs.push(data.publicUrl);}return imgs;}
async function saveProduct(p){
 p.images=await uploadPending(p);
 const row=toRow(p);
 const {data:saved,error}=await db.from('amora_products').upsert(row,{onConflict:'id'}).select('id,name,published,images,stock').single();
 if(error)throw error;
 if(!saved||saved.id!==p.id)throw new Error('O Supabase não confirmou o salvamento deste produto. Nenhuma confirmação foi exibida.');
 const {data:check,error:checkError}=await db.from('amora_products').select('id,name,published,images,stock').eq('id',p.id).maybeSingle();
 if(checkError)throw checkError;
 if(!check)throw new Error('O produto foi enviado, mas não foi encontrado na leitura de confirmação do Supabase. Confira as permissões antes de continuar.');
 p=fromRow({...row,...check});
 products=products.filter(x=>x.id!==p.id);products.unshift(p);
 pendingFiles=[];delete pendingFilesByProduct[p.id];delete pendingByProduct[p.id];
 renderList();updateStats();if(typeof renderSaleProducts==='function')renderSaleProducts();renderPreviews(p.images);
 msg('Produto salvo e confirmado no Supabase. Ele continuará cadastrado após recarregar o painel.');
 return p;
}
async function migrateLegacyCatalog(){
 if(!confirm('Importar apenas os produtos que ainda não existem no Supabase? Os produtos já cadastrados serão preservados, sem sobrescrever seus preços, fotos ou estoque.'))return;
 const btn=$('#migrateLegacy');btn.disabled=true;msg('Lendo catálogo atual...');
 try{
  const response=await fetch('../data/products.json?v='+Date.now(),{cache:'no-store'});
  if(!response.ok)throw new Error('Não consegui ler o catálogo atual do GitHub.');
  const legacy=await response.json();let done=0,skipped=0,total=legacy.length;
  for(const old of legacy){
   const existing=products.find(item=>item.id===old.id);if(existing){skipped++;msg('Preservando produtos já cadastrados: '+skipped+' ignorados; '+done+' novos importados.');continue;}const p={id:old.id,name:old.name,team:old.team||'',category:old.category||'Brasileiras',version:old.version||'Torcedor',price:Number(old.price||0),wholesalePrice:Number(old.wholesalePrice??old.wholesale_price??existing?.wholesalePrice??0),oldPrice:old.oldPrice??null,badge:old.badge||'',description:old.description||'',published:old.published!==false,soldOut:!!old.soldOut,stock:old.stock||{P:0,M:0,G:0,GG:0,'3G':0},images:[],sortOrder:old.sortOrder||0};
   const sourceImages=(old.images&&old.images.length?old.images:(old.image?[old.image]:[]));
   for(let i=0;i<sourceImages.length;i++){
    const src=sourceImages[i];
    if(/^https?:\/\//i.test(src)&&src.includes('.supabase.co/storage/')){p.images.push(src);continue;}
    const imgResponse=await fetch('../'+String(src).replace(/^\//,''));
    if(!imgResponse.ok)throw new Error('Falha ao copiar foto de '+old.name+': '+src);
    const blob=await imgResponse.blob();
    const filename=String(src).split('/').pop()||('foto-'+(i+1)+'.jpg');
    const path=p.id+'/'+String(i+1).padStart(2,'0')+'-'+filename.replace(/[^a-zA-Z0-9._-]/g,'-');
    const {error:uploadError}=await db.storage.from(window.AMORA_SUPABASE_CONFIG.bucket).upload(path,blob,{upsert:true,contentType:blob.type||'image/jpeg'});
    if(uploadError)throw uploadError;
    const {data}=db.storage.from(window.AMORA_SUPABASE_CONFIG.bucket).getPublicUrl(path);p.images.push(data.publicUrl);
   }
   const {error}=await db.from('amora_products').upsert(toRow(p),{onConflict:'id'});
   if(error)throw error;
   done++;msg('Importando catálogo: '+done+' de '+total+' produtos...');
  }
  await loadData();msg('Importação concluída: '+done+' produtos novos importados; '+skipped+' já existentes preservados.');
  alert('Importação concluída! '+done+' produtos novos importados e '+skipped+' produtos já cadastrados preservados. Confira o catálogo antes de ativar a versão principal.');
 }catch(e){msg('Migração interrompida: '+(e.message||'erro desconhecido')+'. Você pode executar novamente; os produtos são atualizados pelo ID.',false);}
 finally{btn.disabled=false;}
}
async function publish(){msg('Sincronizando produtos e estoque...');$('#publish').disabled=true;try{const markApplied=preparePendingSales(products);for(const p of products){const {error}=await db.from('amora_products').upsert(toRow(p),{onConflict:'id'});if(error)throw error;}markApplied();await loadData();msg('Produtos e estoque sincronizados com o Supabase.');}catch(e){msg(e.message||'Não foi possível sincronizar.',false);}finally{$('#publish').disabled=false;}}
$('#connect').onclick=async()=>{const email=$('#email').value.trim(),password=$('#password').value;if(!email||!password)return msg('Informe e-mail e senha.',false);try{const {data,error}=await db.auth.signInWithPassword({email,password});if(error)throw error;const {data:admin,error:ae}=await db.from('amora_admin_users').select('user_id').eq('user_id',data.user.id).maybeSingle();if(ae)throw ae;if(!admin)throw new Error('Usuário ainda não autorizado na tabela amora_admin_users.');$('#authCard').classList.add('hidden');$('#app').classList.remove('hidden');await loadData();msg('Acesso autorizado.');}catch(e){msg(e.message||'Falha no acesso.',false);}};
function slugify(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').replace(/-+/g,'-');}
function uniqueSlug(value){const base=slugify(value);if(!base)return '';let candidate=base,n=2;while(products.some(p=>p.id===candidate&&p.id!==currentId)){candidate=base+'-'+n++;}return candidate;}
$('#fName').addEventListener('input',()=>{if(!slugManuallyEdited)$('#fId').value=uniqueSlug($('#fName').value);});$('#fId').addEventListener('input',()=>{slugManuallyEdited=true;});
$('#newProduct').onclick=newProduct;$('#migrateLegacy').onclick=migrateLegacyCatalog;$('#reload').onclick=()=>loadData().then(()=>msg('Produtos atualizados.')).catch(e=>msg(e.message,false));$('#changeToken').textContent='↪ Sair';$('#changeToken').onclick=async()=>{await db.auth.signOut();$('#app').classList.add('hidden');$('#authCard').classList.remove('hidden');$('#password').value='';msg('Sessão encerrada.');};$('#filter').oninput=renderList;$('#publish').onclick=publish;$('#cancel').onclick=()=>{if(currentId)edit(currentId);else $('#form').classList.add('hidden');};
$('#delete').onclick=async()=>{if(!currentId)return;if(!confirm('Excluir este produto do Supabase?'))return;try{const {error}=await db.from('amora_products').delete().eq('id',currentId);if(error)throw error;products=products.filter(x=>x.id!==currentId);currentId=null;$('#form').classList.add('hidden');$('#emptyEditor').classList.remove('hidden');renderList();updateStats();msg('Produto excluído.');}catch(e){msg(e.message||'Erro ao excluir.',false);}};
$('#form').onsubmit=async e=>{e.preventDefault();const p=readForm();if(!p.id||!p.name||!p.team){alert('Preencha ID, nome e time.');return;}if(products.some(x=>x.id===p.id&&x.id!==currentId)){alert('Esse ID já existe.');return;}const submit=$('#form button[type="submit"]');submit.disabled=true;try{await saveProduct(p);currentId=p.id;$('#editMode').textContent='EDITAR PRODUTO';$('#formTitle').textContent=p.name;$('#delete').style.visibility='visible';}catch(err){msg(err.message||'Não foi possível salvar.',false);}finally{submit.disabled=false;}};
(async()=>{try{const cfg=window.AMORA_SUPABASE_CONFIG;if(!cfg||!cfg.url||!cfg.publishableKey)throw new Error('Configuração do Supabase não encontrada.');db=window.supabase.createClient(cfg.url,cfg.publishableKey);const {data}=await db.auth.getSession();if(data.session){const {data:admin}=await db.from('amora_admin_users').select('user_id').eq('user_id',data.session.user.id).maybeSingle();if(admin){$('#authCard').classList.add('hidden');$('#app').classList.remove('hidden');await loadData();}}db.auth.onAuthStateChange(async(_event,session)=>{if(!session){$('#app').classList.add('hidden');$('#authCard').classList.remove('hidden');}});}catch(e){msg(e.message||'Não foi possível iniciar o painel.',false);}})();
/* CONTROLE DE VENDAS — armazenamento local e dedução no estoque */
const SALES_KEY='amora_fut_sales_v1';
function getSales(){try{return JSON.parse(localStorage.getItem(SALES_KEY)||'[]')}catch(e){return[]}}
function saveSales(v){localStorage.setItem(SALES_KEY,JSON.stringify(v))}
function saleMoney(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function todayBR(){const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)}
function renderSaleProducts(){
 const el=$('#saleProduct');if(!el)return;
 const current=el.value;
 el.innerHTML='<option value="">Selecione o produto</option>'+products.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+' — '+esc(p.team||'')+'</option>').join('');
 if(products.some(p=>p.id===current))el.value=current;
 updateSalePrice();
}
function updateSaleSizes(){
 const el=$('#saleSize');if(!el)return;
 const p=products.find(x=>x.id===$('#saleProduct')?.value);
 const current=el.value;
 const sizes=['P','M','G','GG','3G'];
 if(!p){
   el.innerHTML='<option value="">Selecione o produto primeiro</option>';
   return;
 }
 const stock=p.stock||{};
 const available=sizes.filter(s=>Number(stock[s]||0)>0);
 el.innerHTML='<option value="">Selecione o tamanho</option>'+available.map(s=>'<option value="'+s+'">'+s+'</option>').join('');
 if(available.includes(current))el.value=current;
 else if(available.length===1)el.value=available[0];
}
function updateSalePrice(){
 const p=products.find(x=>x.id===$('#saleProduct')?.value);
 updateSaleSizes();
 if(!p){
   $('#salePrice').value='';$('#saleFinal').value='';
   return;
 }
 const qty=Math.max(1,Number($('#saleQty')?.value||1)); const price=Number(p.price||0), total=price*qty, discount=Math.min(Math.max(Number($('#saleDiscount')?.value||0),0),total);
 $('#salePrice').value=total.toFixed(2);
 $('#saleFinal').value=(total-discount).toFixed(2);
 const v=$('#saleVersion');if(v&&!v.dataset.touched)v.value=p.version||'Torcedor';
}
function toggleInstallment(){
 const parcel=$('#salePayment')?.value==='Parcelado';
 $('#installmentFields')?.classList.toggle('hidden',!parcel);
 if(parcel){
   $('#salePayDate').required=true;$('#salePayValue').required=true;
   if(!Number($('#salePayValue').value||0))$('#salePayValue').value=Number($('#saleFinal').value||0).toFixed(2);
 }else{
   $('#salePayDate').required=false;$('#salePayValue').required=false;
 }
}
function renderSales(){
 const list=$('#salesList');if(!list)return;
 const sales=getSales();
 const pending=sales.filter(x=>!x.aplicada).length;
 $('#salesPendingCount').textContent=pending;
 list.innerHTML=sales.length?sales.slice().reverse().map(s=>'<tr><td>'+esc(s.dataCompra||'')+'</td><td>'+esc(s.cliente||'')+'</td><td>'+esc(s.produtoNome||s.productId)+'</td><td>'+esc(s.tamanho||'')+'</td><td>'+esc(s.quantidade||1)+'</td><td>'+esc(s.versao||'')+'</td><td>'+saleMoney(s.valorFinal)+'</td><td>'+esc(s.formaPagamento||'')+(s.formaPagamento==='Parcelado'?' · '+esc(s.dataPagamento||''):'')+'</td><td><span class="sale-status '+(s.aplicada?'applied':'pending')+'">'+(s.aplicada?'APLICADA':'AGUARDANDO PUBLICAÇÃO')+'</span></td></tr>').join(''):'<tr><td colspan="9" style="color:#999;text-align:center">Nenhuma venda registrada.</td></tr>';
}
function preparePendingSales(list){
 const sales=getSales();
 const pending=sales.filter(s=>!s.aplicada);
 if(!pending.length)return ()=>{};
 const backups=[];
 for(const s of pending){
   const p=list.find(x=>x.id===s.productId);
   if(!p)throw new Error('Produto da venda não encontrado: '+(s.produtoNome||s.productId));
   const size=s.tamanho;
   if(!size)throw new Error('A venda de '+s.produtoNome+' precisa de tamanho.');
   const current=Number((p.stock||{})[size]||0);
   const qty=Math.max(1,Math.floor(Number(s.quantidade||1)));
   if(current<qty)throw new Error('Estoque insuficiente para '+s.produtoNome+' tamanho '+size+'. Estoque atual: '+current+'. Quantidade solicitada: '+qty+'.');
   backups.push({p,size,current});
   p.stock=p.stock||{};p.stock[size]=current-qty;
   const total=Object.values(p.stock).reduce((a,v)=>a+Number(v||0),0);
   if(total<=0)p.soldOut=true;
 }
 return ()=>{
   const now=getSales().map(s=>pending.some(x=>x.id===s.id)?{...s,aplicada:true,dataAplicacao:new Date().toISOString()}:s);
   saveSales(now);renderSales();
 };
}
window.preparePendingSales=preparePendingSales;
function initSales(){
 if(!$('#saleForm'))return;
 $('#saleDate').value=todayBR();
 renderSaleProducts();updateSaleSizes();renderSales();toggleInstallment();
 $('#saleProduct').onchange=()=>{updateSalePrice();const p=products.find(x=>x.id===$('#saleProduct').value);if(p){$('#saleVersion').value=p.version||'Torcedor';$('#saleVersion').dataset.touched='0'}};
 $('#saleVersion').onchange=()=>$('#saleVersion').dataset.touched='1';
 $('#saleDiscount').oninput=updateSalePrice;
 $('#saleQty').oninput=updateSalePrice;
 $('#salePayment').onchange=toggleInstallment;
 $('#saleForm').onsubmit=e=>{
   e.preventDefault();
   const p=products.find(x=>x.id===$('#saleProduct').value);
   if(!p){alert('Selecione o produto.');return}
   const size=$('#saleSize').value;
   const qty=Math.max(1,Math.floor(Number($('#saleQty').value||1)));
   const stock=Number((p.stock||{})[size]||0);
   if(stock<qty){alert('Não há estoque cadastrado para '+p.name+' no tamanho '+size+'. Cadastre o estoque antes de registrar a venda.');return}
   const price=Number(p.price||0),total=price*qty,discount=Math.min(Math.max(Number($('#saleDiscount').value||0),0),total),finalValue=total-discount;
   if($('#salePayment').value==='Parcelado'&&!$('#salePayDate').value){alert('Informe a data para pagamento.');return}
   if($('#salePayment').value==='Parcelado'&&!Number($('#salePayValue').value||0)){alert('Informe o valor acordado.');return}
   const sales=getSales();
   sales.push({id:'venda-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),productId:p.id,produtoNome:p.name,cliente:$('#saleClient').value.trim(),versao:$('#saleVersion').value,tamanho:size,dataCompra:$('#saleDate').value,quantidade:qty,valorUnitario:price,valorProduto:total,desconto:discount,valorFinal:finalValue,formaPagamento:$('#salePayment').value,dataPagamento:$('#salePayment').value==='Parcelado'?$('#salePayDate').value:'',valorAcordado:$('#salePayment').value==='Parcelado'?Number($('#salePayValue').value||0):null,aplicada:false});
   saveSales(sales);renderSales();
   e.target.reset();$('#saleDate').value=todayBR();$('#saleDiscount').value='0';$('#saleQty').value='1';renderSaleProducts();toggleInstallment();
   msg('Venda registrada. Clique em Publicar alterações para deduzir do estoque.',true);
 };
 $('#clearSales').onclick=()=>{if(confirm('Apagar o histórico de vendas salvo neste navegador? Isso não altera vendas já publicadas no estoque.')){saveSales([]);renderSales()}};
}
$('#fVersion').addEventListener('change',()=>{$('#fWholesalePrice').value=calcWholesale($('#fVersion').value,$('#fPrice').value).toFixed(2)});$('#fPrice').addEventListener('input',()=>{$('#fWholesalePrice').value=calcWholesale($('#fVersion').value,$('#fPrice').value).toFixed(2)});
initSales();
const salesJump=$('#salesJump');if(salesJump)salesJump.onclick=()=>$('#saleForm')?.scrollIntoView({behavior:'smooth',block:'start'});
