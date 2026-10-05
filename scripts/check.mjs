import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const base=(process.env.BASE_PATH||'').replace(/\/$/,'');let checked=0;
async function walk(path){const files=[];for(const name of await readdir(path)){const p=resolve(path,name);if((await stat(p)).isDirectory())files.push(...await walk(p));else files.push(p);}return files;}
const files=await walk('dist');
for(const f of files.filter(f=>f.endsWith('.html'))){const html=await readFile(f,'utf8');for(const tag of ['lang="ru"','name="description"','rel="canonical"','property="og:image"','application/ld+json'])assert.ok(html.includes(tag),`${f}: ${tag}`);assert.equal((html.match(/<h1[ >]/g)||[]).length,1,`${f}: one h1`);for(const m of html.matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)){let p=m[1];if(base){assert.ok(p.startsWith(base+'/'),`Missing base ${p}`);p=p.slice(base.length);}let local=resolve('dist','.'+p);if(p.endsWith('/'))local=resolve(local,'index.html');await stat(local).catch(()=>{throw Error(`Broken local link ${m[1]} from ${f}`);});}for(const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g))JSON.parse(m[1]);checked++;}
const og=await readFile('dist/og.png');assert.equal(og.subarray(1,4).toString(),'PNG');assert.equal(og.readUInt32BE(16),1200);assert.equal(og.readUInt32BE(20),630);
assert.ok((await readFile('dist/sitemap.xml','utf8')).includes('https://soberoctober.ru/calculator/'));
console.log(`Checked ${checked} HTML pages: metadata, JSON-LD, headings, internal routes/assets; OG 1200×630; sitemap.`);
