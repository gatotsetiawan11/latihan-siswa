function randomItem(arr){
  return arr[Math.floor(Math.random()*arr.length)];
}

function shuffle(arr){
  return [...arr].sort(()=>Math.random()-0.5);
}

function generateIPASBab1Questions({
  stage="stage1",
  level=1,
  total=10
}){
  const config = IPAS_BAB1_LEVEL[stage][String(level)];
  const concepts = IPAS_BAB1_CONCEPTS.concepts
    .filter(c=>c.difficulty<=config.difficulty);

  const result=[];

  while(result.length<total){
    const concept=randomItem(concepts);
    const fact=randomItem(concept.facts);

    const options=shuffle([
      fact,
      ...concept.wrong
    ].slice(0,4));

    result.push({
      question: fact,
      options,
      answer: String.fromCharCode(97 + options.indexOf(fact))
    });
  }

  return result;
}
