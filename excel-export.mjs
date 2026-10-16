// Layout and styles are authored with Artifact Tool in excel-template.json.
const encoder=new TextEncoder();
const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const cell=(ref,value,style)=>`<x:c r="${ref}" s="${style}" t="${typeof value==='number'?'n':'inlineStr'}">${typeof value==='number'?`<x:v>${Number.isFinite(value)?value:0}</x:v>`:`<x:is><x:t xml:space="preserve">${xml(value)}</x:t></x:is>`}</x:c>`;
function styleFor(sheet,ref){return sheet.match(new RegExp(`<x:c r="${ref}" s="(\\d+)"`))[1];}
export function reportParts(template,r,mode){
 const parts={...template};let sheet=parts['xl/worksheets/sheet1.xml'];
 const rows=[...sheet.matchAll(/<x:row\b[^>]*>[\s\S]*?<\/x:row>/g)].slice(0,10).map(m=>m[0]);
 function put(row,col,value){const ref=col+row;rows[row-1]=rows[row-1].replace(new RegExp(`<x:c r="${ref}"[^>]*(?:\/>|>[\\s\\S]*?<\\/x:c>)`),cell(ref,value,styleFor(sheet,ref)));}
 put(3,'A',`${r.plan.label} · ${mode==='premium'?'คำนวณจากเบี้ยประกัน':'คำนวณจากทุนประกัน'}`);
 for(const [row,c,f] of [[5,r.gender==='male'?'ชาย':'หญิง',r.age],[6,r.sum,r.premium],[7,r.payYears,r.plan.pensionAge],[8,r.totalPaid,r.totalReceived]]){put(row,'C',c);put(row,'F',f);}
 r.schedule.forEach((item,i)=>{
  const row=11+i,source=[r.plan.pensionAge,71,76,81,86].includes(item.age)?12:11;
  const values=[item.age,item.pay,item.pct,item.pension,item.received,item.coverage];
  rows.push(`<x:row r="${row}" ht="25" customHeight="1">${values.map((v,j)=>{const col='ABCDEF'[j];return cell(col+row,v,styleFor(sheet,col+source));}).join('')}</x:row>`);
 });
 const end=10+r.schedule.length,notes=[
  '* ก่อนรับบำนาญ: ความคุ้มครองขั้นต่ำ 105% ของเบี้ยประกันที่ชำระสะสม',
  'หลังเริ่มรับบำนาญ: เบี้ยสะสมหักเงินบำนาญสะสมที่ได้รับแล้ว (ไม่ต่ำกว่า 0 บาท)',
  'ทัก LINE @TYINSURE   https://line.me/R/ti/p/@tyinsure'
 ];
 notes.forEach((text,i)=>{const row=end+2+i;rows.push(`<x:row r="${row}" ht="25" customHeight="1">${cell('A'+row,text,2)}</x:row>`);});
 sheet=sheet.replace(/<x:sheetData>[\s\S]*?<\/x:sheetData>/,`<x:sheetData>${rows.join('')}</x:sheetData>`);
 sheet=sheet.replace('</x:mergeCells>',notes.map((_,i)=>`<x:mergeCell ref="A${end+2+i}:F${end+2+i}" />`).join('')+'</x:mergeCells>');
 sheet=sheet.replace('<x:sheetViews>','<x:sheetPr><x:pageSetUpPr fitToPage="1" /></x:sheetPr><x:sheetViews>');
 sheet=sheet.replace(/<x:pageMargins[^>]*\/>/,'<x:printOptions horizontalCentered="1" /><x:pageMargins left="0.25" right="0.25" top="0.4" bottom="0.4" header="0.2" footer="0.2" /><x:pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0" /><x:headerFooter><x:oddFooter>&amp;LTYINSURE&amp;Rหน้า &amp;P / &amp;N</x:oddFooter></x:headerFooter>');
 parts['xl/worksheets/sheet1.xml']=sheet;
 parts['xl/workbook.xml']=parts['xl/workbook.xml'].replace('</x:workbook>',`<x:definedNames><x:definedName name="_xlnm.Print_Area" localSheetId="0">'สรุปแผนบำนาญ'!$A$1:$F$${end+4}</x:definedName><x:definedName name="_xlnm.Print_Titles" localSheetId="0">'สรุปแผนบำนาญ'!$10:$10</x:definedName></x:definedNames></x:workbook>`);
 return parts;
}
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes){let n=0xffffffff;for(const b of bytes)n=crcTable[(n^b)&255]^(n>>>8);return (n^0xffffffff)>>>0;}
export function zipParts(parts){
 const chunks=[],central=[];let offset=0;
 const header=size=>{const b=new Uint8Array(size);return [b,new DataView(b.buffer)];};
 for(const [path,text] of Object.entries(parts)){
  const name=encoder.encode(path),data=encoder.encode(text),crc=crc32(data);
  const [local,v]=header(30);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);
  chunks.push(local,name,data);
  const [dir,d]=header(46);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint32(16,crc,true);d.setUint32(20,data.length,true);d.setUint32(24,data.length,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);central.push(dir,name);offset+=30+name.length+data.length;
 }
 const length=central.reduce((n,b)=>n+b.length,0),[end,e]=header(22);e.setUint32(0,0x06054b50,true);e.setUint16(8,central.length/2,true);e.setUint16(10,central.length/2,true);e.setUint32(12,length,true);e.setUint32(16,offset,true);
 return new Blob([...chunks,...central,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
let templatePromise;
export async function createExcelReport(result,mode){
 templatePromise??=fetch('./excel-template.json').then(r=>{if(!r.ok)throw Error('โหลดรูปแบบ Excel ไม่สำเร็จ');return r.json();}).catch(e=>{templatePromise=null;throw e;});
 return zipParts(reportParts(await templatePromise,result,mode));
}
