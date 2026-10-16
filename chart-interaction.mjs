export function ageAtPosition(clientX, rect, width, left, right, minAge, maxAge) {
 const svgX=(clientX-rect.left)/rect.width*width;
 const fraction=Math.max(0,Math.min(1,(svgX-left)/(width-left-right)));
 return Math.round(minAge+fraction*(maxAge-minAge));
}

export function enableChartInteraction(container,{schedule,width,height,left,right,top,bottom,x,y,defaultAge}){
 const svg=container.querySelector('svg');
 if(!svg||!schedule.length)return;
 const ns='http://www.w3.org/2000/svg';
 const money=n=>n.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
 const make=(tag,attrs)=>{const el=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));return el;};
 const marker=make('g',{'class':'chart-marker','pointer-events':'none','aria-hidden':'true'});
 const line=make('line',{y1:top,y2:height-bottom,stroke:'#c68aa4','stroke-width':1.3,'stroke-dasharray':'4 4'});
 const paidDot=make('circle',{r:5,fill:'#b9aaa4',stroke:'white','stroke-width':2});
 const pensionDot=make('circle',{r:5,fill:'#b64070',stroke:'white','stroke-width':2});
 marker.append(line,paidDot,pensionDot);svg.append(marker);
 svg.setAttribute('tabindex','0');svg.setAttribute('role','group');svg.setAttribute('aria-label','กราฟยอดสะสม แตะหรือลากเพื่อเลือกอายุ ใช้ปุ่มลูกศรซ้ายขวาเพื่อเลื่อนทีละปี');
 const tooltip=document.createElement('div');tooltip.className='chart-tooltip';tooltip.setAttribute('aria-hidden','true');
 const controls=document.createElement('div');controls.className='chart-age-controls';
 const label=document.createElement('label');label.htmlFor='chart-age-slider';label.textContent='เลือกดูตามอายุ';
 const output=document.createElement('output');output.htmlFor='chart-age-slider';
 const slider=document.createElement('input');slider.id='chart-age-slider';slider.type='range';slider.min=schedule[0].age;slider.max=schedule.at(-1).age;slider.step=1;slider.setAttribute('aria-label','เลือกอายุเพื่อดูเบี้ยสะสมและเงินบำนาญสะสม');
 const controlTop=document.createElement('div');controlTop.append(label,output);controls.append(controlTop,slider);container.append(tooltip,controls);
 let selected=Math.max(schedule[0].age,Math.min(schedule.at(-1).age,Number(container.dataset.selectedAge)||defaultAge));
 function showAge(age){
  selected=Math.max(schedule[0].age,Math.min(schedule.at(-1).age,Math.round(age)));
  const row=schedule[selected-schedule[0].age],cx=x(selected);
  container.dataset.selectedAge=String(selected);
  line.setAttribute('x1',cx);line.setAttribute('x2',cx);
  paidDot.setAttribute('cx',cx);paidDot.setAttribute('cy',y(row.paid));pensionDot.setAttribute('cx',cx);pensionDot.setAttribute('cy',y(row.received));
  tooltip.innerHTML=`<div class="chart-tooltip-heading"><strong>อายุ ${selected} ปี</strong><span>${row.phase}</span></div><div><span><i class="legend-paid"></i>เบี้ยสะสม</span><b>${money(row.paid)}</b></div><div><span><i class="legend-pension"></i>บำนาญสะสม</span><b>${money(row.received)}</b></div><small>หน่วย: บาท</small>`;
  const rect=svg.getBoundingClientRect(),pointX=cx/width*rect.width;
  const tw=tooltip.offsetWidth||220;
  const preferred=pointX+14+tw<=rect.width-4?pointX+14:pointX-tw-14;
  tooltip.style.left=`${Math.max(4,Math.min(rect.width-tw-4,preferred))}px`;
  slider.value=String(selected);output.textContent=`อายุ ${selected} ปี`;
  slider.setAttribute('aria-valuetext',`อายุ ${selected} ปี เบี้ยสะสม ${money(row.paid)} บาท เงินบำนาญสะสม ${money(row.received)} บาท`);
 }
 function selectPointer(event){showAge(ageAtPosition(event.clientX,svg.getBoundingClientRect(),width,left,right,schedule[0].age,schedule.at(-1).age));}
 svg.addEventListener('pointerdown',event=>{if(event.button!==0&&event.pointerType==='mouse')return;selectPointer(event);if(svg.setPointerCapture)svg.setPointerCapture(event.pointerId);});
 svg.addEventListener('pointermove',event=>{if(event.pointerType==='mouse'||event.buttons||svg.hasPointerCapture?.(event.pointerId))selectPointer(event);});
 svg.addEventListener('keydown',event=>{let age;if(event.key==='ArrowLeft')age=selected-1;else if(event.key==='ArrowRight')age=selected+1;else if(event.key==='Home')age=schedule[0].age;else if(event.key==='End')age=schedule.at(-1).age;else return;event.preventDefault();showAge(age);});
 slider.addEventListener('input',()=>showAge(Number(slider.value)));
 showAge(selected);
}
