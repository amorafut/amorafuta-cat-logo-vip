(function(){
  let order=[];
  function stashCurrent(){ if(currentId) pendingByProduct[currentId]=pendingFiles||[]; }
  function restoreCurrent(){ pendingFiles=pendingByProduct[currentId]||[]; }
  function esc2(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function syncOrder(){
    const p=products.find(x=>x.id===currentId);
    const existing=(p&&p.images||[]).map((path,i)=>({kind:'existing',path,url:'../'+path,name:path.split('/').pop(),i}));
    const pending=(pendingFiles||[]).map(x=>({kind:'pending',file:x.file,url:x.url,name:x.file.name}));
    const oldKeys=order.map(x=>x.kind==='existing'?x.path:x.file);
    const all=[...existing,...pending];
    order=order.length?order.map(x=>all.find(y=>x.kind===y.kind&&(x.kind==='existing'?x.path===y.path:x.file===y.file))).filter(Boolean):all;
    all.forEach(x=>{if(!order.some(y=>y.kind===x.kind&&(x.kind==='existing'?x.path===y.path:x.file===y.file)))order.push(x)});
  }
  function draw(){
    syncOrder();
    const box=document.querySelector('#previews'); if(!box)return;
    box.innerHTML=order.map((x,i)=>'<div class="preview" draggable="true" data-i="'+i+'"><img src="'+esc2(x.url)+'" alt=""><span class="photo-order">'+(i+1)+'</span><span class="photo-name">'+esc2(x.name)+'</span><div class="photo-controls"><button type="button" class="move-photo" data-i="'+i+'" data-d="-1">‹</button><button type="button" class="move-photo" data-i="'+i+'" data-d="1">›</button><button type="button" class="remove-photo" data-i="'+i+'">×</button></div></div>').join('');
    box.querySelectorAll('.move-photo').forEach(b=>b.onclick=()=>{const i=+b.dataset.i,j=i+(+b.dataset.d);if(j<0||j>=order.length)return;[order[i],order[j]]=[order[j],order[i]];apply();draw()});
    box.querySelectorAll('.remove-photo').forEach(b=>b.onclick=()=>{const x=order.splice(+b.dataset.i,1)[0];if(x.kind==='pending'){pendingFiles=pendingFiles.filter(y=>y!==x.file&&y!==x);if(x.url)URL.revokeObjectURL(x.url)}else{const p=products.find(y=>y.id===currentId);if(p)p.images=(p.images||[]).filter(y=>y!==x.path)}apply();draw()});
    box.querySelectorAll('.preview').forEach(card=>{card.ondragstart=e=>{e.dataTransfer.setData('text/plain',card.dataset.i)};card.ondragover=e=>e.preventDefault();card.ondrop=e=>{e.preventDefault();const a=+e.dataTransfer.getData('text/plain'),b=+card.dataset.i;if(a===b)return;const x=order.splice(a,1)[0];order.splice(b,0,x);apply();draw()}});
  }
  function apply(){
    const p=products.find(x=>x.id===currentId);
    if(p)p.images=order.filter(x=>x.kind==='existing').map(x=>x.path);
    pendingFiles=order.filter(x=>x.kind==='pending');
  }

  async function publishOrdered(){
    if(!token){msg('Conecte o GitHub primeiro.',false);return}
    $('#publish').disabled=true;msg('Publicando fotos na ordem escolhida...');
    try{
      const p=products.find(x=>x.id===currentId);
      if(p){
        const finalImages=[];let n=1;
        for(const x of order){
          if(x.kind==='existing') finalImages.push(x.path);
          else {
            const f=x.file;
            const ext=(f.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
            const path='assets/images/catalog/'+p.id+'/ord-'+Date.now()+'-'+String(n).padStart(2,'0')+'.'+ext;
            await publishFile(path,await b64File(f));
            finalImages.push(path);
          }
          n++;
        }
        p.images=finalImages;
      }
      const json=btoa(unescape(encodeURIComponent(JSON.stringify(products,null,2))));
      await publishFile(DATA,json);
      pendingFiles=[];if(p)delete pendingByProduct[p.id];order=(p&&p.images||[]).map((x,i)=>({kind:'existing',path:x,url:'../'+x,name:x.split('/').pop(),i}));
      renderList();updateStats();draw();msg('Publicado! A ordem das fotos foi salva.');
    }catch(e){msg(e.message||'Erro ao publicar.',false)}
    finally{$('#publish').disabled=false}
  }
  const originalSet=window.setForm;
  window.setForm=function(p){stashCurrent();originalSet(p);restoreCurrent();order=[];setTimeout(draw,0)};
  const originalNew=window.newProduct;
  window.newProduct=function(){stashCurrent();originalNew();restoreCurrent();order=[];draw()};
  const ph=document.querySelector('#photos');
  if(ph)ph.addEventListener('change',()=>setTimeout(draw,0));
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(draw,50);const pb=document.querySelector('#publish');if(pb)pb.onclick=publishOrdered;});
  setInterval(()=>{const box=document.querySelector('#previews');if(box&&box.dataset.reorderReady!=='1'){box.dataset.reorderReady='1';draw()}},500);
})();