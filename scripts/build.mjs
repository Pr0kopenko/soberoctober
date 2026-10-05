import {mkdir,readFile,writeFile,cp,unlink} from 'node:fs/promises';
import {resolve} from 'node:path';
import {articles} from '../src/content.mjs';
import {legalPages} from '../src/legal.mjs';
import {layout,home,calculator,calendar,articleBody,escape} from '../src/templates.mjs';
const out=resolve('dist');
const base=(process.env.BASE_PATH||'').replace(/\/$/,'');
if(base&&!/^\/[a-zA-Z0-9_-]+$/.test(base))throw Error('BASE_PATH must be a single /repository path');
const noindex=process.env.NOINDEX==='true';
await mkdir(out,{recursive:true});await cp('public',out,{recursive:true});await cp('src/domain.mjs',resolve(out,'domain.mjs'));
// Switching back to a repository preview must not retain a prior custom-domain file.
if(!process.env.SITE_DOMAIN){try{await unlink(resolve(out,'CNAME'));}catch(e){if(e.code!=='ENOENT')throw e;}}
const routes=[
{path:'/',title:'31 день без алкоголя. Ваш октябрь — ваши правила',description:'Sober October: начните 31 день без алкоголя в любую дату. Калькулятор денег и калорий, личный трекер без регистрации, Bingo и карточки прогресса.',body:home(articles)},
{path:'/calculator/',title:'Калькулятор экономии на алкоголе',description:'Посчитайте стоимость привычных напитков, порции и приблизительные калории за 31 день. Настройте личный Sober October без регистрации.',body:calculator()},
{path:'/calendar/',title:'Календарь 31 дня и Sober October Bingo',description:'Отмечайте дни без алкоголя, следите за личным прогрессом 3 / 7 / 14 / 31 день, собирайте Bingo и скачивайте карточку. Сохранение в вашем браузере.',body:calendar()},
...articles.map(a=>({path:`/${a.slug}/`,title:a.title,description:a.description,body:articleBody(a,articles),type:'Article'})),
...legalPages.map(p=>({path:`/${p.slug}/`,title:p.title,description:p.description,body:`<article class="wrap narrow section prose legal"><p class="eyebrow">Sober October / информация</p><h1>${escape(p.title)}</h1>${p.html}</article>`}))
];
for(const route of routes){let html=layout({...route,noindex});html=html.replace('<meta charset="UTF-8">',`<meta charset="UTF-8"><meta name="site-base" content="${base}">`);if(base)html=html.replace(/(href|src)="\/(?!\/)/g,`$1="${base}/`);const dir=resolve(out,'.'+route.path);await mkdir(dir,{recursive:true});await writeFile(resolve(dir,'index.html'),html);}
let missing=layout({path:'/404/',title:'Эта страница куда-то ушла',description:'Страница не найдена. Вернитесь к своему октябрю.',noindex:true,body:'<section class="wrap section"><p class="eyebrow">404 / бывает</p><h1>Здесь только<br><span class="serif">пустой бокал.</span></h1><p>Страница не найдена. Ваш октябрь — по соседству.</p><a class="button orange" href="/">На главную ↗</a></section>'});
missing=missing.replace('<meta charset="UTF-8">',`<meta charset="UTF-8"><meta name="site-base" content="${base}">`);if(base)missing=missing.replace(/(href|src)="\/(?!\/)/g,`$1="${base}/`);await writeFile(resolve(out,'404.html'),missing);
await writeFile(resolve(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(r=>`<url><loc>https://soberoctober.ru${r.path}</loc><lastmod>2026-10-05</lastmod></url>`).join('')}</urlset>\n`);
await writeFile(resolve(out,'robots.txt'),noindex?'User-agent: *\nDisallow: /\n':'User-agent: *\nAllow: /\nSitemap: https://soberoctober.ru/sitemap.xml\n');
await writeFile(resolve(out,'.nojekyll'),'');
if(process.env.SITE_DOMAIN){if(process.env.SITE_DOMAIN!=='soberoctober.ru')throw Error('SITE_DOMAIN must be soberoctober.ru');await writeFile(resolve(out,'CNAME'),'soberoctober.ru\n');}
console.log(`Built ${routes.length} pages + 404. Base: ${base||'/'}; indexing: ${!noindex}`);
