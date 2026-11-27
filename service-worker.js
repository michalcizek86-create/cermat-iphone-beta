/* GitHub Pages serves this worker under the repository's own scope. */
'use strict';
const RELEASE = '821cb1d566927257';
const FILES = ["./index.html","./manifest.webmanifest","./styles/notebook.2eadef9a9056.css","./styles/responsive.2e631f693052.css","./assets/mathematical-notes.a4373d3a2a88.webp","./assets/paper-grain.60a3ea610bc1.webp","./assets/cermat-sans.3a330b1e6800.woff","./assets/stix-two-text.0c9a389199d1.woff","./js/bank.84ffdd99e458.js","./js/diagrams-01.0bfbde1ca480.js","./js/diagrams-02.f24ec2aa56eb.js","./js/diagrams-03.9ca59702945c.js","./js/diagrams-04.ce3495bfcc19.js","./js/diagrams-05.9db26e5e1ef7.js","./js/diagrams-06.673bb8017552.js","./js/diagrams-07.76c4fd0e5ecb.js","./js/diagrams-08.652ba8193b59.js","./js/diagrams-09.78219511a3dc.js","./js/diagrams-10.06044f70b3aa.js","./js/questions-01.da205587c574.js","./js/facts.bfb8fcad5e5b.js","./js/geometry.bbee47810086.js","./js/paper-editor.9b3f1cf1ff6a.js","./js/topic-tags.ce7798a23ce1.js","./js/topic-practice.1e39a7689a83.js","./js/study-store.63b4844caa16.js","./js/practice-ui.263a8b046301.js","./js/student-state.ef307186d32b.js","./js/study-upgrade.85dbb2a906c1.js","./js/app.5fc2c081daf2.js","./js/pwa.e34afd7bf522.js","./icons/apple-touch-icon.png","./icons/favicon-32.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./icons/icon-source.svg","./matematika.html","./subjects/shell.js","./subjects/bridge.js","./subjects/subjects.css","./cestina/index.html","./cestina/app.js","./cestina/IMPORT_REPORT.json","./cestina/manifest.webmanifest","./cestina/.nojekyll","./cestina/README.md","./cestina/app.css","./cestina/vendor/pdf.min.mjs","./cestina/vendor/pdf.worker.min.mjs","./cestina/vendor/LICENSE","./cestina/shared/storage.js","./cestina/shared/offline.js","./cestina/shared/annotations.js","./cestina/shared/design-system.css","./cestina/shared/ui.js","./cestina/shared/scoring.js","./cestina/shared/paper.js","./cestina/assets/josef-jungmann.jpg","./cestina/data/catalogue.json","./cestina/data/subject-cz.json","./cestina/data/topics.js","./cestina/data/facts.json","./cestina/icons/icon-512.png","./cestina/icons/icon-maskable-512.png","./cestina/icons/apple-touch-icon.png","./cestina/icons/favicon-32.png","./cestina/icons/icon-192.png","./cestina/vendor/standard_fonts/LiberationSans-Italic.ttf","./cestina/vendor/standard_fonts/LICENSE_LIBERATION","./cestina/vendor/standard_fonts/FoxitSerifItalic.pfb","./cestina/vendor/standard_fonts/FoxitDingbats.pfb","./cestina/vendor/standard_fonts/LICENSE_FOXIT","./cestina/vendor/standard_fonts/FoxitFixedBoldItalic.pfb","./cestina/vendor/standard_fonts/FoxitFixed.pfb","./cestina/vendor/standard_fonts/FoxitSymbol.pfb","./cestina/vendor/standard_fonts/FoxitFixedItalic.pfb","./cestina/vendor/standard_fonts/FoxitSerifBoldItalic.pfb","./cestina/vendor/standard_fonts/FoxitFixedBold.pfb","./cestina/vendor/standard_fonts/LiberationSans-Regular.ttf","./cestina/vendor/standard_fonts/FoxitSerif.pfb","./cestina/vendor/standard_fonts/LiberationSans-Bold.ttf","./cestina/vendor/standard_fonts/FoxitSerifBold.pfb","./cestina/vendor/standard_fonts/LiberationSans-BoldItalic.ttf","./cestina/vendor/cmaps/78-V.bcmap","./cestina/vendor/cmaps/UniCNS-UTF8-V.bcmap","./cestina/vendor/cmaps/UniCNS-UTF16-V.bcmap","./cestina/vendor/cmaps/90ms-RKSJ-H.bcmap","./cestina/vendor/cmaps/HKdlb-B5-V.bcmap","./cestina/vendor/cmaps/GBT-H.bcmap","./cestina/vendor/cmaps/78-RKSJ-V.bcmap","./cestina/vendor/cmaps/HKscs-B5-V.bcmap","./cestina/vendor/cmaps/Adobe-Japan1-5.bcmap","./cestina/vendor/cmaps/CNS1-V.bcmap","./cestina/vendor/cmaps/UniJIS2004-UTF16-H.bcmap","./cestina/vendor/cmaps/UniJIS-UTF8-V.bcmap","./cestina/vendor/cmaps/Ext-H.bcmap","./cestina/vendor/cmaps/ETen-B5-H.bcmap","./cestina/vendor/cmaps/GBTpc-EUC-V.bcmap","./cestina/vendor/cmaps/HKm314-B5-V.bcmap","./cestina/vendor/cmaps/UniCNS-UCS2-H.bcmap","./cestina/vendor/cmaps/GBK2K-H.bcmap","./cestina/vendor/cmaps/NWP-V.bcmap","./cestina/vendor/cmaps/RKSJ-V.bcmap","./cestina/vendor/cmaps/HKdlb-B5-H.bcmap","./cestina/vendor/cmaps/B5pc-V.bcmap","./cestina/vendor/cmaps/UniJIS-UTF16-H.bcmap","./cestina/vendor/cmaps/UniKS-UTF32-V.bcmap","./cestina/vendor/cmaps/UniJISX0213-UTF32-H.bcmap","./cestina/vendor/cmaps/Adobe-CNS1-2.bcmap","./cestina/vendor/cmaps/UniJIS-UCS2-HW-V.bcmap","./cestina/vendor/cmaps/GBKp-EUC-H.bcmap","./cestina/vendor/cmaps/Adobe-CNS1-1.bcmap","./cestina/vendor/cmaps/Adobe-Japan1-4.bcmap","./cestina/vendor/cmaps/UniJISX02132004-UTF32-V.bcmap","./cestina/vendor/cmaps/Adobe-Japan1-6.bcmap","./cestina/vendor/cmaps/Adobe-GB1-5.bcmap","./cestina/vendor/cmaps/Adobe-GB1-3.bcmap","./cestina/vendor/cmaps/Adobe-Japan1-1.bcmap","./cestina/vendor/cmaps/ETenms-B5-H.bcmap","./cestina/vendor/cmaps/HKscs-B5-H.bcmap","./cestina/vendor/cmaps/UniCNS-UTF16-H.bcmap","./cestina/vendor/cmaps/HKdla-B5-H.bcmap","./cestina/vendor/cmaps/Adobe-Korea1-2.bcmap","./cestina/vendor/cmaps/Adobe-GB1-4.bcmap","./cestina/vendor/cmaps/78-H.bcmap","./cestina/vendor/cmaps/UniJIS-UTF8-H.bcmap","./cestina/vendor/cmaps/CNS-EUC-V.bcmap","./cestina/vendor/cmaps/HKgccs-B5-H.bcmap","./cestina/vendor/cmaps/EUC-V.bcmap","./cestina/vendor/cmaps/UniKS-UTF16-H.bcmap","./cestina/vendor/cmaps/ETHK-B5-V.bcmap","./cestina/vendor/cmaps/GBT-V.bcmap","./cestina/vendor/cmaps/UniGB-UCS2-H.bcmap","./cestina/vendor/cmaps/UniJIS-UCS2-V.bcmap","./cestina/vendor/cmaps/90pv-RKSJ-V.bcmap","./cestina/vendor/cmaps/Adobe-Korea1-UCS2.bcmap","./cestina/vendor/cmaps/HKgccs-B5-V.bcmap","./cestina/vendor/cmaps/KSC-H.bcmap","./cestina/vendor/cmaps/Adobe-Japan1-3.bcmap","./cestina/vendor/cmaps/GBKp-EUC-V.bcmap","./cestina/vendor/cmaps/HKm471-B5-V.bcmap","./cestina/vendor/cmaps/UniJIS-UTF32-V.bcmap","./cestina/vendor/cmaps/UniCNS-UTF8-H.bcmap","./cestina/vendor/cmaps/UniJISX02132004-UTF32-H.bcmap","./cestina/vendor/cmaps/UniJIS2004-UTF8-V.bcmap","./cestina/vendor/cmaps/UniJIS2004-UTF8-H.bcmap","./cestina/vendor/cmaps/90pv-RKSJ-H.bcmap","./cestina/vendor/cmaps/B5-V.bcmap","./cestina/vendor/cmaps/Add-V.bcmap","./cestina/vendor/cmaps/GB-V.bcmap","./cestina/vendor/cmaps/KSC-EUC-V.bcmap","./cestina/vendor/cmaps/CNS2-H.bcmap","./cestina/vendor/cmaps/UniCNS-UCS2-V.bcmap","./cestina/vendor/cmaps/H.bcmap","./cestina/vendor/cmaps/KSC-Johab-H.bcmap","./cestina/vendor/cmaps/UniJISPro-UCS2-V.bcmap","./cestina/vendor/cmaps/KSCpc-EUC-H.bcmap","./cestina/vendor/cmaps/Adobe-Japan1-0.bcmap","./cestina/vendor/cmaps/UniJIS-UCS2-HW-H.bcmap","./cestina/vendor/cmaps/90msp-RKSJ-V.bcmap","./cestina/vendor/cmaps/UniKS-UTF16-V.bcmap","./cestina/vendor/cmaps/Add-RKSJ-H.bcmap","./cestina/vendor/cmaps/KSCms-UHC-HW-H.bcmap","./cestina/vendor/cmaps/GBT-EUC-H.bcmap","./cestina/vendor/cmaps/Adobe-CNS1-3.bcmap","./cestina/vendor/cmaps/UniGB-UTF16-H.bcmap","./cestina/vendor/cmaps/Add-RKSJ-V.bcmap","./cestina/vendor/cmaps/UniJISPro-UTF8-V.bcmap","./cestina/vendor/cmaps/ETen-B5-V.bcmap","./cestina/vendor/cmaps/V.bcmap","./cestina/vendor/cmaps/CNS1-H.bcmap","./cestina/vendor/cmaps/UniGB-UCS2-V.bcmap","./cestina/vendor/cmaps/CNS2-V.bcmap","./cestina/vendor/cmaps/Adobe-CNS1-4.bcmap","./cestina/vendor/cmaps/UniGB-UTF32-V.bcmap","./cestina/vendor/cmaps/Add-H.bcmap","./cestina/vendor/cmaps/Adobe-CNS1-UCS2.bcmap","./cestina/vendor/cmaps/Adobe-GB1-0.bcmap","./cestina/vendor/cmaps/Adobe-Korea1-1.bcmap","./cestina/vendor/cmaps/UniJIS-UCS2-H.bcmap","./cestina/vendor/cmaps/ETenms-B5-V.bcmap","./cestina/vendor/cmaps/Ext-V.bcmap","./cestina/vendor/cmaps/78-EUC-H.bcmap","./cestina/vendor/cmaps/ETHK-B5-H.bcmap","./cestina/vendor/cmaps/UniGB-UTF32-H.bcmap","./cestina/vendor/cmaps/Adobe-GB1-2.bcmap","./cestina/vendor/cmaps/UniGB-UTF16-V.bcmap","./cestina/vendor/cmaps/NWP-H.bcmap","./cestina/vendor/cmaps/78ms-RKSJ-V.bcmap","./cestina/vendor/cmaps/Ext-RKSJ-V.bcmap","./cestina/vendor/cmaps/HKdla-B5-V.bcmap","./cestina/vendor/cmaps/Adobe-Korea1-0.bcmap","./cestina/vendor/cmaps/GBpc-EUC-V.bcmap","./cestina/vendor/cmaps/KSC-V.bcmap","./cestina/vendor/cmaps/90ms-RKSJ-V.bcmap","./cestina/vendor/cmaps/GBT-EUC-V.bcmap","./cestina/vendor/cmaps/KSCms-UHC-HW-V.bcmap","./cestina/vendor/cmaps/GBpc-EUC-H.bcmap","./cestina/vendor/cmaps/UniKS-UTF8-H.bcmap","./cestina/vendor/cmaps/KSC-EUC-H.bcmap","./cestina/vendor/cmaps/Adobe-CNS1-5.bcmap","./cestina/vendor/cmaps/Adobe-GB1-UCS2.bcmap","./cestina/vendor/cmaps/UniJIS-UTF32-H.bcmap","./cestina/vendor/cmaps/Adobe-GB1-1.bcmap","./cestina/vendor/cmaps/Adobe-Japan1-UCS2.bcmap","./cestina/vendor/cmaps/KSC-Johab-V.bcmap","./cestina/vendor/cmaps/Roman.bcmap","./cestina/vendor/cmaps/Katakana.bcmap","./cestina/vendor/cmaps/UniJIS2004-UTF32-V.bcmap","./cestina/vendor/cmaps/GBK-EUC-H.bcmap","./cestina/vendor/cmaps/UniJIS2004-UTF32-H.bcmap","./cestina/vendor/cmaps/GB-EUC-V.bcmap","./cestina/vendor/cmaps/UniJIS2004-UTF16-V.bcmap","./cestina/vendor/cmaps/UniKS-UTF32-H.bcmap","./cestina/vendor/cmaps/GBK-EUC-V.bcmap","./cestina/vendor/cmaps/KSCms-UHC-H.bcmap","./cestina/vendor/cmaps/UniCNS-UTF32-V.bcmap","./cestina/vendor/cmaps/B5-H.bcmap","./cestina/vendor/cmaps/KSCpc-EUC-V.bcmap","./cestina/vendor/cmaps/Adobe-CNS1-0.bcmap","./cestina/vendor/cmaps/UniKS-UCS2-H.bcmap","./cestina/vendor/cmaps/GBK2K-V.bcmap","./cestina/vendor/cmaps/RKSJ-H.bcmap","./cestina/vendor/cmaps/UniGB-UTF8-H.bcmap","./cestina/vendor/cmaps/UniCNS-UTF32-H.bcmap","./cestina/vendor/cmaps/HKm314-B5-H.bcmap","./cestina/vendor/cmaps/78-RKSJ-H.bcmap","./cestina/vendor/cmaps/GB-H.bcmap","./cestina/vendor/cmaps/CNS-EUC-H.bcmap","./cestina/vendor/cmaps/Adobe-CNS1-6.bcmap","./cestina/vendor/cmaps/UniKS-UTF8-V.bcmap","./cestina/vendor/cmaps/Ext-RKSJ-H.bcmap","./cestina/vendor/cmaps/GB-EUC-H.bcmap","./cestina/vendor/cmaps/EUC-H.bcmap","./cestina/vendor/cmaps/GBTpc-EUC-H.bcmap","./cestina/vendor/cmaps/Hankaku.bcmap","./cestina/vendor/cmaps/90msp-RKSJ-H.bcmap","./cestina/vendor/cmaps/Adobe-Japan1-2.bcmap","./cestina/vendor/cmaps/LICENSE","./cestina/vendor/cmaps/UniJISPro-UCS2-HW-V.bcmap","./cestina/vendor/cmaps/UniJISX0213-UTF32-V.bcmap","./cestina/vendor/cmaps/78ms-RKSJ-H.bcmap","./cestina/vendor/cmaps/B5pc-H.bcmap","./cestina/vendor/cmaps/UniKS-UCS2-V.bcmap","./cestina/vendor/cmaps/83pv-RKSJ-H.bcmap","./cestina/vendor/cmaps/WP-Symbol.bcmap","./cestina/vendor/cmaps/HKm471-B5-H.bcmap","./cestina/vendor/cmaps/KSCms-UHC-V.bcmap","./cestina/vendor/cmaps/UniGB-UTF8-V.bcmap","./cestina/vendor/cmaps/Hiragana.bcmap","./cestina/vendor/cmaps/78-EUC-V.bcmap","./cestina/vendor/cmaps/UniJIS-UTF16-V.bcmap","./cestina/vendor/wasm/LICENSE_JBIG2","./cestina/vendor/wasm/LICENSE_PDFJS_QCMS","./cestina/vendor/wasm/openjpeg_nowasm_fallback.js","./cestina/vendor/wasm/jbig2.wasm","./cestina/vendor/wasm/qcms_bg.wasm","./cestina/vendor/wasm/LICENSE_PDFJS_OPENJPEG","./cestina/vendor/wasm/LICENSE_QCMS","./cestina/vendor/wasm/openjpeg.wasm","./cestina/vendor/wasm/LICENSE_PDFJS_JBIG2","./cestina/vendor/wasm/LICENSE_OPENJPEG","./cestina/vendor/iccs/CGATS001Compat-v2-micro.icc","./cestina/vendor/iccs/LICENSE","./subjects/motion.css","./subjects/motion.js","./subjects/ui.js","./subjects/literary-notes.svg","./styles/platform-base.140eb2cf598f.css","./subjects/worksheet.js","./subjects/worksheet.css"];
const BASE = new URL('./', self.location.href);
const INDEX = new URL('index.html', BASE).href;
const PREFIX = 'cermat-offline:' + BASE.pathname + ':';
const CACHE = PREFIX + RELEASE;
const URLS = FILES.map(path => new URL(path, BASE).href);
const ALLOWED = new Set(URLS);
let preparing;
const ARCHIVE = new Set(["./cestina/official/cz-2015-i1/guide.pdf","./cestina/official/cz-2015-i1/key.pdf","./cestina/official/cz-2015-i1/paper.pdf","./cestina/official/cz-2015-r1/guide.pdf","./cestina/official/cz-2015-r1/key.pdf","./cestina/official/cz-2015-r1/paper.pdf","./cestina/official/cz-2016-i1/guide.pdf","./cestina/official/cz-2016-i1/key.pdf","./cestina/official/cz-2016-i1/paper.pdf","./cestina/official/cz-2016-r1/guide.pdf","./cestina/official/cz-2016-r1/key.pdf","./cestina/official/cz-2016-r1/paper.pdf","./cestina/official/cz-2017-i1/guide.pdf","./cestina/official/cz-2017-i1/key.pdf","./cestina/official/cz-2017-i1/paper.pdf","./cestina/official/cz-2017-r1/guide.pdf","./cestina/official/cz-2017-r1/key.pdf","./cestina/official/cz-2017-r1/paper.pdf","./cestina/official/cz-2017-r2/guide.pdf","./cestina/official/cz-2017-r2/key.pdf","./cestina/official/cz-2017-r2/paper.pdf","./cestina/official/cz-2018-i1/guide.pdf","./cestina/official/cz-2018-i1/key.pdf","./cestina/official/cz-2018-i1/paper.pdf","./cestina/official/cz-2018-r1/guide.pdf","./cestina/official/cz-2018-r1/key.pdf","./cestina/official/cz-2018-r1/paper.pdf","./cestina/official/cz-2018-r2/guide.pdf","./cestina/official/cz-2018-r2/key.pdf","./cestina/official/cz-2018-r2/paper.pdf","./cestina/official/cz-2019-i1/guide.pdf","./cestina/official/cz-2019-i1/key.pdf","./cestina/official/cz-2019-i1/paper.pdf","./cestina/official/cz-2019-r1/guide.pdf","./cestina/official/cz-2019-r1/key.pdf","./cestina/official/cz-2019-r1/paper.pdf","./cestina/official/cz-2019-r2/guide.pdf","./cestina/official/cz-2019-r2/key.pdf","./cestina/official/cz-2019-r2/paper.pdf","./cestina/official/cz-2020-i1/guide.pdf","./cestina/official/cz-2020-i1/key.pdf","./cestina/official/cz-2020-i1/paper.pdf","./cestina/official/cz-2020-r1/guide.pdf","./cestina/official/cz-2020-r1/key.pdf","./cestina/official/cz-2020-r1/paper.pdf","./cestina/official/cz-2021-i1/guide.pdf","./cestina/official/cz-2021-i1/key.pdf","./cestina/official/cz-2021-i1/paper.pdf","./cestina/official/cz-2021-n1/key.pdf","./cestina/official/cz-2021-n1/paper.pdf","./cestina/official/cz-2021-n2/key.pdf","./cestina/official/cz-2021-n2/paper.pdf","./cestina/official/cz-2021-r1/guide.pdf","./cestina/official/cz-2021-r1/key.pdf","./cestina/official/cz-2021-r1/paper.pdf","./cestina/official/cz-2021-r2/guide.pdf","./cestina/official/cz-2021-r2/key.pdf","./cestina/official/cz-2021-r2/paper.pdf","./cestina/official/cz-2022-n1/key.pdf","./cestina/official/cz-2022-n1/paper.pdf","./cestina/official/cz-2022-n2/key.pdf","./cestina/official/cz-2022-n2/paper.pdf","./cestina/official/cz-2022-r1/guide.pdf","./cestina/official/cz-2022-r1/key.pdf","./cestina/official/cz-2022-r1/paper.pdf","./cestina/official/cz-2022-r2/guide.pdf","./cestina/official/cz-2022-r2/key.pdf","./cestina/official/cz-2022-r2/paper.pdf","./cestina/official/cz-2023-n1/key.pdf","./cestina/official/cz-2023-n1/paper.pdf","./cestina/official/cz-2023-n2/key.pdf","./cestina/official/cz-2023-n2/paper.pdf","./cestina/official/cz-2023-r1/guide.pdf","./cestina/official/cz-2023-r1/key.pdf","./cestina/official/cz-2023-r1/paper.pdf","./cestina/official/cz-2023-r2/guide.pdf","./cestina/official/cz-2023-r2/key.pdf","./cestina/official/cz-2023-r2/paper.pdf","./cestina/official/cz-2024-n1/key.pdf","./cestina/official/cz-2024-n1/paper.pdf","./cestina/official/cz-2024-n2/key.pdf","./cestina/official/cz-2024-n2/paper.pdf","./cestina/official/cz-2024-r1/guide.pdf","./cestina/official/cz-2024-r1/key.pdf","./cestina/official/cz-2024-r1/paper.pdf","./cestina/official/cz-2024-r2/guide.pdf","./cestina/official/cz-2024-r2/key.pdf","./cestina/official/cz-2024-r2/paper.pdf","./cestina/official/cz-2025-n1/key.pdf","./cestina/official/cz-2025-n1/paper.pdf","./cestina/official/cz-2025-n2/key.pdf","./cestina/official/cz-2025-n2/paper.pdf","./cestina/official/cz-2025-r1/guide.pdf","./cestina/official/cz-2025-r1/key.pdf","./cestina/official/cz-2025-r1/paper.pdf","./cestina/official/cz-2025-r2/guide.pdf","./cestina/official/cz-2025-r2/key.pdf","./cestina/official/cz-2025-r2/paper.pdf","./cestina/official/cz-2026-n1/guide.pdf","./cestina/official/cz-2026-n1/key.pdf","./cestina/official/cz-2026-n1/paper.pdf","./cestina/official/cz-2026-n2/guide.pdf","./cestina/official/cz-2026-n2/key.pdf","./cestina/official/cz-2026-n2/paper.pdf","./cestina/official/cz-2026-r1/guide.pdf","./cestina/official/cz-2026-r1/key.pdf","./cestina/official/cz-2026-r1/paper.pdf","./cestina/official/cz-2026-r2/guide.pdf","./cestina/official/cz-2026-r2/key.pdf","./cestina/official/cz-2026-r2/paper.pdf"].map(file=>new URL(file,BASE).href));
const ARCHIVE_CACHE = 'cermat-cz-archive:'+BASE.pathname+':4e2b8032e9809501';
let archiveTransfer;

async function archiveResponse(url) {
  const cache = await caches.open(ARCHIVE_CACHE);
  const stored = await cache.match(url);
  if (stored) return stored;
  try {
    const response = await fetch(new Request(url));
    if (response.ok && response.status===200) await cache.put(url,response.clone());
    return response;
  } catch (_) {
    return new Response('Dokument není uložený offline.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }
}

self.addEventListener('message',event=>{
  const type = event.data?.type,port = event.ports?.[0];
  if (!port || !['archive-status','cache-archive'].includes(type)) return;
  event.waitUntil((async()=>{
    const cache = await caches.open(ARCHIVE_CACHE);
    const keys = new Set((await cache.keys()).map(request=>request.url));
    let done = [...ARCHIVE].filter(url=>keys.has(url)).length;
    if (type==='archive-status') {port.postMessage({done,total:ARCHIVE.size,complete:true});return;}
    if (archiveTransfer) {
      await archiveTransfer;
      const stored = new Set((await cache.keys()).map(request=>request.url));
      done = [...ARCHIVE].filter(url=>stored.has(url)).length;
      port.postMessage({done,total:ARCHIVE.size,complete:true,failed:done<ARCHIVE.size});return;
    }
    let failed = 0;
    const missing = [...ARCHIVE].filter(url=>!keys.has(url));
    archiveTransfer=(async()=>{
      for(let start=0;start<missing.length;start+=4){
        await Promise.all(missing.slice(start,start+4).map(async url=>{
          try {
            const response=await fetch(new Request(url));
            if(!response.ok || response.status!==200)throw new Error('Stažení selhalo.');
            await cache.put(url,response);done++;
          } catch(_){failed++;}
        }));
        port.postMessage({done,total:ARCHIVE.size});
      }
    })();
    try {await archiveTransfer;}finally {archiveTransfer=null;port.postMessage({done,total:ARCHIVE.size,complete:true,failed});}
  })());
});


async function announce(data) {
  const clients = await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for (const client of clients) {
    if (client.url.startsWith(BASE.href)) client.postMessage({type:'CERMAT_OFFLINE',version:RELEASE,...data});
  }
}

async function status() {
  const cache = await caches.open(CACHE);
  const keys = new Set((await cache.keys()).map(request => request.url));
  const done = URLS.filter(url => keys.has(url)).length;
  return {version:RELEASE,ready:done===URLS.length,done,total:URLS.length};
}

async function valid(response, url) {
  if (!response?.ok || response.type==='opaque') return false;
  const type = response.headers.get('content-type') || '';
  if (/\.(png|svg|webp)$/.test(url)) return type.startsWith('image/');
  if (/\.js$/.test(url)) return /javascript/.test(type);
  if (/\.css$/.test(url)) return type.startsWith('text/css');
  if (url!==INDEX) return true;
  if (!type.includes('text/html')) return false;
  const html = await response.clone().text();
  return html.includes('<meta name="cermat-edition" content="student">') && html.includes('<meta name="cermat-release" content="'+RELEASE+'">');
}

async function precache() {
  const cache = await caches.open(CACHE);
  let next = 0, done = 0, failure;
  await announce({phase:'downloading',done,total:URLS.length});
  const download = async () => {
    while (!failure && next<URLS.length) {
      const url = URLS[next++];
      try {
        if (!await valid(await cache.match(url),url)) {
          const response = await fetch(url,{cache:'reload',credentials:'same-origin'});
          if (!await valid(response,url)) throw new Error('Nesouhlasí verze offline podkladů.');
          await cache.put(url,response);
        }
        done++;
        if (done%4===0 || done===URLS.length) await announce({phase:'downloading',done,total:URLS.length});
      } catch (error) {failure = error;}
    }
  };
  await Promise.all(Array.from({length:6},download));
  if (failure) throw failure;
  const result = await status();
  await announce({phase:'complete',...result});
}

function prepare() {
  if (!preparing) preparing = precache().finally(() => {preparing = null;});
  return preparing;
}

self.addEventListener('install', event => {
  // Activate a complete student shell promptly. An open exam is never reloaded.
  event.waitUntil(prepare().then(() => self.skipWaiting()).catch(async error => {
    await caches.delete(CACHE);
    await announce({phase:'error',ready:false});
    throw error;
  }));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const old = (await caches.keys()).filter(key => key.startsWith(PREFIX) && key!==CACHE);
    await Promise.all(old.map(key => caches.delete(key)));
    await self.clients.claim();
    await announce({phase:'active',...await status()});
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method!=='GET') return;
  const url = new URL(request.url);
  if (url.origin!==BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  const page = request.mode==='navigate' && (url.pathname===BASE.pathname || url.pathname===new URL(INDEX).pathname);
  const key = page ? INDEX : url.origin+url.pathname;
  if(ARCHIVE.has(key)){event.respondWith(archiveResponse(key));return;}
  if (!ALLOWED.has(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const stored = await cache.match(key);
    if (stored) return stored;
    try {
      const response = await fetch(request);
      if (await valid(response,key)) {
        await cache.put(key,response.clone());
        return response;
      }
      if (!page) return response;
    } catch (error) {if (!page) throw error;}
    return new Response('<!doctype html><html lang="cs"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Cermat testy</title><body><h1>Offline podklady zatím nejsou připravené</h1><p>Připoj se k internetu a otevři aplikaci znovu. Uložený postup zůstává v zařízení.</p></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
  })());
});

self.addEventListener('message', event => {
  const type = event.data?.type;
  if (type==='CERMAT_STATUS') event.waitUntil(status().then(value => event.ports?.[0]?.postMessage(value)));
  if (type==='CERMAT_CACHE') event.waitUntil(prepare().catch(() => announce({phase:'error',ready:false})));
  if (type==='CERMAT_ACTIVATE') event.waitUntil(self.skipWaiting());
});
