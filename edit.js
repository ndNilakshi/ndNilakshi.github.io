/* Edit mode for this website. Only someone with a GitHub key for this repository can publish.
   Open the site with #edit at the end of the address to sign in. The key stays in your own browser. */
{
const OWNER='ndNilakshi',REPO='ndNilakshi.github.io',BRANCH='main',KEY='nd-site-token';
const API='https://api.github.com/repos/'+OWNER+'/'+REPO;
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const INLINE_TEXT=['title','photolede','contactline'];
const INLINE_HTML=['intro','about1','about2','about3','research','address'];
let token=null;try{token=localStorage.getItem(KEY)}catch(e){}
let editing=false,links=null,photos=[];
const pending={};

const st=document.createElement('style');
st.textContent=[
'#ed-bar{position:fixed;right:16px;bottom:16px;z-index:70;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:flex-end;max-width:calc(100vw - 32px);font:15px/1.4 Spectral,Georgia,serif}',
'#ed-bar button,#ed-panel button{font:inherit;font-size:15px;min-height:44px;padding:0 16px;border-radius:22px;border:1px solid var(--rule);background:var(--bg);color:var(--ink);cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.08)}',
'#ed-bar button.main,#ed-panel button.main{background:var(--pen);border-color:var(--pen);color:var(--bg)}',
'#ed-bar button:disabled{opacity:.6;cursor:wait}',
'#ed-msg{flex-basis:100%;text-align:right;color:var(--soft);font-size:14px}',
'#ed-msg:empty{display:none}',
'#ed-msg span{background:var(--bg);padding:3px 10px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.08)}',
'#ed-panel{position:fixed;top:0;right:0;bottom:0;width:min(400px,100vw);z-index:60;background:var(--bg);border-left:1px solid var(--rule);overflow:auto;padding:20px 20px 120px;font:16px/1.5 Spectral,Georgia,serif;box-shadow:-8px 0 30px rgba(0,0,0,.08)}',
'#ed-panel[hidden]{display:none}',
'#ed-panel h3{font-style:italic;font-weight:400;font-size:22px;margin:18px 0 8px}',
'#ed-panel p{margin:6px 0}',
'#ed-panel label{display:block;font-size:14px;color:var(--soft);margin:10px 0 4px}',
'#ed-panel input[type=text],#ed-panel input[type=password]{width:100%;font:inherit;font-size:16px;padding:8px 10px;border:1px solid var(--rule);border-radius:8px;background:var(--card);color:var(--ink)}',
'#ed-panel ol{padding-left:1.2em;margin:6px 0;font-size:15px}',
'.ed-top{display:flex;justify-content:space-between;align-items:center;gap:10px}',
'.ed-ph{display:grid;grid-template-columns:64px minmax(0,1fr);gap:6px 10px;align-items:center;padding:10px 0;border-top:1px solid var(--rule)}',
'.ed-ph .th{width:64px;height:48px;border-radius:6px;background:var(--card) center/cover no-repeat;grid-row:span 2}',
'.ed-ph .acts{display:flex;gap:6px}',
'#ed-panel .ed-ph .acts button{min-height:36px;padding:0 12px;font-size:14px;box-shadow:none}',
'.ed-on [contenteditable=true]{outline:1px dashed var(--pen);outline-offset:4px;border-radius:2px;cursor:text}',
'.ed-on [contenteditable=true]:focus{outline-style:solid}',
'.ed-on .tl li{grid-template-columns:9.5em minmax(0,1fr) auto}',
'.ed-x{font:inherit;font-size:13px;min-height:32px;padding:0 10px;border-radius:16px;border:1px solid var(--rule);background:var(--bg);color:var(--soft);cursor:pointer;align-self:center}',
'.ed-add{font:inherit;font-size:15px;min-height:40px;margin-top:12px;padding:0 16px;border-radius:20px;border:1px dashed var(--pen);background:transparent;color:var(--pen);cursor:pointer;display:inline-flex;align-items:center}',
'@media(max-width:600px){.ed-on .tl li{grid-template-columns:minmax(0,1fr)}.ed-x{justify-self:start}}'
].join('\n');
document.head.append(st);

const bar=document.createElement('div');bar.id='ed-bar';document.body.append(bar);
const panel=document.createElement('div');panel.id='ed-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Edit website');document.body.append(panel);
const hdr=t=>({Authorization:'Bearer '+t,Accept:'application/vnd.github+json'});
const msg=t=>{const m=$('#ed-msg');if(m)m.innerHTML=t?'<span>'+esc(t)+'</span>':''};
const btn=(label,cls,fn,id)=>{const b=document.createElement('button');b.type='button';b.textContent=label;if(cls)b.className=cls;if(id)b.id=id;b.onclick=fn;return b};

const showBar=()=>{
  bar.innerHTML='';
  if(!token)bar.append(btn('Sign in to edit','main',()=>openSignIn(),'ed-signin'));
  else if(!editing)bar.append(btn('Sign out','',()=>signOut(),'ed-signout'),btn('Edit page','main',()=>startEdit(),'ed-edit'));
  else bar.append(btn('Cancel','',()=>location.reload(),'ed-cancel'),btn('Links & photos','',()=>togglePanel(),'ed-more'),btn('Publish','main',()=>publish(),'ed-publish'));
  const m=document.createElement('div');m.id='ed-msg';m.setAttribute('aria-live','polite');bar.append(m);
};

const openSignIn=()=>{
  panel.dataset.mode='signin';panel.hidden=false;
  panel.innerHTML='<div class="ed-top"><h3 style="margin:0">Sign in to edit</h3><button type="button" id="ed-tok-close">Close</button></div>'
   +'<p>Paste your GitHub key. It stays only in this browser.</p>'
   +'<label for="ed-tok">GitHub key</label><input id="ed-tok" type="password" autocomplete="off">'
   +'<p><button type="button" class="main" id="ed-tok-go">Sign in</button></p><p id="ed-tok-msg" style="color:var(--soft)"></p>'
   +'<h3>Make a key (once a year)</h3><ol>'
   +'<li>Open <a href="https://github.com/settings/personal-access-tokens/new">GitHub: new fine-grained token</a>.</li>'
   +'<li>Name: Website editing. Expiration: 1 year.</li>'
   +'<li>Repository access: Only select repositories, then '+esc(REPO)+'.</li>'
   +'<li>Permissions: Contents, Read and write.</li>'
   +'<li>Click Generate token, copy it, and paste it above. Do not share it.</li></ol>';
  $('#ed-tok-close').onclick=()=>{panel.hidden=true};
  $('#ed-tok-go').onclick=async()=>{
    const v=$('#ed-tok').value.trim();if(!v)return;
    const out=$('#ed-tok-msg');out.textContent='Checking…';
    try{
      const r=await fetch(API,{headers:hdr(v),cache:'no-store'});
      const j=await r.json();
      if(r.ok&&j.permissions&&j.permissions.push){token=v;try{localStorage.setItem(KEY,v)}catch(e){}panel.hidden=true;showBar();msg('Signed in. Click Edit page.')}
      else out.textContent='This key cannot edit the site. Check that it has Contents: Read and write for '+REPO+'.';
    }catch(e){out.textContent='Could not reach GitHub. Check your internet and try again.'}
  };
  $('#ed-tok').focus();
};

const signOut=()=>{try{localStorage.removeItem(KEY)}catch(e){}token=null;editing=false;panel.hidden=true;showBar();msg('Signed out on this browser.')};

const addExpControls=li=>{
  li.querySelectorAll('span').forEach(s=>s.contentEditable='true');
  const x=document.createElement('button');x.type='button';x.className='ed-x';x.textContent='Remove';x.onclick=()=>li.remove();li.append(x);
};

const startEdit=()=>{
  editing=true;document.body.classList.add('ed-on');
  const h1=$('h1[data-edit="name"]');if(h1)h1.contentEditable='true';
  INLINE_TEXT.concat(INLINE_HTML).forEach(k=>$$('[data-edit="'+k+'"]').forEach(e=>e.contentEditable='true'));
  $$('[data-edit-list="experience"] li').forEach(addExpControls);
  const ul=$('[data-edit-list="experience"]');
  if(ul){const a=document.createElement('button');a.type='button';a.className='ed-add';a.textContent='Add a line';
    a.onclick=()=>{const li=document.createElement('li');li.innerHTML='<span class="yr">Year</span><span>Position, place</span>';ul.append(li);addExpControls(li);li.querySelector('span').focus()};
    ul.after(a)}
  try{photos=JSON.parse($('#photos').textContent).map(x=>({src:x.src||'',cap:x.cap||''}))}catch(e){photos=[]}
  showBar();msg('Click any text to change it. Emails, links and pictures are under Links & photos.');
};

const stopEdit=()=>{
  editing=false;document.body.classList.remove('ed-on');
  $$('[contenteditable]').forEach(e=>e.removeAttribute('contenteditable'));
  $$('.ed-x').forEach(e=>e.remove());$$('.ed-add').forEach(e=>{if(!panel.contains(e))e.remove()});
  panel.hidden=true;showBar();
};

document.addEventListener('keydown',e=>{
  if(!editing||e.key!=='Enter')return;
  const t=e.target.closest&&e.target.closest('[contenteditable=true]');if(!t)return;
  e.preventDefault();if(t.dataset.edit==='address')document.execCommand('insertLineBreak');
});
document.addEventListener('paste',e=>{
  if(!editing)return;
  const t=e.target.closest&&e.target.closest('[contenteditable=true]');if(!t)return;
  e.preventDefault();
  const tx=(e.clipboardData.getData('text/plain')||'').replace(/\s*\n\s*/g,' ');
  document.execCommand('insertText',false,tx);
});
document.addEventListener('click',e=>{
  if(!editing)return;
  const a=e.target.closest&&e.target.closest('a');
  if(a&&a.closest('[contenteditable=true]'))e.preventDefault();
},true);

const linkVal=(sel,attr)=>{const e=$(sel);return e?(attr?e.getAttribute(attr)||'':e.textContent.trim()):''};
const applyLinks=()=>{
  ['1','2'].forEach(n=>{const v=links['email'+n];$$('a[data-email="'+n+'"]').forEach(a=>{a.textContent=v;a.setAttribute('href','mailto:'+v)})});
  ['linkedin','inspire'].forEach(k=>$$('a[data-link="'+k+'"]').forEach(a=>a.setAttribute('href',links[k])));
};
const shown=x=>pending[x.src]?pending[x.src].url:x.src;
const drawGal=()=>{if(window.siteGallery)window.siteGallery(photos.map(x=>({src:shown(x),cap:x.cap})))};

const renderPhotos=()=>{
  const box=$('#ed-phs');if(!box)return;
  box.innerHTML=photos.map((x,i)=>'<div class="ed-ph"><div class="th"'+(x.src?' style="background-image:url(&quot;'+esc(shown(x))+'&quot;)"':'')+'></div>'
    +'<input type="text" aria-label="Caption" placeholder="'+(x.src?'Caption':'Empty frame')+'" value="'+esc(x.cap)+'" data-i="'+i+'">'
    +'<div class="acts">'+(i?'<button type="button" data-up="'+i+'">Move up</button>':'')+'<button type="button" data-rm="'+i+'">Remove</button></div></div>').join('');
  box.querySelectorAll('input').forEach(inp=>inp.addEventListener('input',()=>{photos[+inp.dataset.i].cap=inp.value;drawGal()}));
  box.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const i=+b.dataset.up;const t=photos[i-1];photos[i-1]=photos[i];photos[i]=t;renderPhotos();drawGal()});
  box.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{photos.splice(+b.dataset.rm,1);renderPhotos();drawGal()});
};

const shrink=file=>new Promise((res,rej)=>{
  const img=new Image(),u=URL.createObjectURL(file);
  img.onload=()=>{const m=2000,s=Math.min(1,m/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>b?res(b):rej(new Error('image')),'image/jpeg',0.85)};
  img.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('image'))};
  img.src=u;
});
const toB64=blob=>new Promise(res=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.readAsDataURL(blob)});
const addFiles=async e=>{
  const fs=Array.from(e.target.files||[]);e.target.value='';let bad=0;
  for(let n=0;n<fs.length;n++){
    msg('Preparing photo '+(n+1)+' of '+fs.length+'…');
    try{
      const b=await shrink(fs[n]);const name='photos/'+Date.now()+'-'+n+'.jpg';
      pending[name]={b64:await toB64(b),url:URL.createObjectURL(b),done:false};
      const slot=photos.findIndex(x=>!x.src);
      if(slot>=0){photos[slot]={src:name,cap:photos[slot].cap}}else{photos.push({src:name,cap:''})}
    }catch(err){bad++}
  }
  renderPhotos();drawGal();
  msg(bad?bad+' file(s) could not be read as a picture. The rest are added; click Publish to put them online.':'Photos added. Click Publish to put them online.');
};

const togglePanel=()=>{
  if(!panel.hidden&&panel.dataset.mode==='more'){panel.hidden=true;return}
  panel.dataset.mode='more';panel.hidden=false;
  if(!links)links={email1:linkVal('a[data-email="1"]'),email2:linkVal('a[data-email="2"]'),linkedin:linkVal('a[data-link="linkedin"]','href'),inspire:linkVal('a[data-link="inspire"]','href')};
  panel.innerHTML='<div class="ed-top"><h3 style="margin:0">Links</h3><button type="button" id="ed-close">Close</button></div>'
    +[['email1','Email 1'],['email2','Email 2'],['linkedin','LinkedIn address'],['inspire','INSPIRE-HEP address']].map(p=>'<label for="ed-'+p[0]+'">'+p[1]+'</label><input type="text" id="ed-'+p[0]+'" value="'+esc(links[p[0]])+'">').join('')
    +'<h3>Photos</h3><p style="font-size:15px;color:var(--soft)">The first photo is shown large. New photos fill the empty frames first.</p>'
    +'<div id="ed-phs"></div><label class="ed-add" for="ed-file">Add photos</label><input type="file" id="ed-file" accept="image/*" multiple hidden>';
  $('#ed-close').onclick=()=>{panel.hidden=true};
  ['email1','email2','linkedin','inspire'].forEach(k=>$('#ed-'+k).addEventListener('input',e=>{links[k]=e.target.value.trim();applyLinks()}));
  $('#ed-file').addEventListener('change',addFiles);
  renderPhotos();
};

const b64enc=s=>{const by=new TextEncoder().encode(s);let bin='';for(let i=0;i<by.length;i+=32768)bin+=String.fromCharCode.apply(null,by.subarray(i,i+32768));return btoa(bin)};
const b64dec=b=>new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g,'')),c=>c.charCodeAt(0)));
const put=(path,content,sha,message)=>{const body={message:message,content:content,branch:BRANCH};if(sha)body.sha=sha;return fetch(API+'/contents/'+path,{method:'PUT',headers:Object.assign({'Content-Type':'application/json'},hdr(token)),body:JSON.stringify(body)})};
const clean=h=>h.replace(/\u200b/g,'').replace(/(<br\s*\/?>\s*)+$/i,'').trim();
const photoJSON=()=>'\n['+photos.map(x=>'\n'+JSON.stringify({src:x.src,cap:x.cap.trim()}).replace(/</g,'\\u00'+'3c')).join(',')+'\n]\n';

const publish=async()=>{
  const pb=$('#ed-publish');if(pb)pb.disabled=true;
  try{
    const up=photos.filter(x=>pending[x.src]&&!pending[x.src].done);
    for(let i=0;i<up.length;i++){
      msg('Uploading photo '+(i+1)+' of '+up.length+'…');
      const r=await put(up[i].src,pending[up[i].src].b64,null,'Add photo');if(!r.ok)throw r;
      pending[up[i].src].done=true;
    }
    msg('Saving the page…');
    const g=await fetch(API+'/contents/index.html?ref='+BRANCH,{headers:hdr(token),cache:'no-store'});if(!g.ok)throw g;
    const gj=await g.json();
    const doc=new DOMParser().parseFromString(b64dec(gj.content),'text/html');
    const all=s=>Array.from(doc.querySelectorAll(s));
    const h1=$('h1[data-edit="name"]'),nm=h1?h1.textContent.trim():'';
    if(nm){all('[data-edit="name"]').forEach(e=>{e.textContent=nm});doc.title=nm;$$('[data-edit="name"]').forEach(e=>{e.textContent=nm});document.title=nm}
    INLINE_TEXT.forEach(k=>{const e=$('[data-edit="'+k+'"]');if(e)all('[data-edit="'+k+'"]').forEach(d=>{d.textContent=e.textContent.trim()})});
    INLINE_HTML.forEach(k=>{const e=$('[data-edit="'+k+'"]');if(e)all('[data-edit="'+k+'"]').forEach(d=>{d.innerHTML=clean(e.innerHTML)})});
    const ul=doc.querySelector('[data-edit-list="experience"]');
    if(ul)ul.innerHTML=$$('[data-edit-list="experience"] li').map(li=>{const s=li.querySelectorAll('span');return '\n      <li><span class="yr">'+esc(((s[0]&&s[0].textContent)||'').trim())+'</span><span>'+esc(((s[1]&&s[1].textContent)||'').trim())+'</span></li>'}).join('')+'\n    ';
    if(links){
      ['1','2'].forEach(n=>{const v=links['email'+n];all('a[data-email="'+n+'"]').forEach(a=>{a.textContent=v;a.setAttribute('href','mailto:'+v)})});
      ['linkedin','inspire'].forEach(k=>all('a[data-link="'+k+'"]').forEach(a=>a.setAttribute('href',links[k])));
    }
    const pj=doc.getElementById('photos');if(pj)pj.textContent=photoJSON();
    const live=$('#photos');if(live)live.textContent=photoJSON();
    const html='<!DOCTYPE html>\n'+doc.documentElement.outerHTML+'\n';
    const r=await put('index.html',b64enc(html),gj.sha,'Update website');if(!r.ok)throw r;
    stopEdit();msg('Published. The live site updates in about a minute.');
  }catch(err){
    let t='Could not publish. Check your internet and try again.';
    if(err&&err.status===401)t='Your GitHub key is wrong or has expired. Sign out, make a new key and sign in again.';
    else if(err&&(err.status===403||err.status===404))t='Your GitHub key cannot change this site. Check it has Contents: Read and write.';
    else if(err&&(err.status===409||err.status===422))t='The site was changed somewhere else. Reload the page and try again.';
    msg(t);const pb2=$('#ed-publish');if(pb2)pb2.disabled=false;
  }
};

showBar();
if(location.hash==='#edit'&&!token)openSignIn();
}
