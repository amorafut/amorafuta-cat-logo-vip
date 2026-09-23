const API='https://api.github.com';
const OWNER='amorafut',REPO='amorafuta-cat-logo-vip',BRANCH='main',DATA='data/products.json';
let token=sessionStorage.getItem('amora_github_token')||localStorage.getItem('amora_github_token')||'';
let products=[],currentId=null,pendingFiles=[],originalImages=[];
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function headers(){return {'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};}
function msg(t,ok=true){$('#authMsg').textContent=t;$('#status').textContent=t;$('#authMsg').style.color=ok?'var(--green)':'var(--danger)';}
async function gh(path,opts={}){const r=await fetch(API+'/repos/'+OWNER+'/'+REPO+'/contents/'+path,{...opts,headers:{...headers(),...(opts.headers||{})}});if(!r.ok){let d={};try{d=await r.json()}catch{}throw new Error(d.message||('GitHub HTTP '+r.status));}return r.json();}
async function repoCheck(){const r=await fetch(API+'/repos/'+OWNER+'/'+REPO,{headers:headers()});if(!r.ok)throw new Error('Token sem acesso ao repositório.');return r.json();}
async function loadData(){const r=await fetch('../data/products.json?v='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('Não foi possível ler o catálogo.');products=await r.json();renderList();updateStats();}
function updateStats(){const teams=new Set(products.map(p=>p.team).filter(Boolean));const units=products.reduce((n,p)=>n+Object.values(p.stock||{}).reduce((a,v)=>a+Number(v||0),0),0);$('#statProducts').textContent=products.length;$('#statTeams').textContent=teams.size;$('#statStock').textContent=units;}
function thumb(p){const src=(p.images&&p.images[0])||p.image;return src?'<img src="../'+esc(src)+'" alt="">':'<span>⚽</span>';}
function renderList(){
 const q=($('#filter').value||'').toLowerCase();const arr=products.filter(p=>(p.name+' '+(p.team||'')).toLowerCase().includes(q));
 $('#list').innerHTML=arr.map(p=>'<div class="list-item '+(p.id===currentId?'active':'')+'" data-id="'+esc(p.id)+'"><div class="list-thumb">'+thumb(p)+'</div><div><strong>'+esc(p.name)+'</strong><small>'+esc(p.team||'')+' · '+esc(p.version||'')+'</small><span class="pill">'+(p.published===false?'RASCUNHO':(p.soldOut?'ESGOTADO':'PUBLICADO'))+'</span></div></div>').join('');
 document.querySelectorAll('.list-item').forEach(x=>x.onclick=()=>edit(x.dataset.id));
}
function blank(){return {id:'',team:'',name:'',category:'Brasileiras',version:'Torcedor',price:'',oldPrice:'',badge:'',description:'',published:true,soldOut:false,stock:{P:0,M:0,G:0,GG:0,'3G':0},images:[]};}
function setForm(p){
 currentId=p.id||null;originalImages=[...(p.images||[])];pendingFiles=[];$('#emptyEditor').classList.add('hidden');$('#form').classList.remove('hidden');$('#editMode').textContent=p.id?'EDITAR PRODUTO':'NOVO PRODUTO';$('#formTitle').textContent=p.name||'Novo produto';
 $('#fId').value=p.id||'';$('#fName').value=p.name||'';$('#fTeam').value=p.team||'';$('#fCategory').value=p.category||'Brasileiras';$('#fVersion').value=p.version||'Torcedor';$('#fPrice').value=p.price??'';$('#fOldPrice').value=p.oldPrice??'';$('#fBadge').value=p.badge||'';$('#fDescription').value=p.description||'';$('#fPublished').checked=p.published!==false;$('#fSold').checked=!!p.soldOut;
 const s=p.stock||{};['P','M','G','GG','3G'].forEach(x=>$('#s'+x).value=Number(s[x]||0));pendingFiles=[];renderPreviews(p.images||[]);
 $('#delete').style.visibility=p.id?'visible':'hidden';renderList();
}
function readForm(){const p={id:$('#fId').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-'),name:$('#fName').value.trim(),team:$('#fTeam').value.trim(),category:$('#fCategory').value,version:$('#fVersion').value,price:Number($('#fPrice').value||0),badge:$('#fBadge').value||'',published:$('#fPublished').checked,soldOut:$('#fSold').checked,stock:{P:Number($('#sP').value||0),M:Number($('#sM').value||0),G:Number($('#sG').value||0),GG:Number($('#sGG').value||0),'3G':Number($('#s3G').value||0)},description:$('#fDescription').value.trim()};const old=Number($('#fOldPrice').value||0);if(old)p.oldPrice=old;const existing=products.find(x=>x.id===currentId);p.images=(existing&&existing.images)||[];return p;}
function edit(id){const p=products.find(x=>x.id===id);if(p)setForm(p);}
function newProduct(){setForm(blank());}
function renderPreviews(existing=[]){const list=[...existing.map((x,i)=>({url:'../'+x,name:x.split('/').pop(),kind:'existing',index:i})),...pendingFiles.map((x,i)=>({url:x.url,name:x.file.name,kind:'pending',index:i}))];$('#previews').innerHTML=list.map(x=>'<div class="preview"><img src="'+esc(x.url)+'" alt=""><span>'+esc(x.name)+'</span><button type="button" class="remove-photo" data-kind="'+x.kind+'" data-index="'+x.index+'">×</button></div>').join('');document.querySelectorAll('.remove-photo').forEach(b=>b.onclick=()=>{const kind=b.dataset.kind,i=Number(b.dataset.index);if(kind==='pending'){const item=pendingFiles[i];if(item?.url)URL.revokeObjectURL(item.url);pendingFiles.splice(i,1);}else{const p=products.find(x=>x.id===currentId);if(p?.images)p.images.splice(i,1);}const p=products.find(x=>x.id===currentId);renderPreviews(p?.images||[]);msg('Foto removida. Salve o produto e depois publique as alterações.');});}
$('#photos').addEventListener('change',e=>{pendingFiles=[...pendingFiles,...[...e.target.files].map(file=>({file,url:URL.createObjectURL(file)}))];renderPreviews((products.find(x=>x.id===currentId)||{}).images||[]);e.target.value='';});
function b64File(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=reject;r.readAsDataURL(file);});}
async function fileSha(path){try{const r=await gh(path);return r.sha}catch(e){if(String(e.message).includes('Not Found'))return null;throw e;}}
async function put(path,content,sha){const body={message:'Atualizar catálogo Amora Fut',content,branch:BRANCH};if(sha)body.sha=sha;const r=await fetch(API+'/repos/'+OWNER+'/'+REPO+'/contents/'+path,{method:'PUT',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok){let d={};try{d=await r.json()}catch{}throw new Error(d.message||'Falha ao publicar '+path);}return r.json();}
async function publishFile(path,base64){const sha=await fileSha(path);return put(path,base64,sha);}
async function publish(){
 if(!token){msg('Conecte o GitHub primeiro.',false);return;}
 $('#publish').disabled=true;msg('Publicando...');try{
  for(const p of products){
   if(p.id!==currentId&&pendingFiles.length===0)continue;
  }
  const p=currentId?products.find(x=>x.id===currentId):null;
  if(p&&pendingFiles.length){
   const imgs=[];for(let i=0;i<pendingFiles.length;i++){const f=pendingFiles[i].file;const ext=(f.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';const path='assets/images/catalog/'+p.id+'/'+String(i+1).padStart(2,'0')+'.'+ext;await publishFile(path,await b64File(f));imgs.push(path);}p.images=imgs;
  }
  const json=btoa(unescape(encodeURIComponent(JSON.stringify(products,null,2))));
  await publishFile(DATA,json);
  msg('Publicado! Aguarde alguns segundos para o GitHub Pages atualizar.');
  pendingFiles=[];originalImages=[...((p&&p.images)||[])];renderPreviews((p&&p.images)||[]);renderList();updateStats();
 }catch(e){msg(e.message||'Erro ao publicar.',false);}finally{$('#publish').disabled=false;}
}
$('#connect').onclick=async()=>{token=$('#token').value.trim();if(!token)return msg('Cole seu GitHub token.',false);try{await repoCheck();if($('#remember').checked)localStorage.setItem('amora_github_token',token);else{localStorage.removeItem('amora_github_token');sessionStorage.setItem('amora_github_token',token);}$('#authCard').classList.add('hidden');$('#app').classList.remove('hidden');await loadData();msg('GitHub conectado.');}catch(e){msg(e.message,false);}};
$('#newProduct').onclick=newProduct;$('#reload').onclick=loadData;
$('#changeToken').onclick=()=>{sessionStorage.removeItem('amora_github_token');localStorage.removeItem('amora_github_token');token='';$('#token').value='';$('#remember').checked=false;$('#app').classList.add('hidden');$('#authCard').classList.remove('hidden');msg('Token limpo. Cole o novo token e clique em Conectar.');};$('#filter').oninput=renderList;$('#publish').onclick=publish;$('#cancel').onclick=()=>{if(currentId)edit(currentId);else $('#form').classList.add('hidden');};
$('#delete').onclick=()=>{if(!currentId)return;if(confirm('Excluir este produto do catálogo local? Depois clique em Publicar alterações.')){products=products.filter(p=>p.id!==currentId);currentId=null;$('#form').classList.add('hidden');$('#emptyEditor').classList.remove('hidden');renderList();updateStats();msg('Produto removido localmente. Clique em Publicar alterações.');}};
$('#form').onsubmit=e=>{e.preventDefault();const p=readForm();if(!p.id||!p.name||!p.team){alert('Preencha ID, nome e time.');return;}const i=products.findIndex(x=>x.id===currentId);if(i>=0)products[i]=p;else{if(products.some(x=>x.id===p.id)){alert('Esse ID já existe.');return;}products.unshift(p);}currentId=p.id;$('#emptyEditor').classList.add('hidden');$('#form').classList.remove('hidden');$('#editMode').textContent='EDITAR PRODUTO';$('#formTitle').textContent=p.name;$('#delete').style.visibility='visible';renderList();updateStats();msg('Produto salvo no painel. Clique em Publicar alterações.');};
(async()=>{if(token){try{await repoCheck();$('#token').value=token;$('#authCard').classList.add('hidden');$('#app').classList.remove('hidden');await loadData();}catch(e){sessionStorage.removeItem('amora_github_token');localStorage.removeItem('amora_github_token');token='';}}})();