import {anytime,adventGuide,wallPage} from '../src/experience.mjs';
import {safety} from '../src/templates.mjs';
import {mkdir,readFile,writeFile,cp,unlink,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {articles} from '../src/content.mjs';
import {legalPages} from '../src/legal.mjs';
import {layout,home,calculator,calendar,articleBody,escape} from '../src/templates.mjs';
const out=resolve('dist');
const base=(process.env.BASE_PATH||'').replace(/\/$/,'');
if(base&&!/^\/[a-zA-Z0-9_-]+$/.test(base))throw Error('BASE_PATH must be a single /repository path');
const noindex=process.env.NOINDEX==='true';
await mkdir(out,{recursive:true});await cp('public',out,{recursive:true});await cp('src/domain.mjs',resolve(out,'domain.mjs'));await cp('src/journey-content.mjs',resolve(out,'journey-content.mjs'));await cp('src/journey-domain.mjs',resolve(out,'journey-domain.mjs'));
const assetHash=createHash('sha256');
for(const name of (await readdir(out)).filter(n=>n.endsWith('.mjs')||n.endsWith('.css')||n==='config.js').sort()) {
  assetHash.update(name).update(await readFile(resolve(out,name)));
}
const assetVersion=assetHash.digest('hex').slice(0,12);
const versionAssets=html=>html.replace(/((?:src|href)="[^"?]+\.(?:js|css))"/g,`$1?v=${assetVersion}"`);
// Shared hosts may serve .mjs as application/octet-stream. Publish browser modules as .js.
for (const name of await readdir(out)) {
  if (!name.endsWith('.mjs')) continue;
  const source = await readFile(resolve(out,name),'utf8');
  await writeFile(resolve(out,name.replace(/\.mjs$/,'.js')),source.replace(/\.mjs(['"])/g,`.js?v=${assetVersion}$1`));
  await unlink(resolve(out,name));
}
// Switching back to a repository preview must not retain a prior custom-domain file.
if(!process.env.SITE_DOMAIN){try{await unlink(resolve(out,'CNAME'));}catch(e){if(e.code!=='ENOENT')throw e;}}
const routes=[
{path:'/anytime/',title:'Месяц без алкоголя с любой даты — Свои 31',description:'Начните 31 день без алкоголя в любой месяц: личный адвент, ежедневные идеи, цели и маленькие радости. Бесплатно и без регистрации.',body:anytime(safety)},
{path:'/advent/',title:'31 идея для месяца без алкоголя — ежедневный путеводитель',description:'Практические советы на 31 день: подготовка, вечера, встречи и маленькие награды. Все идеи доступны заранее, без регистрации.',body:adventGuide(),type:'Article'},
{path:'/wall/',title:'Стена на паузе',description:'Продолжайте свои 31 день: календарь, ежедневные идеи и Bingo.',body:wallPage(),noindex:true},
{path:'/',title:'31 день без алкоголя — личный адвент с любой даты',description:'Sober October: начните 31 день без алкоголя в любую дату. Калькулятор денег и калорий, личный трекер без регистрации, Bingo и карточки прогресса.',body:home(articles)},
{path:'/calculator/',title:'Калькулятор экономии на алкоголе',description:'Посчитайте стоимость привычных напитков, порции и приблизительные калории за 31 день. Настройте личный Sober October без регистрации.',body:calculator()},
{path:'/calendar/',title:'Календарь 31 дня и Sober October Bingo',description:'Отмечайте дни без алкоголя, следите за личным прогрессом 3 / 7 / 14 / 31 день, собирайте Bingo и скачивайте карточку. Сохранение в вашем браузере.',body:calendar()},
...articles.map(a=>({path:`/${a.slug}/`,title:a.title,description:a.description,body:articleBody(a,articles),type:'Article'})),
...legalPages.map(p=>({path:`/${p.slug}/`,title:p.title,description:p.description,body:`<article class="wrap narrow section prose legal"><p class="eyebrow">Sober October / информация</p><h1>${escape(p.title)}</h1>${p.html}</article>`}))
];
for(const route of routes){let html=layout({...route,noindex:noindex||Boolean(route.noindex)}).replaceAll('/app.mjs','/app.js');html=versionAssets(html);html=html.replace('<meta charset="UTF-8">',`<meta charset="UTF-8"><meta name="site-base" content="${base}">`);if(base)html=html.replace(/(href|src)="\/(?!\/)/g,`$1="${base}/`);const dir=resolve(out,'.'+route.path);await mkdir(dir,{recursive:true});await writeFile(resolve(dir,'index.html'),html);}
let missing=layout({path:'/404/',title:'Эта страница куда-то ушла',description:'Страница не найдена. Вернитесь к своему октябрю.',noindex:true,body:'<section class="wrap section"><p class="eyebrow">404 / бывает</p><h1>Здесь только<br><span class="serif">пустой бокал.</span></h1><p>Страница не найдена. Ваш октябрь — по соседству.</p><a class="button orange" href="/">На главную ↗</a></section>'});
missing=versionAssets(missing.replaceAll('/app.mjs','/app.js'));
missing=missing.replace('<meta charset="UTF-8">',`<meta charset="UTF-8"><meta name="site-base" content="${base}">`);if(base)missing=missing.replace(/(href|src)="\/(?!\/)/g,`$1="${base}/`);await writeFile(resolve(out,'404.html'),missing);
await writeFile(resolve(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.filter(r=>!r.noindex).map(r=>`<url><loc>https://soberoctober.ru${r.path}</loc><lastmod>2026-10-05</lastmod></url>`).join('')}</urlset>\n`);
await writeFile(resolve(out,'robots.txt'),noindex?'User-agent: *\nAllow: /\n':'User-agent: *\nAllow: /\nSitemap: https://soberoctober.ru/sitemap.xml\n');
await writeFile(resolve(out,'.nojekyll'),'');
if(process.env.SITE_DOMAIN){if(process.env.SITE_DOMAIN!=='soberoctober.ru')throw Error('SITE_DOMAIN must be soberoctober.ru');await writeFile(resolve(out,'CNAME'),'soberoctober.ru\n');}
console.log(`Built ${routes.length} pages + 404. Base: ${base||'/'}; indexing: ${!noindex}`);
