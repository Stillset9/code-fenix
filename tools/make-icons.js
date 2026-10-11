// Genera los íconos PNG de la PWA a partir de tools/icons.html (uso: NODE_PATH=... node tools/make-icons.js)
const fs=require('fs'), path=require('path'), puppeteer=require('puppeteer-core');
(async()=>{ const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']}); const p=await b.newPage();
  await p.goto('file://'+path.join(__dirname,'icons.html')); const icons=await p.evaluate(()=>window.ICONS);
  for(const [n,u] of Object.entries(icons)) fs.writeFileSync(path.join(__dirname,'..','icons',n),Buffer.from(u.split(',')[1],'base64'));
  console.log('íconos:',Object.keys(icons).join(', ')); await b.close(); })();
