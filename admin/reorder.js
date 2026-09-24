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

  async function apiJson(path,opts={}){
    const r=await fetch(API+path,{...opts,headers:{...headers(),...(opts.headers||{}),'Content-Type':'application/json'}});
    if(!r.ok){let d={};try{d=await r.json()}catch{}throw new Error(d.message||('GitHub HTTP '+r.status));}
    return r.json();
  }
  async function createBlob(base64){
    const d=await apiJson('/repos/'+OWNER+'/'+REPO+'/git/blobs',{
      method:'POST',body:JSON.stringify({content:base64,encoding:'base64'})
    });
    return d.sha;
  }
  async function commitAll(changes,message){
    let lastErr=null;
    for(let attempt=1;attempt<=3;attempt++){
      try{
        const ref=await apiJson('/repos/'+OWNER+'/'+REPO+'/git/ref/heads/'+BRANCH);
        const headSha=ref.object.sha;
        const head=await apiJson('/repos/'+OWNER+'/'+REPO+'/git/commits/'+headSha);
        const treeEntries=[];
        for(const x of changes){
          const blobSha=await createBlob(x.content);
          treeEntries.push({path:x.path,mode:'100644',type:'blob',sha:blobSha});
        }
        const tree=await apiJson('/repos/'+OWNER+'/'+REPO+'/git/trees',{
          method:'POST',body:JSON.stringify({base_tree:head.tree.sha,tree:treeEntries})
        });
        const commit=await apiJson('/repos/'+OWNER+'/'+REPO+'/git/commits',{
          method:'POST',body:JSON.stringify({message,tree:tree.sha,parents:[headSha]})
        });
        await apiJson('/repos/'+OWNER+'/'+REPO+'/git/refs/heads/'+BRANCH,{
          method:'PATCH',body:JSON.stringify({sha:commit.sha,force:false})
        });
        return commit.sha;
      }catch(e){
        lastErr=e;
        if(attempt<3)await new Promise(r=>setTimeout(r,1200*attempt));
      }
    }
    throw lastErr||new Error('Não foi possível publicar.');
  }

  async function publishOrdered(){
    if(!token){msg('Conecte o GitHub primeiro.',false);return}
    $('#publish').disabled=true;
    msg('Preparando publicação de todos os produtos...');
    try{
      stashCurrent();

      // Monta uma fotografia completa dos produtos antes de alterar qualquer dado.
      const working=products.map(p=>JSON.parse(JSON.stringify(p)));
      const changes=[];
      const uploadedByProduct={};

      for(const p of working){
        const draft=p.id?pendingByProduct[p.id]:null;
        if(!draft)continue;

        // Cada produto possui seu próprio rascunho. Nunca usa as fotos do produto atual
        // como fonte para outro produto.
        Object.assign(p,JSON.parse(JSON.stringify(draft.product||{})));

        // Normaliza os formatos antigos/novos usados pelo editor.
        // Alguns rascunhos podem guardar diretamente o File; outros guardam
        // {file,url,name}. Ambos precisam chegar aqui como File.
        let queue=(draft.files||[]).map(x=>x&&x.file?x:{file:x}).filter(x=>x.file);
        if(p.id===currentId&&order.length){
          queue=order
            .filter(x=>x.kind==='pending'&&x.file)
            .map(x=>({file:x.file,name:x.name,url:x.url}));
        }

        if(!queue.length)continue;

        const base=[...(p.images||[])];
        let n=base.length+1;
        for(const x of queue){
          msg('Preparando fotos de '+p.name+' — '+n+' de '+(base.length+queue.length)+'...');
          const wf=await imageToWebP(x.file);
          const path='assets/images/catalog/'+p.id+'/ord-'+Date.now()+'-'+String(n).padStart(2,'0')+'.webp';
          const b64=await b64File(wf);
          changes.push({path,content:b64});
          base.push(path);
          n++;
        }
        p.images=base;
        uploadedByProduct[p.id]=true;
      }

      // Vendas pendentes entram na mesma publicação.
      const finalizeSales=window.preparePendingSales?window.preparePendingSales(working):()=>{};

      const json=btoa(unescape(encodeURIComponent(JSON.stringify(working,null,2))));
      changes.push({path:DATA,content:json});

      msg('Enviando '+changes.length+' arquivo(s) em uma única publicação...');
      const sha=await commitAll(changes,'Atualizar catálogo Amora Fut — publicação em lote');

      // Só confirma rascunhos e vendas depois que o commit inteiro foi aceito.
      for(const id of Object.keys(uploadedByProduct))delete pendingByProduct[id];
      pendingFiles=[];
      products=working;
      finalizeSales();

      try{localStorage.setItem('amora_fut_admin_drafts_v1',JSON.stringify({}));}catch(e){}
      order=(products.find(x=>x.id===currentId)?.images||[]).map((x,i)=>({kind:'existing',path:x,url:'../'+x,name:x.split('/').pop(),i}));
      renderPreviews((products.find(x=>x.id===currentId)?.images)||[]);
      renderList();
      updateStats();
      msg('Publicado com sucesso! Todos os produtos, dados e fotos foram enviados juntos. Commit: '+sha.slice(0,7),true);
    }catch(e){
      msg('Publicação não concluída: '+(e.message||e),false);
    }finally{
      $('#publish').disabled=false;
    }
  }
  const originalSet=window.setForm;
  window.setFormBase=originalSet;
  window.setForm=function(p){
    stashCurrent();
    const draft=p&&p.id?pendingByProduct[p.id]:null;
    const target=draft&&draft.product?JSON.parse(JSON.stringify(draft.product)):p;
    // Carrega o produto-alvo sem apagar o rascunho de nenhum outro produto.
    originalSet(target);
    pendingFiles=draft?[...(draft.files||[])]:[];
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