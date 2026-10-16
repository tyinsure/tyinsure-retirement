import {createPDFReport} from './pdf-export.mjs';
import {createExcelReport} from './excel-export.mjs';
import {createCustomerSummary,copyPlainText} from './customer-summary.mjs';
import {enableChartInteraction} from './chart-interaction.mjs';
import {calculate} from './calculator.mjs';
const $=id=>document.getElementById(id);
const money=n=>Number(n).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
const compact=n=>n>=1000000?`${n/1000000} ล้าน`:n>=1000?`${n/1000}k`:String(n);
let plans=[],mode='sum',result=null,lastCalculatedInput='';
const input=()=>({mode,gender:document.querySelector('input[name="gender"]:checked')?.value,age:$('age').value,planId:$('plan').value,amount:$('amount').value});
function updateHints(){
 const p=plans.find(p=>p.id===$('plan').value);if(!p)return;
 $('age-hint').textContent=`มีอัตราเบี้ยสำหรับอายุ ${p.minAge}–${p.maxAge} ปี`;
 $('age').max=p.maxAge;
 $('plan-hint').textContent=p.kind==='five_years'?`ชำระเบี้ย 5 ปี · เริ่มรับบำนาญอายุ ${p.pensionAge} ปี`:`ชำระถึงก่อนอายุ ${p.pensionAge} ปี · เริ่มรับบำนาญอายุ ${p.pensionAge} ปี`;
 $('amount-label').innerHTML=mode==='sum'?'ทุนประกัน <span>บาท</span>':'เบี้ยประกันรายปี <span>บาท/ปี</span>';
 $('amount-hint').textContent=mode==='sum'?(p.minSum?'ทุนประกันเริ่มที่ 100,000 บาท':'ระบุทุนประกันที่ต้องการ'):'ใช้เบี้ยตามที่กรอก คำนวณทุนเป็นทศนิยม 2 ตำแหน่ง';
}
function setMode(next){
 if(next===mode)return;
 const previous=result;
 mode=next;
 $('mode-sum').classList.toggle('active',mode==='sum');$('mode-premium').classList.toggle('active',mode==='premium');
 $('mode-sum').setAttribute('aria-selected',String(mode==='sum'));$('mode-premium').setAttribute('aria-selected',String(mode==='premium'));
 $('amount').value=previous?(mode==='sum'?previous.sum:previous.premium):(mode==='sum'?1000000:50000);
 updateHints();render();
}
function render(){
 try{
  result=calculate(plans,input());
  $('error').hidden=true;$('results').classList.remove('invalid');
  const r=result;
  $('headline-label').textContent=mode==='sum'?'เบี้ยประกันรายปี':'ทุนประกันที่คำนวณได้';
  $('headline-value').textContent=money(mode==='sum'?r.premium:r.sum);
  $('headline-unit').textContent=mode==='sum'?'บาท/ปี':'บาท';
  $('complement-label').textContent=mode==='sum'?'ทุนประกัน':'เบี้ยรายปีที่ใช้คำนวณ';
  $('complement-value').textContent=`${money(mode==='sum'?r.sum:r.premium)} ${mode==='sum'?'บาท':'บาท/ปี'}`;
  $('plan-badge').textContent=r.plan.label.replace('เฟล็กซี่ รีไทร์ ','');
  $('rate-detail').textContent=`อัตรา ${money(r.rate)} บาท ต่อทุน 1,000 บาท${r.plan.kind==='to_retirement'?` · ทุนช่วง ${['100,000–299,999.99','300,000–499,999.99','500,000–999,999.99','ตั้งแต่ 1,000,000'][r.tier]} บาท`:''}`;
  $('first-pension').textContent=money(r.firstPension);$('first-pension-note').textContent=`บาท/ปี · เริ่มอายุ ${r.plan.pensionAge} ปี`;
  $('total-pension').textContent=money(r.totalReceived);$('total-paid').textContent=money(r.totalPaid);$('pay-note').textContent=`บาท · ชำระ ${r.payYears} ปี`;
  $('calculation-note').textContent=mode==='premium'?(r.alternatives>1?'เบี้ยนี้คำนวณได้หลายช่วงทุน ระบบเลือกทุนที่สูงที่สุดให้แล้ว':'คำนวณจากเบี้ยที่กรอกโดยตรง ทุนประกันแสดงทศนิยม 2 ตำแหน่ง'):'อัตราเบี้ยขึ้นกับเพศ อายุเริ่มทำประกัน และช่วงทุนประกัน';
  $('schedule-description').textContent=`${r.plan.label} · ${r.gender==='male'?'ชาย':'หญิง'} อายุเริ่ม ${r.age} ปี · ทุน ${money(r.sum)} บาท`;
  $('schedule-body').innerHTML=r.schedule.map(row=>`<tr class="${[r.plan.pensionAge,71,76,81,86].includes(row.age)?'milestone':''}"><td><span class="age-number">${row.age}</span><span class="phase ${row.before?'':'pension-phase'}">${row.phase}</span></td><td>${row.pay?money(row.pay):'<span class="dash">—</span>'}</td><td>${row.pct?`${Math.round(row.pct*100)}%`:'<span class="dash">—</span>'}</td><td class="${row.pension?'pension-value':''}">${row.pension?money(row.pension):'<span class="dash">—</span>'}</td><td>${money(row.received)}</td><td class="coverage-value">${money(row.coverage)}${row.before?'<sup title="ขั้นต่ำ 105% ของเบี้ยสะสม">*</sup>':''}</td></tr>`).join('');
  $('row-count').textContent=`ทั้งหมด ${r.schedule.length} ปี · อายุ ${r.age}–90 ปี`;
  $('csv').disabled=false;$('pdf').disabled=false;$('print').disabled=false;
  lastCalculatedInput=JSON.stringify(input());
  updateCustomerSummary();
  drawChart();
 }catch(e){
  result=null;$('error').hidden=false;$('error').textContent=e.message;
  $('results').classList.add('invalid');
  for(const id of ['headline-value','complement-value','first-pension','total-pension','total-paid'])$(id).textContent='—';
  $('rate-detail').textContent='';$('calculation-note').textContent='แก้ไขข้อมูลเพื่อดูผลคำนวณ';
  $('schedule-body').replaceChildren();$('row-count').textContent='กรอกข้อมูลให้ครบเพื่อคำนวณ';$('chart').replaceChildren();$('csv').disabled=true;$('pdf').disabled=true;$('print').disabled=true;$('customer-summary-text').value='';$('copy-summary').disabled=true;$('regenerate-summary').disabled=true;$('summary-copy-status').textContent='กรอกข้อมูลให้ถูกต้องเพื่อสร้างข้อความสรุป';
 }
}
function updateCustomerSummary(){
 $('customer-summary-text').value=createCustomerSummary(result);
 $('copy-summary').disabled=!result;$('regenerate-summary').disabled=!result;
 $('copy-summary').querySelector('span').textContent='คัดลอกข้อความ';
 $('summary-copy-status').textContent='';
}
async function copyCustomerSummary(){
 if(JSON.stringify(input())!==lastCalculatedInput)render();
 if(!result)return;
 const text=$('customer-summary-text').value;
 if(!text.trim()){$('summary-copy-status').textContent='กรุณาใส่ข้อความ หรือกดสร้างข้อความใหม่จากผลคำนวณ';return;}
 $('copy-summary').disabled=true;
 try{
  await copyPlainText(text);
  $('copy-summary').querySelector('span').textContent='คัดลอกแล้ว';
  $('summary-copy-status').textContent='คัดลอกแล้ว นำไปวางในแชต LINE ได้เลยครับ';
 }catch{
  const box=$('customer-summary-text');box.focus();box.select();box.setSelectionRange(0,box.value.length);
  $('summary-copy-status').textContent='อุปกรณ์ไม่อนุญาตให้คัดลอกอัตโนมัติ กดค้างที่ข้อความแล้วเลือกคัดลอกได้เลย';
 }finally{$('copy-summary').disabled=!result;}
}
function drawChart(){
 if(!result)return;
 const r=result,mobile=window.matchMedia('(max-width:760px)').matches;
 const W=mobile?580:1100,H=mobile?290:270,L=mobile?63:76,R=16,T=18,B=45,F=mobile?15:12;
 const max=Math.max(r.totalPaid,r.totalReceived,1),unit=max>=1000000?1000000:1000,unitName=unit===1000000?'ล้านบาท':'พันบาท';
 const scale=Math.ceil(max/unit*1.1/4)*unit||unit;
 const ymax=scale*4;
 const x=a=>L+(a-r.age)/(90-r.age)*(W-L-R), y=v=>T+(1-v/ymax)*(H-T-B);
 const paid=r.schedule.map(row=>`${x(row.age).toFixed(2)},${y(row.paid).toFixed(2)}`).join(' ');
 const pension=r.schedule.map(row=>`${x(row.age).toFixed(2)},${y(row.received).toFixed(2)}`).join(' ');
 const grid=Array.from({length:5},(_,i)=>{const value=scale*i;return `<line x1="${L}" x2="${W-R}" y1="${y(value)}" y2="${y(value)}" stroke="#eee7eb" stroke-dasharray="3 5"/><text x="${L-12}" y="${y(value)+4}" text-anchor="end" fill="#ad9ca8" font-size="${F}">${(value/unit).toLocaleString('th-TH',{maximumFractionDigits:1})}</text>`;}).join('');
 const ages=[...new Set([r.age,r.plan.pensionAge,70,80,90])].sort((a,b)=>a-b).filter((a,i,aList)=>i===0||a-aList[i-1]>=4||a===90);
 const labels=ages.map(a=>`<text x="${x(a)}" y="${H-16}" text-anchor="${a===r.age?'start':a===90?'end':'middle'}" fill="#ad9ca8" font-size="${F}">${a} ปี</text>`).join('');
 const area=`${x(r.age)},${y(0)} ${pension} ${x(90)},${y(0)}`;
 $('chart').innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="เงินบำนาญสะสม ${money(r.totalReceived)} บาท และเบี้ยสะสม ${money(r.totalPaid)} บาท ถึงอายุ 90 ปี"><defs><linearGradient id="pension-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#b64070" stop-opacity=".12"/><stop offset="1" stop-color="#b64070" stop-opacity="0"/></linearGradient></defs><text x="4" y="12" font-size="${F-1}" fill="#ad9ca8">${unitName}</text>${grid}<line x1="${x(r.plan.pensionAge)}" x2="${x(r.plan.pensionAge)}" y1="${T}" y2="${H-B}" stroke="#dfbccd" stroke-dasharray="4 5"/><polygon points="${area}" fill="url(#pension-fill)"/><polyline points="${paid}" stroke="#b9aaa4" fill="none" stroke-width="2.5" stroke-linejoin="round"/><polyline points="${pension}" stroke="#b64070" fill="none" stroke-width="3" stroke-linejoin="round"/><circle cx="${x(90)}" cy="${y(r.totalReceived)}" r="4" fill="#b64070"/>${labels}</svg>`;
 enableChartInteraction($('chart'),{schedule:r.schedule,width:W,height:H,left:L,right:R,top:T,bottom:B,x,y,defaultAge:r.plan.pensionAge});
}
async function downloadReport(format){
 if(JSON.stringify(input())!==lastCalculatedInput)render();
 if(!result)return;
 const r=result,button=$(format==='pdf'?'pdf':'csv'),label=button.innerHTML;button.disabled=true;button.textContent='กำลังสร้างไฟล์…';
 try{
  const blob=await (format==='pdf'?createPDFReport(r,mode):createExcelReport(r,mode)),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`TYINSURE_Flexi_Retire_${r.plan.id}_age${r.age}.${format==='pdf'?'pdf':'xlsx'}`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }catch(e){$('error').hidden=false;$('error').textContent=`ส่งออก ${format==='pdf'?'PDF':'Excel'} ไม่สำเร็จ กรุณาลองอีกครั้ง (${e.message})`;}
 finally{button.innerHTML=label;button.disabled=!result;}
}

try{
 const response=await fetch('./plans.json');if(!response.ok)throw Error('ไม่สามารถโหลดอัตราเบี้ยได้');plans=await response.json();
 const groups=[['ชำระเบี้ย 5 ปี','five_years'],['ชำระถึงก่อนเริ่มรับบำนาญ','to_retirement']];
 for(const [label,kind] of groups){const g=document.createElement('optgroup');g.label=label;for(const p of plans.filter(p=>p.kind===kind)){const option=document.createElement('option');option.value=p.id;option.textContent=p.label;g.append(option);}$('plan').append(g);}
 $('plan').value='p2';
 $('mode-sum').addEventListener('click',()=>setMode('sum'));$('mode-premium').addEventListener('click',()=>setMode('premium'));
 $('form').addEventListener('submit',e=>{e.preventDefault();render();});
 let timer;
 for(const el of [$('age'),$('amount')])el.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(render,250);});
 $('plan').addEventListener('change',()=>{updateHints();render();});
 document.querySelectorAll('input[name="gender"]').forEach(el=>el.addEventListener('change',()=>{render();}));
 $('copy-summary').addEventListener('click',copyCustomerSummary);
 $('regenerate-summary').addEventListener('click',()=>{if(JSON.stringify(input())!==lastCalculatedInput)render();else updateCustomerSummary();});
 $('customer-summary-text').addEventListener('input',()=>{$('summary-copy-status').textContent='';$('copy-summary').querySelector('span').textContent='คัดลอกข้อความ';});
 $('csv').addEventListener('click',()=>downloadReport('xlsx'));$('pdf').addEventListener('click',()=>downloadReport('pdf'));$('print').addEventListener('click',()=>window.print());
 window.addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(drawChart,150);});
 updateHints();render();$('loading').remove();
}catch(e){$('loading').textContent='โหลดไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ';$('error').hidden=false;$('error').textContent=e.message;}
