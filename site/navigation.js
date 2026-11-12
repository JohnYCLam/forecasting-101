// Roadmap labels only. Draft lessons and datasets stay on development branches.
export const upcomingTopics = {
  forecasting: [
    {number:'6',label:'Traditional machine learning',status:'In progress'},
    {number:'7',label:'Prophet',status:'Planned'},
    {number:'8',label:'Traditional deep learning',status:'Planned'},
    {number:'9',label:'Modern deep learning',status:'Planned'},
    {number:'10',label:'Retrieval-augmented generation',status:'Planned'},
    {number:'11',label:'Foundation models',status:'Planned'},
  ],
  calculus: [
    {number:'7',label:'Stratonovich and the λ-family',status:'In progress'},
    {number:'8',label:'Jumps in stochastic models',status:'In progress'},
    {number:'9',label:'ML: learn random dynamics',status:'In progress'},
    {number:'10',label:'ML: distributions and generation',status:'In progress'},
    {number:'11',label:'ML: payoffs and equation solving',status:'In progress'},
    {number:'12',label:'ML: sampling and optimization',status:'In progress'},
  ],
};

export function pendingTopics(topic, publishedMax) {
  const entries=upcomingTopics[topic].filter(item=>parseInt(item.number,10)>publishedMax);
  if(!entries.length)return '';
  return `<section class="pending-topics" aria-label="Upcoming topics"><h2 class="nav-group-title">Coming next</h2><p>These lessons are not yet available.</p><ul>${entries.map(item=>`<li><span class="pending-number">${item.number}</span><div><span class="pending-label">${item.label}</span><span class="topic-status" data-status="${item.status==='Planned'?'planned':'progress'}">${item.status}</span></div></li>`).join('')}</ul></section>`;
}
