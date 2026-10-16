const money=n=>Number(n).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});

export function createCustomerSummary(r){
 if(!r)return '';
 const plan=r.plan.label.startsWith('90/5')?`เฟล็กซี่ รีไทร์ ${r.plan.label}`:r.plan.label;
 const pensions=[[r.plan.pensionAge,70],[71,75],[76,80],[81,85],[86,90]].map(([start,end])=>{
  const row=r.schedule.find(row=>row.age===start);
  return `• อายุ ${start}–${end} ปี: ปีละ ${money(row.pension)} บาท`;
 });
 return [
 'สรุปแผนบำนาญสำหรับคุณ',
 `แผน ${plan}`,
 `สำหรับเพศ${r.gender==='male'?'ชาย':'หญิง'} อายุเริ่มทำประกัน ${r.age} ปี`,
 '',
 'เบี้ยประกัน',
 `• เบี้ยรายปี ${money(r.premium)} บาท ชำระ ${r.payYears} ปี (อายุ ${r.age}–${r.age+r.payYears-1} ปี)`,
 '',
 `เริ่มรับเงินบำนาญอายุ ${r.plan.pensionAge} ปี ถึงอายุ 90 ปี`,
 ...pensions,
 `รวมเงินบำนาญ ${money(r.totalReceived)} บาท`,
 '',
 'ความคุ้มครองกรณีเสียชีวิต',
 '• ก่อนเริ่มรับบำนาญ: อย่างน้อย 105% ของเบี้ยประกันที่ชำระสะสม',
 '• หลังเริ่มรับบำนาญ: เบี้ยประกันที่ชำระสะสม หักเงินบำนาญสะสมที่ได้รับแล้ว',
 '',
 'ปรึกษาหรือสอบถามเพิ่มเติม ทัก LINE @TYINSURE',
 'https://line.me/R/ti/p/@tyinsure'
 ].join('\n');
}

export async function copyPlainText(text,{navigatorObject=globalThis.navigator,documentObject=globalThis.document}={}){
 if(!text.trim())throw Error('ไม่มีข้อความสำหรับคัดลอก');
 if(navigatorObject?.clipboard?.writeText){
  try{await navigatorObject.clipboard.writeText(text);return 'clipboard';}catch{}
 }
 if(!documentObject)throw Error('ไม่สามารถเข้าถึงคลิปบอร์ดได้');
 const previous=documentObject.activeElement;
 const temporary=documentObject.createElement('textarea');
 temporary.value=text;temporary.setAttribute('readonly','');temporary.style.position='fixed';temporary.style.left='-9999px';temporary.style.top='0';temporary.style.opacity='0';
 documentObject.body.appendChild(temporary);
 try{
  temporary.focus();temporary.select();temporary.setSelectionRange(0,text.length);
  if(!documentObject.execCommand?.('copy'))throw Error('กรุณาเลือกข้อความและคัดลอกด้วยตนเอง');
  return 'legacy';
 }finally{temporary.remove();previous?.focus?.({preventScroll:true});}
}
