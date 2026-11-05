import * as D from "./domain.js";
import * as R from "./repository.js";
import * as V from "./views.js";
import {artUri,photoAsset} from "./art.js";
import {exampleInput,dateAfter,seedBundle} from "./fixtures.js";
const {e,br,b,field,area,select,tag,art,money,person,fmtDate,fmtTime}=V;
const root=document.getElementById("app"),modal=document.getElementById("modal"),modalBody=document.getElementById("modal-body");
let trips=[],generation=0,toastTimer,previousFocus,creation=null;
const urls=new Map(),mapStates=new Map(),summaryJobs=new Set(),pendingActions=new Set(),formJobs=new WeakSet();
let uploadDraft={tripId:null,nodeId:null,caption:"",files:[]};
const tripBy=id=>{const t=trips.find(x=>x.id===id);D.check(t,"旅行不存在");return t};
const mapState=id=>{if(!mapStates.has(id))mapStates.set(id,{day:"all",page:0,zoom:1});return mapStates.get(id)};
function navigate(path){if(location.hash==="#"+path)render();else location.hash=path}
function route(){
  try{const parts=location.hash.replace(/^#\/?/,"").split("/").map(decodeURIComponent);
    if(!parts[0])return {page:"home"};if(parts[0]==="trips")return {page:"trips"};
    if(parts[0]==="trip"&&parts[1])return{page:parts[2]||"plan",id:parts[1]};return{page:"unknown"};
  }catch{return{page:"unknown"}}
}
function notify(message){
  const el=document.getElementById("toast");clearTimeout(toastTimer);el.textContent=message;el.hidden=false;
  toastTimer=setTimeout(()=>el.hidden=true,4600);
}
function showError(error,scope=modalBody){
  let box=scope?.querySelector("[data-form-error]");
  if(!box&&scope){box=document.createElement("div");box.className="error";box.dataset.formError="";scope.prepend(box)}
  if(box){box.textContent=error.message||String(error);box.hidden=false;box.scrollIntoView({block:"nearest"})}
  else notify(error.message||String(error));
}
function openModal(title,html,kind=""){
  delete modal.dataset.lightbox;
  const alreadyOpen=modal.open;if(!alreadyOpen)previousFocus=document.activeElement;
  modal.className=kind;document.getElementById("modal-title").textContent=title;modalBody.innerHTML=html;
  if(!alreadyOpen)modal.showModal();
  const focus=modalBody.querySelector("[autofocus]")||modalBody.querySelector("input:not([type=checkbox]):not([type=radio]),textarea,select,button");
  requestAnimationFrame(()=>focus?.focus({preventScroll:true}));
}
function closeModal(){modal.close()}
modal.addEventListener("close",()=>{modal.className="";if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true})});
async function preload(t){
  const ids=[t.coverId,...t.photos.map(p=>p.id),...t.expenses.map(x=>x.receiptId)].filter(Boolean);
  await Promise.all(ids.filter(id=>!urls.has(id)).map(async id=>{const record=await R.getMedia(id);if(record?.blob)urls.set(id,URL.createObjectURL(record.blob))}));
}
async function refresh(){trips=(await R.allTrips()).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));await render()}
async function render(){
  const ticket=++generation,r=route();
  try{
    if(r.page==="home"){root.innerHTML=V.shell(V.homeView(),"home");return}
    if(r.page==="trips"){await Promise.all(trips.filter(t=>t.coverId).map(preload));if(ticket!==generation)return;root.innerHTML=V.shell(V.listView(trips,urls),"trips");return}
    if(r.id){
      const t=tripBy(r.id);await preload(t);if(ticket!==generation)return;
      const content=r.page==="map"&&t.snapshot?V.mapView(t,mapState(t.id),urls):r.page==="ledger"&&t.snapshot?V.ledgerView(t):V.proposalView(t);
      root.innerHTML=V.shell(content,r.page);
      if(t.snapshot&&["not-started","running"].includes(t.summary.status))ensureSummary(t.id);
      return;
    }
    root.innerHTML=V.shell('<main class="page"><div class="empty"><h1>这一页暂时找不到</h1><a class="button primary" href="#/trips">返回旅行列表</a></div></main>',"trips");
  }catch(error){root.innerHTML=V.shell('<main class="page"><div class="error">'+e(error.message)+'</div><a class="button" href="#/trips">返回旅行列表</a></main>',"trips")}
}
async function mutate(id,fn){const result=await R.transact(id,fn);await refresh();return result}
async function ensureSummary(id,force=false){
  if(summaryJobs.has(id))return;
  const t=tripBy(id);if(!force&&t.summary.status==="done")return;
  summaryJobs.add(id);
  try{
    await R.transact(id,trip=>{trip.summary={status:"running",inputVersion:trip.snapshot.id}});
    const current=await R.getTrip(id);const result=D.makeSummary(current.snapshot);
    await R.transact(id,trip=>{D.check(trip.snapshot.id===result.inputVersion,"快照版本发生变化，请重试");trip.summary=result});
  }catch(error){
    await R.transact(id,trip=>{trip.summary={status:"failed",inputVersion:trip.snapshot?.id,error:"整理失败，可重试；基础行程仍可使用"}}).catch(()=>{});
    notify("自动整理暂未完成，地图与基础行程仍可使用");
  }finally{summaryJobs.delete(id);await refresh()}
}
const fd=form=>new FormData(form);
const value=(data,key)=>String(data.get(key)??"").trim();
function preferenceData(form){
  const data=fd(form);return{interests:data.getAll("interests"),pace:value(data,"pace"),diets:data.getAll("diets"),needs:value(data,"needs"),suggestion:value(data,"suggestion"),scope:value(data,"scope")};
}
async function persistPreference(id){
  const form=document.getElementById("preference-form");
  if(form&&form.dataset.trip===id)return R.transact(id,t=>D.savePreference(t,D.USER_ID,preferenceData(form)));
}
async function openConfirm(id){
  await persistPreference(id);
  const t=await R.getTrip(id),p=t.proposals.find(x=>x.id===t.selections[D.USER_ID]);
  D.check(p,"请先选择一份方案");
  openModal("确认参加这场旅行",'<div class="stack"><div class="notice"><strong>'+e(p.title)+'</strong><p>'+fmtDate(p.startDate)+' — '+fmtDate(p.endDate)+' · '+e(p.cities.join(" → "))+'</p><p>预计每人 ¥'+money(p.budgetMin)+'–'+money(p.budgetMax)+'</p><p>'+e(p.core)+'</p></div>'+
    '<p>确认后不能改选，你的选择将计入正式票数</p><p class="fine">组织者将按最高票方案成团，锁定前仍可补充个人偏好</p>'+
    '<form id="confirmation-form" data-trip="'+e(id)+'" data-proposal="'+e(p.id)+'"><label class="check"><input type="checkbox" name="acceptsWinner" required><span>我接受按最高票候选方案成团，并理解确认后不能修改所选方案</span></label>'+
    '<p class="fine" style="margin-top:12px">确认参加不代表付款、合同或强制出行义务</p><div class="error" data-form-error hidden></div><div class="dialog-actions">'+b("close","再想一下")+'<button type="submit" class="primary">确认参加</button></div></form></div>',"narrow");
}
async function openLock(id){
  const t=await R.getTrip(id);D.organizer(t,D.USER_ID);D.check(D.members(t).length>=t.min,"确认人数不足，暂时不能锁定");
  const top=D.leaders(t);D.check(top.length,"还没有正式确认的票数");
  openModal("结束报名并锁定方案",'<div class="stack"><div class="notice warn">锁定后停止新报名，基础方案不可再编辑；进度、照片和账单仍可持续记录</div>'+
    '<form id="lock-form" data-trip="'+e(id)+'">'+select("最终方案（仅可选最高票）","winnerId",top.map(p=>({value:p.id,label:p.title+" · "+p.count+"票"})),top[0].id)+
    (top.length>1?area("平票选择原因","tieReason","",'required maxlength="200" placeholder="简要说明为什么选择这一方案"'):"")+
    '<div id="lock-proposal-details">'+lockDetails(t,top[0].id)+'</div><h3 style="margin-top:18px">确认同行的成员</h3><p style="margin-top:10px">'+D.members(t).map(D.displayName).map(e).join("、")+'</p>'+
    '<p class="fine" style="margin-top:8px">共 '+D.members(t).length+' 人，包含组织者；正式投票 '+t.participations.length+' 票</p>'+
    '<div class="error" data-form-error hidden></div><div class="dialog-actions">'+b("close","返回检查")+'<button type="submit" class="primary">结束报名并锁定</button></div></form></div>',"narrow");
}
function lockDetails(t,id){
  const p=t.proposals.find(x=>x.id===id);return '<dl class="detail-list"><dt>旅行日期</dt><dd>'+e(p.startDate)+' — '+e(p.endDate)+'</dd><dt>目的地</dt><dd>'+e(p.cities.join(" → "))+'</dd><dt>核心项目</dt><dd>'+e(p.core)+'</dd><dt>预计个人费用</dt><dd>¥'+money(p.budgetMin)+'–'+money(p.budgetMax)+'</dd><dt>费用范围</dt><dd>'+e(p.feeScope)+'</dd></dl>';
}
function openSummary(id){
  const t=tripBy(id),s=t.summary;D.check(s.status==="done","汇总尚未完成");
  openModal("同行建议汇总",'<div class="notice">'+tag("模板整理","green")+'<p style="margin-top:8px">'+s.filled+' / '+s.total+' 位成员填写了偏好或建议</p></div><div class="spacer"></div>'+
    '<section class="summary-section"><h3>大家的旅行兴趣</h3>'+Object.entries(s.interestCounts).map(([label,count])=>'<div class="summary-count"><span>'+e(label)+'</span><strong>'+count+' 人</strong></div>').join("")+'</section>'+
    '<section class="summary-section"><h3>节奏偏好</h3>'+Object.entries(s.paceCounts).map(([label,count])=>'<div class="summary-count"><span>'+e(label)+'</span><strong>'+count+' 人</strong></div>').join("")+'</section>'+
    '<section class="summary-section"><h3>需要关注的需求</h3>'+(s.needs.length?s.needs.map(n=>'<p><strong>'+e(D.displayName(n.userId))+'</strong> · '+br(n.text)+'</p>').join(""):'<p class="fine">暂无已填写需求，不代表所有人都没有要求</p>')+'</section>'+
    '<section class="summary-section"><h3>建议处理清单</h3>'+(s.suggestions.length?s.suggestions.map(n=>'<div style="margin:12px 0">'+tag(n.category,n.category==="与锁定范围冲突"?"warm":"gray")+'<p style="margin-top:5px">'+e(D.displayName(n.userId))+' · '+br(n.text)+'</p></div>').join(""):'<p class="fine">暂无适用于最终方案的建议</p>')+'</section>'+
    '<section class="summary-section"><h3>每日执行参考</h3>'+s.days.map(d=>'<div class="day-outline"><h3>第'+d.day+'天 · '+fmtDate(d.date)+'</h3>'+d.items.map(item=>'<p>'+e(t.nodes.find(n=>n.activityId===item.activityId)?.name||"")+'：'+e(item.text)+'</p>').join("")+'</div>').join("")+'</section>'+
    '<section class="summary-section"><h3>出发前待核实</h3>'+s.verify.map(x=>'<p>— '+e(x)+'</p>').join("")+'</section><p class="fine">'+e(s.note)+'</p>',"drawer");
}
function confirmAction(title,copy,action,id,label="确认"){
  openModal(title,'<p>'+br(copy)+'</p><div class="error" data-form-error hidden></div><div class="dialog-actions">'+b("close","取消")+b(action,label,'data-trip="'+e(id)+'"',"primary")+'</div>',"narrow");
}

function blankProposal(i=0){
  return {title:"方案"+(i+1),startDate:dateAfter(30),endDate:dateAfter(31),cities:[],budgetMin:"",budgetMax:"",
    core:"",feeScope:"",transport:"train",stay:"",notes:"",days:[0,1].map(j=>({date:dateAfter(30+j),items:[{name:"",type:"activity",transport:"walk",description:"",city:""}]}))};
}
function openCreate(id=null){
  const existing=id?tripBy(id):null;if(existing)D.editable(existing,D.USER_ID);
  creation={id,step:0,coverFile:null,data:existing?D.clone(existing):{
    title:"",description:"",departure:"",deadline:new Date(Date.now()+14*86400000).toISOString(),min:2,max:6,theme:"beach",proposals:[blankProposal()]
  }};
  renderCreate();
}
function localTimeValue(iso){const date=new Date(iso);date.setMinutes(date.getMinutes()-date.getTimezoneOffset());return date.toISOString().slice(0,16)}
function renderCreate(){
  const d=creation.data,prefix=i=>"p-"+i+"-",price=n=>typeof n==="number"?String(n/100):n;
  const basic='<section '+(creation.step===0?"":"hidden")+'><div class="row between" style="margin-bottom:18px"><h3>先给这场旅行起个名字</h3>'+(!creation.id?b("fill-form","填入海边示例","","small"):"")+'</div>'+
    field("旅行名称","title",d.title,"text",'required minlength="2" maxlength="30" placeholder="例如：毕业去海边"')+
    area("旅行简介","description",d.description,'required maxlength="300" placeholder="想和同学一起留下怎样的回忆"')+
    '<div class="grid2">'+field("出发城市","departure",d.departure,"text",'required maxlength="30"')+field("报名截止时间","deadline",localTimeValue(d.deadline),"datetime-local","required")+'</div>'+
    '<div class="grid3">'+field("最少同行人数（含我）","min",d.min,"number",'required min="2" step="1"')+field("人数上限（含我）","max",d.max,"number",'required min="2" step="1"')+
    select("旅行主题","theme",[{value:"beach",label:"海滨手账"},{value:"mountain",label:"山野手账"}],d.theme)+'</div>'+
    '<label class="field">旅行封面（可选）<input type="file" name="cover" accept="image/jpeg,image/png,image/webp"></label><p class="fine">'+
    (creation.coverFile?'已选：'+e(creation.coverFile.name):d.coverId?"保留当前封面，选择新图片可替换":"不上传则使用对应主题的风景封面")+'</p></section>';
  const proposals='<section '+(creation.step===1?"":"hidden")+'><div class="row between" style="margin-bottom:18px"><h3>候选方案 · '+d.proposals.length+' / 3</h3>'+b("add-proposal","＋ 添加方案",d.proposals.length>=3?"disabled":"","small")+'</div>'+
    d.proposals.map((p,i)=>{
      const pre=prefix(i);
      return '<div class="proposal-form"><div class="row between"><h3>方案 '+(i+1)+'</h3>'+b("remove-proposal","移除方案",'data-index="'+i+'" '+(d.proposals.length<=1?"disabled":""),"ghost small")+'</div><div class="spacer"></div>'+
        '<div class="grid2">'+field("方案名称",pre+"title",p.title,"text",'required maxlength="40"')+field("目的地城市（按顺序，用逗号分隔）",pre+"cities",Array.isArray(p.cities)?p.cities.join("，"):p.cities,"text",'required placeholder="厦门，泉州"')+'</div>'+
        '<div class="grid2">'+field("出发日期",pre+"startDate",p.startDate,"date",'required data-proposal-date="'+i+'"')+field("结束日期",pre+"endDate",p.endDate,"date",'required data-proposal-date="'+i+'"')+'</div>'+
        '<div class="grid2">'+field("每人预计费用下限（元）",pre+"budgetMin",price(p.budgetMin),"number",'required min="0" step="0.01"')+field("每人预计费用上限（元）",pre+"budgetMax",price(p.budgetMax),"number",'required min="0" step="0.01"')+'</div>'+
        area("核心项目",pre+"core",p.core,'required maxlength="400" placeholder="每位同学确认前需要了解的重要活动"')+
        area("费用包含范围",pre+"feeScope",p.feeScope,'required maxlength="400" placeholder="例如：往返交通、住宿、基础餐饮，不含个人购物"')+
        '<div class="grid2">'+select("主要交通方式",pre+"transport",Object.entries(D.TRANSPORT).map(([value,label])=>({value,label})),p.transport||"unknown")+field("住宿设想（可选）",pre+"stay",p.stay||"","text",'maxlength="200"')+'</div>'+
        p.days.map((day,j)=>'<section class="day-form"><div class="row between"><h3>第'+(j+1)+'天 · '+e(day.date)+'</h3>'+b("add-activity","＋ 添加活动",'data-index="'+i+'" data-day="'+j+'" '+(day.items.length>=12?"disabled":""),"small")+'</div>'+
          day.items.map((item,k)=>{const key=pre+"d-"+j+"-a-"+k+"-";return '<div class="activity-form">'+
            field("活动名称",key+"name",item.name,"text",'required maxlength="40" placeholder="例如：海边合影"')+
            select("活动类型",key+"type",[{value:"meeting",label:"集合"},{value:"city",label:"城市"},{value:"attraction",label:"景点"},{value:"activity",label:"活动"},{value:"food",label:"餐饮"},{value:"hotel",label:"住宿"},{value:"return",label:"返程"}],item.type)+
            select("到本站交通",key+"transport",Object.entries(D.TRANSPORT).map(([value,label])=>({value,label})),item.transport||"unknown")+
            b("remove-activity","×",'aria-label="移除此活动" data-index="'+i+'" data-day="'+j+'" data-item="'+k+'" '+(day.items.length<=1?"disabled":""),"icon-button")+
            '<div class="description">'+field("活动说明（可选）",key+"description",item.description||"","text",'maxlength="400" placeholder="集合提示、活动安排或注意事项"')+'</div>'+
            '</div>'}).join("")+'</section>').join("")+
        area("其他说明（可选）",pre+"notes",p.notes||"",'maxlength="500"')+'</div>';
    }).join("")+'</section>';
  openModal(creation.id?"编辑旅行":"发起一场毕业旅行",'<div class="form-steps"><span class="'+(creation.step===0?"active":"")+'">1 基本信息</span><span class="'+(creation.step===1?"active":"")+'">2 候选方案</span></div>'+
    '<form id="trip-form" novalidate>'+basic+proposals+'<div class="error" data-form-error hidden></div><div class="dialog-actions">'+
    (creation.step===0?b("close","取消")+b("next-create","下一步：候选方案","","primary"):
      b("back-create","上一步")+(!creation.id?b("save-draft","保存为草稿"):"")+'<button type="submit" class="primary">'+(creation.id?"保存修改":"发起旅行")+'</button>')+'</div></form>',"wide");
}
function collectCreation(){
  const form=document.getElementById("trip-form");if(!form)return;
  const f=fd(form),d=creation.data;
  for(const k of["title","description","departure","theme"])d[k]=value(f,k);
  d.min=Number(value(f,"min"));d.max=Number(value(f,"max"));d.deadline=value(f,"deadline")||d.deadline;
  const file=form.querySelector('[name="cover"]').files?.[0];if(file)creation.coverFile=file;
  d.proposals.forEach((p,i)=>{
    const pre="p-"+i+"-";
    for(const k of["title","startDate","endDate","budgetMin","budgetMax","core","feeScope","transport","stay","notes"])p[k]=value(f,pre+k);
    p.cities=value(f,pre+"cities").split(/[，,、]/).map(D.text).filter(Boolean);
    p.days.forEach((day,j)=>day.items.forEach((item,k)=>{
      const key=pre+"d-"+j+"-a-"+k+"-";
      for(const fieldName of["name","type","transport","description"])item[fieldName]=value(f,key+fieldName);
      item.city=p.cities[Math.min(j,p.cities.length-1)]||"";
    }));
  });
}
async function submitCreation(asDraft=false){
  collectCreation();const d=creation.data,editingId=creation.id;
  if(!asDraft&&(!editingId||d.status==="recruiting"))D.check(Date.parse(d.deadline)>Date.now(),"报名截止时间需要晚于现在");
  const blob=creation.coverFile?await R.compressImage(creation.coverFile,1600):null;
  if(editingId){
    await R.transact(editingId,(t,media)=>{
      D.editTrip(t,d,D.USER_ID);
      if(blob){const id=D.uid("cover");if(t.coverId)media.delete(t.coverId);t.coverId=id;media.add({id,tripId:t.id,namespace:t.namespace,kind:"cover",ownerId:D.USER_ID,blob})}
    });
  }else{
    const trip=D.createTrip({...d,status:asDraft?"draft":"recruiting"});
    const cover=blob?{id:D.uid("cover"),tripId:trip.id,namespace:trip.namespace,kind:"cover",ownerId:D.USER_ID,blob}:null;
    if(cover)trip.coverId=cover.id;
    await R.insertTrip(trip,cover);creation.id=trip.id;
  }
  const id=creation.id;closeModal();await refresh();navigate("/trip/"+id+"/plan");notify(editingId?"旅行内容已保存":asDraft?"旅行草稿已保存":"旅行已发起");creation=null;
}
function openNode(id,nodeId){
  const t=tripBy(id),n=t.nodes.find(x=>x.id===nodeId);D.check(n,"节点不存在");
  const own=t.organizerId===D.USER_ID,canEdit=own&&t.status==="travelling",current=t.nodes.find(x=>x.status==="current"&&x.id!==nodeId);
  const reference=t.summary.status==="done"?t.summary.days.flatMap(d=>d.items).find(x=>x.activityId===n.activityId)?.text:null;
  const attr='data-trip="'+e(id)+'" data-node="'+e(nodeId)+'"';
  openModal(n.name,'<div class="row">'+tag("第"+n.day+"天")+tag(D.NODE_STATUS[n.status],"green")+'</div>'+
    '<dl class="detail-list"><dt>城市</dt><dd>'+e(n.city)+'</dd><dt>日期</dt><dd>'+e(n.date)+'</dd><dt>到本站交通</dt><dd>'+e(D.TRANSPORT[n.transport])+'</dd><dt>基础安排</dt><dd>'+br(n.baseContent)+'</dd></dl>'+
    (reference?'<div class="notice"><strong>执行参考 · 模板整理</strong><p>'+e(reference)+'</p></div>':"")+
    '<div class="row wrap" style="margin:20px 0">'+b("album","本站相册（"+t.photos.filter(p=>p.nodeId===nodeId).length+"）",attr)+
    (D.isMember(t,D.USER_ID)?b("upload","上传本站照片",attr)+b("new-expense","记一笔",attr):"")+'</div>'+
    (canEdit?'<form id="progress-form" data-trip="'+e(id)+'" data-node="'+e(nodeId)+'"><h3>更新团队进度</h3><div class="spacer"></div>'+
    select("本站状态","status",Object.entries(D.NODE_STATUS).map(([value,label])=>({value,label})),n.status)+
    (current?select("若将本站设为进行中，原节点「"+e(current.name)+"」如何处理","previousStatus",[{value:"",label:"请选择原节点的状态"},{value:"done",label:"标记为已完成"},{value:"planned",label:"恢复未开始（纠正误选）"},{value:"skipped",label:"标记为跳过"}],""):"")+
    area("操作原因（跳过时必填）","reason","",'maxlength="300" placeholder="例如：天气变化，暂时跳过这一站"')+
    '<div class="error" data-form-error hidden></div><button type="submit" class="primary">保存团队进度</button></form>':own&&t.status==="locked"?'<div class="notice">点击地图页的“开始旅行”后，可维护团队进度</div>':"")+
    '<hr class="divider"><h3>本站记录</h3>'+t.moments.filter(m=>m.nodeId===nodeId).slice(-8).reverse().map(m=>'<div class="moment"><div><p class="fine">'+e(D.displayName(m.actorId))+' · '+fmtTime(m.at)+'</p><p>'+br(m.text)+'</p></div></div>').join("")+
    (D.isMember(t,D.USER_ID)?b("write-note","添加本站记录",attr,"small"):"")+
    '<details style="margin-top:20px"><summary class="fine">进度变更历史</summary>'+t.progressEvents.filter(p=>p.nodeId===nodeId).map(p=>'<p class="fine">'+fmtTime(p.at)+' · '+e(D.NODE_STATUS[p.from])+' → '+e(D.NODE_STATUS[p.to])+(p.reason?' · '+e(p.reason):"")+'</p>').join("")+'</details>',"drawer");
}
function openNote(id,nodeId=null,announcement=false){
  const t=tripBy(id);D.canContribute(t,D.USER_ID);
  openModal(announcement?"发布集合提醒":"写一条旅途记录",'<form id="note-form" data-trip="'+e(id)+'" data-kind="'+(announcement?"announcement":"note")+'">'+
    select("关联节点","nodeId",[{value:"",label:"整场旅行"},...t.nodes.map(n=>({value:n.id,label:"第"+n.day+"天 · "+n.name}))],nodeId||"")+
    area(announcement?"提醒内容":"记录内容","content","",'required maxlength="1000" placeholder="'+(announcement?"例如：明早8点在酒店大堂集合":"写下这一站值得记住的小事")+'"')+
    '<div class="error" data-form-error hidden></div><div class="dialog-actions">'+b("close","取消")+'<button type="submit" class="primary">保存记录</button></div></form>',"narrow");
}
function openUpload(id,nodeId=null){
  const t=tripBy(id);D.canContribute(t,D.USER_ID);
  if(uploadDraft.tripId!==id){uploadDraft.files.forEach(f=>URL.revokeObjectURL(f.preview));uploadDraft={tripId:id,nodeId:null,caption:"",files:[]}}
  if(nodeId)uploadDraft.nodeId=nodeId;
  if(!uploadDraft.nodeId)uploadDraft.nodeId=t.nodes.find(n=>n.status==="current")?.id||"";
  renderUpload();
}
function captureUpload(){
  const form=document.getElementById("upload-form");if(!form)return;
  const f=fd(form);uploadDraft.nodeId=value(f,"nodeId");uploadDraft.caption=value(f,"caption");
}
function renderUpload(){
  const t=tripBy(uploadDraft.tripId);
  openModal("上传旅行照片",'<form id="upload-form" data-trip="'+e(t.id)+'">'+
    select("照片属于哪一站","nodeId",[{value:"",label:"请选择所属节点"},...t.nodes.map(n=>({value:n.id,label:"第"+n.day+"天 · "+n.name}))],uploadDraft.nodeId,'required')+
    '<label class="field">选择照片（每次最多9张，单张不超过10MB）<input name="files" id="photo-files" type="file" multiple accept="image/jpeg,image/png,image/webp"></label>'+
    '<p class="fine">支持 JPEG、PNG、WebP；保存前自动压缩，照片仅保存在当前浏览器</p><div class="spacer"></div>'+
    '<div class="upload-grid">'+uploadDraft.files.map((f,i)=>'<div class="photo-draft"><img src="'+f.preview+'" alt="'+e(f.name)+'">'+b("remove-upload","×",'aria-label="移除'+e(f.name)+'" data-index="'+i+'"',"icon-button")+'<p>'+e(f.name)+'</p></div>').join("")+'</div><div class="spacer"></div>'+
    area("照片说明（可选）","caption",uploadDraft.caption,'maxlength="500" placeholder="把这一刻的心情也留下来"')+
    '<div class="error" data-form-error hidden></div><div class="dialog-actions">'+b("close","稍后再传")+'<button type="submit" class="primary" '+(!uploadDraft.files.length?"disabled":"")+'>保存 '+uploadDraft.files.length+' 张照片</button></div></form>');
}
async function prepareUpload(files){
  captureUpload();D.check(uploadDraft.files.length+files.length<=9,"一次最多上传9张照片");
  const prepared=[];
  try{
    for(const file of files){
      const blob=await R.compressImage(file);
      prepared.push({id:D.uid("photo"),blob,name:file.name,preview:URL.createObjectURL(blob)});
    }
    uploadDraft.files.push(...prepared);
  }catch(error){prepared.forEach(file=>URL.revokeObjectURL(file.preview));throw error}
  renderUpload();
}
function nodePhotos(t,nodeId){return t.photos.filter(p=>p.nodeId===nodeId).sort((a,b)=>b.at.localeCompare(a.at))}
function openAlbum(id,nodeId){
  const t=tripBy(id),node=t.nodes.find(n=>n.id===nodeId);D.check(node,"节点不存在");const photos=nodePhotos(t,nodeId);
  const attr='data-trip="'+e(id)+'" data-node="'+e(nodeId)+'"';
  openModal(node.name+" · 相册",'<div class="row between" style="margin-bottom:20px"><span class="fine">共 '+photos.length+' 张照片</span>'+(D.isMember(t,D.USER_ID)?b("upload","上传本站照片",attr):"")+'</div>'+
    (photos.length?'<div class="album-grid">'+photos.map((p,i)=>'<article class="album-item">'+b("lightbox",'<img src="'+e(urls.get(p.id)||"")+'" alt="'+e(p.caption||node.name+'的照片')+'">',attr+' data-index="'+i+'"',"photo-open")+
      '<p>'+e(p.caption||"这一刻，值得留住")+'</p><p class="fine">'+e(D.displayName(p.ownerId))+' · '+fmtTime(p.at)+'</p>'+
      (p.ownerId===D.USER_ID?b("delete-photo","删除",attr+' data-photo="'+e(p.id)+'"',"ghost small"):"")+'</article>').join("")+'</div>':
      '<div class="empty">'+art("camera",100)+'<h3>这一站，还没有照片</h3><p class="muted">上传第一张属于我们的回忆</p></div>'));
}
function openLightbox(id,nodeId,index=0){
  const t=tripBy(id),photos=nodePhotos(t,nodeId);if(!photos.length){openAlbum(id,nodeId);return}
  index=Math.max(0,Math.min(index,photos.length-1));const p=photos[index];
  const attr='data-trip="'+e(id)+'" data-node="'+e(nodeId)+'"';
  openModal("旅行照片 "+(index+1)+" / "+photos.length,'<img class="large-photo" src="'+e(urls.get(p.id)||"")+'" alt="'+e(p.caption||"旅行照片")+'">'+
    '<div class="lightbox-controls">'+b("lightbox","上一张",attr+' data-index="'+(index-1)+'" '+(index===0?"disabled":""))+
    '<div class="grow"><p>'+br(p.caption||"这一刻，值得留住")+'</p><p class="fine">'+e(D.displayName(p.ownerId))+' · '+fmtTime(p.at)+'</p></div>'+
    b("lightbox","下一张",attr+' data-index="'+(index+1)+'" '+(index===photos.length-1?"disabled":""))+'</div><div class="dialog-actions">'+
    (p.ownerId===D.USER_ID?b("delete-photo","删除这张照片",attr+' data-photo="'+e(p.id)+'"',"danger"):"")+b("album","返回本站相册",attr)+'</div>',"wide");
  modal.dataset.photoTrip=id;modal.dataset.photoNode=nodeId;modal.dataset.photoIndex=index;modal.dataset.lightbox="true";
}

function openExpense(id,nodeId=null,expenseId=null){
  const t=tripBy(id);D.canContribute(t,D.USER_ID);
  const existing=expenseId?t.expenses.find(x=>x.id===expenseId):null;
  if(expenseId){D.check(existing,"账单不存在");D.check(existing.creatorId===D.USER_ID,"只能修改自己创建的账单")}
  const node=t.nodes.find(n=>n.id===(existing?.nodeId||nodeId));
  const roster=t.snapshot.members;
  openModal(existing?"修改支出":"记一笔支出",'<form id="expense-form" data-trip="'+e(id)+'" data-expense="'+e(expenseId||"")+'" novalidate>'+
    '<div class="expense-panel"><div>'+field("支出名称","title",existing?.title||"","text",'required maxlength="60" placeholder="例如：毕业聚餐"')+
    '<div class="grid2">'+field("总金额（元）","amount",existing?String(existing.amount/100):"","number",'required min="0.01" step="0.01"')+
    field("支出日期","date",existing?.date||node?.date||new Date().toISOString().slice(0,10),"date","required")+'</div>'+
    '<div class="grid2">'+select("付款人（实际垫付）","payerId",roster.map(userId=>({value:userId,label:D.displayName(userId)})),existing?.payerId||D.USER_ID)+
    select("分账方式","mode",[{value:"",label:"请选择分账方式"},{value:"even",label:"参与人均分"},{value:"custom",label:"自定义每人金额"}],existing?.mode||"")+'</div>'+
    select("关联节点（可选）","nodeId",[{value:"",label:"全程支出，不关联节点"},...t.nodes.map(n=>({value:n.id,label:"第"+n.day+"天 · "+n.name}))],node?.id||"")+
    select("分类","category",["餐饮","交通","住宿","门票","活动","其他"].map(x=>({value:x,label:x})),existing?.category||"其他")+
    area("备注（可选）","note",existing?.note||"",'maxlength="500"')+
    '<label class="field">凭证图片（可选）<input name="receipt" type="file" accept="image/jpeg,image/png,image/webp"></label>'+
    (existing?.receiptId?'<p class="fine">已有凭证，选择新图片可替换；历史版本会保留</p>':"")+
    '</div><div class="card"><h3>哪些同学参与了这笔消费</h3><p class="fine" style="margin:8px 0">付款人可以不参与消费；请明确勾选分摊人</p>'+
    roster.map(userId=>{
      const share=existing?.shares.find(s=>s.userId===userId);
      return '<div class="member-split"><label class="check"><input type="checkbox" name="memberIds" value="'+e(userId)+'" '+(share?"checked":"")+'>'+e(D.displayName(userId))+'</label>'+
        '<input type="number" name="custom-'+e(userId)+'" aria-label="'+e(D.displayName(userId))+'的自定义承担金额" value="'+(share?share.amount/100:"")+'" min="0" step="0.01" placeholder="金额" '+(existing?.mode==="custom"&&share?"":"disabled")+'></div>';
    }).join("")+'<div id="split-preview" class="split-preview"><p class="fine">选择分摊人和方式后，查看每人承担金额</p></div></div></div>'+
    '<div class="error" data-form-error hidden></div><div class="dialog-actions">'+b("close","取消")+'<button type="submit" class="primary">'+(existing?"保存修改":"保存支出")+'</button></div></form>',"wide");
  updateSplitPreview();
}
function expensePayload(form){
  const f=fd(form),roster=tripBy(form.dataset.trip).snapshot.members;
  return {title:value(f,"title"),amount:value(f,"amount"),date:value(f,"date"),payerId:value(f,"payerId"),
    mode:value(f,"mode"),memberIds:f.getAll("memberIds"),nodeId:value(f,"nodeId"),category:value(f,"category"),
    note:value(f,"note"),custom:Object.fromEntries(roster.map(id=>[id,value(f,"custom-"+id)]))};
}
function updateSplitPreview(){
  const form=document.getElementById("expense-form");if(!form)return;
  const f=fd(form),members=f.getAll("memberIds"),mode=value(f,"mode");
  for(const input of form.querySelectorAll('input[name^="custom-"]'))input.disabled=mode!=="custom"||!members.includes(input.name.slice(7));
  const box=document.getElementById("split-preview");
  if(!members.length||!mode){box.innerHTML='<p class="fine">请选择消费参与人及分账方式</p>';return}
  try{
    const {amount,shares}=D.expenseShares(tripBy(form.dataset.trip),expensePayload(form));
    box.innerHTML=shares.map(s=>'<div class="row between"><span>'+e(D.displayName(s.userId))+'</span><strong class="amount">¥'+money(s.amount)+'</strong></div>').join("")+'<hr class="divider"><div class="row between"><strong>合计</strong><strong>¥'+money(amount)+'</strong></div>';
  }catch(error){box.innerHTML='<p class="fine" style="color:var(--warn)">'+e(error.message)+'</p>'}
}
function openExpenseDetail(id,expenseId){
  const t=tripBy(id),entry=t.expenses.find(x=>x.id===expenseId);D.check(entry,"账单不存在");
  openModal(entry.title,'<div class="row">'+tag(entry.status==="void"?"已作废":"有效支出",entry.status==="void"?"gray":"green")+tag(entry.category)+'</div>'+
    '<dl class="detail-list"><dt>金额</dt><dd>¥'+money(entry.amount)+'</dd><dt>日期</dt><dd>'+e(entry.date)+'</dd><dt>付款人</dt><dd>'+e(D.displayName(entry.payerId))+'</dd><dt>记录人</dt><dd>'+e(D.displayName(entry.creatorId))+'</dd><dt>关联节点</dt><dd>'+e(t.nodes.find(n=>n.id===entry.nodeId)?.name||"全程支出")+'</dd><dt>备注</dt><dd>'+br(entry.note||"暂无")+'</dd></dl>'+
    '<h3>本次分摊</h3>'+entry.shares.map(s=>'<div class="summary-count"><span>'+e(D.displayName(s.userId))+'</span><strong>¥'+money(s.amount)+'</strong></div>').join("")+
    (entry.receiptId&&urls.has(entry.receiptId)?'<div class="spacer"></div><h3>凭证</h3><img src="'+urls.get(entry.receiptId)+'" alt="账单凭证" style="max-width:100%;max-height:300px;object-fit:contain">':"")+
    '<details style="margin-top:20px"><summary class="fine">变更记录（'+entry.history.length+'）</summary>'+entry.history.map(h=>'<p class="fine">'+fmtTime(h.changedAt)+' · 原金额 ¥'+money(h.amount)+' · '+e(h.title)+'</p>').join("")+'</details>'+
    (entry.creatorId===D.USER_ID&&entry.status==="active"?'<div class="dialog-actions">'+b("void-expense","作废这笔账单",'data-trip="'+e(id)+'" data-expense="'+e(expenseId)+'"',"danger")+b("edit-expense","修改账单",'data-trip="'+e(id)+'" data-expense="'+e(expenseId)+'"')+'</div>':""),"narrow");
}
function showHelp(){
  openModal("使用毕业同游",'<div class="stack"><h3>一位用户，两种旅行关系</h3><p>你发起旅行时是组织者，参与其他同学的旅行时是参与者；不需要切换身份</p>'+
    '<h3>从方案到回忆</h3><p>选择方案、填写偏好并确认参加；组织者锁定最高票方案后，即可进入地图、上传照片和记录费用</p>'+
    '<h3>关于示例同学</h3><p>示例旅行用于体验流程；你发起旅行后可以点击“填充示例报名”，明确模拟其他同学的选择</p>'+
    '<h3>数据保存在这里</h3><p>旅行和照片仅保存在当前浏览器，不会跨设备同步；清理浏览器数据可能导致丢失，可在“本地数据”中导出备份</p>'+
    '<h3>参考内容与图片</h3><p>建议由规则模板整理，景点开放、交通和价格需核实；地图不是实时定位或导航；预算与账本不执行付款</p>'+
    '<p class="fine">本版本只面向PC；地图采用实拍地点照片与独立Q版贴纸，标注参考的照片不代表具体餐厅、酒店或活动现场；摄影来源与许可可在页脚查看</p>'+
    '<p class="fine">示例报名使用六位固定同学；若自行创建旅行，请将最少成团人数设置在六人以内，或后续接入真实多人能力</p></div>',"narrow");
}
function dataSettings(){
  const users=trips.filter(t=>t.namespace==="user").length,demos=trips.filter(t=>t.namespace==="demo").length;
  openModal("本地数据",'<div class="stack"><p>当前有 '+users+' 场自己创建的旅行、'+demos+' 场示例旅行</p><p class="fine">不同浏览器的数据互不同步，清理前建议先导出备份</p>'+
    b("export-data","导出全部数据与照片备份")+
    '<hr class="divider"><h3>重置范围</h3>'+b("ask-reset-demo","恢复示例旅行")+'<p class="fine">只恢复示例旅行，不影响自己创建的旅行</p>'+
    b("ask-reset-user","清空自己创建的旅行","","danger")+'<p class="fine">不会清空示例旅行；该操作会删除对应照片与账单</p></div>',"narrow");
}
async function downloadBackup(){
  const data=await R.exportData();downloadBlob(new Blob([JSON.stringify(data)],{type:"application/json"}),"毕业同游-备份-"+new Date().toISOString().slice(0,10)+".json");notify("备份文件已准备下载");
}
function downloadBlob(blob,filename){
  const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
async function handleAction(action,el){
  const id=el.dataset.trip,nodeId=el.dataset.node,proposalId=el.dataset.proposal;
  switch(action){
    case "close":closeModal();return;
    case "go-trips":navigate("/trips");return;
    case "create-trip":openCreate();return;
    case "edit-trip":openCreate(id);return;
    case "fill-form":creation.data=exampleInput("beach");creation.coverFile=null;renderCreate();return;
    case "next-create":{
      collectCreation();const d=creation.data;
      D.check(d.title.length>=2&&d.title.length<=30,"旅行名称需为2—30个字");D.check(d.description&&d.departure,"请填写简介和出发城市");
      D.check(d.min>=2&&Number.isInteger(d.min)&&d.max>=d.min&&Number.isInteger(d.max),"请检查最少人数和人数上限");
      creation.step=1;renderCreate();return;
    }
    case "back-create":collectCreation();creation.step=0;renderCreate();return;
    case "add-proposal":collectCreation();D.check(creation.data.proposals.length<3,"最多3份候选方案");creation.data.proposals.push(blankProposal(creation.data.proposals.length));renderCreate();return;
    case "remove-proposal":collectCreation();D.check(creation.data.proposals.length>1,"至少保留一份方案");creation.data.proposals.splice(Number(el.dataset.index),1);renderCreate();return;
    case "add-activity":collectCreation();creation.data.proposals[Number(el.dataset.index)].days[Number(el.dataset.day)].items.push({name:"",type:"activity",transport:"walk",description:""});renderCreate();return;
    case "remove-activity":{collectCreation();const items=creation.data.proposals[Number(el.dataset.index)].days[Number(el.dataset.day)].items;D.check(items.length>1,"每天至少保留一个活动");items.splice(Number(el.dataset.item),1);renderCreate();return}
    case "save-draft":await submitCreation(true);return;
    case "publish-trip":await mutate(id,t=>D.setTripStatus(t,D.USER_ID,"recruiting"));notify("已开始招募同学");return;
    case "select-proposal":await persistPreference(id);await mutate(id,t=>D.selectProposal(t,D.USER_ID,proposalId));notify("已保存草稿选择，确认后才计入票数");return;
    case "confirm":await openConfirm(id);return;
    case "simulate":await mutate(id,t=>D.simulateRegistrations(t,D.USER_ID));notify("示例同学报名已填充");return;
    case "lock":await openLock(id);return;
    case "start-trip":confirmAction("准备出发了吗","开始旅行后，组织者可以维护全团进度","confirm-start",id,"开始旅行");return;
    case "confirm-start":await mutate(id,t=>D.setTripStatus(t,D.USER_ID,"travelling"));closeModal();notify("旅行开始，去记录第一站吧");return;
    case "end-trip":confirmAction("结束这场旅行","结束后仍可补充照片、核对和纠正账单；不会自动把未完成的节点标为完成","confirm-end",id,"结束旅行");return;
    case "confirm-end":await mutate(id,t=>D.setTripStatus(t,D.USER_ID,"ended"));closeModal();notify("旅行已结束，回忆会保留在这里");return;
    case "cancel-trip":confirmAction("取消这场旅行","取消后停止报名与新记录，历史内容会保留","confirm-cancel",id,"确认取消");return;
    case "confirm-cancel":await mutate(id,t=>D.setTripStatus(t,D.USER_ID,"cancelled"));closeModal();notify("旅行已取消，历史记录仍保留");return;
    case "summary":openSummary(id);return;
    case "retry-summary":await ensureSummary(id,true);return;
    case "map-day":Object.assign(mapState(id),{day:el.dataset.day,page:0});await render();return;
    case "map-page":mapState(id).page=Number(el.dataset.page);await render();return;
    case "zoom":mapState(id).zoom=Number(el.dataset.zoom);await render();return;
    case "current-node":{const current=tripBy(id).nodes.find(n=>n.status==="current");D.check(current,"还没有进行中的节点");Object.assign(mapState(id),{day:String(current.day),page:current.page});await render();openNode(id,current.id);return}
    case "locate-node":{const node=tripBy(id).nodes.find(n=>n.id===nodeId);Object.assign(mapState(id),{day:String(node.day),page:node.page});await render();openNode(id,nodeId);return}
    case "node":openNode(id,nodeId);return;
    case "write-note":openNote(id,nodeId);return;
    case "announcement":openNote(id,null,true);return;
    case "upload":openUpload(id,nodeId);return;
    case "remove-upload":{captureUpload();const[indexed]=uploadDraft.files.splice(Number(el.dataset.index),1);if(indexed)URL.revokeObjectURL(indexed.preview);renderUpload();return}
    case "album":openAlbum(id,nodeId);return;
    case "lightbox":openLightbox(id,nodeId,Number(el.dataset.index));return;
    case "delete-photo":
      openModal("删除这张照片",'<p>删除后，相框数量和主照片会一起更新</p><div class="dialog-actions">'+b("album","保留照片",'data-trip="'+e(id)+'" data-node="'+e(nodeId)+'"')+
        b("confirm-delete-photo","确认删除",'data-trip="'+e(id)+'" data-node="'+e(nodeId)+'" data-photo="'+e(el.dataset.photo)+'"',"danger")+'</div>',"narrow");return;
    case "confirm-delete-photo":await R.deletePhoto(id,el.dataset.photo);if(urls.has(el.dataset.photo)){URL.revokeObjectURL(urls.get(el.dataset.photo));urls.delete(el.dataset.photo)}await refresh();openAlbum(id,nodeId);notify("照片已删除");return;
    case "new-expense":openExpense(id,nodeId);return;
    case "edit-expense":openExpense(id,null,el.dataset.expense);return;
    case "expense-detail":openExpenseDetail(id,el.dataset.expense);return;
    case "void-expense":openModal("作废这笔账单",'<p>作废后会重新计算分摊与结算建议，原记录仍保留</p><div class="dialog-actions">'+b("expense-detail","返回账单",'data-trip="'+e(id)+'" data-expense="'+e(el.dataset.expense)+'"')+b("confirm-void-expense","确认作废",'data-trip="'+e(id)+'" data-expense="'+e(el.dataset.expense)+'"',"danger")+'</div>',"narrow");return;
    case "confirm-void-expense":await mutate(id,t=>D.voidExpense(t,D.USER_ID,el.dataset.expense));closeModal();notify("账单已作废并重新计算");return;
    case "help":showHelp();return;
    case "data-settings":dataSettings();return;
    case "export-data":await downloadBackup();return;
    case "ask-reset-demo":confirmAction("恢复示例旅行","将重置示例旅行的报名、进度、照片和账单\n不会影响自己创建的旅行","reset-demo","","确认恢复示例");return;
    case "ask-reset-user":confirmAction("清空自己创建的旅行","将删除自己创建的全部旅行及对应照片、账单\n示例旅行不受影响，建议先导出备份","reset-user","","确认清空");return;
    case "reset-demo":{const seed=await seedBundle();await R.resetNamespace("demo",seed.trips,seed.media);break}
    case "reset-user":await R.resetNamespace("user");break;
    default:return;
  }
  for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();closeModal();await refresh();navigate("/trips");notify(action==="reset-demo"?"示例旅行已恢复":"自己创建的旅行已清空");
}
document.addEventListener("click",async event=>{
  const el=event.target.closest("[data-action],[data-close]");if(!el)return;
  if(el.hasAttribute("data-close")){closeModal();return}
  if(el.disabled)return;
  const action=el.dataset.action,key=action+":"+(el.dataset.trip||"");if(pendingActions.has(key))return;
  pendingActions.add(key);const wasDisabled=el.disabled;el.disabled=true;
  try{await handleAction(action,el)}catch(error){if(modal.open)showError(error);else notify(error.message||String(error))}
  finally{pendingActions.delete(key);if(el.isConnected)el.disabled=wasDisabled}
});
document.addEventListener("submit",async event=>{
  const form=event.target;if(!(form instanceof HTMLFormElement))return;
  event.preventDefault();if(formJobs.has(form))return;
  formJobs.add(form);const submit=form.querySelector('button[type="submit"]');if(submit)submit.disabled=true;
  const previousLabel=submit?.textContent;if(submit)submit.textContent="正在保存";
  try{
    const id=form.dataset.trip;
    if(form.id==="trip-form")await submitCreation(false);
    else if(form.id==="preference-form"){await mutate(id,t=>D.savePreference(t,D.USER_ID,preferenceData(form)));notify("偏好与建议已保存")}
    else if(form.id==="confirmation-form"){
      const f=fd(form);await mutate(id,t=>D.confirmParticipation(t,D.USER_ID,form.dataset.proposal,f.has("acceptsWinner")));
      closeModal();notify("已确认参加，选择已锁定");
    }else if(form.id==="lock-form"){
      const f=fd(form);await mutate(id,t=>D.lockTrip(t,D.USER_ID,value(f,"winnerId"),value(f,"tieReason")));
      closeModal();navigate("/trip/"+id+"/map");notify("方案已锁定，正在整理同行建议");await ensureSummary(id);
    }else if(form.id==="progress-form"){
      const f=fd(form),nodeId=form.dataset.node;
      await mutate(id,t=>D.updateProgress(t,D.USER_ID,nodeId,value(f,"status"),{reason:value(f,"reason"),previousStatus:value(f,"previousStatus")}));
      closeModal();notify("团队进度已更新");
    }else if(form.id==="note-form"){
      const f=fd(form);await mutate(id,t=>D.addMoment(t,D.USER_ID,{nodeId:value(f,"nodeId"),content:value(f,"content"),kind:form.dataset.kind}));
      closeModal();notify("旅途记录已保存");
    }else if(form.id==="upload-form"){
      captureUpload();await R.savePhotos(id,uploadDraft.nodeId,uploadDraft.files,uploadDraft.caption);
      uploadDraft.files.forEach(f=>URL.revokeObjectURL(f.preview));uploadDraft.files=[];uploadDraft.caption="";
      closeModal();await refresh();notify("照片已保存到这场旅行");
    }else if(form.id==="expense-form"){
      const payload=expensePayload(form),expenseId=form.dataset.expense||null;
      D.expenseShares(tripBy(id),payload);
      const file=form.querySelector('[name="receipt"]').files?.[0],blob=file?await R.compressImage(file,1800):null;
      await mutate(id,(t,media)=>{
        const receiptId=blob?D.uid("receipt"):undefined;
        if(blob)media.add({id:receiptId,tripId:id,namespace:t.namespace,kind:"receipt",ownerId:D.USER_ID,blob});
        D.saveExpense(t,D.USER_ID,{...payload,receiptId},expenseId);
      });
      closeModal();notify(expenseId?"账单已修改并重新计算":"支出已保存，分摊已更新");
    }
  }catch(error){showError(error,form.isConnected?form:modal.open?modalBody:null)}
  finally{formJobs.delete(form);if(submit?.isConnected){submit.disabled=false;submit.textContent=previousLabel}}
});
document.addEventListener("input",event=>{if(event.target.closest("#expense-form"))updateSplitPreview()});
document.addEventListener("change",async event=>{
  const target=event.target;
  try{
    if(target.id==="photo-files"){await prepareUpload([...target.files]);return}
    if(target.closest("#expense-form"))updateSplitPreview();
    if(target.matches('[name="winnerId"]')&&target.closest("#lock-form")){
      document.getElementById("lock-proposal-details").innerHTML=lockDetails(tripBy(target.form.dataset.trip),target.value);
    }
    if(target.hasAttribute("data-proposal-date")&&creation){
      collectCreation();const p=creation.data.proposals[Number(target.dataset.proposalDate)],dates=D.dateRange(p.startDate,p.endDate);
      p.days=dates.map((date,i)=>({...p.days[i],date,items:p.days[i]?.items||[{name:"",type:"activity",transport:"walk",description:""}]}));renderCreate();
    }
  }catch(error){showError(error)}
});
document.addEventListener("keydown",event=>{
  if(!modal.open||modal.dataset.lightbox!=="true"||!["ArrowLeft","ArrowRight"].includes(event.key))return;
  const id=modal.dataset.photoTrip,nodeId=modal.dataset.photoNode,index=Number(modal.dataset.photoIndex)+(event.key==="ArrowLeft"?-1:1);
  openLightbox(id,nodeId,index);event.preventDefault();
});
window.addEventListener("hashchange",()=>{if(modal.open)closeModal();render();window.scrollTo(0,0)});
async function boot(){
  try{
    await R.connect();const initialized=await R.getMeta("initialized");
    if(initialized)D.check(initialized.schemaVersion===1,"本地数据版本不兼容，请先保留备份，不会自动清空");
    else{const seed=await seedBundle();await R.initializeSeeds(seed.trips,seed.media)}
    await refresh();
  }catch(error){
    root.innerHTML=V.shell('<main class="page"><div class="empty"><h1>本地存储暂时无法使用</h1><p>'+e(error.message)+'</p><p class="fine">请允许此站点使用浏览器存储，或关闭其他同游页面后刷新；已有数据不会被自动清空</p>'+b("reload-page","重新打开","","primary")+'</div></main>',"home");
    root.querySelector('[data-action="reload-page"]')?.addEventListener("click",()=>location.reload());
  }
}
boot();



