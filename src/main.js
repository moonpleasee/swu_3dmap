import './style.css';
import { CampusScene } from './scene.js';
import {communityState,fixedPlace,createPlace,addPhoto,addComment,addRating,addReply,getPlace} from './community.js';

const icons={
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
 compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
 layers:'<path d="m12 3 10 5-10 5L2 8Z M2 12l10 5 10-5 M2 16l10 5 10-5"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
 sunset:'<path d="M3 17h18M5 21h14M7 17a5 5 0 0 1 10 0M12 2v7m-3-3 3 3 3-3M3 10l2 2m14 0 2-2"/>',
 moon:'<path d="M20 14a8 8 0 0 1-10-10A8.5 8.5 0 1 0 20 14Z"/>',
 play:'<path d="m8 4 12 8-12 8Z"/>',pause:'<path d="M8 5v14M16 5v14"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
 reset:'<path d="M3 10a9 9 0 1 1 2 9M3 4v6h6"/>',
 expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-11v1"/>',
 book:'<path d="M12 6c-3-3-7-3-10-2v14c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 2Zm0 0v14"/>',
 leaf:'<path d="M5 19C-2 7 9 2 21 3c0 12-4 20-14 14M3 21 16 8"/>',
 building:'<path d="M4 21V5l12-3v19M2 21h20M16 9h4v12M8 7v2m4-3v2m-4 3v2m4-3v2m-4 3v2m4-3v2"/>',
 ball:'<circle cx="12" cy="12" r="9"/><path d="m4 5 15 15M4 19 19 4M3 10c6-1 12 4 11 11M10 3c-1 6 4 12 11 11"/>',
 share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m9 10 6-4M9 14l6 4"/>',
 pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
 top:'<path d="m12 3 10 9-10 9L2 12Z M12 8v8m-4-4h8"/>',
};
const icon=(name,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.pin}</svg>`;
const catIcon={'全部':'compass','文化':'book','教学':'building','风景':'leaf','运动':'ball','宿舍':'building','生活':'pin','待核名':'info'};
const app=document.getElementById('app');
app.innerHTML=`
 <div class="app-shell">
  <div id="scene"></div><div class="map-grain" aria-hidden="true"></div>
  <header class="masthead">
   <a class="brand" href="#" aria-label="西南大学云游北碚，返回全景"><span class="brand-seal">西南</span><span><strong>西南大学<span class="brand-divider">/</span><b>云游北碚</b></strong><small>SOUTHWEST UNIVERSITY · CAMPUS EXPLORER</small></span></a>
   <div class="header-right"><span class="location"><i></i> 重庆 · 北碚校区</span><button class="text-button" id="sources-open" aria-label="关于这座校园">${icon('info')}<span>关于这座校园</span></button></div>
  </header>
  <aside class="explorer" id="explorer" aria-label="校园探索面板">
   <div class="intro"><div class="eyebrow"><span></span> 山城里的花园大学</div><h1>山水之间，<br>遇见西大<span>。</span></h1><p>把熟悉的校园，换个角度看。</p><div class="intro-rule"></div></div>
   <div class="explore-heading"><div><h2>探索校园</h2><small>从一栋楼，走到一段校园记忆</small></div><span id="landmark-count">12 处精选地标</span><button id="create-place" class="create-place-button">＋ 创建地点</button><button id="mobile-collapse" aria-expanded="true" aria-label="收起探索面板">⌄</button></div>
   <div class="explorer-content">
    <label class="search-box">${icon('search')}<input id="search" type="search" placeholder="找一栋楼，或一段校园记忆" autocomplete="off" aria-label="搜索校园建筑与地标"><button id="clear-search" type="button" aria-label="清除搜索" hidden>×</button><kbd>/</kbd></label>
    <div class="categories" aria-label="按类型筛选">${['全部','教学','宿舍','文化','运动','生活','风景','待核名'].map((c,i)=>`<button data-category="${c}" class="category ${i===0?'active':''}" aria-pressed="${i===0}">${c}</button>`).join('')}</div>
    <p class="directory-hint">放大地图可见更多楼名 · 支持现名、旧名和舍号</p>
    <div class="landmark-list" id="landmark-list" aria-live="polite"></div>
    <div class="panel-footer"><span><i></i> 含弘光大 · 继往开来</span><span>SWU / BEIBEI</span></div>
   </div>
  </aside>
  <div class="map-heading"><span class="eyebrow">A DIFFERENT PERSPECTIVE</span><p>一座校园，万千日常。</p><div class="model-badge"><i></i> 三维校园 · 简化模型</div></div>
  <div class="view-tools" aria-label="地图视角工具">
    <button id="reset" title="返回全景" aria-label="返回全景">${icon('reset')}</button>
    <button id="top-view" title="俯视校园" aria-label="俯视校园">${icon('top')}</button>
    <span></span><button id="zoom-in" title="放大" aria-label="放大">＋</button><button id="zoom-out" title="缩小" aria-label="缩小">−</button>
    <span></span><button id="fullscreen" title="全屏" aria-label="全屏">${icon('expand')}</button>
  </div>
  <button id="compass" class="compass" title="恢复全景方向" aria-label="恢复全景方向"><span>N</span><svg id="compass-arrow" viewBox="0 0 40 40" aria-hidden="true"><path d="m20 5 8 27-8-5-8 5Z" fill="none" stroke="currentColor"/><path d="m20 5 0 22-8 5Z" fill="currentColor"/></svg></button>
  <section class="detail-card" id="detail" aria-label="地标详情" hidden></section>
  <div class="tour-status" id="tour-status" hidden><span id="tour-progress"></span><button id="tour-next">下一站 ${icon('arrow')}</button><button id="tour-stop" aria-label="结束漫游">${icon('close')}</button></div>
  <div class="bottom-controls">
    <div class="time-switch" aria-label="光照模式"><button class="active" data-time="day" aria-pressed="true">${icon('sun')}<span>日间</span></button><button data-time="dusk" aria-pressed="false">${icon('sunset')}<span>黄昏</span></button><button data-time="night" aria-pressed="false">${icon('moon')}<span>夜景</span></button></div>
    <button class="tour-button" id="tour">${icon('play')}<span>沿着校园走一走</span></button>
    <div class="utility-tools"><button id="layers-open" title="图层设置" aria-label="图层设置">${icon('layers')}</button><button id="capture" title="保存校园画面" aria-label="保存校园画面">${icon('download')}</button></div>
  </div>
  <footer class="map-footer"><span class="gesture-hint">拖动旋转 · 右键平移 · 滚轮缩放</span><span><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a> · <button id="data-open">数据与精度</button></span></footer>
  <div id="loading" class="loading"><div class="loader-orbit"></div><strong>正在铺开西大的山水…</strong><span>加载校园轮廓与林荫小路</span></div>
  <div id="toast" role="status" aria-live="polite"></div>
 </div>
 <dialog id="export-dialog" class="export-dialog"><div class="dialog-heading"><div><span class="eyebrow">A LITTLE PIECE OF CAMPUS</span><h2>把这一刻带走</h2></div><button data-close aria-label="关闭画面预览">${icon('close')}</button></div><img id="export-image" alt="西南大学三维校园导出画面"><p class="dialog-intro">图片已生成并附带地图署名。点击下载，或长按图片保存。</p><a id="export-link" class="tour-button" download="西南大学-云游北碚.png">下载 PNG 图片 ${icon('download')}</a></dialog>
 <dialog id="layers-dialog" class="small-dialog"><div class="dialog-heading"><div><span class="eyebrow">YOUR CAMPUS VIEW</span><h2>看见你想看的</h2></div><button data-close aria-label="关闭图层设置">${icon('close')}</button></div><p class="dialog-intro">自由组合校园中的不同风景。</p><div class="layer-list">${[['buildings','建筑','教学楼、图书馆与学生园区'],['roads','道路','校内道路与步行小径'],['nature','绿地与运动场','示意树木、花园与运动空间'],['water','水体','湖泊与泳池'],['labels','地标名称','在地图上显示精选地标']].map(([id,name,desc])=>`<label class="layer-row"><span><strong>${name}</strong><small>${desc}</small></span><input type="checkbox" data-layer="${id}" checked><span class="toggle"></span></label>`).join('')}</div></dialog>
 <dialog id="sources-dialog" class="sources-dialog"><div class="dialog-heading"><div><span class="eyebrow">A CAMPUS, REIMAGINED</span><h2>山水有出处，记忆有坐标。</h2></div><button data-close aria-label="关闭资料说明">${icon('close')}</button></div><p class="dialog-intro">西南大学北碚校区 · 独立制作的三维校园探索原型</p><div class="source-stats"><div><b id="building-total">301</b><span>建筑轮廓</span></div><div><b>12</b><span>精选地标</span></div><div><b>3</b><span>光照模式</span></div></div><h3>这座模型如何建立</h3><p>校界、建筑平面、校内道路和水体来自 OpenStreetMap；建筑名称与外观参考学校公开地图、航拍和校园介绍。公开照片仅用于观察造型，未作为网页贴图。</p><ul class="source-links"><li><a href="https://120th.swu.edu.cn/xyhj/xydt.htm" target="_blank" rel="noreferrer">西南大学 · 官方校园地图 ↗</a><span>校区布局与建筑名称</span></li><li><a href="https://dwxcbwlgzb.swu.edu.cn/info/1028/1910.htm" target="_blank" rel="noreferrer">青绿校园 · 摄影师杨坚 ↗</a><span>2022 年航拍：建筑轮廓与庭院参考</span></li><li><a href="https://www.swu.edu.cn/info/1147/2076.htm" target="_blank" rel="noreferrer">西南大学 · 崇德湖 ↗</a><span>校园景观资料</span></li><li><a href="https://www.openstreetmap.org/way/413071891" target="_blank" rel="noreferrer">OpenStreetMap · 西南大学 ↗</a><span>2026-09-21 获取 · © OpenStreetMap contributors · ODbL</span></li></ul><div class="accuracy-note"><strong>关于精度</strong><p id="accuracy-text">建筑高度部分由地图楼层数估算，其余采用示意高度。植被为示意布局；地形采用公开 DEM 高程，建筑与场地的平台位置仍为估算。地图标注可能滞后，模型不作为实地导航或测绘依据。</p></div><p class="source-credit">交互方向参考 <a href="https://wcqqq1214.github.io/gxu-campus-3d/" target="_blank" rel="noreferrer">广西大学云游校园</a>；本项目重新实现界面与模型。</p></dialog>
 <dialog id="place-create-dialog" class="small-dialog"><div class="dialog-heading"><div><span class="eyebrow">A PLACE ON CAMPUS</span><h2>创建地点</h2></div><button data-close aria-label="关闭创建地点">${icon('close')}</button></div><p class="dialog-intro">先在地图上点击位置移动标记，再确认地点。</p><form id="place-create-form"><label>地点名称<input id="place-name" required maxlength="40" placeholder="例如：银杏路转角"></label><label>一句介绍<textarea id="place-description" maxlength="240" placeholder="这里有什么，为什么值得分享？"></textarea></label><input type="hidden" id="place-point"><div class="place-form-actions"><button type="button" class="text-button" data-close>取消</button><button class="tour-button" type="submit">创建地点 ${icon('arrow')}</button></div></form></dialog>
`;

let scene,data,category='全部',selected=null,tourRunning=false,tourIndex=0,tourTimer,toastTimer;
let explorerState={expanded:false,query:'',category:'全部',scrollTop:0};
let community=communityState(),mapPickPoint=null;
const $=id=>document.getElementById(id);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3200);}
let exportUrl;
function previewExport(blob){if(exportUrl)URL.revokeObjectURL(exportUrl);exportUrl=URL.createObjectURL(blob);$('export-image').src=exportUrl;$('export-link').href=exportUrl;showDialog('export-dialog');}
function setHash(id){history.replaceState(null,'',id?'#place='+encodeURIComponent(id):location.pathname+location.search);}
function renderList(){
 const query=$('search').value.trim().toLowerCase();
 $('clear-search').hidden=!query;
 const status={official:'名称已核对',map:'地图原标注',conflict:'名称有冲突',unresolved:'名称待核实'};
 const landmarks=new Map(data.landmarks.map(l=>[l.id,l]));
 let items=[...data.buildings.map(f=>({id:f.id,name:f.displayName,category:f.category,en:f.dormGroup?`${f.dormGroup}学生园区 · ${status[f.nameStatus]}`:status[f.nameStatus],aliases:[...f.aliases,landmarks.get(f.id)?.aliases||'',f.id].join(' '),nameStatus:f.nameStatus,featured:landmarks.has(f.id)})),...data.landmarks.filter(l=>!data.buildings.some(f=>f.id===l.id)),...community.places.filter(p=>!p.fixedId).map(p=>({id:p.id,name:p.name,category:'生活',en:'用户地点 · 社区内容',aliases:p.name+' '+p.description,nameStatus:'map',featured:true}))];
 items.push(...data.surfaces.filter(f=>f.displayName&&!landmarks.has(f.id)).map(f=>({id:f.id,name:f.displayName,category:f.category,en:'运动场地',aliases:(f.aliases||[]).join(' '),nameStatus:f.nameStatus})));
 items=items.filter(l=>(category==='全部'||(category==='待核名'?['unresolved','conflict'].includes(l.nameStatus):l.category===category))&&(!query||[l.name,l.en,l.aliases].some(s=>(s||'').toLowerCase().includes(query))));
 items.sort((a,b)=>Number(b.featured||false)-Number(a.featured||false)||(a.nameStatus==='unresolved')-(b.nameStatus==='unresolved')||a.name.localeCompare(b.name,'zh-CN',{numeric:true}));
 $('landmark-count').textContent=`${items.length} ${query||category!=='全部'?'个搜索结果':'处建筑与场地'}`;
 $('landmark-list').innerHTML=items.length?items.map((l,i)=>`<button class="landmark-item ${selected?.id===l.id?'selected':''}" data-place="${l.id}" aria-pressed="${selected?.id===l.id}"><span class="place-icon ${l.category==='风景'?'nature-icon':''}">${icon(catIcon[l.category]||'building')}</span><span class="place-copy"><strong>${escape(l.name)}</strong><small>${escape(l.en)}</small></span><span class="place-arrow">${icon('arrow')}</span></button>`).join(''):`<div class="empty-state">${icon('search')}<strong>还没找到这个地方</strong><p>试试「图书馆」「29」或「楠园」</p><button type="button" id="clear-filters" class="clear-filters">清除筛选</button></div>`;
 $('landmark-list').querySelector('#clear-filters')?.addEventListener('click',()=>{category='全部';$('search').value='';document.querySelectorAll('[data-category]').forEach((x,i)=>{x.classList.toggle('active',i===0);x.setAttribute('aria-pressed',String(i===0));});renderList();});
 $('landmark-list').querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>b.dataset.place.startsWith('user:')?selectCommunityPlace(b.dataset.place):selectById(b.dataset.place));
}
function featureById(id){return data.buildings.concat(data.surfaces).find(f=>f.id===id);}
function selectById(id,fromTour=false){const f=featureById(id);if(f)selectFeature(f,fromTour);}
function communitySummary(p){const avg=p.ratings.length?(p.ratings.reduce((a,b)=>a+b,0)/p.ratings.length).toFixed(1):'暂无';return `${p.photos.length} 张照片 · ${p.comments.length} 条评论 · ${avg} 分`;}
function refreshCommunity(p){
 const panel=$('detail').querySelector('.community-panel');
 const tab=panel?.dataset.tab||'discussion';
 const scroll=$('detail').scrollTop;
 community=communityState();
 if(p.fixedId)selectById(p.fixedId);else selectCommunityPlace(p.id);
 const next=$('detail').querySelector('.community-panel');
 if(next){next.dataset.tab=tab;next.querySelectorAll('[data-forum-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.forumTab===tab)));}
 $('detail').scrollTop=scroll;
}
function bindCommunityPanel(p){
 const detail=$('detail');
 const save=action=>{try{action();refreshCommunity(p);}catch{toast('保存失败，浏览器空间可能不足，请减少照片大小后重试');}};
 detail.querySelector('#community-comment-form')?.addEventListener('submit',e=>{e.preventDefault();const input=detail.querySelector('#community-comment');if(input.value.trim())save(()=>addComment(p.id,input.value));});
 detail.querySelectorAll('[data-reply-form]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();const input=form.querySelector('input');if(input.value.trim())save(()=>addReply(p.id,form.dataset.replyForm,input.value));}));
 detail.querySelectorAll('[data-reply-toggle]').forEach(button=>button.onclick=()=>{const form=button.parentElement.querySelector('form');form.hidden=!form.hidden;if(!form.hidden)form.querySelector('input').focus();});
 detail.querySelector('#community-rating')?.addEventListener('change',e=>{if(e.target.value)save(()=>addRating(p.id,e.target.value));});
 detail.querySelector('#community-photo')?.addEventListener('change',async e=>{
  for(const file of e.target.files){
   if(!file.type.startsWith('image/')){toast('请选择图片文件');continue;}
   if(file.size>1800000){toast('单张图片请控制在 1.8 MB 以内');continue;}
   try{const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});addPhoto(p.id,{name:file.name,data});refreshCommunity(p);}catch{toast('照片未保存，可能已超出浏览器存储空间');}
  }
 });
 detail.querySelectorAll('[data-forum-tab]').forEach(button=>button.onclick=()=>{
  const panel=detail.querySelector('.community-panel');panel.dataset.tab=button.dataset.forumTab;
  detail.querySelectorAll('[data-forum-tab]').forEach(b=>b.setAttribute('aria-selected',String(b===button)));
 });
}
function communityPanel(p){
 const photos=p.photos.map(x=>`<img src="${escape(x.data)}" alt="${escape(x.name||'地点照片')}" loading="lazy">`).join('');
 const date=x=>new Date(x).toLocaleDateString('zh-CN');
 const comments=[...p.comments].reverse().map(x=>`<li class="forum-post"><header><span class="forum-avatar">我</span><div><strong>本机访客</strong><small>${escape(date(x.createdAt))}</small></div></header><p>${escape(x.text)}</p><div class="forum-replies">${(x.replies||[]).map(r=>`<p><b>本机访客</b> ${escape(r.text)}</p>`).join('')}</div><button type="button" data-reply-toggle="${escape(x.id)}">回复 · ${(x.replies||[]).length}</button><form data-reply-form="${escape(x.id)}" class="community-comment-form" hidden><input aria-label="回复这条评价" maxlength="240" placeholder="回应这条评价…" required><button type="submit">发送</button></form></li>`).join('');
 return `<section class="community-panel" data-tab="discussion"><div class="community-heading"><strong>这里的校园日常</strong><small>${communitySummary(p)}</small></div><div class="forum-tabs" role="tablist" aria-label="地点内容"><button role="tab" aria-selected="true" data-forum-tab="discussion">讨论 <small>${p.comments.length}</small></button><button role="tab" aria-selected="false" data-forum-tab="photos">照片 <small>${p.photos.length}</small></button></div><div class="forum-photo-section">${photos?`<div class="community-photos">${photos}</div>`:'<div class="forum-empty"><strong>第一张照片，等你来拍</strong><p>记录这里的风景、课间与校园生活。</p></div>'}</div><div class="forum-discussion-section"><div class="community-rating"><span>这个地方，你给几分？</span><select id="community-rating" aria-label="为地点评分"><option value="">去评分</option>${[5,4,3,2,1].map(n=>`<option value="${n}">${'★'.repeat(n)} ${n}分</option>`).join('')}</select></div>${comments?`<ul class="community-comments">${comments}</ul>`:'<div class="forum-empty"><strong>还没有讨论，来坐第一排</strong><p>上课体验、实用提醒，或是你在这里的故事。</p></div>'}</div><div class="forum-compose"><label class="upload-photo">＋ 照片<input id="community-photo" type="file" accept="image/*" multiple></label><form id="community-comment-form" class="community-comment-form"><input id="community-comment" aria-label="发表地点评价" maxlength="240" placeholder="说说这个地方…" required><button type="submit">发布</button></form></div><small class="community-local-note">本机体验版 · 照片与讨论仅在此浏览器保存，尚未与其他用户共享。</small></section>`;
}
function arrangeForum(){
 const detail=$('detail'),panel=detail.querySelector('.community-panel');if(!panel)return;
 const info=document.createElement('details');info.className='forum-building-info';
 const summary=document.createElement('summary');summary.textContent='建筑资料与模型';info.append(summary);
 for(const child of [...detail.children])if(child!==panel&&!child.matches('.detail-top,h2'))info.append(child);
 detail.append(info);detail.scrollTop=0;
}
function selectCommunityPlace(id){
 const p=getPlace(id);if(!p)return;rememberExplorer();selected={id:p.id};setHash(p.id);$('detail').innerHTML=`<div class="detail-top"><span class="detail-tag">${icon('pin')} 社区地点 · 北碚校区</span><button id="detail-close" aria-label="关闭地点详情">${icon('close')}</button></div><h2>${escape(p.name)}</h2><span class="detail-en">CAMPUS PLACE</span><p>${escape(p.description||'用户创建的校园地点。')}</p><div class="detail-note">位置已记录在当前三维地图上，可继续上传照片、评论和评分。</div>${communityPanel(p)}`;$('detail').hidden=false;$('detail-close').onclick=closeDetail;scene.focusPoint(p.point);renderList();bindCommunityPanel(p);arrangeForum();
}
function selectFeature(f,fromTour=false){
 if(f?.kind==='community-place'){selectCommunityPlace(f.communityPlaceId||f.id);return;}
 if(!fromTour){stopTour();rememberExplorer();}selected=f;scene.focus(f);setHash(f.id);
 const l=data.landmarks.find(l=>l.id===f.id),title=f.displayName||l?.name||f.name||'校园建筑';
 const category=l?.category||f.category||'建筑';
 $('detail').innerHTML=`<div class="detail-top"><span class="detail-tag">${icon(catIcon[category]||'building')} ${category} · 北碚校区</span><button id="detail-close" aria-label="关闭地标详情">${icon('close')}</button></div><h2>${escape(title)}</h2><span class="detail-en">${escape(l?.en||'SOUTHWEST UNIVERSITY')}</span><p>${escape(l?.description||'根据开放地图中的建筑轮廓生成。可拖动场景，从不同方向查看这栋建筑。')}</p><div class="detail-note">${escape(l?.note||(f.heightBasis==='map-levels'?'高度按开放地图楼层数估算，立面为简化示意。':f.heightBasis==='map-height'?'采用地图标注高度，外观为简化表达。':'建筑高度与外观为示意，待进一步核对。'))}</div><div class="detail-actions"><a href="${escape(l?.source||`https://www.openstreetmap.org/${f.sourceId.startsWith('r')?'relation/'+f.sourceId.slice(1):'way/'+f.sourceId}`)}" target="_blank" rel="noreferrer">查看参考资料 ↗</a><button id="share-place">${icon('share')} 分享地标</button></div>`;
 $('detail').hidden=false;$('detail-close').onclick=closeDetail;
 const notes=[f.nameNote,f.geometryNote,f.heightNote,f.appearanceNote].filter(Boolean);
 if(notes.length)$('detail').querySelector('.detail-note').textContent=notes.join(' ');
 const facts=document.createElement('div');facts.className='building-facts';
 const badges=[];
 badges.push(`基座海拔约 ${Math.round(scene.terrain.meters(f))} 米 · DEM 估算`);
 if(f.kind==='building'){
   badges.push(({official:'名称已核对',map:'地图标注',unresolved:'名称待核实',conflict:'名称有冲突'})[f.nameStatus]);
   badges.push(f.levels?`${f.heightBasis==='photo-estimate'?'约 ':''}${f.levels} 层 · ${f.heightBasis==='official-levels'?'官方资料':f.heightBasis==='photo-estimate'?'照片估读':f.heightBasis==='estimated'?'示意':'地图资料'}`:'层数待核实');
   if(f.model==='library')badges.push('裙楼 1—5 层');
 }
 facts.textContent=badges.join(' / ');if(badges.length)$('detail').querySelector('h2').after(facts);
 const oldNames=(f.aliases||[]).filter(a=>a&&!title.includes(a)&&a!==f.name&&a.length<35);
 const description=$('detail').querySelector('p');
 if(f.kind==='building')description.textContent=f.nameStatus==='unresolved'?'此处已保留独立轮廓和临时编号，名称仍待核实。':`原地图标注：${f.originalName||'未命名'}。${oldNames.length?'也可搜索：'+oldNames.slice(0,3).join('、')+'。':''}`;
 if(f.sources?.length){
   const refs=document.createElement('div');refs.className='evidence-links';
   for(const source of f.sources){const a=document.createElement('a');a.href=source.url;a.target='_blank';a.rel='noreferrer';a.textContent=source.title+' ↗';refs.append(a);}
   $('detail').querySelector('.detail-actions').before(refs);
   $('detail').querySelector('.detail-actions a').remove();
 }
 if(f.kind==='building'){
   const inspect=document.createElement('button');inspect.id='inspect-building';inspect.className='inspect-button';inspect.textContent=scene.inspectionMode?'回到校园':'单栋细看';
   inspect.onclick=()=>{scene.setInspection(!scene.inspectionMode);inspect.textContent=scene.inspectionMode?'回到校园':'单栋细看';inspect.setAttribute('aria-pressed',String(scene.inspectionMode));};
   inspect.setAttribute('aria-pressed',String(!!scene.inspectionMode));
   const inspectBar=document.createElement('div');inspectBar.className='inspection-bar';inspectBar.append(inspect);$('detail').querySelector('h2').before(inspectBar);
   if(f.exterior.entry){
     const entrance=document.createElement('button');entrance.id='view-entrance';entrance.className='entrance-button';entrance.textContent='看入口';
     entrance.onclick=()=>{scene.focusEntrance(f);inspect.textContent='回到校园';inspect.setAttribute('aria-pressed','true');};inspectBar.append(entrance);
   }
   const observation=document.createElement('div');observation.className='exterior-observations';
   const label=({ 'single-photo':'外观参考：单体照片','garden-photo':'外观参考：园区照片','inferred':'外观配置：用途与轮廓估算，待照片核实','unverified':'外观资料待补充','map-only':'外观资料待补充'})[f.exterior.basis];
   observation.innerHTML=`<strong>${label}</strong><ul>${f.exterior.observations.map(t=>`<li>${escape(t)}</li>`).join('')}</ul>`;
   $('detail').querySelector('.detail-note').before(observation);
   if(f.exterior.entryNote){const note=document.createElement('p');note.className='entry-evidence';note.textContent=(f.exterior.entryBasis==='photo-reference'?'入口参考：':'入口待核实：')+f.exterior.entryNote;observation.append(note);}
 }
 const place=fixedPlace(f.id,f);$('detail').insertAdjacentHTML('beforeend',communityPanel(place));bindCommunityPanel(place);
 arrangeForum();
 $('share-place').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);toast('地标链接已复制');}catch{toast('可复制浏览器地址栏中的地标链接');}};
 renderList();
 if(mobileMedia.matches)setExplorerExpanded(false);
}
function rememberExplorer(){explorerState={expanded:!$('explorer').classList.contains('collapsed'),query:$('search').value,category,scrollTop:$('landmark-list').scrollTop};}
function setExplorerExpanded(expanded,focus=false){$('explorer').classList.toggle('collapsed',!expanded);$('mobile-collapse').setAttribute('aria-expanded',String(expanded));$('mobile-collapse').setAttribute('aria-label',expanded?'收起探索面板':'展开探索面板');if(expanded&&focus)$('search').focus();}
function restoreExplorer(){category=explorerState.category;$('search').value=explorerState.query;document.querySelectorAll('[data-category]').forEach(b=>{const active=b.dataset.category===category;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});renderList();setExplorerExpanded(explorerState.expanded);requestAnimationFrame(()=>$('landmark-list').scrollTop=explorerState.scrollTop);}
function closeDetail(){if(scene.inspectionMode)scene.setInspection(false);selected=null;$('detail').hidden=true;scene.highlight(null);scene.activeId=null;setHash(null);restoreExplorer();}
function reset(){stopTour(false);selected=null;$('detail').hidden=true;setHash(null);scene.reset();setExplorerExpanded(!mobileMedia.matches);renderList();}
function syncTourButton(){
 $('tour').innerHTML=`${icon(tourRunning?'pause':'play')}<span>${tourRunning?'暂停校园漫游':'沿着校园走一走'}</span>`;
 $('tour').classList.toggle('playing',tourRunning);$('tour').setAttribute('aria-pressed',String(tourRunning));
}
function stopTour(clearStatus=true){tourRunning=false;clearTimeout(tourTimer);syncTourButton();if(clearStatus)$('tour-status').hidden=true;}
function tourStep(){
 const l=data.landmarks[tourIndex];selectById(l.id,true);
 $('tour-progress').textContent=`${String(tourIndex+1).padStart(2,'0')} / ${data.landmarks.length}  ·  ${l.name}`;$('tour-status').hidden=false;
 clearTimeout(tourTimer);if(tourRunning)tourTimer=setTimeout(()=>{tourIndex=(tourIndex+1)%data.landmarks.length;tourStep();},6500);
}
function showDialog(id){$(id).showModal();}
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.target===d&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))d.close();}));
$('sources-open').onclick=$('data-open').onclick=()=>showDialog('sources-dialog');
$('layers-open').onclick=()=>showDialog('layers-dialog');
$('mobile-collapse').onclick=()=>setExplorerExpanded($('explorer').classList.contains('collapsed'));
const mobileMedia=matchMedia('(max-width: 760px)');
const adaptExplorer=()=>setExplorerExpanded(!mobileMedia.matches);
mobileMedia.addEventListener('change',adaptExplorer);
adaptExplorer();
async function init(){
 try{
  const [response,terrainResponse]=await Promise.all([fetch(`${import.meta.env.BASE_URL}data/campus.json`),fetch(`${import.meta.env.BASE_URL}data/terrain.json`)]);if(!response.ok||!terrainResponse.ok)throw new Error('校园或地形数据加载失败');data=await response.json();const terrain=await terrainResponse.json();
  scene=new CampusScene($('scene'),data,{terrain,onSelect:selectFeature,onMove:()=>{if(tourRunning){stopTour(false);toast('漫游已暂停，可自由查看校园');}},onReady:()=>{$('loading').classList.add('loaded');setTimeout(()=>$('loading').remove(),650);}});
  scene.setCommunityMarkers(community.places);
  $('create-place').onclick=()=>{mapPickPoint=null;scene.setMapPickMode(point=>{mapPickPoint=point;scene.setMapMarker(point);$('place-point').value=point.join(',');$('place-create-dialog').showModal();toast('位置已选定，可以确认或重新点击地图移动标记');});scene.setMapMarker(null);toast('请点击地图选择位置，再填写地点信息');};
  $('place-create-form').onsubmit=e=>{e.preventDefault();if(!mapPickPoint){toast('请先在地图上选择位置');return;}const p=createPlace({name:$('place-name').value,description:$('place-description').value,point:mapPickPoint});community=communityState();scene.setMapPickMode(null);scene.setCommunityMarkers(community.places);$('place-create-dialog').close();$('place-create-form').reset();mapPickPoint=null;renderList();selectCommunityPlace(p.id);toast('地点已创建');};
  document.querySelector('.model-badge').innerHTML='<i></i> DEM 地形 · 高差比例 1:1';
  const terrainLayer=document.createElement('label');terrainLayer.className='layer-row';terrainLayer.innerHTML='<span><strong>地形等高线</strong><small>间隔 10 米 · 含平台平整处理</small></span><input type="checkbox" data-layer="contours"><span class="toggle"></span>';document.querySelector('.layer-list').append(terrainLayer);
  $('building-total').textContent=data.buildings.length;
  $('accuracy-text').textContent=`共 ${data.buildings.length} 个独立建筑轮廓，${data.meta.namedBuildings} 栋带有名称（含 ${data.meta.nameConflicts} 处名称冲突），${data.meta.officialNames} 栋名称对照学校目录，${data.meta.unresolvedNames} 栋仍待核名。地形采用 Mapzen / AWS Terrain Tiles 公开高程栅格，区域源数据约 30 米级，按实际高差 1:1 展示。SRTM 数据主要源于 2000 年前后，不能反映全部近期土方变化。建筑、运动场和湖面使用估算的平台高程；边坡过渡、台阶与道路局部坡度未经实测。既有建筑外貌保持不变，建筑高度、植被与部分细节仍为示意。`;
  const sources=document.querySelector('.source-links');
  const demSource=document.createElement('li');demSource.innerHTML='<a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noreferrer">Mapzen / AWS Terrain Tiles · 地形高程 ↗</a><span>SRTM terrain data courtesy of the U.S. Geological Survey · '+terrain.source.accessed+' 获取 · 已缓存到本地</span>';sources.prepend(demSource);
  for(const [title,url] of [['学校楼宇目录 · 84处建筑资料','https://www.swu.edu.cn/whxd/hjwh/ly.htm'],['学校学生园区目录 · 新旧宿舍名称','https://www.swu.edu.cn/whxd/hjwh/jdxsyq.htm'],['2026年校运会 · 第二运动场近照','https://www.swu.edu.cn/info/1197/27757.htm']]){const li=document.createElement('li'),a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noreferrer';a.textContent=title+' ↗';li.append(a);sources.prepend(li);}
  renderList();
  $('search').addEventListener('input',renderList);
  $('clear-search').onclick=()=>{ $('search').value='';renderList();$('search').focus(); };
  document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;setExplorerExpanded(true);document.querySelectorAll('[data-category]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});renderList();});
  $('reset').onclick=$('compass').onclick=reset;document.querySelector('.brand').onclick=e=>{e.preventDefault();reset();};
  $('top-view').onclick=()=>{stopTour();scene.topView();};$('zoom-in').onclick=()=>scene.zoom(.75);$('zoom-out').onclick=()=>scene.zoom(1.3);
  document.querySelectorAll('[data-time]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-time]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});scene.setTime(b.dataset.time);document.body.dataset.time=b.dataset.time;});
  document.querySelectorAll('[data-layer]').forEach(input=>input.onchange=()=>scene.setLayer(input.dataset.layer,input.checked));
  $('tour').onclick=()=>{if(tourRunning){stopTour(false);return;}tourRunning=true;syncTourButton();tourStep();};
  $('tour-next').onclick=()=>{tourIndex=(tourIndex+1)%data.landmarks.length;tourStep();};$('tour-stop').onclick=()=>stopTour();
  $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('当前浏览器不支持全屏，请尝试 F11');}};
  $('capture').onclick=async()=>{try{previewExport(await scene.screenshot());}catch{toast('画面生成失败，请重试');}};
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&!document.querySelector('dialog[open]')){e.preventDefault();setExplorerExpanded(true,true);}});
  const parseHash=()=>{const id=new URLSearchParams(location.hash.slice(1)).get('place');if(id&&featureById(id))selectById(id);};
  window.addEventListener('hashchange',parseHash);parseHash();
  window.__campusDebug={buildingCount:data.buildings.length,landmarkCount:data.landmarks.length,get activeId(){return scene.activeId;},get tourRunning(){return tourRunning;},get layers(){return Object.fromEntries(Object.entries(scene.layers).map(([k,v])=>[k,v.visible]));},get drawCalls(){return scene.renderer.info.render.calls;},get triangles(){return scene.renderer.info.render.triangles;}};
 }catch(error){console.error(error);$('loading').innerHTML=`${icon('info')}<strong>校园暂时没有展开</strong><span>请确认浏览器支持 WebGL，并通过本地服务打开网页。</span><button onclick="location.reload()">重新加载</button>`;}
}
init();
