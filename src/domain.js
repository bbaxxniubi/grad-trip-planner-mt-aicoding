/** Pure business rules. All mutation is committed by repository.js transactions. */
export const USER_ID = "me";
export const USERS = [
  {id:"me",name:"林晓",short:"我",art:"traveler"},
  {id:"chen",name:"陈宇",art:"traveler"}, {id:"su",name:"苏晴",art:"friend"},
  {id:"zhou",name:"周航",art:"traveler"}, {id:"xu",name:"许诺",art:"friend"},
  {id:"zhao",name:"赵可",art:"friend"}
];
export const STATUS = {draft:"草稿",recruiting:"招募中",locked:"已锁定",travelling:"旅行中",ended:"已结束",cancelled:"已取消"};
export const NODE_STATUS = {planned:"未开始",current:"进行中",done:"已完成",skipped:"已跳过"};
export const TRANSPORT = {train:"火车",plane:"飞机",car:"汽车",bus:"公交 / 地铁",walk:"步行",unknown:"待定"};
export const INTERESTS=["摄影","美食","人文","看海","户外"];
export const DIETS=["清淡","可吃辣","素食"];
export const PACES=["轻松","适中","紧凑"];
export const DEMO_ENABLED = false;
export const clone = value => structuredClone(value);
export const uid = prefix => prefix+"-"+crypto.randomUUID();
export const now = () => new Date().toISOString();
export const nameOf = id => USERS.find(u=>u.id===id)?.name || "同行同学";
export const displayName = id => id===USER_ID ? "林晓（我）" : nameOf(id);
export function check(condition,message){if(!condition)throw new Error(message)}
export const text = value => String(value??"").trim();
export function toCents(input){
  const s=text(input);
  check(/^\d+(?:\.\d{1,2})?$/.test(s),"金额请填写非负数字，最多两位小数");
  const [whole,fraction=""]=s.split(".");
  const result=Number(whole)*100+Number(fraction.padEnd(2,"0"));
  check(Number.isSafeInteger(result),"金额超出可计算范围");
  return result;
}
export const money = cents => (cents/100).toLocaleString("zh-CN",{minimumFractionDigits:2,maximumFractionDigits:2});
export function sumMoney(values){const sum=values.reduce((a,b)=>a+b,0);check(Number.isSafeInteger(sum),"合计金额超出可计算范围");return sum}
export function splitEven(amount,ids){
  check(Number.isSafeInteger(amount)&&amount>0,"金额必须大于零");
  check(ids.length>0&&new Set(ids).size===ids.length,"请明确选择消费参与人，不能重复");
  const base=Math.floor(amount/ids.length),remainder=amount%ids.length;
  return ids.map((userId,i)=>({userId,amount:base+(i<remainder?1:0)}));
}
export function dateRange(start,end){
  const valid=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s+"T00:00:00Z").toISOString().slice(0,10)===s;
  check(valid(start)&&valid(end),"请填写有效的出发和结束日期");
  check(end>=start,"结束日期不能早于出发日期");
  const count=Math.round((Date.parse(end)-Date.parse(start))/86400000)+1;
  check(count<=60,"此展示版本支持最多60天的旅行");
  return Array.from({length:count},(_,i)=>new Date(Date.parse(start)+i*86400000).toISOString().slice(0,10));
}
export function normalizeProposal(p){
  check(text(p.title),"请填写方案名称");
  const dates=dateRange(p.startDate,p.endDate);
  const cities=(Array.isArray(p.cities)?p.cities:text(p.cities).split(/[，,、]/)).map(text).filter(Boolean);
  check(cities.length>0,"请填写目的地城市");
  const min=typeof p.budgetMin==="number"?p.budgetMin:toCents(p.budgetMin);
  const max=typeof p.budgetMax==="number"?p.budgetMax:toCents(p.budgetMax);
  check(Number.isSafeInteger(min)&&Number.isSafeInteger(max)&&min>=0&&max>=min,"费用上限不能低于下限");
  check(text(p.core)&&text(p.feeScope),"请填写核心项目和费用包含范围");
  check(Array.isArray(p.days)&&p.days.length===dates.length,"每一天都需要填写行程内容");
  const days=p.days.map((d,i)=>{
    check(d.items?.length>0,"第"+(i+1)+"天至少填写一个活动");
    check(d.items.length<=12,"每天最多12个活动，超过6个会分组显示");
    return {id:d.id||uid("day"),date:dates[i],items:d.items.map(item=>{
      check(text(item.name),"请填写每个活动的名称");
      return {id:item.id||uid("activity"),name:text(item.name),city:text(item.city)||cities[Math.min(i,cities.length-1)],
        type:item.type||"activity",description:text(item.description),transport:TRANSPORT[item.transport]?item.transport:"unknown"};
    })};
  });
  return {id:p.id||uid("proposal"),title:text(p.title),startDate:p.startDate,endDate:p.endDate,cities,
    budgetMin:min,budgetMax:max,core:text(p.core),feeScope:text(p.feeScope),transport:p.transport||"unknown",
    stay:text(p.stay),notes:text(p.notes),version:(p.version||0)+1,days};
}
export function createTrip(input,organizerId=USER_ID,namespace="user"){
  check(USERS.some(u=>u.id===organizerId),"未知组织者");
  const title=text(input.title);
  check(title.length>=2&&title.length<=30,"旅行名称需为2—30个字");
  check(text(input.description)&&text(input.departure),"请填写旅行简介和出发城市");
  check(input.deadline&&!isNaN(Date.parse(input.deadline)),"请填写报名截止时间");
  const min=Number(input.min),max=Number(input.max);
  check(Number.isInteger(min)&&min>=2&&Number.isInteger(max)&&max>=min,"最少人数至少为2，上限不能低于最少人数");
  check(input.proposals?.length>=1&&input.proposals.length<=3,"需要1—3份候选方案");
  const proposals=input.proposals.map(normalizeProposal);
  return {id:input.id||uid(namespace==="demo"?"demo":"trip"),schemaVersion:1,namespace,organizerId,title,
    description:text(input.description),departure:text(input.departure),deadline:new Date(input.deadline).toISOString(),
    min,max,theme:input.theme==="mountain"?"mountain":"beach",coverId:null,
    status:input.status==="draft"?"draft":"recruiting",createdAt:now(),revision:0,proposals,
    selections:{},preferences:{},participations:[],snapshot:null,summary:{status:"not-started"},nodes:[],
    progressEvents:[],photos:[],moments:[],expenses:[],simulationApplied:false};
}
export function organizer(trip,actor){check(trip.organizerId===actor,"只有旅行组织者可以进行此操作")}
export function editable(trip,actor){
  organizer(trip,actor);check(["draft","recruiting"].includes(trip.status),"当前旅行不可编辑基础方案");
  check(!trip.participations.length,"已有同学确认参加，候选方案已整体冻结");
}
export function editTrip(trip,input,actor){
  editable(trip,actor);
  const next=createTrip({...input,id:trip.id,status:trip.status},trip.organizerId,trip.namespace);
  Object.assign(trip,{title:next.title,description:next.description,departure:next.departure,deadline:next.deadline,
    min:next.min,max:next.max,theme:next.theme,proposals:next.proposals});
}
export function members(trip){
  return [...new Set([trip.organizerId,...trip.participations.map(p=>p.userId)])];
}
export function isMember(trip,actor){return members(trip).includes(actor)}
export function canContribute(trip,actor){
  check(isMember(trip,actor),"请先确认参加这场旅行");
  check(["locked","travelling","ended"].includes(trip.status),"锁定方案后才能记录照片与账单");
}
export function voteCounts(trip){
  return trip.proposals.map(p=>({id:p.id,title:p.title,count:trip.participations.filter(x=>x.userId!==trip.organizerId&&x.proposalId===p.id).length}));
}
export function leaders(trip){
  const votes=voteCounts(trip),highest=Math.max(0,...votes.map(v=>v.count));
  return votes.filter(v=>highest>0&&v.count===highest);
}
export function savePreference(trip,actor,pref){
  check(["draft","recruiting"].includes(trip.status),"方案已锁定，偏好快照不可再修改");
  const scope=pref.scope||"general";
  check(scope==="general"||trip.proposals.some(p=>p.id===scope),"建议所关联的方案不存在");
  trip.preferences[actor]={interests:(pref.interests||[]).filter(x=>INTERESTS.includes(x)),
    pace:PACES.includes(pref.pace)?pref.pace:"",diets:(pref.diets||[]).filter(x=>DIETS.includes(x)),
    needs:text(pref.needs),suggestion:text(pref.suggestion),scope,updatedAt:now()};
}
export function selectProposal(trip,actor,proposalId){
  check(trip.status==="recruiting","当前不在招募中");
  check(actor!==trip.organizerId,"组织者不参与自己旅行的方案投票");
  check(!trip.participations.some(p=>p.userId===actor),"确认后不能修改所选方案");
  check(Date.parse(trip.deadline)>Date.now(),"报名已截止");
  check(trip.proposals.some(p=>p.id===proposalId),"候选方案不存在");
  trip.selections[actor]=proposalId;
}
export function confirmParticipation(trip,actor,proposalId,acceptsWinner,simulated=false){
  const previous=trip.participations.find(p=>p.userId===actor);
  if(previous){check(previous.proposalId===proposalId,"确认后不能修改所选方案");return previous}
  check(actor!==trip.organizerId,"组织者不参与自己旅行的方案投票");
  check(trip.status==="recruiting","当前旅行已停止报名");
  check(Date.parse(trip.deadline)>Date.now(),"报名已截止");
  check(members(trip).length<trip.max,"旅行人数已满");
  check(acceptsWinner===true,"请主动勾选接受按最高票候选方案成团");
  const proposal=trip.proposals.find(p=>p.id===proposalId);check(proposal,"请选择一份候选方案");
  const record={id:uid("participation"),userId:actor,proposalId,confirmedAt:now(),acceptsWinner:true,simulated,
    commitment:{proposal:clone(proposal),rule:"接受按最高票方案成团；不代表付款、合同或强制出行义务"}};
  trip.participations.push(record);trip.selections[actor]=proposalId;
  return record;
}
export function simulateRegistrations(trip,actor){
  organizer(trip,actor);check(trip.status==="recruiting","仅招募中可以填充示例报名");
  if(trip.simulationApplied)return 0;
  let count=0;
  const roster=USERS.filter(u=>u.id!==actor);
  for(let i=0;i<roster.length&&members(trip).length<trip.max;i++){
    const user=roster[i];if(trip.participations.some(p=>p.userId===user.id))continue;
    const proposal=trip.proposals[(i===2&&trip.proposals.length>1)?1:0];
    savePreference(trip,user.id,{interests:[INTERESTS[i%5]],pace:i%2?"适中":"轻松",
      diets:i===1?["素食"]:[],needs:i===0?"希望留出自由活动时间":"",
      suggestion:i===3?"合影可以安排在傍晚":"",scope:"general"});
    confirmParticipation(trip,user.id,proposal.id,true,true);count++;
  }
  trip.simulationApplied=true;
  trip.moments.push({id:uid("event"),kind:"simulation",actorId:actor,at:now(),text:"填充了"+count+"位示例同学的报名"});
  return count;
}
export function buildNodes(tripId,proposal){
  let order=0;
  return proposal.days.flatMap((day,dayIndex)=>day.items.map((item,index)=>({
    id:tripId+"-"+item.id,activityId:item.id,day:dayIndex+1,date:day.date,order:order++,dayOrder:index,
    name:item.name,city:item.city,type:item.type,baseContent:item.description||proposal.core,
    transport:item.transport||proposal.transport||"unknown",status:"planned",notes:[],
    x:[13,43,76,18,50,80][index%6],y:[30,22,37,73,65,77][index%6],page:Math.floor(index/6)
  })));
}
export function lockTrip(trip,actor,winnerId,tieReason=""){
  organizer(trip,actor);
  if(trip.snapshot){check(!winnerId||winnerId===trip.snapshot.proposal.id,"该旅行已经锁定其他方案");return trip.snapshot}
  check(trip.status==="recruiting","只有招募中的旅行可以锁定");
  check(members(trip).length>=trip.min,"确认人数不足，暂时不能成团");
  const top=leaders(trip);check(top.length>0,"还没有正式确认的票数");
  const winningId=winnerId||top[0].id;
  check(top.some(v=>v.id===winningId),"只能锁定最高票方案");
  if(top.length>1)check(text(tieReason),"平票时请填写选择原因");
  const selected=trip.proposals.find(p=>p.id===winningId);
  const roster=members(trip);
  trip.snapshot={id:uid("snapshot"),version:1,lockedAt:now(),lockedBy:actor,proposal:clone(selected),
    members:roster,votes:clone(voteCounts(trip)),participants:clone(trip.participations),
    preferences:Object.fromEntries(roster.filter(id=>trip.preferences[id]).map(id=>[id,clone(trip.preferences[id])])),
    tieReason:top.length>1?text(tieReason):""};
  trip.nodes=buildNodes(trip.id,selected);trip.status="locked";
  trip.summary={status:"not-started",inputVersion:trip.snapshot.id};
  trip.moments.push({id:uid("event"),kind:"lock",actorId:actor,at:now(),text:"锁定了「"+selected.title+"」"});
  return trip.snapshot;
}
export function makeSummary(snapshot){
  check(snapshot,"请先锁定方案");
  const prefs=Object.entries(snapshot.preferences);
  const interestCounts=Object.fromEntries(INTERESTS.map(x=>[x,0]));
  const paceCounts=Object.fromEntries(PACES.map(x=>[x,0]));
  let filled=0;
  const needs=[],suggestions=[];
  for(const[userId,p]of prefs){
    if(p.interests?.length||p.pace||p.diets?.length||p.needs||p.suggestion)filled++;
    for(const interest of p.interests||[])interestCounts[interest]=(interestCounts[interest]||0)+1;
    if(p.pace)paceCounts[p.pace]=(paceCounts[p.pace]||0)+1;
    if(p.needs||p.diets?.length)needs.push({userId,text:[p.diets?.join("、"),p.needs].filter(Boolean).join("；")});
    if(p.suggestion&&(p.scope==="general"||p.scope===snapshot.proposal.id)){
      const category=/改.*(城市|日期)|提前一天|推迟一天|增加.*(收费|门票)/.test(p.suggestion)?"与锁定范围冲突":
        /自己|个人|自选/.test(p.suggestion)?"个人自选":/合影|拍照|自由活动/.test(p.suggestion)?"可参考":"待核实";
      suggestions.push({userId,text:p.suggestion,category});
    }
  }
  return {status:"done",source:"模板整理",inputVersion:snapshot.id,completedAt:now(),filled,total:snapshot.members.length,
    interestCounts,paceCounts,needs,suggestions,
    days:snapshot.proposal.days.map((d,i)=>({day:i+1,date:d.date,
      items:d.items.map(item=>({activityId:item.id,text:item.type==="meeting"?"提前确认集合位置，出发前清点人数":
        item.type==="food"?"点餐前核对饮食需求，费用按实际参与人记录":
        item.type==="return"?"核对返程车次与行李，给交通衔接预留余量":
        "按基础行程安排，集合时间、现场开放情况与交通时长待核实"}))})),
    verify:["景点营业时间与预约要求","交通时长、班次与集合地点","门票、餐饮、住宿的实际价格"],
    note:"参考内容不改变已锁定的日期、城市和核心项目；未填写偏好不代表没有要求"};
}
export function setTripStatus(trip,actor,status){
  organizer(trip,actor);
  const allowed={draft:["recruiting","cancelled"],recruiting:["cancelled"],locked:["travelling","cancelled"],travelling:["ended"]};
  check(allowed[trip.status]?.includes(status),"当前旅行状态不允许此操作");
  if(status==="recruiting")check(Date.parse(trip.deadline)>Date.now(),"请先更新报名截止时间");
  trip.status=status;
  trip.moments.push({id:uid("event"),kind:"status",actorId:actor,at:now(),text:"旅行状态更新为"+STATUS[status]});
}
export function updateProgress(trip,actor,nodeId,status,{reason="",previousStatus=""}={}){
  organizer(trip,actor);check(trip.status==="travelling","开始旅行后可以更新团队进度");
  check(Object.hasOwn(NODE_STATUS,status),"未知的节点状态");
  const node=trip.nodes.find(n=>n.id===nodeId);check(node,"节点不存在");
  if(status==="skipped")check(text(reason),"跳过节点时请填写原因");
  const previous=trip.nodes.find(n=>n.status==="current"&&n.id!==nodeId);
  if(status==="current"&&previous){
    check(["planned","done","skipped"].includes(previousStatus),"请先明确处理原进行中节点");
    if(previousStatus==="skipped")check(text(reason),"跳过原节点时请填写原因");
    const from=previous.status;previous.status=previousStatus;
    trip.progressEvents.push({id:uid("progress"),nodeId:previous.id,from,to:previousStatus,actorId:actor,reason:text(reason),at:now()});
  }
  const from=node.status;node.status=status;
  trip.progressEvents.push({id:uid("progress"),nodeId,from,to:status,actorId:actor,reason:text(reason),at:now()});
  trip.moments.push({id:uid("event"),kind:"progress",actorId:actor,nodeId,at:now(),text:node.name+" · "+NODE_STATUS[status]+(reason?" · "+text(reason):"")});
}
export function addMoment(trip,actor,{nodeId=null,content,kind="note"}){
  canContribute(trip,actor);check(text(content),"请填写记录内容");
  check(text(content).length<=1000,"记录内容不超过1000字");
  if(kind==="announcement")organizer(trip,actor);
  if(nodeId)check(trip.nodes.some(n=>n.id===nodeId),"节点不存在");
  const record={id:uid("event"),kind,actorId:actor,nodeId,text:text(content),at:now()};
  trip.moments.push(record);return record;
}
export function expenseShares(trip,input){
  const amount=toCents(input.amount);check(amount>0,"支出金额必须大于零");
  const roster=trip.snapshot?.members||members(trip);
  const selected=input.memberIds||[];
  check(selected.length>0&&new Set(selected).size===selected.length,"请明确选择消费参与人");
  check(selected.every(id=>roster.includes(id)),"消费参与人必须属于这场旅行");
  check(roster.includes(input.payerId),"请从旅行成员中选择付款人");
  const ordered=roster.filter(id=>selected.includes(id));
  check(["even","custom"].includes(input.mode),"请选择均分或自定义分账方式");
  const shares=input.mode==="even"?splitEven(amount,ordered):ordered.map(userId=>({userId,amount:toCents(input.custom?.[userId]??"")}));
  const total=sumMoney(shares.map(s=>s.amount));
  check(total===amount,"分摊合计与支出金额相差 ¥"+money(Math.abs(total-amount)));
  return {amount,shares};
}
export function saveExpense(trip,actor,input,expenseId=null){
  canContribute(trip,actor);
  const existing=expenseId?trip.expenses.find(e=>e.id===expenseId):null;
  if(expenseId){check(existing,"账单不存在");check(existing.creatorId===actor,"只能修改自己创建的账单");check(existing.status==="active","作废账单不能再修改")}
  check(text(input.title),"请填写支出名称");
  const {amount,shares}=expenseShares(trip,input);
  check(/^\d{4}-\d{2}-\d{2}$/.test(input.date||""),"请填写账单日期");
  if(input.nodeId)check(trip.nodes.some(n=>n.id===input.nodeId),"关联节点不存在");
  const entry={id:existing?.id||uid("expense"),creatorId:actor,createdAt:existing?.createdAt||now(),updatedAt:now(),
    title:text(input.title),date:input.date,amount,payerId:input.payerId,shares,mode:input.mode,
    nodeId:input.nodeId||null,category:text(input.category)||"其他",note:text(input.note),
    receiptId:input.receiptId||existing?.receiptId||null,status:"active",
    history:existing?[...(existing.history||[]),{...clone(existing),history:undefined,changedAt:now(),changedBy:actor}]:[]};
  const prospective=[...trip.expenses.filter(e=>e.id!==entry.id&&e.status==="active"),entry];
  sumMoney(prospective.map(e=>e.amount));
  if(existing)Object.assign(existing,entry);else trip.expenses.push(entry);
  return entry;
}
export function voidExpense(trip,actor,id){
  canContribute(trip,actor);const entry=trip.expenses.find(e=>e.id===id);check(entry,"账单不存在");
  check(entry.creatorId===actor,"只能作废自己创建的账单");if(entry.status==="void")return;
  entry.history.push({...clone(entry),history:undefined,changedAt:now(),changedBy:actor});
  entry.status="void";entry.updatedAt=now();
}
export function ledger(trip){
  const roster=trip.snapshot?.members||members(trip);
  const balances=roster.map(userId=>({userId,paid:0,owed:0,net:0}));
  const byId=Object.fromEntries(balances.map(b=>[b.userId,b]));
  const active=trip.expenses.filter(e=>e.status==="active");
  for(const e of active){
    check(byId[e.payerId],"账单付款人不在成员名单内");
    byId[e.payerId].paid+=e.amount;
    for(const s of e.shares){check(byId[s.userId],"账单分摊人不在成员名单内");byId[s.userId].owed+=s.amount}
  }
  balances.forEach(b=>{b.net=b.paid-b.owed;check(Number.isSafeInteger(b.net),"账务累计超出精确范围")});
  check(balances.reduce((sum,b)=>sum+b.net,0)===0,"账务异常：成员净额不平");
  const receivers=balances.filter(b=>b.net>0).map(b=>({userId:b.userId,value:b.net})).sort((a,b)=>b.value-a.value);
  const senders=balances.filter(b=>b.net<0).map(b=>({userId:b.userId,value:-b.net})).sort((a,b)=>b.value-a.value);
  const transfers=[];let i=0,j=0;
  while(i<senders.length&&j<receivers.length){
    const amount=Math.min(senders[i].value,receivers[j].value);
    transfers.push({from:senders[i].userId,to:receivers[j].userId,amount});
    senders[i].value-=amount;receivers[j].value-=amount;
    if(!senders[i].value)i++;if(!receivers[j].value)j++;
  }
  return {total:sumMoney(active.map(e=>e.amount)),balances,transfers};
}

