// --- PWA & Service Worker Logic ---
// تسجيل Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(err => console.log('SW Error:', err));
    });
}
// --- نهاية أكواد PWA ---


// --- أكواد النظام الأصلية للزبائن والأقساط ---
function switchTab(event, tabId) {
    let i, tabContent, tabBtns;
    tabContent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
        tabContent[i].classList.remove("active");
    }
    tabBtns = document.getElementsByClassName("tab-btn");
    for (i = 0; i < tabBtns.length; i++) {
        tabBtns[i].classList.remove("active");
    }
    document.getElementById(tabId).style.display = "block";
    document.getElementById(tabId).classList.add("active");
    event.currentTarget.classList.add("active");
}

let PASSWORD="1001";
let secureMode=false;
let showOnlyOverdue=false;
let data=JSON.parse(localStorage.getItem("aqsat"))||[];
let receivedThisMonth=+localStorage.getItem("receivedThisMonth")||0;
let lastMonth=new Date().getMonth();

let name=document.getElementById("name");
let item=document.getElementById("item");
let phone=document.getElementById("phone");
let total=document.getElementById("total");
let paid=document.getElementById("paid");
let search=document.getElementById("search");
let list=document.getElementById("list");
let totalDebtEl=document.getElementById("totalDebt");
let receivedEl=document.getElementById("receivedThisMonth");
let reportModal=document.getElementById("reportModal");
let reportTable=document.getElementById("reportTable");
let loginBtn=document.getElementById("loginBtn");
let closeBtn=document.getElementById("closeBtn");
let printEditBox=document.getElementById("printEditBox");
let printBtn=document.getElementById("printBtn");
let editDeleteBtn=document.getElementById("editDeleteBtn");
let closeReportBtn=document.getElementById("closeReportBtn");
let backupBtn=document.getElementById("backupBtn");
let restoreBtn=document.getElementById("restoreBtn");

function resetMonthlyReceived(){let now=new Date();if(now.getMonth()!=lastMonth){receivedThisMonth=0;localStorage.setItem("receivedThisMonth",receivedThisMonth);lastMonth=now.getMonth();}}
setInterval(resetMonthlyReceived,1000*60*60);

function save(){localStorage.setItem("aqsat",JSON.stringify(data)); localStorage.setItem("receivedThisMonth",receivedThisMonth);}
function formatNumber(n){return n.toLocaleString('de-DE');}
function daysBetween(d){return (Date.now()-new Date(d).getTime())/86400000;}
function lastPayDate(c){return c.log.length?c.log[c.log.length-1].date:null;}

function show(){
    resetMonthlyReceived();
    let q=search.value.toLowerCase();
    list.innerHTML="";
    let totalDebt=0;
    data.forEach((c,index)=>{
        let match=c.name.toLowerCase().includes(q)||c.phone.includes(q);
        let last=lastPayDate(c)||c.createdAt;
        let overdue=last&&daysBetween(last)>30;
        if(showOnlyOverdue && !overdue) return;
        if(!match) return;
        let rem=c.total-c.paid;
        totalDebt+=rem;
        let tr=document.createElement("tr");
        tr.innerHTML=`<td>${index+1}</td><td>${c.name}</td><td>${c.item}</td><td>${c.phone}</td><td>${formatNumber(c.total)}</td><td>${formatNumber(c.paid)}</td><td>${formatNumber(rem)}</td><td><button class="whatsapp">💬</button></td>${secureMode?`<td><button class="pay">تسديد</button></td><td><button class="addDebt">➕</button></td><td><button class="report">كشف</button></td>`:""}`;
        list.appendChild(tr);
        tr.querySelectorAll(".whatsapp").forEach(b=>b.addEventListener("click",()=>showWhatsapp(index)));
        tr.querySelectorAll(".pay").forEach(b=>b.addEventListener("click",()=>pay(index)));
        tr.querySelectorAll(".addDebt").forEach(b=>b.addEventListener("click",()=>addDebt(index)));
        tr.querySelectorAll(".report").forEach(b=>b.addEventListener("click",()=>showReport(index)));
    });
    totalDebtEl.innerHTML = `💰 مجموع الديون: ${formatNumber(totalDebt)} | 💵 الديون المستلمة للشهر: <span id="receivedThisMonth">${formatNumber(receivedThisMonth)}</span>
    <button onclick="resetReceived()" style="margin-left:10px;padding:5px 10px;background:#c62828;color:#fff;border:none;border-radius:5px;cursor:pointer;font-weight:bold;">❌ حذف الديون المستلمة</button>`;
}

function add(){
    if(!name.value||!item.value||!phone.value||total.value<=0) return alert("أكمل البيانات");
    let newItems = [{name:item.value, price:+total.value}];
    data.push({name:name.value,item:item.value,phone:phone.value,total:+total.value,paid:+paid.value,log:[],items:newItems,createdAt:new Date()});
    save();
    show();
    name.value = "";
    item.value = "";
    phone.value = "";
    total.value = "";
    paid.value = "";
}

function pay(index){let c=data[index];let amount=+prompt("ادخل مبلغ التسديد:");if(amount<=0 || amount> (c.total - c.paid)) return alert("مبلغ غير صالح");c.paid+=amount;c.log.push({type:"pay",amount,date:new Date()});receivedThisMonth+=amount;save(); show();}
function addDebt(index){let c=data[index];let amount=+prompt("ادخل مبلغ الدين الجديد:");if(amount<=0) return alert("مبلغ غير صالح");let newItem=prompt("ادخل نوع السلعة الجديدة:");if(!newItem) return alert("أكمل نوع السلعة");c.total+=amount;c.item += " + " + newItem;c.items.push({name:newItem, price:amount});c.log.push({type:"debt",amount,date:new Date()});save(); show();}

function showReport(index){
    let c = data[index];

    let htmlMain = `<table style="width:100%;border-collapse:collapse;font-weight:bold;margin-bottom:10px;">
    <tr><th>الاسم</th><th>رقم الهاتف</th><th>نوع السلع</th><th>المدفوع</th><th>المتبقي</th></tr>
    <tr><td>${c.name}</td><td>${c.phone}</td><td>${c.item}</td><td>${formatNumber(c.paid)}</td><td>${formatNumber(c.total-c.paid)}</td></tr>
    </table>`;

    let htmlLog = `<table style="width:100%;border-collapse:collapse;font-weight:bold;margin-bottom:10px;">
    <tr><th>#</th><th>نوع</th><th>المبلغ</th><th>التاريخ</th><th>حذف</th></tr>`;
    c.log.forEach((l,i)=>{
        if(l.type === "pay"){
            htmlLog += `<tr><td>${i+1}</td><td>تسديد</td><td>${formatNumber(l.amount)}</td><td>${new Date(l.date).toLocaleString()}</td><td><button class="deletePay" data-l="${i}">❌</button></td></tr>`;
        }
    });
    htmlLog += "</table>";

    if(!c.items) c.items = [];
    let htmlItems = `<h4>📦 المواد المشتراة</h4><table style="width:100%;border-collapse:collapse;font-weight:bold;">
    <tr><th>#</th><th>المادة</th><th>السعر</th><th>حذف</th></tr>`;
    c.items.forEach((it,idx)=>{
        htmlItems += `<tr><td>${idx+1}</td><td>${it.name}</td><td>${formatNumber(it.price)}</td><td><button class="deleteItem" data-i="${idx}">❌</button></td></tr>`;
    });
    htmlItems += "</table>";

    reportTable.innerHTML = htmlMain + htmlLog + htmlItems;
    reportModal.style.display="block";

    reportTable.querySelectorAll(".deletePay").forEach(b=>{
        b.addEventListener("click",()=>{
            let lIndex = b.dataset.l;
            if(confirm("تأكيد حذف هذه الدفعة؟")){
                let logItem = c.log[lIndex];
                if(logItem.type=="pay"){c.paid-=logItem.amount; receivedThisMonth-=logItem.amount;}
                c.log.splice(lIndex,1);
                save(); show(); showReport(index);
            }
        });
    });

    reportTable.querySelectorAll(".deleteItem").forEach(b=>{
        b.addEventListener("click",()=>{
            let iIndex = b.dataset.i;
            if(confirm("تأكيد حذف هذه المادة؟")){
                let price = c.items[iIndex].price;
                c.total -= price;
                c.items.splice(iIndex,1);
                save(); show(); showReport(index);
            }
        });
    });
}

closeReportBtn.addEventListener("click",()=>{reportModal.style.display="none";});

function resetReceived(){if(confirm("هل تريد حذف الديون المستلمة لهذا الشهر؟")){receivedThisMonth=0;localStorage.setItem("receivedThisMonth",receivedThisMonth);show();}}
function filterOverdue(){showOnlyOverdue=true; show();}
function resetFilter(){showOnlyOverdue=false; search.value=""; show();}
function showWhatsapp(index){let c=data[index];let rem=c.total - c.paid;let msg=`مرحبا ${c.name}%0Aرصيدك المتبقي: ${formatNumber(rem)} دينار`;window.open(`https://wa.me/${c.phone}?text=${msg}`, '_blank');}

printBtn.addEventListener("click",()=>{
    let rows=""; data.forEach((c,i)=>{rows+=`<tr><td>${i+1}</td><td>${c.name}</td><td>${c.item}</td><td>${c.phone}</td><td>${formatNumber(c.total)}</td><td>${formatNumber(c.paid)}</td><td>${formatNumber(c.total-c.paid)}</td></tr>`;});
    let w=window.open("","","width=900,height=700"); w.document.write(`<html dir="rtl"><head><meta charset="UTF-8"><style>body{font-family:Arial;text-align:center;font-weight:bold}table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:6px;font-weight:bold}th{background:#eee}</style></head><body><h3>قائمة الأقساط</h3><table><tr><th>#</th><th>الاسم</th><th>السلعة</th><th>الهاتف</th><th>الكلي</th><th>المدفوع</th><th>الباقي</th></tr>${rows}</table></body></html>`); w.document.close(); w.print();
});

editDeleteBtn.addEventListener("click",()=>{
    let n=prompt("رقم الزبون:"); if(!n) return; let i=n-1; if(!data[i]) return alert("رقم غير صحيح");
    let a=prompt("1 حذف | 2 تعديل"); if(a=="1"){if(confirm("تأكيد الحذف؟")){data.splice(i,1);save();show();}} 
    else if(a=="2"){let c=data[i];c.name=prompt("الاسم",c.name)||c.name;c.phone=prompt("الهاتف",c.phone)||c.phone;c.item=prompt("السلعة",c.item)||c.item;c.total=+prompt("الكلي",c.total)||c.total;c.paid=+prompt("المدفوع",c.paid)||c.paid;save();show();}});

backupBtn.addEventListener("click", () => {
    const dataStr = JSON.stringify(data);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;a.download = "backup_aqsat.json";
    a.click();
    URL.revokeObjectURL(url);
});

restoreBtn.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = event => {
            try {
                data = JSON.parse(event.target.result);
                save();
                show();
                alert("تم استرجاع النسخة الاحتياطية بنجاح!");
            } catch(err) {
                alert("خطأ في الملف!");
            }
        };
        reader.readAsText(file);
    };
    input.click();
});

function login(){
    if(prompt("كلمة المرور:")==PASSWORD){
        secureMode=true;
        loginBtn.style.display="none";
        closeBtn.style.display="block";
        printEditBox.classList.remove("hidden");
        document.querySelectorAll(".secure").forEach(e=>e.classList.remove("hidden"));
        show();
    }
}

function closePayment(){
    secureMode=false;
    loginBtn.style.display="block";
    closeBtn.style.display="none";
    printEditBox.classList.add("hidden");
    document.querySelectorAll(".secure").forEach(e=>e.classList.add("hidden"));
    show();
}

show();
