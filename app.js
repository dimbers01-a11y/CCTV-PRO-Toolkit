const tools=[
['home','🏠','Home'],['bandwidth','📶','Bandwidth'],['storage','💾','Storage'],
['cameras','📷','Camera Schedule'],['alarms','🚨','Alarm Schedule'],['ip','🌐','IP Addressing'],
['commission','✅','Commissioning'],['survey','📋','Site Survey'],['nvr','🖥️','NVR Configuration'],
['maintenance','🔧','Maintenance']
];
let page='home';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem('cctv_'+k))??d}catch{return d}};
const put=(k,v)=>localStorage.setItem('cctv_'+k,JSON.stringify(v));

function go(p){saveVisible();page=p;render()}
function nav(){ $('nav').innerHTML=tools.map(t=>`<button class="${page===t[0]?'active':''}" onclick="go('${t[0]}')">${t[1]} ${t[2]}</button>`).join('') }
function field(id,label,type='text',value=''){if(type==='textarea')return `<label>${label}<textarea id="${id}">${esc(value)}</textarea></label>`;return `<label>${label}<input id="${id}" type="${type}" value="${esc(value)}"></label>`}
function card(title,sub,body,hero=false){return `<div class="card ${hero?'hero':''}"><h2>${title}</h2>${sub?`<p class="sub">${sub}</p>`:''}${body}</div>`}

function render(){
nav();let h='';
if(page==='home')h=card('CCTV Pro Toolkit','A mobile field toolkit for CCTV engineers.',`<div class="grid">${tools.slice(1).map(t=>`<button class="tool" onclick="go('${t[0]}')"><span>${t[1]}</span><b>${t[2]}</b></button>`).join('')}</div><div class="result">💾 Automatic saving is enabled. Your entries remain on this phone when you move between tools.</div>`,true);
if(page==='bandwidth')h=bandwidth();
if(page==='storage')h=storage();
if(page==='ip')h=ipTool();
if(page==='cameras')h=listPage('cameras','📷 Camera Schedule','Add cameras and record the design details.',['Camera','Location','Make / Model','IP Address','Main FPS','Main Mbps','Sub FPS','Sub Mbps','Recording']);
if(page==='alarms')h=listPage('alarms','🚨 Alarm Schedule','Record multiple alarm types and arming arrangements.',['Camera','Alarm type(s)','Arming type','Schedule','Notes']);
if(page==='commission')h=checkPage('commission','✅ Commissioning Checklist',['Image','Focus / zoom','Time / NTP','Recording','Playback','Motion / analytics','Alarm inputs','Alarm outputs','Network','Storage','User permissions','UPS / power','Labels','Client handover']);
if(page==='maintenance')h=checkPage('maintenance','🔧 Maintenance Checklist',['Image quality','Focus','IR / night image','PTZ operation','Recording / playback','Storage health','Network health','Time / NTP','Alarms / analytics','UPS / power','Firmware','Labels','Client issues']);
if(page==='survey')h=formPage('survey','📋 Site Survey','Record the key site information.',['Site name','Site reference','Survey date','Client / site contact','Scope / requirements','Network / VLAN / IP information','Power / PoE / feeder information','Cable routes / containment / distances','Mounting / mast / access requirements','Access / MEWP / lifting / permits','Risks / RAMS / site constraints']);
if(page==='nvr')h=formPage('nvr','🖥️ NVR Configuration','Store configuration details without passwords.',['NVR make / model','Serial number','Firmware','NVR name / hostname','IP / subnet / gateway / DNS','Disk configuration / capacity / RAID','Recording / retention settings','Network / switch / SFP / uplink details','Usernames / roles — DO NOT enter passwords']);
$('app').innerHTML=h;
loadFormValues();
}

function bandwidth(){return card('📶 Bandwidth Calculator','Calculate combined camera traffic, including thumbnail/extra traffic.',`
<div class="row">${field('bc_n','Number of cameras','number',1)}${field('bc_m','Main stream Mbps','number',4)}${field('bc_s','Sub stream Mbps','number',0.5)}${field('bc_t','Thumbnail / extra Mbps per camera','number',0)}</div>
<button onclick="calcBandwidth()">Calculate</button><div id="bc_r" class="result">Enter values and calculate.</div>`)}
function calcBandwidth(){let n=+bc_n.value||0,m=+bc_m.value||0,s=+bc_s.value||0,t=+bc_t.value||0,total=n*(m+s+t);bc_r.innerHTML=`Total: <b>${total.toFixed(2)} Mbps</b><br>Approx. ${(+total/8).toFixed(2)} MB/s`}

function storage(){return card('💾 Storage Calculator','Estimate storage from bitrate, retention and recording duty cycle.',`
<div class="row">${field('st_n','Number of cameras','number',1)}${field('st_b','Average bitrate Mbps / camera','number',4)}${field('st_d','Retention days','number',31)}${field('st_u','Recording duty %','number',100)}${field('st_o','Overhead %','number',10)}</div>
<button onclick="calcStorage()">Calculate</button><div id="st_r" class="result">Enter values and calculate.</div>`)}
function calcStorage(){let n=+st_n.value||0,b=+st_b.value||0,d=+st_d.value||0,u=(+st_u.value||0)/100,o=1+(+st_o.value||0)/100;let tb=n*b*86400*d*u/8/1e6*o;st_r.innerHTML=`Estimated storage: <b>${tb.toFixed(2)} TB</b><br>≈ ${(tb*.9094947).toFixed(2)} TiB`}

function ipTool(){return card('🌐 IP Addressing','Generate a simple sequential IP list for a camera/device range.',`
<div class="row">${field('ip_base','Network base IP','text','192.168.10.0')}${field('ip_start','Starting host','number',10)}${field('ip_count','Number of addresses','number',20)}</div>
<button onclick="makeIPs()">Generate IPs</button><div id="ip_r"></div>`)}
function makeIPs(){let a=ip_base.value.split('.').map(Number);if(a.length!==4)return;let q=a[0]*16777216+a[1]*65536+a[2]*256+a[3]+(+ip_start.value||1),out=[];for(let i=0;i<+ip_count.value;i++){let z=q+i;out.push([Math.floor(z/16777216)%256,Math.floor(z/65536)%256,Math.floor(z/256)%256,z%256].join('.'))}ip_r.innerHTML='<table><tr><th>#</th><th>IP address</th></tr>'+out.map((x,i)=>`<tr><td>${i+1}</td><td>${x}</td></tr>`).join('')+'</table>'}

function listPage(key,title,sub,cols){
let rows=get(key,[]);
return card(title,sub,`<div id="${key}_rows">${rows.length?rows.map((r,i)=>listRow(key,cols,r,i)).join(''):`<p class="muted">No entries yet. Tap Add row to begin.</p>`}</div>
<div class="actions"><button onclick="addRow('${key}',${JSON.stringify(cols).replace(/"/g,'&quot;')})">＋ Add row</button><button class="secondary" onclick="exportKey('${key}')">Export backup</button><button class="danger" onclick="clearKey('${key}')">Clear all</button><span class="status">● Autosaved</span></div>`)}
function listRow(key,cols,r,i){return `<div class="item"><div class="itemhead"><b>Entry ${i+1}</b><button class="danger smallbtn" onclick="deleteRow('${key}',${i})">Delete</button></div>${cols.map((c,j)=>field(`${key}_${i}_${j}`,c,'text',r[j]||'')).join('')}</div>`}
function addRow(key,cols){saveVisible();let rows=get(key,[]);rows.push(cols.map(()=>''));put(key,rows);render()}
function deleteRow(key,i){saveVisible();let rows=get(key,[]);rows.splice(i,1);put(key,rows);render()}
function clearKey(key){if(confirm('Clear all saved entries for this tool?')){localStorage.removeItem('cctv_'+key);render()}}
function saveList(key){let rows=get(key,[]);rows.forEach((r,i)=>r.forEach((_,j)=>{let x=$(`${key}_${i}_${j}`);if(x)r[j]=x.value}));put(key,rows)}
function saveVisible(){if(page==='cameras')saveList('cameras');if(page==='alarms')saveList('alarms');if(page==='commission')saveChecks('commission');if(page==='maintenance')saveChecks('maintenance');if(page==='survey'||page==='nvr')saveForm(page)}

function checkPage(key,title,items){
let data=get(key,items.map(x=>({item:x,done:false,note:''})));
return card(title,'Tick each item and add notes/results. Changes are saved automatically.',`${data.map((v,i)=>`<div class="item"><label class="check"><input id="${key}_c_${i}" type="checkbox" ${v.done?'checked':''} onchange="saveChecks('${key}')"> ${esc(v.item)}</label><input id="${key}_n_${i}" placeholder="Notes / result" value="${esc(v.note)}" oninput="saveChecks('${key}')"></div>`).join('')}<div class="actions"><button class="secondary" onclick="exportKey('${key}')">Export backup</button><button class="danger" onclick="clearKey('${key}')">Reset</button><span class="status">● Autosaved</span></div>`)}
function saveChecks(key){let data=get(key,[]);data.forEach((v,i)=>{let c=$(`${key}_c_${i}`),n=$(`${key}_n_${i}`);if(c)v.done=c.checked;if(n)v.note=n.value});put(key,data)}

function formPage(key,title,sub,labels){
let old=get(key,{});
return card(title,sub,labels.map((x,i)=>field(`${key}_${i}`,x, x.toLowerCase().includes('date')?'date':x.includes('requirements')||x.includes('information')||x.includes('details')||x.includes('settings')||x.includes('scope')||x.includes('risks')||x.includes('roles')?'textarea':'text',old[i]||'')).join('')+
`<div class="actions"><button class="green" onclick="saveForm('${key}');alert('Saved')">Save</button><button class="secondary" onclick="exportKey('${key}')">Export backup</button><button class="danger" onclick="clearKey('${key}')">Clear</button><span class="status">● Autosaved</span></div>`)}
function saveForm(key){let o={};document.querySelectorAll(`[id^="${key}_"]`).forEach(x=>o[x.id.split('_').slice(1).join('_')]=x.value);put(key,o)}
function loadFormValues(){if(page==='survey'||page==='nvr'){let o=get(page,{});document.querySelectorAll(`[id^="${page}_"]`).forEach(x=>{let k=x.id.substring(page.length+1);if(o[k]!==undefined)x.value=o[k]})}}
function exportKey(key){saveVisible();let data=get(key,{}),blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`cctv-${key}-backup.json`;a.click();URL.revokeObjectURL(a.href)}
function clearKey(key){if(confirm('Delete all saved data for this tool?')){localStorage.removeItem('cctv_'+key);render()}}

document.addEventListener('input',e=>{
 if(e.target.id.startsWith('cameras_'))saveList('cameras');
 if(e.target.id.startsWith('alarms_'))saveList('alarms');
 if(e.target.id.startsWith('commission_')||e.target.id.startsWith('maintenance_'))saveChecks(e.target.id.split('_')[0]);
 if(e.target.id.startsWith('survey_'))saveForm('survey');
 if(e.target.id.startsWith('nvr_'))saveForm('nvr');
});
document.addEventListener('change',e=>{
 if(e.target.id.startsWith('commission_')||e.target.id.startsWith('maintenance_'))saveChecks(e.target.id.split('_')[0]);
});
window.addEventListener('beforeunload',saveVisible);
if('serviceWorker' in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
render();