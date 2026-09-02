function randomItem(a){
return a[Math.floor(Math.random()*a.length)];
}

function shuffle(a){
return [...a].sort(()=>Math.random()-0.5);
}

function generateIPASBab1Questions({stage="stage1",level=1,total=10}){

const rule=IPAS_BAB1_LEVEL[stage][level];
let pool=IPAS_BAB1_CONCEPTS.concepts.filter(
x=>x.difficulty<=rule.difficulty &&
x.questionTypes.includes(rule.type)
);

if(!pool.length){
pool=IPAS_BAB1_CONCEPTS.concepts;
}

let result=[];
let used=new Set();

while(result.length<total){

let c=randomItem(pool);

if(used.has(c.id+rule.type)){
continue;
}

used.add(c.id+rule.type);

let q=createIPASQuestion(c,rule.type);

if(q){
result.push(q);
}

}

return result;
}


function createIPASQuestion(c,type){

let question="";
let answer="";
let wrong=[...c.wrong];


if(type==="function"){
question=c.name+" digunakan untuk ....";
answer=c.facts.function;
}

else if(type==="understand"){
question="Mengapa "+c.name+" penting bagi manusia?";
answer=c.facts.detail;
}

else if(type==="case"){
question="Budi mengalami kegiatan yang berkaitan dengan "+c.name+". Fungsi yang tepat adalah ....";
answer=c.facts.function;
}


let options=shuffle([
answer,
...wrong
]).slice(0,4);


return {
question,
options,
answer:String.fromCharCode(97+options.indexOf(answer))
};

}
