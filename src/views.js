import * as D from "./domain.js";
import {artUri,photoAsset} from "./art.js";
import {nodePhoto,PLACES} from "./place-photos.js";
export const e=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const br=value=>e(value).replace(/\n/g,"<br>");
export const b=(action,label,attrs="",kind="")=>'<button type="button" data-action="'+action+'" class="'+kind+'" '+attrs+'>'+label+'</button>';
export const field=(label,name,value="",type="text",attrs="")=>'<label class="field">'+label+'<input name="'+name+'" type="'+type+'" value="'+e(value)+'" '+attrs+'></label>';
export const area=(label,name,value="",attrs="")=>'<label class="field">'+label+'<textarea name="'+name+'" '+attrs+'>'+e(value)+'</textarea></label>';
export const select=(label,name,options,value="",attrs="")=>'<label class="field">'+label+'<select name="'+name+'" '+attrs+'>'+options.map(o=>'<option value="'+e(o.value)+'" '+(o.value===value?"selected":"")+'>'+e(o.label)+'</option>').join("")+'</select></label>';
export const tag=(s,kind="")=>'<span class="badge '+kind+'">'+e(s)+'</span>';
export const art=(kind,size=48)=>'<img src="'+artUri(kind)+'" width="'+size+'" height="'+size+'" alt="" aria-hidden="true">';
export const fmtDate=s=>s?new Date(s).toLocaleDateString("zh-CN",{month:"numeric",day:"numeric"}):"待定";
export const fmtTime=s=>s?new Date(s).toLocaleString("zh-CN",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}):"";
export const person=id=>'<span class="member-name">'+art(D.USERS.find(u=>u.id===id)?.art||"traveler",30)+e(D.displayName(id))+'</span>';
export const money=D.money;
const actionsAttrs=t=>'data-trip="'+e(t.id)+'"';
const routeUrl=t=>'#/trip/'+encodeURIComponent(t.id)+(t.snapshot?"/map":"/plan");
export function shell(content,page){
  return '<header class="site-header"><div class="header-inner"><a class="brand" href="#/"><img src="./assets/logo.svg" alt=""><strong>毕业同游</strong><small>OUR LAST SUMMER</small></a>'+
    '<nav class="nav" aria-label="主导航"><a href="#/" '+(page==="home"?'class="active" aria-current="page"':"")+'>首页</a><a href="#/trips" '+(page!=="home"?'class="active" aria-current="page"':"")+'>同学们的旅行</a><span class="identity">'+art("traveler",30)+'林晓</span></nav></div></header>'+
    content+'<footer class="site-footer"><span>毕业同游 · 把这一程，留给我们</span><div class="row"><a href="./assets/photos.html" target="_blank" rel="noopener">摄影署名</a>'+b("help","使用说明","","ghost small")+b("data-settings","本地数据","","ghost small")+'</div></footer>';
}
function heroArt(){
  return '<div class="hero-art" aria-label="Q版同学和交通工具搭配真实风景照片">'+
    '<svg class="scene-bg" viewBox="0 0 720 510" aria-hidden="true"><path d="M46 252C10 167 136 89 274 98S504 1 611 86s64 194 30 277-247 137-376 101S87 373 46 252Z" fill="#e9eedd"/><path d="M467 155q163-40 211 63 27 73-24 150-85 115-218 45-68-36-39-108 24-55 70-150Z" fill="#d8ecec"/><path d="M30 445Q125 457 154 383T356 268 595 364" fill="none" stroke="white" stroke-width="16" stroke-linecap="round"/><path d="M30 445Q125 457 154 383T356 268 595 364" fill="none" stroke="#28634f" stroke-width="2.5" stroke-dasharray="5 9" stroke-linecap="round"/><path d="M69 319v-26m-9 11 9-19 10 19m-23 9 13-20 13 20m548-168v-27m-10 12 10-19 10 19m-23 10 13-21 13 21" fill="#c7dbc9" stroke="#28634f" stroke-width="2"/><circle cx="124" cy="98" r="25" fill="#f2d9b8"/><path d="M302 78q12-15 25 0m8 0q12-15 25 0" fill="none" stroke="#53675f" stroke-width="2"/></svg>'+
    '<div class="polaroid hero-photo-coast"><img src="'+PLACES.oldtown.src+'" alt="厦门鼓浪屿实景"><p>把日落留在这一站</p><span class="tape"></span></div>'+
    '<div class="polaroid hero-photo-lake"><img src="'+photoAsset("mountain")+'" alt="杭州西湖实景"><p>下一程，去山野</p><span class="tape"></span></div>'+
    '<img class="sticker" src="'+artUri("traveler")+'" alt="Q版背包同学" style="left:15%;top:65%;transform:rotate(-8deg)">'+
    '<img class="sticker" src="'+artUri("friend")+'" alt="Q版摄影同学" style="left:26%;top:65%;width:14%;transform:rotate(7deg)">'+
    '<img class="sticker" src="'+artUri("train")+'" alt="Q版火车" style="left:43%;top:46%;width:18%;transform:rotate(-5deg)">'+
    '<img class="sticker" src="'+artUri("camera")+'" alt="Q版相机" style="left:80%;top:57%;transform:rotate(12deg)">'+
    '<img class="sticker" src="'+artUri("tent")+'" alt="Q版帐篷" style="left:65%;top:75%;width:17%">'+
    '<span class="hero-art-note">下一站，一起去看海</span></div>';
}
export function homeView(){
  return '<main class="page page-wide"><section class="hero"><div><p class="eyebrow">毕业不是散场，是一起出发</p><h1>把毕业旅行，<br>一起走成回忆</h1><p class="subtitle">一起选方案，沿着地图出发<br>把照片留在每一站</p><div class="row">'+b("go-trips",'立即体验 <span aria-hidden="true">↗</span>',"","primary")+'<span class="fine">从一场同学旅行开始</span></div></div>'+heroArt()+'</section><section class="hero-features" aria-label="产品功能">'+
    [["01","一起选方案","把每个人的想法，放进同一场旅行"],["02","沿着地图出发","同一条路线，留下共同的脚印"],["03","把回忆留在每一站","照片与账单，都有自己的归处"]].map(([n,title,copy])=>'<div><span class="number">'+n+'</span><div><h3>'+title+'</h3><p class="fine">'+copy+'</p></div></div>').join("")+'</section></main>';
}
export function listView(trips,urls){
  return '<main class="page"><div class="page-heading"><div><p class="eyebrow">OUR TRIPS</p><h1>同学们的旅行</h1><p>一起决定去哪儿，把每一站变成共同的回忆</p></div>'+b("create-trip","＋ 发起旅行","","primary")+'</div>'+
    (trips.length?'<div class="grid3">'+trips.map(t=>{
      const own=t.organizerId===D.USER_ID,p=t.snapshot?.proposal||t.proposals[0],participated=t.participations.some(r=>r.userId===D.USER_ID);
      return '<article class="trip-card"><div class="trip-cover"><img src="'+(urls.get(t.coverId)||photoAsset(t.theme))+'" alt="'+e(t.title)+'的风景封面">'+tag(own?"我发起的旅行":participated?"我参加的旅行":D.nameOf(t.organizerId)+"发起")+'</div>'+
      '<div class="trip-content"><div class="row between"><h2>'+e(t.title)+'</h2>'+tag(D.STATUS[t.status],t.status==="travelling"?"green":"gray")+'</div><p class="fine">'+e(t.description)+'</p>'+
      '<div class="meta"><span>'+e(p.cities.join(" → "))+'</span><span>·</span><span>'+fmtDate(p.startDate)+' — '+fmtDate(p.endDate)+'</span></div>'+
      '<div class="meta"><span>'+t.proposals.length+'份候选方案</span><span>·</span><span>'+D.members(t).length+'/'+t.max+'人同行</span>'+(t.namespace==="demo"?'<span>· 示例旅行</span>':"")+'</div>'+
      '<div class="card-bottom"><span class="fine">组织者 '+e(D.displayName(t.organizerId))+'</span>'+
      '<a class="button" href="'+routeUrl(t)+'">'+(t.status==="ended"?"回看旅程":t.snapshot?"查看旅行地图":t.status==="draft"?"继续填写":"查看方案")+'</a></div></div></article>';
    }).join("")+'</div>':'<div class="empty">'+art("traveler",100)+'<h2>从第一场毕业旅行开始</h2><p class="muted">发起旅行，邀请示例同学一起选择方案</p>'+b("create-trip","发起第一场旅行","","primary")+'</div>')+'</main>';
}
export function proposalView(t){
  const attr=actionsAttrs(t),own=t.organizerId===D.USER_ID,confirmed=t.participations.find(p=>p.userId===D.USER_ID),chosen=confirmed?.proposalId||t.selections[D.USER_ID];
  const votes=D.voteCounts(t),total=votes.reduce((s,v)=>s+v.count,0),expired=Date.parse(t.deadline)<=Date.now();
  const frozen=t.participations.length>0||!!t.snapshot,canChoose=!own&&!confirmed&&t.status==="recruiting"&&!expired;
  const pref=t.preferences[D.USER_ID]||{},readonly=!!t.snapshot||!["draft","recruiting"].includes(t.status);
  return '<main class="page"><div class="breadcrumb"><a href="#/trips">同学们的旅行</a><span>/</span><span>'+e(t.title)+'</span></div>'+
    '<div class="page-heading"><div><div class="row"><h1>'+e(t.title)+'</h1>'+tag(D.STATUS[t.status],"green")+'</div><p>'+e(t.description)+'</p></div><div class="row">'+
    (own&&!frozen&&["draft","recruiting"].includes(t.status)?b("edit-trip","编辑旅行",attr):"")+
    (t.status==="draft"&&own?b("publish-trip","开始招募",attr,"primary"):"")+
    (t.snapshot?'<a class="button primary" href="#/trip/'+e(t.id)+'/map">查看旅行地图</a>':"")+'</div></div>'+
    '<div class="notice row between"><span>从 '+e(t.departure)+' 出发 · '+fmtTime(t.deadline)+' 截止报名</span><span>最少 '+t.min+' 人 · 上限 '+t.max+' 人（含组织者）</span></div><div class="spacer"></div>'+
    '<div class="proposal-layout"><div class="stack"><section class="proposal-list" aria-label="候选方案">'+t.proposals.map((p,i)=>{
      const count=votes.find(v=>v.id===p.id).count;
      return '<article class="proposal '+(chosen===p.id?"selected":"")+'"><div class="proposal-top"><div><div class="row gap8">'+tag("方案 "+(i+1))+((t.snapshot?.proposal.id===p.id)?tag("已锁定","green"):"")+'</div><h2 style="margin-top:12px">'+e(p.title)+'</h2><p class="fine" style="margin-top:7px">'+fmtDate(p.startDate)+' — '+fmtDate(p.endDate)+' · '+e(p.cities.join(" → "))+'</p></div><div class="right"><div class="budget">¥'+money(p.budgetMin)+'–'+money(p.budgetMax)+'</div><span class="fine">每人预计费用</span></div></div>'+
      '<p style="margin-top:15px">'+e(p.core)+'</p><div class="row between" style="margin-top:16px"><span class="fine">'+count+' 人已确认选择'+(total?" / "+total+" 票":"")+'</span>'+
      (canChoose?b("select-proposal",chosen===p.id?"已选择":"选择这个方案",attr+' data-proposal="'+e(p.id)+'"',chosen===p.id?"primary small":"small"):
        chosen===p.id?tag(confirmed?"我的已确认选择":"我的选择","green"):"")+'</div>'+
      '<div class="vote-track"><span style="width:'+(total?count/total*100:0)+'%"></span></div>'+
      '<details><summary>查看每日安排与费用范围</summary>'+p.days.map((d,j)=>'<div class="day-outline"><h3>第'+(j+1)+'天 · '+fmtDate(d.date)+'</h3>'+
        d.items.map(item=>'<p>'+e(item.name)+' · '+e(D.TRANSPORT[item.transport])+(item.description?' · '+e(item.description):"")+'</p>').join("")+'</div>').join("")+
      '<dl class="detail-list"><dt>费用包含</dt><dd>'+e(p.feeScope)+'</dd><dt>住宿设想</dt><dd>'+e(p.stay||"待商议")+'</dd>'+(p.notes?'<dt>补充说明</dt><dd>'+br(p.notes)+'</dd>':"")+'</dl></details></article>';
    }).join("")+'</section>'+
    '<section class="card"><h2>我的偏好与建议</h2><p class="fine" style="margin-top:8px">可以留空，未填写不代表没有要求'+(frozen&&!t.snapshot?"；方案已冻结，锁定前仍可补充偏好":"")+'</p><div class="spacer"></div>'+
    '<form id="preference-form" data-trip="'+e(t.id)+'"><fieldset '+(readonly?"disabled":"")+' style="border:0;padding:0;margin:0"><label class="field">旅行兴趣</label><div class="tags">'+D.INTERESTS.map(x=>'<label class="tag-check"><input type="checkbox" name="interests" value="'+x+'" '+(pref.interests?.includes(x)?"checked":"")+'>'+x+'</label>').join("")+'</div><div class="spacer"></div>'+
    '<div class="grid2">'+select("旅行节奏","pace",[{value:"",label:"暂不填写"},...D.PACES.map(x=>({value:x,label:x}))],pref.pace||"")+
    '<div><label class="field">饮食偏好</label><div class="tags">'+D.DIETS.map(x=>'<label class="tag-check"><input type="checkbox" name="diets" value="'+x+'" '+(pref.diets?.includes(x)?"checked":"")+'>'+x+'</label>').join("")+'</div></div></div>'+
    area("其他需求","needs",pref.needs||"",'maxlength="600" placeholder="例如：不希望太早集合，希望留出自由活动时间"')+
    select("建议关联","scope",[{value:"general",label:"通用建议"},...t.proposals.map(p=>({value:p.id,label:p.title}))],pref.scope||"general")+
    area("方案建议","suggestion",pref.suggestion||"",'maxlength="600" placeholder="例如：第二天的合影能否安排在傍晚"')+
    '<button type="submit">保存偏好与建议</button></fieldset><div class="error" data-form-error hidden></div></form></section></div>'+
    '<aside class="side-panel stack"><section class="card"><h3>同行状态</h3><div class="stat" style="border:0;padding:16px 0"><div class="value">'+D.members(t).length+' <small class="muted">/ '+t.max+' 人</small></div><span class="fine">'+t.participations.length+'位参与者已确认 · 组织者不计票</span></div>'+
    (t.participations.length?'<p class="fine">首位同学确认后，候选方案已整体冻结</p>':'<p class="fine">第一位同学确认前，组织者可修改候选方案</p>')+'<div class="spacer"></div>'+
    (own?(t.status==="recruiting"?'<div class="stack gap8">'+b("simulate","填充示例报名",attr+(expired||t.simulationApplied?' disabled':""))+
      '<p class="fine">用于展示其他同学报名，不是真人实时加入</p>'+b("lock","结束报名并锁定",attr+(D.members(t).length<t.min||!total?' disabled':""),"primary")+
      (D.members(t).length<t.min?'<p class="fine">还需 '+(t.min-D.members(t).length)+' 人即可成团</p>':"")+'</div>':""):
      confirmed?'<div class="notice">已确认参加<br>你的选择已锁定，等待组织者确定最终方案</div>':
      t.status==="recruiting"?'<div class="stack gap8">'+b("confirm","确认参加",attr+(!chosen||expired||D.members(t).length>=t.max?' disabled':""),"primary")+
        '<p class="fine">'+(expired?"报名已截止":D.members(t).length>=t.max?"同行人数已满":"草稿选择不计票，确认后不可改选")+'</p></div>':"")+
    '</section><section class="card"><h3>同行同学</h3>'+D.members(t).map(id=>'<div class="member-line">'+person(id)+'<span class="muted">'+(id===t.organizerId?"组织者":"已确认")+'</span></div>').join("")+'</section>'+
    (own&&["draft","recruiting","locked"].includes(t.status)?b("cancel-trip","取消这场旅行",attr,"ghost small"):"")+'</aside></div></main>';
}
export function visibleNodes(t,view){
  if(view.day==="all"){
    const selected=[t.nodes[0]];
    for(const day of t.snapshot.proposal.days.map((_,i)=>i+1)){
      const preferred=t.nodes.find(n=>n.day===day&&/合影/.test(n.name))||t.nodes.find(n=>n.day===day&&["attraction","activity"].includes(n.type));
      if(preferred)selected.push(preferred);
    }
    selected.push(t.nodes.at(-1));
    return [...new Map(selected.filter(Boolean).map(n=>[n.id,n])).values()].slice(0,6).sort((a,b)=>a.order-b.order);
  }
  return t.nodes.filter(n=>n.day===Number(view.day)&&n.page===(view.page||0));
}
function mapBackdrop(theme){
  return '<path d="M0 45C80 5 180 80 290 28s180 65 270 10S820 4 1000 50V660H0Z" fill="#eef2e6"/>'+
    (theme==="beach"?'<path d="M740 0c-50 95 95 105 0 218S680 390 775 472 734 580 660 660h340V0Z" fill="#d8ecec"/><path d="M803 88q18-13 36 0t36 0m-32 190q18-13 36 0t36 0m-16 260q18-13 36 0t36 0" fill="none" stroke="#95b8b0" stroke-width="3"/>':
      '<path d="m600 650 140-200 190 200M-50 120 70 2 190 120" fill="#c7dbc9" opacity=".7"/>')+
    '<path d="M70 485v-38m-15 18 15-28 15 28m-34 12 19-31 19 31M876 150v-38m-15 18 15-28 15 28m-34 12 19-31 19 31" fill="#c7dbc9" stroke="#83a48a" stroke-width="2"/>';
}
function mapPhotos(t,node,urls){
  const photos=t.photos.filter(p=>p.nodeId===node.id).sort((a,b)=>b.at.localeCompare(a.at)),count=photos.length,attr=actionsAttrs(t)+' data-node="'+e(node.id)+'"';
  if(!count)return D.isMember(t,D.USER_ID)?b("upload",art("camera",20)+"照片",attr,"node-empty-photo"):"";
  const photo=p=>'<img src="'+e(urls.get(p.id)||"")+'" alt="'+e(p.caption||node.name+"的照片")+'">';
  if(count===2||count===3)return '<div class="node-photo-pair">'+photos.slice(0,2).map((p,i)=>b("album",photo(p)+(i===1?'<span class="photo-count">共'+count+'张</span>':""),attr,"node-photo")).join("")+'</div>';
  return b("album",photo(photos[0])+(count>1?'<span class="photo-count">共'+count+'张</span>':""),attr,"node-photo "+(count>=4?"stacked":""));
}
// Two serpentine rows. Height grows with text, without changing persisted node positions.
function mapLayout(nodes){
  const longest=Math.max(1,...nodes.map(n=>Math.ceil([...n.name].length/11)));
  const rowHeight=286+longest*23;
  return {rowHeight,height:rowHeight*(nodes.length>3?2:1)+90,
    nodes:nodes.map((n,i)=>({...n,x:[18,50,82,82,50,18][i],y:78+(i<3?0:rowHeight)}))};
}
function mapLinks(nodes,height){
  return nodes.slice(1).map((n,i)=>{
    const a=nodes[i],x1=a.x*10,x2=n.x*10,y1=a.y,y2=n.y,turn=y1!==y2;
    const mx=turn?946:(x1+x2)/2,my=turn?(y1+y2)/2+40:y1;
    const path=turn?'M'+x1+' '+y1+'H898Q946 '+y1+' 946 '+(y1+48)+'V'+(y2-48)+'Q946 '+y2+' 898 '+y2+'H'+x2:'M'+x1+' '+y1+'H'+x2;
    return '<svg class="map-route" viewBox="0 0 1000 '+height+'" preserveAspectRatio="none" aria-hidden="true"><path d="'+path+'" class="route-bed"/><path d="'+path+'" class="route-dash"/></svg>'+
      '<div class="route-transport" style="left:'+mx/10+'%;top:'+my+'px" aria-label="到'+e(n.name)+'：'+e(D.TRANSPORT[n.transport])+'">'+
      (n.transport!=="unknown"?art(n.transport==="walk"?"traveler":n.transport,58):'<span class="transport-unknown">?</span>')+
      '<span>'+e(D.TRANSPORT[n.transport])+'</span></div>';
  }).join('');
}
export function mapView(t,view,urls){
  if(!t.snapshot)return proposalView(t);
  const attr=actionsAttrs(t),own=t.organizerId===D.USER_ID,current=t.nodes.find(n=>n.status==="current"),layout=mapLayout(visibleNodes(t,view)),nodes=layout.nodes;
  const progress=t.progressEvents.at(-1),next=current?t.nodes.find(n=>n.order>current.order&&n.status==="planned"):t.nodes.find(n=>n.status==="planned");
  const dayCount=t.snapshot.proposal.days.length,pages=view.day==="all"?1:Math.max(1,...t.nodes.filter(n=>n.day===Number(view.day)).map(n=>n.page+1));
  const canUpload=D.isMember(t,D.USER_ID)&&["locked","travelling","ended"].includes(t.status);
  return '<main class="page page-wide"><div class="breadcrumb"><a href="#/trips">同学们的旅行</a><span>/</span><a href="#/trip/'+e(t.id)+'/plan">锁定方案</a></div>'+
    '<div class="page-heading"><div><div class="row"><h1>'+e(t.title)+'</h1>'+tag(D.STATUS[t.status],"green")+'</div><p>'+e(t.snapshot.proposal.cities.join(" → "))+' · '+fmtDate(t.snapshot.proposal.startDate)+' — '+fmtDate(t.snapshot.proposal.endDate)+'</p></div><div class="row">'+
    (own&&t.status==="locked"?b("start-trip","开始旅行",attr,"primary"):"")+(own&&t.status==="travelling"?b("end-trip","结束旅行",attr):"")+
    '<a class="button" href="#/trip/'+e(t.id)+'/ledger">旅行账本</a>'+b("upload","上传照片",attr+(canUpload?"":" disabled"),"primary")+'</div></div>'+
    '<div class="current-info">'+art("traveler",58)+'<div class="grow"><h3>'+(current?"我们到这里啦 · "+e(current.name):t.status==="ended"?"这场旅行已结束":"出发前，再确认一下我们的安排")+'</h3><p class="fine">团队进度由组织者维护'+(progress?' · 更新于 '+fmtTime(progress.at):"")+(next?' · 下一站 '+e(next.name):"")+'</p></div>'+b("current-node","回到当前站",attr+(!current?' disabled':""))+'</div>'+
    '<div class="summary-banner"><div><strong>'+(t.summary.status==="done"?"同行建议已整理":t.summary.status==="failed"?"整理暂未完成，基础行程仍可使用":"正在整理同行建议")+'</strong><p class="fine">基于已锁定方案与团队偏好 · 模板整理</p></div>'+
      b(t.summary.status==="failed"?"retry-summary":"summary",t.summary.status==="failed"?"重试整理":"查看汇总",attr+(t.summary.status==="done"||t.summary.status==="failed"?"":" disabled"))+'</div>'+
    '<div class="map-toolbar"><div class="tabs" role="group" aria-label="行程天数">'+b("map-day","全程",attr+' data-day="all"',view.day==="all"?"active":"")+
      Array.from({length:dayCount},(_,i)=>b("map-day","第"+(i+1)+"天",attr+' data-day="'+(i+1)+'"',view.day===String(i+1)?"active":"")).join("")+'</div><div class="row">'+
      (pages>1?'<span class="fine">当日节点组</span>'+Array.from({length:pages},(_,i)=>b("map-page",String(i+1),attr+' data-page="'+i+'"',view.page===i?"small primary":"small")).join(""):"")+
      b("zoom","放大",attr+' data-zoom="1.2"',"small")+b("zoom","适应窗口",attr+' data-zoom="1"',"small")+'</div></div>'+
    '<div class="map-wrapper" id="map-scroll"><div class="map-board" style="height:'+layout.height+'px;'+(view.zoom>1?'width:120%;':"")+'"><svg class="map-background" viewBox="0 0 1000 660" preserveAspectRatio="none" aria-hidden="true">'+mapBackdrop(t.theme)+'</svg>'+mapLinks(nodes,layout.height)+
      nodes.map(n=>{const picture=nodePhoto(t,n,urls),kind=({activity:"camera",attraction:"tent",food:"food",hotel:"hotel"})[n.type]||"traveler";
        return '<div class="map-node '+n.status+'" style="left:'+n.x+'%;top:'+n.y+'px" data-node-view="'+e(n.id)+'">'+
        b("node",'<span class="node-portrait"><span class="node-pin '+(picture?'has-photo':'')+'">'+(picture?'<img src="'+e(picture.src)+'" alt="'+e(picture.label)+'" style="object-position:'+picture.position+'">':art(kind,52))+'</span><span class="node-number">'+String(n.order+1).padStart(2,'0')+'</span>'+
        (n.status==="current"?'<img class="team-avatar" src="'+artUri("traveler")+'" alt="团队当前所在节点">':'')+'</span><span class="node-copy"><span class="node-place">'+e(picture?.label||'等待本站照片')+'</span><span class="node-title">'+e(n.name)+'</span><small class="node-status">'+(n.status==='done'?'✓ ':n.status==='current'?'● ':'')+D.NODE_STATUS[n.status]+'</small></span>',attr+' data-node="'+e(n.id)+'"',"node-main")+
        mapPhotos(t,n,urls)+'</div>';
      }).join("")+'</div></div>'+
    '<details class="moments"><summary><div class="row between"><strong>旅途记录</strong><span class="fine">展开查看全部 '+t.moments.length+' 条</span></div><p class="fine" style="margin-top:9px">'+(t.moments.length?e(D.displayName(t.moments.at(-1).actorId))+' · '+e(t.moments.at(-1).text):"从第一张照片、第一段记录开始")+'</p></summary>'+
    '<div class="row" style="margin-top:16px">'+(canUpload?b("write-note","写一条记录",attr):"")+(own&&canUpload?b("announcement","发布集合提醒",attr):"")+'</div>'+
    [...t.moments].reverse().map(m=>'<div class="moment"><time>'+fmtTime(m.at)+'</time><div class="grow"><span class="who">'+e(D.displayName(m.actorId))+'</span><p>'+br(m.text)+'</p></div>'+(m.nodeId?b("locate-node","查看本站",attr+' data-node="'+e(m.nodeId)+'"',"small"):"")+'</div>').join("")+'</details></main>';
}
function expenseRows(t,items){
  return items.map(item=>'<tr><td><strong>'+e(item.title)+'</strong><div class="fine">'+e(item.category)+(item.nodeId?' · '+e(t.nodes.find(n=>n.id===item.nodeId)?.name||""):"全程支出")+'</div></td><td>'+e(item.date)+'</td><td class="amount right">¥'+money(item.amount)+'</td><td>'+e(D.displayName(item.payerId))+'</td><td>'+item.shares.length+'人 · '+(item.mode==="even"?"均分":"自定义")+'</td><td class="right">'+
    b("expense-detail","详情",actionsAttrs(t)+' data-expense="'+e(item.id)+'"',"small")+
    (item.creatorId===D.USER_ID&&item.status==="active"?' '+b("edit-expense","修改",actionsAttrs(t)+' data-expense="'+e(item.id)+'"',"small"):"")+'</td></tr>').join("");
}
export function ledgerView(t){
  const totals=D.ledger(t),me=totals.balances.find(x=>x.userId===D.USER_ID)||{paid:0,owed:0,net:0};
  const active=t.expenses.filter(x=>x.status==="active").sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),voided=t.expenses.filter(x=>x.status==="void");
  const canEdit=D.isMember(t,D.USER_ID)&&["locked","travelling","ended"].includes(t.status),attr=actionsAttrs(t);
  const table=items=>'<div class="table-wrap"><table><thead><tr><th>支出</th><th>日期</th><th class="right">金额</th><th>付款人</th><th>分账</th><th class="right">操作</th></tr></thead><tbody>'+expenseRows(t,items)+'</tbody></table></div>';
  return '<main class="page"><div class="breadcrumb"><a href="#/trips">同学们的旅行</a><span>/</span><a href="#/trip/'+e(t.id)+'/map">'+e(t.title)+'</a><span>/ 旅行账本</span></div>'+
    '<div class="page-heading"><div><h1>旅行账本</h1><p>谁垫付、谁参与，每一笔都清清楚楚</p></div>'+b("new-expense","＋ 记一笔",attr+(canEdit?"":" disabled"),"primary")+'</div>'+
    '<section class="stats">'+[["全团实际支出",totals.total,"实际发生，不包含预计预算"],["我的垫付",me.paid,"我实际支付的费用"],["我的承担",me.owed,"我参与消费的分摊金额"],[me.net>0?"我的应收":me.net<0?"我的应付":"我的净额",Math.abs(me.net),me.net===0?"目前已平账":me.net>0?"垫付超过承担":"承担超过垫付"]].map(([label,value,note])=>'<div class="stat"><span class="muted">'+label+'</span><div class="value">¥'+money(value)+'</div><p class="fine">'+note+'</p></div>').join("")+'</section>'+
    '<section class="stack"><div class="row between"><h2>支出明细</h2><span class="fine">'+active.length+' 笔有效支出</span></div>'+
    (active.length?table(active):'<div class="empty">'+art("camera",80)+'<h3>还没有支出记录</h3><p class="muted">从第一顿聚餐或第一段交通开始</p>'+b("new-expense","记第一笔",attr+(canEdit?"":" disabled"),"primary")+'</div>')+
    (voided.length?'<details><summary class="fine">查看 '+voided.length+' 笔作废记录</summary><div class="spacer"></div>'+table(voided)+'</details>':"")+'</section>'+
    '<div class="grid2" style="margin-top:28px"><section class="stack"><h2>成员汇总</h2><div class="table-wrap"><table><thead><tr><th>成员</th><th class="right">垫付</th><th class="right">承担</th><th class="right">应收 / 应付</th></tr></thead><tbody>'+
    totals.balances.map(member=>'<tr><td>'+e(D.displayName(member.userId))+'</td><td class="right amount">¥'+money(member.paid)+'</td><td class="right amount">¥'+money(member.owed)+'</td><td class="right amount '+(member.net>0?"positive":member.net<0?"negative":"muted")+'">'+(member.net===0?"已平账":(member.net>0?"应收 ":"应付 ")+"¥"+money(Math.abs(member.net)))+'</td></tr>').join("")+'</tbody></table></div></section>'+
    '<section class="stack"><h2>结算建议</h2><div class="card">'+(totals.transfers.length?totals.transfers.map(transfer=>'<div class="transfer"><span>'+e(D.displayName(transfer.from))+' <span class="muted">转给</span> '+e(D.displayName(transfer.to))+'</span><strong class="amount">¥'+money(transfer.amount)+'</strong></div>').join(""):'<p class="muted">大家已平账，暂无转账建议</p>')+
    '<p class="fine" style="margin-top:16px">这里只提供结算建议，不执行支付<br>按净应收与净应付匹配，减少往返转账</p></div></section></div></main>';
}

