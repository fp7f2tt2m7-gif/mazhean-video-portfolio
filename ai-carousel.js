/* Native scrolling: no cloned cards and no automatic playback. */
(() => {
  const rail=document.querySelector('#experiment-grid');
  const previous=document.querySelector('#experiment-previous');
  const next=document.querySelector('#experiment-next');
  const position=document.querySelector('#experiment-position');
  if(!rail||!previous||!next||!position)return;
  const cards=[...rail.querySelectorAll('.video-card')];
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const behavior=()=>reduced.matches?'auto':'smooth';
  const cardLeft=card=>card.getBoundingClientRect().left-rail.getBoundingClientRect().left+rail.scrollLeft-2;
  let frame=0;
  function update(){
    frame=0;
    const maximum=Math.max(0,rail.scrollWidth-rail.clientWidth);
    previous.disabled=rail.scrollLeft<=3;
    next.disabled=rail.scrollLeft>=maximum-3;
    const rect=rail.getBoundingClientRect();
    const visible=cards.map((card,index)=>{const r=card.getBoundingClientRect();return {index,visible:Math.min(r.right,rect.right)-Math.max(r.left,rect.left)>r.width*.5};}).filter(item=>item.visible);
    if(visible.length){const first=visible[0].index+1,last=visible[visible.length-1].index+1;const text=`${first===last?first:first+'–'+last} / ${cards.length}`;if(position.textContent!==text)position.textContent=text;}
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update);}
  function advance(direction){
    const offset=rail.scrollLeft;
    const target=direction>0?cards.find(card=>cardLeft(card)>offset+6):[...cards].reverse().find(card=>cardLeft(card)<offset-6);
    rail.scrollTo({left:target?cardLeft(target):direction>0?rail.scrollWidth:0,behavior:behavior()});
  }
  previous.addEventListener('click',()=>advance(-1));
  next.addEventListener('click',()=>advance(1));
  rail.addEventListener('scroll',schedule,{passive:true});
  rail.addEventListener('keydown',event=>{
    if(event.target!==rail)return;
    if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();advance(event.key==='ArrowRight'?1:-1);}
    else if(event.key==='Home'||event.key==='End'){event.preventDefault();rail.scrollTo({left:event.key==='Home'?0:rail.scrollWidth,behavior:behavior()});}
  });
  rail.addEventListener('focusin',event=>{
    const card=event.target.closest('.video-card');
    if(!card)return;
    const r=card.getBoundingClientRect(),viewport=rail.getBoundingClientRect();
    if(r.left<viewport.left||r.right>viewport.right)rail.scrollTo({left:cardLeft(card),behavior:'auto'});
  });
  if('ResizeObserver' in window)new ResizeObserver(schedule).observe(rail);
  else window.addEventListener('resize',schedule);
  schedule();
})();
