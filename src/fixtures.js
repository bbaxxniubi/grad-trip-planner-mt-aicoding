import {
  USER_ID,createTrip,confirmParticipation,savePreference,simulateRegistrations,lockTrip,
  makeSummary,setTripStatus,updateProgress,saveExpense,now
} from "./domain.js";
import {photoAsset} from "./art.js";
export function dateAfter(days){const d=new Date();d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)}
export function exampleInput(theme="beach"){
  const coast=theme==="beach",start=dateAfter(30),end=dateAfter(coast?32:31);
  const days=Array.from({length:coast?3:2},(_,i)=>({
    date:dateAfter(30+i),
    items:(coast?[
      [["集合出发","meeting","train","提前到达集合点，确认车次和行李"],["老城漫步","attraction","walk","一起逛街巷，留出自由活动时间"],["同学聚餐","food","walk","费用按实际参加聚餐的成员分摊"],["入住休息","hotel","car","住宿房型与价格待核实"]],
      [["早餐与集合","meeting","walk","确定当日集合时间"],["海边合影","activity","car","拍下属于我们的毕业合照"],["自由活动","activity","walk","各自选择散步、拍照或休息"],["日落晚餐","food","walk","照顾不同饮食需求"]],
      [["收拾行李","meeting","walk","核对个人物品"],["最后一张合照","activity","walk","把回忆留在每一站"],["返程","return","train","返程班次和时间待核实"]]
    ][i]:[
      [["集合出发","meeting","car","核对人数和随身物品"],["山间轻徒步","attraction","walk","量力而行，天气与路线开放情况待核实"],["草地野餐","food","walk","自行准备适合的餐食"],["山间住宿","hotel","car","住宿价格与入住要求待核实"]],
      [["晨间散步","activity","walk","保留自由活动时间"],["集体合影","activity","walk","一起记录这场出游"],["返程","return","car","检查天气和道路情况"]]
    ][i]).map(([name,type,transport,description])=>({name,type,transport,description,city:coast?"厦门":"杭州"}))
  }));
  const proposal={title:coast?"海边慢游":"山野轻徒步",startDate:start,endDate:end,cities:[coast?"厦门":"杭州"],
    budgetMin:coast?120000:80000,budgetMax:coast?180000:120000,core:coast?"老城散步、海边合影、同学聚餐":"轻徒步、草地野餐、集体合影",
    feeScope:"交通、住宿、基础餐饮的预估范围，不含个人购物与自选活动",transport:coast?"train":"car",stay:"按实际人数协商房型",notes:"所有价格与营业信息待核实",days};
  return {title:coast?"毕业去海边":"山野告别计划",description:coast?"一起去看海，把最后一个夏天留在照片里":"放慢脚步，和同学一起走进山野",
    departure:"上海",deadline:new Date(Date.now()+14*86400000).toISOString(),min:4,max:6,theme,
    proposals:[proposal,{...structuredClone(proposal),title:coast?"人文与海岸":"湖畔慢行",core:coast?"街区漫步、文化体验、海边合影":"湖边散步、同学聚餐、集体合影",
      budgetMin:coast?100000:70000,budgetMax:coast?150000:100000}]};
}
export function buildSeedTrips(){
  const coast=createTrip({...exampleInput("beach"),id:"demo-coast"},USER_ID,"demo");
  simulateRegistrations(coast,USER_ID);
  const forest=createTrip({...exampleInput("mountain"),id:"demo-forest",min:3},"su","demo");
  for(const id of ["chen","zhou"]){savePreference(forest,id,{interests:["户外"],pace:"轻松",scope:"general"});confirmParticipation(forest,id,forest.proposals[0].id,true,true)}
  const memory=createTrip({...exampleInput("beach"),id:"demo-memories",title:"把夏天留在海边"},USER_ID,"demo");
  simulateRegistrations(memory,USER_ID);lockTrip(memory,USER_ID,memory.proposals[0].id);
  memory.summary=makeSummary(memory.snapshot);setTripStatus(memory,USER_ID,"travelling");
  const first=memory.nodes[0],second=memory.nodes[1],current=memory.nodes.find(n=>n.name==="海边合影");
  updateProgress(memory,USER_ID,first.id,"done");
  updateProgress(memory,USER_ID,second.id,"done");
  updateProgress(memory,USER_ID,current.id,"current");
  saveExpense(memory,USER_ID,{title:"毕业聚餐",amount:"600",date:memory.nodes[2].date,payerId:USER_ID,memberIds:memory.snapshot.members,mode:"even",nodeId:memory.nodes[2].id,category:"餐饮"});
  saveExpense(memory,"su",{title:"海边体验活动",amount:"200",date:current.date,payerId:"su",memberIds:[USER_ID,"chen","su","zhou"],mode:"even",nodeId:current.id,category:"活动"});
  coast.createdAt=new Date(Date.now()-86400000).toISOString();
  forest.createdAt=new Date(Date.now()-2*86400000).toISOString();
  memory.createdAt=new Date(Date.now()-3*86400000).toISOString();
  return [coast,forest,memory];
}
export async function seedBundle(){
  const trips=buildSeedTrips(),media=[],memory=trips.find(t=>t.id==="demo-memories"),node=memory.nodes.find(n=>n.status==="current");
  try{
    const response=await fetch(photoAsset("beach"));if(!response.ok)throw new Error("示例照片加载失败");
    const blob=await response.blob();
    for(let i=0;i<3;i++){
      const metadata={id:"demo-photo-"+i,tripId:memory.id,nodeId:node.id,ownerId:["me","su","chen"][i],
        caption:["把日落留在这一站","一起去看海","我们的毕业旅行"][i]+" · 实拍氛围样图",
        at:new Date(Date.now()-(3-i)*60000).toISOString(),namespace:"demo",kind:"photo",example:true};
      memory.photos.push(metadata);media.push({...metadata,blob});
    }
    memory.moments.push({id:"demo-photo-event",kind:"photo",actorId:"su",nodeId:node.id,at:now(),text:"添加了3张旅行氛围样图"});
  }catch(error){console.warn("基础示例已准备；示例照片暂未加载",error.message)}
  return {trips,media};
}

