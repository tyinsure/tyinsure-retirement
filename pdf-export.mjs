const W=595.28,H=841.89,M=28,TABLE_BOTTOM=738,ROW=20;
const widths=[34,99,61,110,112,123.28];
const money=n=>Number(n).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
export function reportPageLayouts(r){
 const pages=[];let offset=0;
 while(offset<r.schedule.length){
  const first=pages.length===0,top=first?226:100,capacity=Math.floor((TABLE_BOTTOM-top-36)/ROW);
  const rows=r.schedule.slice(offset,offset+capacity);pages.push({first,top,rows});offset+=rows.length;
 }
 return pages;
}
export function drawPDFPage(canvas,r,mode,layout,index,total,scale=3){
 canvas.width=Math.ceil(W*scale);canvas.height=Math.ceil(H*scale);
 const c=canvas.getContext('2d');c.scale(scale,scale);c.fillStyle='#FFFFFF';c.fillRect(0,0,W,H);
 function text(value,x,y,{size=10,color='#36283b',bold=false,align='left',maxWidth}={}){
  c.font=`${bold?'bold ':''}${size}px Sarabun`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';
  // Keep unusually large amounts inside their own cells.
  if(maxWidth&&c.measureText(String(value)).width>maxWidth)c.fillText(String(value),x,y,maxWidth);else c.fillText(String(value),x,y);
 }
 function line(x1,y1,x2,y2,color='#CBC3C8'){c.beginPath();c.strokeStyle=color;c.lineWidth=.5;c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
 text('TYINSURE',M,37,{size:18,bold:true,color:'#A13362'});
 text('สรุปแผนบำนาญ',W-M,37,{size:15,align:'right',bold:true});
 line(M,55,W-M,55,'#A13362');
 text(r.plan.label,M,71,{size:11,bold:true,maxWidth:W-2*M});
 if(layout.first){
  text(mode==='premium'?'คำนวณจากเบี้ยประกันรายปี':'คำนวณจากทุนประกัน',M,91,{size:9,color:'#877b87'});
  const meta=[['เพศ',r.gender==='male'?'ชาย':'หญิง','อายุเริ่มทำประกัน',`${r.age} ปี`],['ทุนประกัน',`${money(r.sum)} บาท`,'เบี้ยรายปี',`${money(r.premium)} บาท`],['ระยะชำระเบี้ย',`${r.payYears} ปี`,'เริ่มรับบำนาญ',`${r.plan.pensionAge} ปี`],['เบี้ยที่ชำระรวม',`${money(r.totalPaid)} บาท`,'เงินบำนาญรวม',`${money(r.totalReceived)} บาท`]];
  meta.forEach(([a,b,d,e],i)=>{const y=107+i*25,half=(W-2*M)/2;
   c.fillStyle=i%2?'#FFFFFF':'#F9F3F6';c.fillRect(M,y,W-2*M,25);
   text(a,M+7,y+12.5,{size:9,color:'#766775'});text(b,M+half-9,y+12.5,{size:9,align:'right',maxWidth:165});
   text(d,M+half+8,y+12.5,{size:9,color:'#766775'});text(e,W-M-7,y+12.5,{size:9,align:'right',maxWidth:160});
   line(M,y+25,W-M,y+25);
  });
 }else text(`${r.gender==='male'?'ชาย':'หญิง'} อายุเริ่ม ${r.age} ปี | เบี้ยรายปี ${money(r.premium)} บาท`,M,88,{size:9});
 const headers=[['อายุ','(ปี)'],['เบี้ยที่ชำระ','(บาท/ปี)'],['อัตรา','บำนาญ'],['เงินบำนาญ','(บาท/ปี)'],['บำนาญสะสม','(บาท)'],['คุ้มครองชีวิต*','(บาท)']];
 c.fillStyle='#A13362';c.fillRect(M,layout.top,W-2*M,36);
 let x=M;headers.forEach((lines,j)=>{lines.forEach((s,k)=>text(s,x+widths[j]/2,layout.top+11+k*14,{size:9,color:'#FFFFFF',bold:true,align:'center'}));x+=widths[j];});
 layout.rows.forEach((row,i)=>{
  const y=layout.top+36+i*ROW,milestone=[r.plan.pensionAge,71,76,81,86].includes(row.age);
  c.fillStyle=milestone?'#F9EAF1':i%2?'#FCFAFB':'#FFFFFF';c.fillRect(M,y,W-2*M,ROW);
  let x=M;const values=[row.age,row.pay?money(row.pay):'-',row.pct?`${Math.round(row.pct*100)}%`:'-',row.pension?money(row.pension):'-',row.received?money(row.received):'-',row.coverage?money(row.coverage):'-'];
  values.forEach((v,j)=>{text(v,j===0?x+widths[j]/2:x+widths[j]-6,y+ROW/2,{size:9,bold:milestone,align:j===0?'center':'right',color:j===3&&row.pension?'#A13362':'#36283b',maxWidth:widths[j]-10});x+=widths[j];});
  line(M,y+ROW,W-M,y+ROW);
 });
 const bottom=layout.top+36+layout.rows.length*ROW;x=M;
 for(const width of [...widths,0]){line(x,layout.top,x,bottom);x+=width;}
 line(M,759,W-M,759,'#A13362');
 text('* ก่อนรับบำนาญ: ความคุ้มครองขั้นต่ำ 105% ของเบี้ยประกันที่ชำระสะสม',M,774,{size:8});
 text('หลังเริ่มรับบำนาญ: เบี้ยสะสมหักเงินบำนาญสะสมที่ได้รับแล้ว (ไม่ต่ำกว่า 0 บาท)',M,788,{size:8});
 text('ทัก LINE @TYINSURE   https://line.me/R/ti/p/@tyinsure',M,809,{size:8,color:'#338169'});
 text(`หน้า ${index+1} / ${total}`,W-M,809,{size:8,color:'#877b87',align:'right'});
 return canvas;
}
export async function createPDFReport(r,mode,{createCanvas=()=>document.createElement('canvas'),loadFont=()=>document.fonts.load('11px Sarabun','สรุปแผนบำนาญ')}={}){
 const [{PDFDocument}]=await Promise.all([import('./assets/pdf-lib.min.mjs'),loadFont()]);
 const pdf=await PDFDocument.create();pdf.setTitle(`TYINSURE - ${r.plan.label}`);pdf.setAuthor('TYINSURE');pdf.setSubject('สรุปผลประโยชน์และความคุ้มครองรายปี');
 const layouts=reportPageLayouts(r);
 for(let i=0;i<layouts.length;i++){
  const canvas=drawPDFPage(createCanvas(),r,mode,layouts[i],i,layouts.length);
  const png=await pdf.embedPng(canvas.toDataURL('image/png'));
  const page=pdf.addPage([W,H]);page.drawImage(png,{x:0,y:0,width:W,height:H});
  canvas.width=0;canvas.height=0;
 }
 return new Blob([await pdf.save()],{type:'application/pdf'});
}
