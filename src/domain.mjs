export const STORAGE_KEY = 'sober-october:v1';
export const CONSENT_KEY = 'sober-consent:v1';
export const DRINKS = {
  wine: {name: 'Вино', volume: 150, kcal: 82, unit: 'бокалов'},
  beer: {name: 'Пиво', volume: 500, kcal: 43, unit: 'порций'},
  cider: {name: 'Сидр', volume: 330, kcal: 50, unit: 'порций'},
  spirits: {name: 'Крепкий алкоголь', volume: 50, kcal: 230, unit: 'порций'},
  cocktail: {name: 'Коктейль', volume: 250, kcal: 90, unit: 'порций'},
  custom: {name: 'Свой вариант', volume: 200, kcal: 60, unit: 'порций'}
};
export const BINGO = ['Пережить пятницу','Чай в баре. Да, можно','Утро без «что вчера?»','Сберечь 5 000 ₽','Попробовать 0.0','«А почему не пьёшь?»','Отказаться от шота','Неделя — есть','Купить себе подарок','Сходить на вечеринку','Выспаться. Просто так','Уйти, когда хочется','FREE / я здесь','Две недели — есть','Найти свой моктейль','Трезвое свидание','Танцевать без разогрева','20 дней. Ничего себе','Устроить киноночь','Не объясняться','25 дней — есть','Пережить субботу','Сберечь 15 000 ₽','31 день — есть','Я это сделал(а)'];
export function todayISO(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function ordinal(s) { if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return NaN; const [y,m,d]=s.split('-').map(Number); const dt=new Date(Date.UTC(y,m-1,d)); return dt.toISOString().slice(0,10)===s ? dt.getTime()/86400000 : NaN; }
export function addDays(s,n) { return new Date((ordinal(s)+n)*86400000).toISOString().slice(0,10); }
export function dayNumber(start,today=todayISO()) { return Math.min(31,Math.max(0,ordinal(today)-ordinal(start)+1)); }
export function validProfile(p) {return p && Object.hasOwn(DRINKS,p.drink) && Number.isFinite(ordinal(p.start)) && p.start>='2000-01-01' && p.start<='2100-12-31' && [['frequency',0,7],['quantity',0.1,30],['volume',10,2000],['price',0,100000],['kcal',0,1000]].every(([k,min,max])=>Number.isFinite(p[k]) && p[k]>=min && p[k]<=max);}
export function estimates(p,days=31) { const portions=p.frequency/7*p.quantity*days; return {portions,money:portions*p.price,calories:portions*p.volume/100*p.kcal}; }
export function sanitizeState(raw) {
  if(!raw || raw.version!==1 || !validProfile(raw.profile)) return null;
  const p=raw.profile;
  return {version:1,profile:p,checks:[...new Set(Array.isArray(raw.checks)?raw.checks:[])].filter(x=>Number.isFinite(ordinal(x)) && x>=p.start && x<=addDays(p.start,30)),bingo:[...new Set(Array.isArray(raw.bingo)?raw.bingo:[])].filter(x=>Number.isInteger(x)&&x>=0&&x<25)};
}
export function confirmedDays(state,today=todayISO()) {return state.checks.filter(x=>x<=today).length;}
export function bingoLines(cells) { const s=new Set(cells); const lines=[]; for(let i=0;i<5;i++){lines.push(Array.from({length:5},(_,j)=>i*5+j));lines.push(Array.from({length:5},(_,j)=>j*5+i));}lines.push([0,6,12,18,24],[4,8,12,16,20]); return lines.filter(l=>l.every(x=>s.has(x))).length; }
export const fmt = (n,decimal=0) => new Intl.NumberFormat('ru-RU',{maximumFractionDigits:decimal}).format(n);
export function pluralDays(n) {return n%10===1&&n%100!==11?'день':n%10>=2&&n%10<=4&&!(n%100>=12&&n%100<=14)?'дня':'дней';}
