export const ART_COLORS={ink:"#263D37",paper:"#FFFFFF",blue:"#D8ECEC",green:"#28634F",sand:"#F2D9B8",grass:"#C7DBC9"};
export function artSvg(kind,c = ART_COLORS) {
  const outline = 'stroke="'+c.ink+'" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
  let body = "";
  if (kind==="traveler" || kind==="friend") {
    const friend=kind==="friend";
    body = '<g '+outline+'>'+
      '<path d="M33 83 29 94h15l5-13m5 1 7 12h14l-7-18" fill="'+c.ink+'"/>'+
      '<rect x="64" y="46" width="19" height="32" rx="9" fill="'+c.sand+'"/>'+
      '<path d="M33 49q-10 8-11 25l8 3 8-18M65 49q9 6 13 22l-7 5-10-18" fill="'+c.sand+'"/>'+
      '<path d="M36 48q14-6 27 0l7 35q-19 7-38 0z" fill="'+(friend?c.blue:c.green)+'"/>'+
      '<path d="M41 50v30m18-30v30" fill="none" stroke="'+(friend?c.green:c.sand)+'" stroke-width="4"/>'+
      (friend?'<path d="M21 34q-10 4-9 15 8 2 16-6m43-9q10 4 9 15-8 2-16-6" fill="'+c.ink+'"/>':'')+
      '<ellipse cx="49" cy="30" rx="27" ry="25" fill="'+c.sand+'"/>'+
      '<path d="M22 29Q20 7 45 5q27-2 31 24l-14-9-11 5-12-8-9 13z" fill="'+c.ink+'"/>'+
      '<path d="M22 17Q32 1 51 4q21-1 28 17l-1 6Q44 19 16 28l-3-5z" fill="'+(friend?c.paper:c.blue)+'"/>'+
      '<path d="M17 25q31-8 59 1" fill="none"/>'+
      '<path d="M37 34v3m23-3v3" stroke-width="3.2"/>'+
      '<path d="M45 42q5 4 9-1" fill="none"/>'+
      '<ellipse cx="30" cy="41" rx="4" ry="2" fill="'+c.paper+'" stroke="none" opacity=".6"/>'+
      '<ellipse cx="65" cy="41" rx="4" ry="2" fill="'+c.paper+'" stroke="none" opacity=".6"/>'+
      '<path d="M40 58q10 6 20 0" stroke="'+c.paper+'" fill="none"/>'+
      (friend?'<path d="M40 69h19v12H40z" fill="'+c.paper+'"/><circle cx="49.5" cy="75" r="4" fill="'+c.ink+'"/>':
      '<path d="m44 64 7-4 6 5-2 8-8 1-5-4z" fill="'+c.sand+'"/>')+
      '</g>';
  } else if (kind==="train") {
    body='<g '+outline+'>'+
      '<path d="M10 85h81M17 79l-4 12m68-12 5 12" fill="none" stroke="'+c.green+'"/>'+
      '<rect x="12" y="22" width="77" height="58" rx="15" fill="'+c.blue+'"/>'+
      '<path d="M15 55h71v16q-3 9-13 9H27q-11 0-12-9z" fill="'+c.green+'"/>'+
      '<rect x="23" y="31" width="24" height="24" rx="6" fill="'+c.paper+'"/>'+
      '<rect x="54" y="31" width="24" height="24" rx="6" fill="'+c.paper+'"/>'+
      '<path d="m25 33 14 19m17-19 14 19" stroke="'+c.blue+'" stroke-width="4"/>'+
      '<rect x="38" y="13" width="24" height="8" rx="3" fill="'+c.sand+'"/>'+
      '<path d="M45 13V8h11v5" fill="none"/>'+
      '<circle cx="29" cy="67" r="5" fill="'+c.sand+'"/><circle cx="72" cy="67" r="5" fill="'+c.sand+'"/>'+
      '<path d="M45 67q6 5 12 0" fill="none" stroke="'+c.paper+'"/>'+
      '<rect x="26" y="77" width="12" height="10" rx="4" fill="'+c.ink+'"/>'+
      '<rect x="65" y="77" width="12" height="10" rx="4" fill="'+c.ink+'"/>'+
      '</g>';
  } else if(kind==="plane"){
    body='<g '+outline+'>'+
      '<path d="m44 39-2-23q0-11 8-11t8 11l-2 23 33 21v10L55 60v17l11 9v7l-16-6-16 6v-7l11-9V60L11 70V60z" fill="'+c.paper+'"/>'+
      '<path d="M44 19h12v10H44z" fill="'+c.blue+'"/><path d="M17 61 45 47m38 14L55 47" stroke="'+c.green+'" stroke-width="5"/>'+
      '<path d="M47 39v29m7-29v29" stroke="'+c.blue+'" stroke-width="3"/>'+
      '</g>';
  } else if(kind==="car" || kind==="bus"){
    body='<g '+outline+'>'+
      '<path d="M10 48 22 25h49l15 23q8 3 8 12v15H7V59q0-7 3-11Z" fill="'+c.blue+'"/>'+
      '<path d="m26 30-8 18h27V30Zm26 0v18h26L67 30Z" fill="'+c.paper+'"/>'+
      '<path d="M8 60h84v15H8Z" fill="'+c.green+'"/>'+
      '<circle cx="25" cy="76" r="11" fill="'+c.ink+'"/><circle cx="75" cy="76" r="11" fill="'+c.ink+'"/>'+
      '<circle cx="25" cy="76" r="4" fill="'+c.paper+'"/><circle cx="75" cy="76" r="4" fill="'+c.paper+'"/>'+
      '<path d="M49 53h8"/><rect x="82" y="53" width="9" height="7" rx="2" fill="'+c.sand+'"/>'+
      (kind==="bus"?'<rect x="32" y="17" width="34" height="8" rx="3" fill="'+c.sand+'"/>':'')+'</g>';
  } else if(kind==="food"){
    body='<g '+outline+'><circle cx="50" cy="53" r="30" fill="'+c.paper+'"/><circle cx="50" cy="53" r="23" fill="'+c.blue+'"/>'+
      '<path d="M11 23v20q0 7 8 7V88M19 23v25m8-25v20q0 7-8 7M85 23q12 0 7 20l-7 8v37" fill="none"/>'+
      '<ellipse cx="50" cy="56" rx="15" ry="11" fill="'+c.sand+'"/><path d="M44 36q-8-8 0-15m11 15q-8-8 0-15" fill="none" stroke="'+c.green+'"/></g>';
  } else if(kind==="hotel"){
    body='<g '+outline+'><path d="M20 43h60v43H20Z" fill="'+c.paper+'"/><path d="m10 44 40-31 40 31Z" fill="'+c.green+'"/>'+
      '<rect x="42" y="62" width="17" height="24" rx="3" fill="'+c.sand+'"/><rect x="27" y="49" width="14" height="14" rx="3" fill="'+c.blue+'"/>'+
      '<rect x="61" y="49" width="13" height="14" rx="3" fill="'+c.blue+'"/><path d="M70 27V13h10v22" fill="'+c.sand+'"/></g>';
  } else if(kind==="camera"){
    body='<g '+outline+'>'+
      '<path d="M18 45q-13-3-11 15t13 24M81 45q12 0 11 18T80 84" fill="none" stroke="'+c.green+'"/>'+
      '<path d="m31 26 5-12h25l8 12" fill="'+c.sand+'"/>'+
      '<rect x="14" y="26" width="72" height="53" rx="12" fill="'+c.blue+'"/>'+
      '<path d="M15 47h70v20q0 12-11 12H26Q14 78 14 67z" fill="'+c.green+'"/>'+
      '<circle cx="51" cy="52" r="22" fill="'+c.paper+'"/>'+
      '<circle cx="51" cy="52" r="14" fill="'+c.ink+'"/>'+
      '<circle cx="47" cy="47" r="5" fill="'+c.blue+'" stroke="none"/>'+
      '<rect x="22" y="32" width="12" height="7" rx="2" fill="'+c.paper+'"/>'+
      '<path d="m76 9 2-5m7 13 6-1m-9-6 4-4" stroke="'+c.green+'"/>'+
      '</g>';
  } else {
    body='<g '+outline+'>'+
      '<path d="M9 83q42-8 83 0" fill="none" stroke="'+c.grass+'" stroke-width="9"/>'+
      '<path d="m45 14 41 64H13z" fill="'+c.sand+'"/>'+
      '<path d="m45 14 20 63H13z" fill="'+c.green+'"/>'+
      '<path d="m41 40 13 37H25z" fill="'+c.paper+'"/>'+
      '<path d="m45 14 5-8m-5 8-4-9m45 72 7 7m-78-8-8 8" fill="none"/>'+
      '<path d="M76 20v26m-9-15 9-16 10 16m-20 8 10-18 11 18" fill="'+c.grass+'"/>'+
      '<path d="m13 16 1-5m-9 8 5-2m10 4 4 2" stroke="'+c.green+'"/>'+
      '</g>';
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'+body+'</svg>';
}
export const artUri=kind=>"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(artSvg(kind));
export const photoAsset=theme=>new URL("../assets/photos/"+(theme==="mountain"?"mountain":"beach")+".jpg",import.meta.url).href;

