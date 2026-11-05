// Editable, local-only photo catalog. Unknown places never receive a guessed photo.
const asset=file=>new URL('../assets/photos/'+file,import.meta.url).href;
export const PLACES={
  coast:{src:asset('beach.jpg'),label:'厦门 · 环岛路',position:'72% 52%'},
  oldtown:{src:asset('gulangyu.jpg'),label:'厦门 · 鼓浪屿',position:'38% 70%'},
  station:{src:asset('xiamen-station.jpg'),label:'厦门站',position:'50% 50%'},
  lake:{src:asset('mountain.jpg'),label:'杭州 · 西湖',position:'50% 50%'}
};
const exactPlaces=[[/环岛路/,PLACES.coast],[/鼓浪屿/,PLACES.oldtown],[/厦门站/,PLACES.station],[/西湖/,PLACES.lake]];
export function nodePhoto(trip,node,urls){
  const own=trip.photos.filter(p=>p.nodeId===node.id&&!p.example&&urls.get(p.id)).sort((a,b)=>b.at.localeCompare(a.at))[0];
  if(own)return {src:urls.get(own.id),label:'本站照片',position:'50% 50%'};
  const exact=exactPlaces.find(([pattern])=>pattern.test(node.name));
  if(exact)return exact[1];
  // Legacy demo snapshots retain their original labels and IDs. These are
  // explicit scenery references, not assertions of exact restaurant/hotel locations.
  if(trip.namespace==='demo'){
    if(node.city==='厦门'){
      const place=/集合出发|返程/.test(node.name)?PLACES.station:/老城|入住|行李/.test(node.name)?PLACES.oldtown:PLACES.coast;
      return {...place,label:place.label+' · 参考'};
    }
    if(node.city==='杭州')return {...PLACES.lake,label:'杭州 · 西湖风景参考'};
  }
  return null;
}
