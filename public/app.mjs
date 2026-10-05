import {STORAGE_KEY,CONSENT_KEY,DRINKS,BINGO,todayISO,ordinal,addDays,dayNumber,validProfile,estimates,sanitizeState,confirmedDays,bingoLines,fmt,pluralDays} from './domain.mjs';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const base=$('meta[name="site-base"]')?.content||'';
let storageOK=true;
function read(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{storageOK=false;$('#storage-warning').hidden=false;return false;}}
let state=sanitizeState(read(STORAGE_KEY));
let looseBingo=read('sober-bingo:v1');
looseBingo=Array.isArray(looseBingo)?looseBingo.filter(i=>Number.isInteger(i)&&i>=0&&i<25):[];
let toastTimer;
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3500);}
function save(){return write(STORAGE_KEY,state);}
function displayDate(date,year=false){return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',...(year?{year:'numeric'}:{})}).format(new Date(`${date}T12:00:00`)).replace(/\.$/,'');}
const today=todayISO();
$$('[data-year]').forEach(n=>n.textContent=new Date().getFullYear());
function season(){const d=new Date(),m=d.getMonth(),year=d.getFullYear();const inOctober=m===9;const n=inOctober?d.getDate():31; if($('#season-day'))$('#season-day').textContent=String(n).padStart(2,'0');if($('[data-season]'))$('[data-season]').textContent=`${inOctober?'Октябрь': 'Ваш личный октябрь'} / ${year}`;if($('#season-label'))$('#season-label').textContent=inOctober?`${displayDate(today)} · общий челлендж`:'день старта выбираете вы';if($('#season-copy')){const strong=$('#season-copy strong'),span=$('#season-copy span');strong.textContent=inOctober?(d.getDate()===1?'Октябрь начался. Поехали?':'Октябрь уже начался. И что?'):m>=10?'Октябрь закончился. Начать всё ещё можно.':'Ваш октябрь может начаться сегодня.';span.textContent=`Начните сегодня. Ваш 31-й день — ${displayDate(addDays(today,30),true)}.`;}}
season();
const form=$('#calculator-form');
if(form){
 const f=form.elements;
 f.start.value=today;
 if(state){for(const k of ['drink','frequency','quantity','volume','price','kcal','start'])f[k].value=state.profile[k];$('#edit-note').hidden=false;form.querySelector('[type="submit"]').innerHTML='Сохранить и открыть трекер <span>↗</span>';}
 function profile(){return {drink:f.drink.value,frequency:Number(f.frequency.value),quantity:Number(f.quantity.value),volume:Number(f.volume.value),price:Number(f.price.value),kcal:Number(f.kcal.value),start:f.start.value};}
 function update(){const p=profile();if(!validProfile(p))return; const e=estimates(p);$('#forecast-money').textContent=fmt(e.money);$('#forecast-portions').textContent=fmt(e.portions,1);$('#forecast-calories').textContent=`≈${fmt(e.calories)} ккал`;$('#finish-preview').textContent=`31-й день — ${displayDate(addDays(p.start,30),true)}. Можно начать в любой месяц.`;$('#retro-label').hidden=p.start>=today||Boolean(state&&state.profile.start===p.start);if($('#retro-label').hidden)$('#retro').checked=false;}
 f.drink.addEventListener('change',()=>{f.volume.value=DRINKS[f.drink.value].volume;f.kcal.value=DRINKS[f.drink.value].kcal;update();});
 form.addEventListener('input',update);update();
 form.addEventListener('submit',e=>{e.preventDefault();const p=profile();if(!form.reportValidity()||!validProfile(p)){ $('#form-error').textContent='Проверьте числа и дату: все поля должны быть заполнены.';return;}
 const same=state&&state.profile.start===p.start;
 const checks=same?state.checks:$('#retro').checked?Array.from({length:31},(_,i)=>addDays(p.start,i)).filter(d=>d<today):[];
 state={version:1,profile:p,checks,bingo:state?.bingo||looseBingo};if(save())location.href=`${base}/calendar/`;else{$('#form-error').textContent='Сохранение заблокировано браузером. Включите локальное хранилище и повторите; ваши поля остаются здесь.';}});
}
function renderTracker(){if(!$('#tracker'))return;$('#tracker-empty').hidden=Boolean(state);$('#tracker').hidden=!state;if(!state)return;
 const p=state.profile,n=confirmedDays(state),e=estimates(p,n),day=dayNumber(p.start);
 $('#tracker-range').textContent=`${displayDate(p.start,true)} — ${displayDate(addDays(p.start,30),true)}`;
 $('#tracker-day').textContent=today<p.start?'Скоро ваш первый день':today>addDays(p.start,30)?'Ваши 31 день завершились':`Сегодня день ${day} из 31`;
 $('#confirmed').textContent=n;$('#saved-money').textContent=`≈${fmt(e.money)} ₽`;$('#saved-portions').textContent=fmt(e.portions,1);$('#saved-calories').textContent=`≈${fmt(e.calories)} ккал`;
 $('#milestones').innerHTML=[3,7,14,31].map((v,i)=>`<div class="milestone ${n>=v?'achieved':''}"><span>${n>=v?'✓':String(i+1).padStart(2,'0')}</span><strong>${v} ${pluralDays(v)}</strong><small>${['Начало положено','Неделя — есть','Уже две недели','Я это сделал(а)'][i]}</small></div>`).join('');
 $('#calendar-grid').innerHTML=Array.from({length:31},(_,i)=>{const d=addDays(p.start,i),checked=state.checks.includes(d),future=d>today;return `<button class="day ${checked?'checked':''} ${d===today?'today':''}" data-date="${d}" ${future?'disabled':''} aria-pressed="${checked}" aria-label="${displayDate(d,true)}, день ${i+1}${checked?', отмечен':''}"><small>${displayDate(d)}</small><strong>${i+1}</strong><span>${checked?'✓':d===today?'сегодня':future?'впереди':'отметить'}</span></button>`;}).join('');
 const eligible=today>=p.start&&today<=addDays(p.start,30);$('#check-today').disabled=!eligible;$('#check-today').textContent=eligible?(state.checks.includes(today)?'Снять сегодняшнюю отметку':'Сегодня без алкоголя ✓'):today<p.start?'Старт ещё впереди':'Все 31 дня позади';
 $('#share-days').textContent=`${n} ${pluralDays(n)}`;$('#share-money').textContent=`≈${fmt(e.money)} ₽ осталось на себя`;$('#share-kcal').textContent=`≈${fmt(e.calories)} ккал в напитках`;
 $('#download-card').disabled=n===0;$('#share-status').textContent=n===0?'Карточка появится после первой отметки.':'';
 if($('#native-share'))$('#native-share').hidden=!navigator.share||n===0;
}
function toggleDate(d){if(!state||d>today||d<state.profile.start||d>addDays(state.profile.start,30))return;state.checks=state.checks.includes(d)?state.checks.filter(x=>x!==d):[...state.checks,d];save();renderTracker();}
$('#calendar-grid')?.addEventListener('click',e=>{const b=e.target.closest('[data-date]');if(b){const d=b.dataset.date;toggleDate(d);$(`[data-date="${d}"]`)?.focus();}});
$('#check-today')?.addEventListener('click',()=>toggleDate(todayISO()));
function renderBingo(){if(!$('#bingo-grid'))return;const cells=state?.bingo||looseBingo;$('#bingo-grid').innerHTML=BINGO.map((t,i)=>`<button class="bingo-cell ${cells.includes(i)?'marked':''} ${i===12?'free':''}" data-bingo="${i}" aria-pressed="${cells.includes(i)}"><span>${i===12?'✳':String(i+1).padStart(2,'0')}</span><strong>${t}</strong><small>${cells.includes(i)?'✓':'+'}</small></button>`).join('');const lines=bingoLines(cells);$('#bingo-status').textContent=`${cells.length} / 25 клеток${lines?` · Bingo! Собрано линий: ${lines}. Довольный кивок засчитан.`:' · Соберите пять в ряд, столбец или по диагонали.'}`;}
$('#bingo-grid')?.addEventListener('click',e=>{const b=e.target.closest('[data-bingo]');if(!b)return;const i=Number(b.dataset.bingo),cells=state?.bingo||looseBingo;const next=cells.includes(i)?cells.filter(x=>x!==i):[...cells,i];if(state){state.bingo=next;save();}else{looseBingo=next;write('sober-bingo:v1',next);}renderBingo();$(`[data-bingo="${i}"]`).focus();});
renderTracker();renderBingo();
// Calendar rollover and cross-tab changes never overwrite newer saved state.
window.addEventListener('storage',e=>{if([STORAGE_KEY,'sober-bingo:v1',CONSENT_KEY].includes(e.key))location.reload();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&todayISO()!==today)location.reload();});
setInterval(()=>{if(todayISO()!==today)location.reload();},60000);
$('#reset-open')?.addEventListener('click',()=>$('#reset-dialog').showModal());
$('#reset-confirm')?.addEventListener('click',()=>{try{localStorage.removeItem(STORAGE_KEY);localStorage.removeItem('sober-bingo:v1');state=null;looseBingo=[];renderTracker();renderBingo();toast('Чистый лист готов.');}catch{toast('Не удалось удалить данные. Проверьте настройки браузера.');}});
async function cardBlob(){const n=confirmedDays(state),e=estimates(state.profile,n);const c=document.createElement('canvas');c.width=1080;c.height=1350;const x=c.getContext('2d');x.fillStyle='#ff5a1f';x.fillRect(0,0,1080,1350);x.fillStyle='#191916';x.font='bold 32px Arial';x.fillText('SOBER OCTOBER / МОИ 31',70,92);x.font='bold 215px Arial';x.fillText(String(n).padStart(2,'0'),58,342);x.font='bold 80px Arial';x.fillText(`${pluralDays(n)} без алкоголя`,70,452);x.fillRect(70,512,940,3);x.font='bold 76px Arial';x.fillText(`≈${fmt(e.money)} ₽`,70,640,940);x.font='32px Arial';x.fillText('осталось на себя',70,693);x.font='bold 58px Arial';x.fillText(`≈${fmt(e.calories)} ккал`,70,800,940);x.font='32px Arial';x.fillText('в напитках, которые я не выпил(а)',70,852);x.font='italic 54px Georgia';x.fillText('Потеряно 0 друзей.',70,998);x.fillText('Пока.',70,1065);x.fillStyle='#f4f1e9';x.fillRect(0,1155,1080,195);x.fillStyle='#191916';x.font='bold 32px Arial';x.fillText('soberoctober.ru',70,1220);x.font='23px Arial';x.fillText('Мои отметки · расчёт приблизительный',70,1275);return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('PNG unavailable')),'image/png'));}
$('#download-card')?.addEventListener('click',async()=>{try{const blob=await cardBlob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`sober-october-${confirmedDays(state)}-days.png`;const oldUrl=$('#card-file').href; $('#card-file').href=url; $('#card-file').download=a.download; $('#card-image').src=url; $('#card-result').hidden=false; if(oldUrl.startsWith('blob:'))URL.revokeObjectURL(oldUrl); document.body.append(a);a.click();a.remove();$('#share-status').textContent='Карточка готова. Если загрузка не началась, сохраните изображение по ссылке ниже или долгим нажатием.';}catch{$('#share-status').textContent='Не удалось создать карточку. Попробуйте другой браузер.';}});
$('#native-share')?.addEventListener('click',async()=>{try{const file=new File([await cardBlob()],'sober-october.png',{type:'image/png'});if(navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:'Мой Sober October'});else await navigator.share({title:'Мой Sober October',text:`${confirmedDays(state)} ${pluralDays(confirmedDays(state))} без алкоголя. Потеряно 0 друзей. Пока.`,url:'https://soberoctober.ru/'});}catch(e){if(e.name!=='AbortError')toast('Скачайте карточку и отправьте её вручную.');}});
// Optional integrations are dormant until configured AND explicitly consented to.
const cfg=window.SOBER_CONFIG||{}; if(typeof cfg.contactEmail==='string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfg.contactEmail) && $('[data-contact]')){ const a=document.createElement('a'); a.href='mailto:'+encodeURIComponent(cfg.contactEmail); a.textContent='Контакт владельца: '+cfg.contactEmail; $('[data-contact]').append(a); }
function currentConsent(){const c=read(CONSENT_KEY);return c?.version===1&&typeof c.analytics==='boolean'&&typeof c.ads==='boolean'?c:null;}
function integrations(c){if(c?.analytics&&/^\d+$/.test(String(cfg.metricaId))&&Number(cfg.metricaId)>0){window.ym=window.ym||function(){(window.ym.a=window.ym.a||[]).push(arguments);};window.ym.l=Date.now();const s=document.createElement('script');s.async=true;s.src='https://mc.yandex.ru/metrika/tag.js';document.head.append(s);window.ym(Number(cfg.metricaId),'init',{clickmap:false,trackLinks:false,accurateTrackBounce:true,webvisor:false,sendTitle:false});}
 if(c?.ads&&/^R-A-\d+-\d+$/.test(cfg.rsyaBlockId||'')&&$('#ad-slot')){const slot=$('#ad-slot');slot.hidden=false;window.yaContextCb=window.yaContextCb||[];const load=()=>{const s=document.createElement('script');s.async=true;s.src='https://yandex.ru/ads/system/context.js';document.head.append(s);window.yaContextCb.push(()=>window.Ya.Context.AdvManager.render({blockId:cfg.rsyaBlockId,renderTo:'yandex_rtb'}));};if('IntersectionObserver'in window){const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();load();}},{rootMargin:'200px'});io.observe(slot);}else load();}}
const consent=currentConsent();$('#cookie-banner').hidden=Boolean(consent);integrations(consent);
function saveConsent(analytics,ads){if(write(CONSENT_KEY,{version:1,analytics,ads,updatedAt:new Date().toISOString()}))location.reload();else toast('Выбор не сохранился. Внешние сервисы не включены.');}
$('#cookie-accept').addEventListener('click',()=>saveConsent(true,true));$('#cookie-decline').addEventListener('click',()=>saveConsent(false,false));
$$('[data-cookie-settings]').forEach(b=>b.addEventListener('click',()=>{const c=currentConsent();$('#consent-analytics').checked=c?.analytics||false;$('#consent-ads').checked=c?.ads||false;$('#cookie-dialog').showModal();}));
$('#cookie-save').addEventListener('click',()=>saveConsent($('#consent-analytics').checked,$('#consent-ads').checked));
