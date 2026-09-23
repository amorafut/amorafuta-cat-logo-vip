(function(){
  let order=[];
  function stashCurrent(){
    if(!currentId)return;
    try{
      const draft=typeof readForm==='function'?readForm():products.find(x=>x.id===currentId);
      pendingByProduct[currentId]={
        product: JSON.parse(JSON.stringify(draft||products.find(x=>x.id===currentId)||{})),
        files:[...(pendingFiles||[])]
      };
    }catch(e){
      pendingByProduct[currentId]={
        product: products.find(x=>x.id===currentId),
        files:[...(pendingFiles||[])]
      };
    }
  }
  function restoreCurrent(fallback){
    const d=currentId?pendingByProduct[currentId]:null;
    if(d){
      // Recarrega todos os campos salvos do produto antes de restaurar as fotos pendentes.
      if(d.product && typeof window.setFormBase==='function') window.setFormBase(d.product);
      pendingFiles=[...(d.files||[])];
    }else{
      pendingFiles=[];
    }
  }
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

  function imageToWebP(file){
    return new Promise((resolve,reject)=>{
      if(!file){reject(new Error('Arquivo de imagem inválido.'));return}
      if(file.type==='image/webp'){resolve(file);return}
      if(!/^image\\/(jpeg|jpg|png)$/i.test(file.type||'')){
        reject(new Error('Formato não suportado: '+(file.name||'imagem')+'. Use JPG, PNG ou WebP.'));
        return;
      }
      const url=URL.createObjectURL(file),img=new Image();
      img.onload=()=>{
        try{
          const max=1800;
          const scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
          const canvas=document.createElement('canvas');
          canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
          canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
          const ctx=canvas.getContext('2d',{alpha:true});
          if(!ctx)throw new Error('Seu navegador não conseguiu preparar a imagem.');
          ctx.drawImage(img,0,0,canvas.width,canvas.height);
          canvas.toBlob(blob=>{
            URL.revokeObjectURL(url);
            if(!blob){reject(new Error('Não foi possível converter '+file.name+' para WebP.'));return}
            const name=file.name.replace(/\\.[^.]+$/,'')+'.webp';
            resolve(new File([blob],name,{type:'image/webp',lastModified:Date.now()}));
          },'image/webp',0.82);
        }catch(e){URL.revokeObjectURL(url);reject(e)}
      };
      img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Não foi possível abrir '+file.name+'. Use JPG, PNG ou WebP.'))};
      img.src=url;
    });
  }

  async function publishOrdered(){
    if(!token){msg('Conecte o GitHub primeiro.',false);return}
    $('#publish').disabled=true;msg('Publicando todos os produtos e fotos...');
    try{
      // Captura o que estiver aberto neste momento antes de publicar.
      stashCurrent();

      // Reserva as vendas pendentes e deduz o estoque somente após o JSON ser publicado.
      const finalizeSales=window.preparePendingSales?window.preparePendingSales(products):()=>{};

      for(const p of products){
        const draft=p.id?pendingByProduct[p.id]:null;
        if(draft&&draft.product){
          Object.assign(p,JSON.parse(JSON.stringify(draft.product)));
        }

        const files=draft&&draft.files?draft.files:[];
        if(!files.length) continue;

        // Para o produto atual, respeita a ordem definida no painel.
        let queue;
        if(p.id===currentId&&order.length){
          queue=order.filter(x=>x.kind==='pending');
        }else{
          queue=files.map(x=>({kind:'pending',file:x.file,url:x.url,name:x.file.name}));
        }

        const base=[...(p.images||[])];
        let n=base.length+1;
        for(const x of queue){
          msg('Enviando foto '+n+' de '+queue.length+' — '+p.name+'...');
          const f=await imageToWebP(x.file);
          const path='assets/images/catalog/'+p.id+'/ord-'+Date.now()+'-'+String(n).padStart(2,'0')+'.webp';
          await publishFile(path,await b64File(f));
          base.push(path);
          n++;
        }
        p.images=base;
        delete pendingByProduct[p.id];
      }

      const json=btoa(unescape(encodeURIComponent(JSON.stringify(products,null,2))));
      await publishFile(DATA,json);
      finalizeSales();

      pendingFiles=[];
      order=(products.find(x=>x.id===currentId)?.images||[]).map((x,i)=>({kind:'existing',path:x,url:'../'+x,name:x.split('/').pop(),i}));
      renderPreviews((products.find(x=>x.id===currentId)?.images)||[]);
      renderList();
      updateStats();
      msg('Publicado! Todos os produtos e fotos foram enviados ao site.');
    }catch(e){
      msg(e.message||'Erro ao publicar.',false)
    }finally{
      $('#publish').disabled=false
    }
  }
  const originalSet=window.setForm;
  window.setFormBase=originalSet;
  window.setForm=function(p){
    stashCurrent();
    const draft=p&&p.id?pendingByProduct[p.id]:null;
    originalSet(draft&&draft.product?draft.product:p);
    if(draft) pendingFiles=[...(draft.files||[])];
    else pendingFiles=[];
    order=[];
    setTimeout(draw,0);
  };
  const originalNew=window.newProduct;
  window.newProduct=function(){
    stashCurrent();
    originalNew();
    pendingFiles=[];
    order=[];
    draw();
  };
  const ph=document.querySelector('#photos');
  if(ph)ph.addEventListener('change',()=>setTimeout(draw,0));
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(draw,50);const pb=document.querySelector('#publish');if(pb)pb.onclick=publishOrdered;});
  setInterval(()=>{const box=document.querySelector('#previews');if(box&&box.dataset.reorderReady!=='1'){box.dataset.reorderReady='1';draw()}},500);
})();