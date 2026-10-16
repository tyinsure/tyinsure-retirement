export const round2 = n => Math.round((n + Number.EPSILON * Math.max(1,Math.abs(n))) * 100) / 100;
export const bands = [[100000,299999.99],[300000,499999.99],[500000,999999.99],[1000000,Infinity]];
export function calculate(plans, input) {
 const plan=plans.find(p=>p.id===input.planId);
 if(!plan)throw Error('กรุณาเลือกแบบประกัน');
 const age=Number(input.age), amount=Number(input.amount), sex=input.gender==='male'?0:input.gender==='female'?1:-1;
 if(sex<0)throw Error('กรุณาเลือกเพศ');
 if(!Number.isInteger(age)||age<plan.minAge||age>plan.maxAge)throw Error(`แผนนี้มีอัตราเบี้ยสำหรับอายุ ${plan.minAge}–${plan.maxAge} ปี`);
 if(!Number.isFinite(amount)||amount<=0)throw Error(input.mode==='premium'?'กรุณากรอกเบี้ยรายปีที่มากกว่า 0':'กรุณากรอกทุนประกันที่มากกว่า 0');
 if(Math.abs(amount*100-Math.round(amount*100))>0.00001)throw Error('กรุณากรอกจำนวนเงินไม่เกินทศนิยม 2 ตำแหน่ง');
 let sum, premium, rate, tier=0, alternatives=0;
 const rows=plan.rates[String(age)];
 if(input.mode==='premium'){
  const candidates=rows.map((pair,i)=>{const value=round2(amount*1000/pair[sex]);const [lo,hi]=plan.kind==='five_years'?[1,Infinity]:bands[i];return {sum:value,rate:pair[sex],tier:i,valid:value>=lo&&value<=hi};}).filter(c=>c.valid);
  if(!candidates.length)throw Error(`เบี้ยต่ำกว่าทุนขั้นต่ำของตาราง (เบี้ยเริ่มประมาณ ${round2((plan.minSum||1)*rows[0][sex]/1000).toLocaleString('th-TH',{minimumFractionDigits:2})} บาท/ปี)`);
  const chosen=candidates.reduce((a,b)=>b.sum>a.sum?b:a);({sum,rate,tier}=chosen);premium=amount;alternatives=candidates.length;
 }else{
  sum=round2(amount);
  if(sum<plan.minSum)throw Error('แผนนี้มีอัตราเบี้ยสำหรับทุนประกันตั้งแต่ 100,000 บาท');
  tier=plan.kind==='five_years'?0:sum<300000?0:sum<500000?1:sum<1000000?2:3;
  rate=rows[tier][sex];premium=round2(rate*sum/1000);
 }
 const payYears=plan.kind==='five_years'?5:plan.pensionAge-age;
 let paid=0,received=0;
 const schedule=[];
 for(let a=age;a<=90;a++){
  const pay=a-age<payYears?premium:0;
  const pct=a<plan.pensionAge?0:a<=70?.12:a<=75?.15:a<=80?.18:a<=85?.21:.24;
  const pension=round2(sum*pct);
  paid=round2(paid+pay);received=round2(received+pension);
  const before=a<plan.pensionAge;
  const coverage=before?round2(paid*1.05):Math.max(0,round2(paid-received));
  schedule.push({age:a,year:a-age+1,pay,pct,pension,paid,received,coverage,before,phase:pay>0?'ชำระเบี้ย':before?'รอรับบำนาญ':'รับบำนาญ'});
 }
 return {plan,age,gender:input.gender,sum,premium,rate,tier,alternatives,payYears,schedule,totalPaid:paid,totalReceived:received,firstPension:round2(sum*.12)};
}
