const sharp=require('/tmp/rv/node_modules/sharp');
const fs=require('fs');
const F='/home/user/zhaket/پیش‌نمایش/پیش‌نمایش-نهایی/assets/fonts/';
const mb=fs.readFileSync(F+'Morabba-Black.ttf').toString('base64');
const pd=fs.readFileSync(F+'Peyda-Bold.ttf').toString('base64');
const WHEEL='/tmp/icon/wheel.png';
const W=1240, H=800;          // final banner panel size (vertical stack, Zhaket scale)
const S=2;                     // supersample

const GRADS = {
 bg:  ['#2E6E3F','#224420','#12280F'],
 bg2: ['#275C36','#1F3E1E','#16301A'],
 bg3: ['#31663C','#24481F','#152D14'],
};
function head(grad){
 const c = GRADS[grad] || GRADS.bg;
 return `<defs>
<style type="text/css"><![CDATA[
 @font-face{font-family:'MB';src:url(data:font/ttf;base64,${mb}) format('truetype');}
 @font-face{font-family:'PD';src:url(data:font/ttf;base64,${pd}) format('truetype');}
 text{font-family:'MB';} .pd{font-family:'PD';}
]]></style>
<linearGradient id="G" x1=".1" y1="0" x2=".9" y2="1">
 <stop offset="0" stop-color="${c[0]}"/><stop offset="46%" stop-color="${c[1]}"/><stop offset="100%" stop-color="${c[2]}"/>
</linearGradient>
<radialGradient id="gl" cx="18%" cy="8%" r="72%">
 <stop offset="0" stop-color="#4FD08C" stop-opacity=".38"/><stop offset="100%" stop-color="#3CC47E" stop-opacity="0"/>
</radialGradient>
<radialGradient id="gg" cx="88%" cy="92%" r="58%">
 <stop offset="0" stop-color="#FFC517" stop-opacity=".22"/><stop offset="100%" stop-color="#FFC517" stop-opacity="0"/>
</radialGradient>
<pattern id="grid" width="62" height="62" patternUnits="userSpaceOnUse">
 <path d="M62 0H0V62" fill="none" stroke="#8FD3A6" stroke-opacity=".065" stroke-width="1.5"/>
</pattern>
</defs>`;
}

const svg=(inner,w=W,h=H,g='bg')=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w*S}" height="${h*S}" viewBox="0 0 ${w} ${h}">
${head(g)}
<rect width="${w}" height="${h}" fill="url(#G)"/><rect width="${w}" height="${h}" fill="url(#grid)"/>
<rect width="${w}" height="${h}" fill="url(#gl)"/><rect width="${w}" height="${h}" fill="url(#gg)"/>
${inner}</svg>`;

// 5 cards for features, 2 columns x ... layout helper
function cards(items, startY, cols=2, cw=520, ch=118, gapX=44, gapY=26, x0=70){
  let out='';
  items.forEach((it,i)=>{
    const c=i%cols, r=Math.floor(i/cols);
    const x=x0+c*(cw+gapX), y=startY+r*(ch+gapY);
    out+=`<g>
      <rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="24" fill="#FFFFFF" fill-opacity=".07" stroke="#9BD8B4" stroke-opacity=".26" stroke-width="1.6"/>
      <circle cx="${x+cw-46}" cy="${y+ch/2}" r="26" fill="#FFC517" fill-opacity=".16"/>
      <text x="${x+cw-46}" y="${y+ch/2+11}" text-anchor="middle" font-size="26" fill="#FFC517">${it[0]}</text>
      <text x="${x+cw-88}" y="${y+ch/2-6}" text-anchor="end" class="pd" font-size="26" font-weight="700" fill="#F4F8F2">${it[1]}</text>
      <text x="${x+cw-88}" y="${y+ch/2+30}" text-anchor="end" class="pd" font-size="19" font-weight="700" fill="#AFD3AE">${it[2]}</text>
    </g>`;
  });
  return out;
}

(async()=>{
 // ── P1 ── hero
 const p1=svg(`
  <circle cx="936" cy="424" r="222" fill="#0D220D" opacity=".34"/>
  <circle cx="936" cy="424" r="222" fill="none" stroke="#FFC517" stroke-width="2.4" stroke-opacity=".45"/>
  <circle cx="936" cy="424" r="252" fill="none" stroke="#3CC47E" stroke-width="1.6" stroke-dasharray="6 14" stroke-opacity=".45"/>
  <text x="70" y="262" font-size="104" fill="#FFFDF4">بچرخون</text>
  <text x="76" y="322" class="pd" font-size="28" font-weight="700" fill="#CFE9CE">گردونهٔ شانس برای وردپرس و ووکامرس</text>
  <rect x="76" y="356" width="150" height="4" rx="2" fill="#FFC517"/>
  <text x="76" y="446" class="pd" font-size="25" font-weight="700" fill="#E6F2E2">بازدیدکننده را به مشتری تبدیل کن.</text>
  <text x="76" y="490" class="pd" font-size="25" font-weight="700" fill="#E6F2E2">قرعه‌کشی امن سمت سرور، جایزهٔ واقعی.</text>
  <g>
    <rect x="76" y="556" width="196" height="56" rx="28" fill="#FFC517"/>
    <text x="174" y="593" text-anchor="middle" class="pd" font-size="24" font-weight="700" fill="#1E381B">۵۰۰ قابلیت</text>
    <rect x="292" y="556" width="196" height="56" rx="28" fill="#3CC47E" fill-opacity=".2" stroke="#3CC47E" stroke-width="2"/>
    <text x="390" y="593" text-anchor="middle" class="pd" font-size="24" font-weight="700" fill="#E8F7E8">۳۶ تم</text>
  </g>`);
 const b1=await sharp(Buffer.from(p1)).png().toBuffer();
 const w1=await sharp(WHEEL).resize({height:360}).toBuffer();
 const wm1=await sharp(w1).metadata();
 await sharp(b1).composite([{input:w1,left:Math.round(936-wm1.width/2),top:244}])
  .resize(W,H,{kernel:'lanczos3'}).jpeg({quality:93,chromaSubsampling:'4:4:4'})
  .toFile('banner-p6-01.jpg');

 // ── P2: numbers
 const stats=[['۳۶','تم آماده','شش خانوادهٔ رنگی'],['۱۲','الگوی آماده','سناریوهای آماده'],
              ['۱۴','نوع جایزه','از کوپن تا کیف پول'],['۵۱','شرط هدف‌گذاری','دقیقاً هرکه بخواهی'],
              ['۲۶','پنل پیامک','پوشش ۶۰+ برند'],['۱۲','صفحهٔ پنل','مدیریت کامل فارسی']];
 let st='';
 stats.forEach((s,i)=>{
   const c=i%3, r=Math.floor(i/3);
   const x=70+c*376, y=300+r*196;
   st+=`<g><rect x="${x}" y="${y}" width="348" height="168" rx="28" fill="#FFFFFF" fill-opacity=".07" stroke="#9BD8B4" stroke-opacity=".24" stroke-width="1.7"/>
    <text x="${x+174}" y="${y+86}" text-anchor="middle" font-size="62" fill="#FFC517">${s[0]}</text>
    <text x="${x+174}" y="${y+124}" text-anchor="middle" class="pd" font-size="23" font-weight="700" fill="#F2F8F0">${s[1]}</text>
    <text x="${x+174}" y="${y+152}" text-anchor="middle" class="pd" font-size="18" font-weight="700" fill="#A8CFA7">${s[2]}</text></g>`;
 });
 const p2=svg(`
  <text x="620" y="196" text-anchor="middle" font-size="60" fill="#FFFDF4">اعداد بچرخون</text>
  <text x="620" y="244" text-anchor="middle" class="pd" font-size="25" font-weight="700" fill="#CFE9CE">هر عدد از کد افزونه شمرده شده، نه از حافظه</text>
  ${st}`,W,H,'bg2');
 await sharp(Buffer.from(p2)).png().toBuffer().then(b=>
   sharp(b).resize(W,H,{kernel:'lanczos3'}).jpeg({quality:93,chromaSubsampling:'4:4:4'}).toFile('banner-p6-02.jpg'));

 // ── P3: prizes
 const prizes=['کوپن درصدی','کوپن مبلغ ثابت','کوپن محصول','ارسال رایگان','محصول رایگان','کیف پول',
               'امتیاز','شانس اضافه','مخزن کد','متن سفارشی','لینک','جایزهٔ فیزیکی','چرخش دوباره','پوچ'];
 let pz='';
 prizes.forEach((p,i)=>{
   const c=i%4, r=Math.floor(i/4);
   const x=70+c*290, y=292+r*96;
   pz+=`<g><rect x="${x}" y="${y}" width="264" height="78" rx="18" fill="#3CC47E" fill-opacity=".14" stroke="#3CC47E" stroke-opacity=".42" stroke-width="1.6"/>
     <circle cx="${x+230}" cy="${y+39}" r="8" fill="#FFC517"/>
     <text x="${x+30}" y="${y+48}" class="pd" font-size="21" font-weight="700" fill="#EDF7EB">${p}</text></g>`;
 });
 const p3=svg(`
  <text x="620" y="158" text-anchor="middle" font-size="56" fill="#FFFDF4">۱۴ نوع جایزه، همه واقعی</text>
  <text x="620" y="202" text-anchor="middle" class="pd" font-size="24" font-weight="700" fill="#CFE9CE">کوپن خودکار در ووکامرس ساخته می‌شود — نه یک پیام تشکر خالی</text>
  ${pz}
  <text x="620" y="742" text-anchor="middle" class="pd" font-size="21" font-weight="700" fill="#9FC79E">برای هر جایزه: مقدار · بازهٔ اعتبار · سقف برنده · پیام مخصوص</text>`);
 await sharp(Buffer.from(p3)).png().toBuffer().then(b=>
   sharp(b).resize(W,H,{kernel:'lanczos3'}).jpeg({quality:93,chromaSubsampling:'4:4:4'}).toFile('banner-p6-03.jpg'));

 // ── P4: rules + sms
 const p4=svg(`
  <text x="620" y="164" text-anchor="middle" font-size="58" fill="#FFFDF4">چه کسی، چند بار، چه زمانی</text>
  <text x="620" y="210" text-anchor="middle" class="pd" font-size="24" font-weight="700" fill="#CFE9CE">۵۱ شرط و سه حالت دسترسی — کنترل کامل دست توست</text>
  ${cards([
    ['۱','اولین سفارش','خرید اول را جایزه‌دار کن'],
    ['۲','سفارش بالای مبلغ','آستانهٔ مبلغ را خودت بگذار'],
    ['۳','هر مبلغ خرید','به ازای هر خرید شانس بده'],
    ['۴','سفارش N‌ام','مشتری وفادار را نگه دار'],
    ['۵','ثبت‌نام و دیدگاه','لید و نظر جمع کن'],
    ['۶','دعوت دوستان و تولد','رشد ارجاعی بساز'],
  ],258,2,520,110,44,22)
  }
  `,W,H,'bg2');
 await sharp(Buffer.from(p4)).png().toBuffer().then(b=>
   sharp(b).resize(W,H,{kernel:'lanczos3'}).jpeg({quality:93,chromaSubsampling:'4:4:4'}).toFile('banner-p6-04.jpg'));

 // ── P5: panel / demo
 let pages='';
 ['داشبورد','گردونه‌ها','جایزه‌ها','قوانین','مخاطبان','پیامک','گزارش‌ها','تنظیمات'].forEach((n,i)=>{
   const c=i%4, r=Math.floor(i/4);
   const x=92+c*272, y=330+r*96;
   pages+=`<g><rect x="${x}" y="${y}" width="248" height="72" rx="16" fill="#FFFFFF" fill-opacity=".07" stroke="#9BD8B4" stroke-opacity=".2"/>
     <circle cx="${x+34}" cy="${y+36}" r="11" fill="#3CC47E" fill-opacity=".85"/>
     <text x="${x+58}" y="${y+45}" class="pd" font-size="21" font-weight="700" fill="#EFf6EC">${n}</text></g>`;
 });
 const p5=svg(`
  <text x="620" y="164" text-anchor="middle" font-size="58" fill="#FFFDF4">پنل مدیریت فارسی، کامل و تمیز</text>
  <text x="620" y="210" text-anchor="middle" class="pd" font-size="24" font-weight="700" fill="#CFE9CE">راست‌به‌چپ · حالت تیره · پیش‌نمایش زنده · خروجی CSV</text>
  <rect x="80" y="300" width="1080" height="330" rx="26" fill="#0C1E0C" fill-opacity=".55" stroke="#9BD8B4" stroke-opacity=".22" stroke-width="1.8"/>
  ${pages}
  <text x="620" y="712" text-anchor="middle" class="pd" font-size="22" font-weight="700" fill="#9FC79E">در پیش‌نمایش آنلاین، همهٔ این صفحه‌ها را آزادانه ببین و بگشتی</text>`);
 await sharp(Buffer.from(p5)).png().toBuffer().then(b=>
   sharp(b).resize(W,H,{kernel:'lanczos3'}).jpeg({quality:93,chromaSubsampling:'4:4:4'}).toFile('banner-p6-05.jpg'));

 // ── P6: closing
 const p6=svg(`
  <circle cx="620" cy="352" r="150" fill="#0D220D" opacity=".3"/>
  <circle cx="620" cy="352" r="150" fill="none" stroke="#FFC517" stroke-width="2.2" stroke-opacity=".4"/>
  <text x="620" y="582" text-anchor="middle" font-size="56" fill="#FFFDF4">آماده‌ای گردونه را بچرخانی؟</text>
  <text x="620" y="630" text-anchor="middle" class="pd" font-size="24" font-weight="700" fill="#CFE9CE">نصب، انتخاب الگو، اتصال پیامک، گذاشتن کد کوتاه — همین.</text>
  <g>
   <rect x="380" y="678" width="216" height="56" rx="28" fill="#FFC517"/>
   <text x="488" y="715" text-anchor="middle" class="pd" font-size="23" font-weight="700" fill="#1E381B">۵۰۰ قابلیت</text>
   <rect x="618" y="678" width="240" height="56" rx="28" fill="#3CC47E" fill-opacity=".2" stroke="#3CC47E" stroke-width="2"/>
   <text x="738" y="715" text-anchor="middle" class="pd" font-size="23" font-weight="700" fill="#E8F7E8">۳۶ تم آماده</text>
  </g>`,W,H,'bg2');
 const b6=await sharp(Buffer.from(p6)).png().toBuffer();
 const w6=await sharp(WHEEL).resize({height:250}).toBuffer();
 const wm6=await sharp(w6).metadata();
 await sharp(b6).composite([{input:w6,left:Math.round(620-wm6.width/2),top:227}])
  .resize(W,H,{kernel:'lanczos3'}).jpeg({quality:93,chromaSubsampling:'4:4:4'}).toFile('banner-p6-06.jpg');

 for(let i=1;i<=6;i++){
   const f=`banner-p6-0${i}.jpg`;
   const m=await sharp(f).metadata();
   console.log(f, m.width+'x'+m.height, Math.round(fs.statSync(f).size/1024)+'KB');
 }
})();
