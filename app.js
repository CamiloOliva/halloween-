(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = (id, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const cfg = window.GIFT_CONFIG;
  const name = esc(cfg.name || 'Nailyn');
  const STORE = 'noctilucia-gift-v1';
  const fresh = () => ({started:false,done:0,flies:[],mix:[],stars:[],candles:[],wish:'',letter:false});
  const ingredients = [
    {id:'rocio',name:'Rocío de luna',color:'#b3c6e6',symbol:'moon'},
    {id:'petalo',name:'Pétalo de ternura',color:'#e4a5bd',symbol:'heart'},
    {id:'sombra',name:'Sombra de ayer',color:'#9f94b6',symbol:'leaf'},
    {id:'polvo',name:'Polvo de alegría',color:'#e5c588',symbol:'spark'},
    {id:'brasa',name:'Brasa de valor',color:'#e6a17f',symbol:'star'},
    {id:'niebla',name:'Niebla del olvido',color:'#a5c1b7',symbol:'moon'}
  ];
  const starNodes = [
    {id:'moon',label:'Luna',x:24,y:31},
    {id:'heart',label:'Corazón',x:53,y:20},
    {id:'star',label:'Estrella',x:75,y:43},
    {id:'home',label:'Hogar',x:51,y:75},
    {id:'leaf',label:'Bosque',x:25,y:66},
    {id:'potion',label:'Poción',x:78,y:74}
  ];
  function readState() {
    try {
      const value = JSON.parse(localStorage.getItem(STORE));
      if (!value || typeof value !== 'object') return fresh();
      const state = fresh();
      state.started = value.started === true;
      state.done = Number.isInteger(value.done) ? Math.max(0,Math.min(3,value.done)) : 0;
      state.flies = [...new Set(Array.isArray(value.flies) ? value.flies.filter(v=>Number.isInteger(v)&&v>=0&&v<5) : [])];
      state.mix = Array.isArray(value.mix) ? value.mix.filter(v=>ingredients.some(i=>i.id===v)).slice(0,3) : [];
      const expected=['moon','heart','star','home'];
      state.stars=[];
      if(Array.isArray(value.stars)) for(let i=0;i<Math.min(4,value.stars.length);i++){if(value.stars[i]!==expected[i])break;state.stars.push(value.stars[i]);}
      state.candles = [...new Set(Array.isArray(value.candles) ? value.candles.filter(v=>Number.isInteger(v)&&v>=0&&v<3) : [])];
      state.wish = typeof value.wish === 'string' ? value.wish.slice(0,240) : '';
      state.letter = value.letter === true && state.done===3 && state.candles.length===3;
      return state;
    } catch { return fresh(); }
  }
  let state = readState();
  let view = 'home';
  let busy = false;
  let toastTimer;
  let previousFocus;
  let fireworks = [];
  const main = $('#main');
  const modal = $('#modal');
  const chapterNames = ['El bosque de los susurros','La alquimia de los deseos','El cielo que te recuerda'];
  const chapterShort = ['El bosque de los susurros','El jardín de los deseos','El observatorio lunar'];
  const rewards = [
    {title:'Tu luz no se pierde.',word:'La luz',text:'Las luciérnagas forman una estrella entre tus manos. No brillaban por un hechizo: estaban esperando a alguien que se detuviera a verlas.',meaning:'Que este nuevo año te encuentre rodeada de personas que sepan ver tu luz, incluso cuando tú la olvides.'},
    {title:'Lo bonito también se construye.',word:'El deseo',text:'La poción cambia de violeta a dorado. Dentro del frasco aparece el segundo fragmento. Huele a comienzos, a abrazos largos y a cosas buenas que todavía no tienen nombre.',meaning:'Que tengas valor para empezar, ternura para cuidarte y alegría para disfrutar el camino.'},
    {title:'Siempre hay un camino a casa.',word:'El encuentro',text:'Las estrellas dibujan un hilo de oro sobre la mansión. Las ventanas se encienden una por una. En la puerta, una inscripción comienza a brillar: «Faltabas tú».',meaning:'Que, vayas adonde vayas, siempre encuentres un amor en el que puedas sentirte en casa.'}
  ];
  function save() { try { localStorage.setItem(STORE,JSON.stringify(state)); } catch { /* The adventure remains playable without storage. */ } }
  function toast(message) { const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3500); }
  function ghost() {return '<div class="ghost" aria-hidden="true"><span class="ghost-eye left"></span><span class="ghost-eye right"></span><span class="ghost-cheek left"></span><span class="ghost-cheek right"></span></div>';}
  function guide(text){return `<aside class="guide">${ghost()}<div><small>LÚMEN · TU GUÍA DE ESTA NOCHE</small><p>“${text}”</p></div></aside>`;}
  function showModal(html, callback) {
    if(modal.open)modal.close();
    previousFocus=document.activeElement;
    $('#modal-content').innerHTML=html;
    modal.showModal();
    const action=$('[data-modal-action]',modal);
    if(action) action.addEventListener('click',()=>{modal.close();if(callback)callback();});
  }
  $('.modal-close').addEventListener('click',()=>modal.close());
  modal.addEventListener('click',event=>{if(event.target===modal){const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)modal.close();}});
  modal.addEventListener('close',()=>{if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});});
  function navigate(next) {
    busy=false;view=next;
    if(next==='home')renderHome();
    else if(next==='forest')renderForest();
    else if(next==='potion')renderPotion();
    else if(next==='stars')renderStars();
    else if(next==='finale')renderFinale();
    window.scrollTo({top:0,behavior:'instant'});
    main.focus({preventScroll:true});
  }
  function nextView(){return ['forest','potion','stars','finale'][state.done];}
  function chapterCard(i) {
    const complete=state.done>i,locked=state.done<i;
    return `<button class="chapter-card ${complete?'complete':''}" data-chapter="${i}" data-num="0${i+1}" ${locked?'disabled':''}><span class="chapter-symbol">${icon(['leaf','potion','moon'][i])}</span><span><small>CAPÍTULO 0${i+1}</small><h3>${chapterShort[i]}</h3><span class="chapter-status">${icon(complete?'check':locked?'lock':'spark')}${complete?'Fragmento recuperado':locked?'Aún por descubrir':state.started?'Tu aventura continúa aquí':'Aquí comienza la magia'}</span></span>${icon('arrow','chapter-arrow')}</button>`;
  }
  function renderHome() {
    main.innerHTML=`<section class="home" aria-labelledby="home-title"><div class="hero"><div class="hero-copy"><div class="eyebrow">UNA AVENTURA DE CUMPLEAÑOS PARA ${name}</div><h1 id="home-title">La noche que<br>la luna <em>te eligió.</em></h1><p class="hero-description">Hay noches que guardan secretos.<br>Y una, cada año, que celebra que <strong>tú existes.</strong><br>Esta noche, la magia tiene tu nombre.</p><div class="hero-actions"><button class="primary" id="start">${state.letter?'Volver a mi regalo':state.started?'Continuar mi aventura':'Abrir mi aventura'}${icon('arrow')}</button><button class="text-button" id="premise">Leer el prólogo ${icon('book')}</button></div><div class="hero-meta"><span>${icon('moon')}Una noche. Tres secretos.</span><i></i><span>5–10 min de magia</span></div></div><div class="date-seal" aria-label="31 de octubre, tu noche"><span>OCTUBRE</span><strong>31</strong><span>TU NOCHE</span></div><div class="dedicated">Para ti, ${name}.<span>CON TODO MI AMOR</span></div></div><section class="journey" aria-labelledby="journey-title"><div class="section-heading"><h2 id="journey-title"><span>✧</span> TRES LUGARES. UN SOLO DESTINO.</h2><p>${state.done?`${state.done} de 3 fragmentos de luz`:'Cada paso te acerca a tu sorpresa.'}</p></div><div class="chapter-grid">${[0,1,2].map(chapterCard).join('')}</div><p class="home-note">${icon('heart')} No todas las historias de Halloween dan miedo. Algunas enamoran.</p></section></section>`;
    $('#start').addEventListener('click',()=>{if(state.started)navigate(nextView());else opening();});
    $('#premise').addEventListener('click',opening);
    $$('[data-chapter]').forEach(button=>button.addEventListener('click',()=>{const i=Number(button.dataset.chapter);if(i<state.done)showReward(i,true);else if(!state.started)opening();else navigate(nextView());}));
  }
  function opening() {
    showModal(`<span class="modal-icon">${icon('moon')}</span><p class="modal-eyebrow">PRÓLOGO · LA CARTA DE MEDIANOCHE</p><h2 id="modal-title">Te estábamos esperando,<br>${name}.</h2><p>En Noctilucia, el 31 de octubre no es una noche cualquiera. Es la noche en la que la luna enciende una estrella por cada persona que nació bajo su luz.</p><p>Pero tu estrella era distinta. Al intentar guardar en ella todo lo que mereces, se dividió en tres fragmentos y cayó sobre el bosque, el jardín y el observatorio.</p><blockquote>“Soy Lúmen. Pequeño fantasma, gran organizador de sorpresas. Y, bueno… necesito un poquito de tu ayuda.”</blockquote><p>Recupera los tres fragmentos. La mansión guarda algo que solo puede abrirse contigo.</p><button class="primary" data-modal-action>Seguir a Lúmen ${icon('arrow')}</button>`,()=>{state.started=true;save();navigate(nextView());});
  }
  function frame(chapter,title,story,quote,challengeTitle,challengeMeta,challengeHTML,bottom) {
    main.innerHTML=`<section class="game" aria-labelledby="game-title"><div class="game-header"><button class="back-button" id="back">${icon('arrow')}Volver al mapa</button><div class="progress-track"><span>FRAGMENTOS DE LUZ</span>${[0,1,2].map(i=>`<i class="fragment ${state.done>i?'filled':''}" aria-label="${state.done>i?'Recuperado':'Pendiente'}"></i>`).join('')}</div></div><div class="game-layout"><div class="story-panel"><div class="eyebrow">CAPÍTULO 0${chapter+1} · ${['LA LUZ','EL DESEO','EL ENCUENTRO'][chapter]}</div><h1 id="game-title">${title}</h1><p>${story}</p>${guide(quote)}<button class="hint-button" id="hint">${icon('spark')}Un susurro de ayuda</button><p class="hint-text" id="hint-text" role="status"></p></div><section class="play-panel" aria-label="${esc(challengeTitle)}"><div class="panel-bar"><span>${challengeTitle}</span><span id="challenge-meta" aria-live="polite">${challengeMeta}</span></div>${challengeHTML}<div class="panel-bottom" id="panel-bottom">${bottom}</div></section></div></section>`;
    $('#back').addEventListener('click',()=>navigate('home'));
  }
  function renderForest() {
    if(state.flies.length===5){complete(0);return;}
    const positions=[[12,25],[40,13],[76,36],[26,63],[63,70]];
    frame(0,'El bosque de<br>los susurros.','El sendero se ha quedado a oscuras. Entre las ramas, cinco luciérnagas custodian palabras que la noche guardó para ti.<br><br><strong>Toca las cinco luces doradas</strong> para devolverle su brillo al bosque. Cada una recuerda algo que mereces llevar contigo.', 'A veces, para encontrar la magia, solo hay que mirar un poquito más despacio.', 'EL CLARO DE LAS LUCIÉRNAGAS', `${state.flies.length} / 5 luces`, `<div class="forest-scene">${positions.map(([x,y],i)=>`<button class="firefly ${state.flies.includes(i)?'found':''}" data-fly="${i}" style="left:${x}%;top:${y}%;animation-delay:-${i*.83}s" aria-label="Recoger luciérnaga ${i+1}" ${state.flies.includes(i)?'disabled':''}></button>`).join('')}<div class="forest-label">Hasta las noches oscuras guardan luz.</div></div>`,`<div class="jar-meter" aria-hidden="true">${[0,1,2,3,4].map(i=>`<span class="${state.flies.length>i?'lit':''}"></span>`).join('')}</div><span id="forest-status">Encuentra las luces que respiran entre los árboles.</span>`);
    $('#hint').addEventListener('click',()=>{$('#hint-text').textContent='Busca dos luces arriba, una hacia la derecha y dos cerca del suelo. También puedes encontrarlas con Tab y Enter.';$$('.firefly:not(.found)').forEach(b=>b.style.outline='1px solid #e3b98f77');});
    $$('[data-fly]').forEach(button=>button.addEventListener('click',()=>{
      const i=Number(button.dataset.fly);if(state.flies.includes(i)||busy)return;
      state.flies.push(i);save();button.disabled=true;button.classList.add('found');chime(523.25+i*50);
      const words=['Valentía','Ternura','Alegría','Calma','Amor'];
      const word=document.createElement('span');word.className='reveal-word';word.textContent=words[i];word.style.left=button.style.left;word.style.top=button.style.top;$('.forest-scene').append(word);setTimeout(()=>word.remove(),2600);
      $('#challenge-meta').textContent=`${state.flies.length} / 5 luces`;
      $$('.jar-meter span').forEach((el,j)=>el.classList.toggle('lit',j<state.flies.length));
      $('#forest-status').textContent=`${words[i]}. Una palabra para tu nuevo año.`;
      if(state.flies.length===5){busy=true;setTimeout(()=>{if(view==='forest')complete(0);},1000);}
    }));
  }
  function bottle(ingredient) {
    return `<svg viewBox="0 0 45 54" aria-hidden="true" style="color:${ingredient.color}"><path d="M17 4h11v6H17z" fill="#ac8c78" stroke="#d1b499"/><path d="M18 11v8C6 26 7 44 14 49c4 3 14 3 19-1 6-6 4-22-6-29v-8Z" fill="${ingredient.color}18"/><path d="M11 34c6-4 17 3 24-1v9c0 12-24 12-24 0Z" fill="${ingredient.color}66" stroke="none"/><path d="M17 14h11M15 28l-1 5"/><use href="#i-${ingredient.symbol}" x="17" y="30" height="12" width="12"/></svg>`;
  }
  function renderPotion() {
    frame(1,'El jardín de<br>los deseos.','Tras la verja crecen flores que solo se abren en los cumpleaños. Una bruja amable dejó seis frascos y una receta para tu próximo viaje alrededor del sol.<br><br><strong>Elige tres ingredientes, en el orden del poema,</strong> y prepara tu deseo. Aquí equivocarse también es parte de la magia.', 'Primero, valor para dar el paso. Después, ternura para abrazar el camino. Al final, alegría para celebrarlo.', 'EL TALLER DE ALQUIMIA', 'Una receta para ti', `<div class="potion-area"><div class="cauldron" aria-hidden="true"><span></span><span></span></div><div class="ingredient-grid">${ingredients.map(i=>`<button class="ingredient" data-ingredient="${i.id}" aria-pressed="false" aria-label="Añadir ${i.name}">${bottle(i)}<span>${i.name}</span></button>`).join('')}</div><div class="mix-slot" id="mix-slots" aria-label="Ingredientes elegidos" aria-live="polite"></div><div class="mix-actions"><button class="primary small-primary" id="brew">Preparar mi deseo ${icon('spark')}</button><button class="reset-button" id="reset-mix">Vaciar el caldero</button></div><p class="potion-error" id="potion-error" role="status"></p></div>`, '<span class="dot"></span> La receta está en las palabras de Lúmen.');
    updateMix();
    $('#hint').addEventListener('click',()=>{$('#hint-text').textContent='El orden es: Brasa de valor → Pétalo de ternura → Polvo de alegría.';});
    $$('[data-ingredient]').forEach(button=>button.addEventListener('click',()=>{
      if(state.mix.length>=3){toast('El caldero ya tiene tres ingredientes. Prepáralo o vacíalo para probar de nuevo.');return;}
      const id=button.dataset.ingredient;if(state.mix.includes(id)){toast('Ese ingrediente ya está en el caldero.');return;}
      state.mix.push(id);save();updateMix();$('#potion-error').textContent='';chime(329.63+state.mix.length*50);
    }));
    $('#reset-mix').addEventListener('click',()=>{state.mix=[];save();updateMix();$('#potion-error').textContent='El caldero está listo para un nuevo intento.';});
    $('#brew').addEventListener('click',()=>{
      if(state.mix.length!==3||busy)return;
      if(state.mix.join(',')==='brasa,petalo,polvo'){busy=true;$('#brew').disabled=true;$('.cauldron').style.boxShadow='0 0 65px #e3b98f99';$('#potion-error').style.color='var(--gold)';$('#potion-error').textContent='La magia se vuelve dorada…';chime(659.25);setTimeout(()=>{if(view==='potion')complete(1);},1100);}
      else{$('#potion-error').textContent='La poción suspira: recuerda el orden del poema. Puedes volver a intentarlo.';state.mix=[];save();updateMix();}
    });
  }
  function updateMix() {
    $('#mix-slots').innerHTML=[0,1,2].map(i=>{const found=ingredients.find(v=>v.id===state.mix[i]);return `<span class="${found?'added':''}">${found?esc(found.name.split(' de ')[0]):`0${i+1}`}</span>`;}).join('');
    $$('[data-ingredient]').forEach(button=>button.setAttribute('aria-pressed',String(state.mix.includes(button.dataset.ingredient))));
    $('#brew').disabled=state.mix.length!==3;
  }
  function renderStars() {
    if(state.stars.length===4){complete(2);return;}
    frame(2,'El cielo que<br>te recuerda.','En lo alto del observatorio, un mapa de estrellas espera una última historia. No se lee con los ojos, sino con eso que nos hace volver a alguien.<br><br><strong>Une cuatro símbolos en el orden del mensaje de Lúmen.</strong> Cada clic dibuja un tramo de tu constelación.', 'La luna te vio llegar. Tu corazón aprendió a querer. Una estrella te enseñó a soñar. Y el amor te dio un hogar.', 'TU CONSTELACIÓN', `${state.stars.length} / 4 estrellas`, `<div class="constellation"><div class="starfield" aria-hidden="true"></div><div class="astrolabe" aria-hidden="true"></div><svg class="star-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline id="constellation-line" fill="none" points=""/></svg>${starNodes.map(s=>`<button class="star-node" data-star="${s.id}" style="left:${s.x}%;top:${s.y}%" aria-label="Estrella ${s.label}" aria-pressed="false">${icon(s.id)}<span>${s.label}</span></button>`).join('')}<div class="constellation-counter" id="star-status" role="status">TU HISTORIA TAMBIÉN ESTÁ ESCRITA AQUÍ</div></div>`,`<span class="sequence-note" id="star-sequence">Escucha el mensaje. Traza tu camino.</span>`);
    updateStars();
    $('#hint').addEventListener('click',()=>{$('#hint-text').textContent='Une Luna → Corazón → Estrella → Hogar. Si te equivocas, puedes empezar de nuevo.';});
    $$('[data-star]').forEach(button=>button.addEventListener('click',()=>{
      if(busy)return;
      const expected=['moon','heart','star','home'];
      if(button.dataset.star===expected[state.stars.length]){
        state.stars.push(button.dataset.star);save();updateStars();chime([440,523.25,659.25,880][state.stars.length-1]);
        if(state.stars.length===4){busy=true;$('#star-status').textContent='LA MANSIÓN HA DESPERTADO';setTimeout(()=>{if(view==='stars')complete(2);},1100);}
      }else{state.stars=[];save();updateStars();$('#star-status').textContent='LAS ESTRELLAS TE INVITAN A INTENTARLO DE NUEVO';$('.constellation').classList.remove('shake');void $('.constellation').offsetWidth;$('.constellation').classList.add('shake');}
    }));
  }
  function updateStars(){
    $('#constellation-line').setAttribute('points',state.stars.map(id=>{const node=starNodes.find(s=>s.id===id);return `${node.x},${node.y-3.5}`;}).join(' '));
    $$('[data-star]').forEach(b=>{const selected=state.stars.includes(b.dataset.star);b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
    $('#challenge-meta').textContent=`${state.stars.length} / 4 estrellas`;
    $('#star-sequence').textContent=state.stars.length?state.stars.map(id=>starNodes.find(s=>s.id===id).label).join(' → '):'Escucha el mensaje. Traza tu camino.';
  }
  function complete(chapter){
    if(state.done>chapter){navigate(nextView());return;}
    state.done=chapter+1;save();busy=false;navigate('home');burst();showReward(chapter);
  }
  function showReward(chapter,readOnly=false){
    const reward=rewards[chapter];
    showModal(`<div class="reward-mark" aria-hidden="true">✧</div><p class="modal-eyebrow">FRAGMENTO 0${chapter+1} · ${reward.word}</p><h2 id="modal-title">${reward.title}</h2><p>${reward.text}</p><blockquote>${reward.meaning}</blockquote><button class="primary" data-modal-action>${readOnly?'Volver al mapa':chapter===2?'Entrar en la mansión':'Seguir mi camino'}${icon('arrow')}</button>`,()=>{if(!readOnly){if(chapter===2)revelation();else navigate(nextView());}});
  }
  function revelation(){
    showModal(`<span class="modal-icon">${icon('heart')}</span><p class="modal-eyebrow">EL SECRETO DE NOCTILUCIA</p><h2 id="modal-title">No era un hechizo.<br>Era una sorpresa.</h2><p>Al abrir la puerta, lo entiendes todo. Las calabazas son farolitos de fiesta. Los fantasmas cuelgan guirnaldas. Y la luna no vigilaba la mansión: estaba esperando tu llegada.</p><blockquote>“Hay quien ve el 31 de octubre como la noche de las brujas. Alguien lo ve como el día en que nació su persona favorita.”</blockquote><p>Sobre la mesa hay un pastel, tres velas y una carta. En el sobre se lee: <strong>«Para ${name}, con todo mi amor».</strong></p><button class="primary" data-modal-action>Descubrir mi regalo ${icon('heart')}</button>`,()=>navigate('finale'));
  }
  function renderFinale(){
    const letter=state.letter;
    main.innerHTML=`<section class="finale" aria-labelledby="final-title"><div class="eyebrow">31 DE OCTUBRE · EL MUNDO TUVO SUERTE</div><h1 id="final-title">Feliz cumpleaños,<br><em>${name}.</em></h1><p class="finale-intro">El bosque encontró su luz. El cielo, su estrella.<br>Y esta noche encontró su razón de ser: tú.</p>${letter?'':`<div class="cake-stage"><div class="cake-plate" aria-hidden="true"></div><div class="cake" aria-hidden="true"></div>${[0,1,2].map(i=>`<button class="candle ${state.candles.includes(i)?'out':''}" data-candle="${i}" aria-label="Apagar vela ${i+1}" ${state.candles.includes(i)?'disabled':''}><span class="candle-stick"></span><span class="flame"></span></button>`).join('')}</div><div class="wish-form"><label for="wish">Antes de abrir la carta, pide un deseo.</label><textarea id="wish" maxlength="240" rows="2" placeholder="Algo bonito que quieras para tu nuevo año…">${esc(state.wish)}</textarea><p class="privacy-note">Este deseo es solo tuyo. Se guarda únicamente en este navegador.</p></div><p class="candle-instruction" id="candle-instruction" role="status">${state.candles.length===3?'Tu deseo ya viaja con la luna. La carta te espera.':'Toca las tres llamas para apagar las velas.'}</p><button class="primary" id="open-letter" ${state.candles.length<3?'disabled':''}>Abrir la carta para mí ${icon('heart')}</button>`}<div id="letter-container">${letter?letterMarkup():''}</div></section>`;
    if(letter){bindFinalActions();return;}
    $('#wish').addEventListener('input',event=>{state.wish=event.target.value;save();});
    $$('[data-candle]').forEach(button=>button.addEventListener('click',()=>{
      const id=Number(button.dataset.candle);if(state.candles.includes(id))return;
      state.candles.push(id);save();button.classList.add('out');button.disabled=true;chime(392+id*65);
      $('#candle-instruction').textContent=state.candles.length===3?'Tu deseo ya viaja con la luna. La carta te espera.':`${state.candles.length} de 3 velas apagadas. Que venga todo lo bonito.`;
      if(state.candles.length===3){$('#open-letter').disabled=false;burst();}
    }));
    $('#open-letter').addEventListener('click',()=>{if(state.candles.length!==3)return;state.letter=true;save();renderFinale();burst();chime(880);$('#letter-container').scrollIntoView({behavior:'smooth',block:'start'});});
  }
  function letterMarkup(){
    const paragraphs=String(cfg.dedication||'Feliz cumpleaños, mi amor.').split(/\n\s*\n/).map(p=>`<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('');
    return `<div class="letter-reveal"><article class="letter-paper"><span class="letter-date">PARA TI, EN TU DÍA · 31 DE OCTUBRE</span><h2>Mi querida ${name},</h2>${paragraphs}<p class="signature">Con todo mi amor,<br>${esc(cfg.author)}</p><p class="postscript">P. D. Si la magia existe, tiene un poquito de tu forma de sonreír.</p></article><div class="final-actions"><button class="primary" id="download-card">Guardar mi recuerdo ${icon('heart')}</button><button class="text-button" id="back-map">Volver a Noctilucia ${icon('arrow')}</button></div><p class="final-note">No necesitas una noche mágica para ser extraordinaria.</p><button class="restart-button" id="restart">Volver a vivir la aventura</button></div>`;
  }
  function bindFinalActions(){
    $('#download-card').addEventListener('click',downloadCard);
    $('#back-map').addEventListener('click',()=>navigate('home'));
    $('#restart').addEventListener('click',()=>showModal(`<p class="modal-eyebrow">UNA HISTORIA QUE PUEDES VOLVER A VIVIR</p><h2 id="modal-title">¿Otra noche de magia?</h2><p>Los retos y las velas comenzarán de nuevo. Conservaremos tu deseo en este navegador.</p><button class="primary" data-modal-action>Comenzar otra vez ${icon('arrow')}</button>`,()=>{const wish=state.wish;state=fresh();state.wish=wish;save();navigate('home');}));
  }
  async function downloadCard(){
    const button=$('#download-card');button.disabled=true;button.textContent='Preparando tu recuerdo…';
    try{
      await document.fonts.ready;
      const c=document.createElement('canvas');c.width=1200;c.height=1600;
      const ctx=c.getContext('2d');
      const bg=ctx.createLinearGradient(0,0,1200,1600);bg.addColorStop(0,'#32223f');bg.addColorStop(1,'#15101e');ctx.fillStyle=bg;ctx.fillRect(0,0,1200,1600);
      ctx.strokeStyle='#c79f7966';ctx.lineWidth=2;ctx.strokeRect(55,55,1090,1490);ctx.strokeStyle='#c79f7933';ctx.strokeRect(68,68,1064,1464);
      const random=(i)=>{const x=Math.sin(i*78.233)*43758.5453;return x-Math.floor(x);};
      for(let i=0;i<95;i++){ctx.fillStyle=`rgba(241,214,175,${.15+random(i+2)*.5})`;ctx.beginPath();ctx.arc(100+random(i+1)*1000,90+random(i+8)*1400,random(i+6)*2.2+1,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle='#ead0ab';ctx.beginPath();ctx.arc(600,270,88,0,Math.PI*2);ctx.fill();ctx.fillStyle='#2f203b';ctx.beginPath();ctx.arc(635,241,79,0,Math.PI*2);ctx.fill();
      ctx.textAlign='center';ctx.fillStyle='#e0bd97';ctx.font='500 18px "DM Sans", sans-serif';ctx.fillText('N O C T I L U C I A  ·  3 1  D E  O C T U B R E',600,444);
      ctx.fillStyle='#f4e5e5';ctx.font='400 76px "Cormorant Garamond", Georgia';ctx.fillText('Feliz cumpleaños,',600,565);ctx.fillStyle='#e6bd96';ctx.font='italic 108px "Cormorant Garamond", Georgia';ctx.fillText(String(cfg.name),600,686,960);
      ctx.font='400 33px "Cormorant Garamond", Georgia';ctx.fillStyle='#d6c2dc';
      const lines=['La noche tiene muchas estrellas.','Pero ninguna ilumina mi mundo como tú.','','Que este nuevo año te regale valentía,','ternura y mil motivos para sonreír.'];lines.forEach((line,i)=>ctx.fillText(line,600,810+i*53));
      ctx.strokeStyle='#d3ad7e77';ctx.beginPath();ctx.moveTo(480,1125);ctx.lineTo(720,1125);ctx.stroke();
      ctx.fillStyle='#e5c39f';ctx.font='italic 39px "Cormorant Garamond", Georgia';ctx.fillText('Con todo mi amor,',600,1210);ctx.fillText(String(cfg.author),600,1260,970);
      if(state.wish){ctx.fillStyle='#ad94b7';ctx.font='500 14px "DM Sans", sans-serif';ctx.fillText('UN DESEO SE QUEDA ENTRE TÚ Y LA LUNA.',600,1410);}
      else{ctx.fillStyle='#ad94b7';ctx.font='500 14px "DM Sans", sans-serif';ctx.fillText('TRES FRAGMENTOS. UNA ESTRELLA. TÚ.',600,1410);}
      const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!blob)throw Error('No se pudo crear la imagen');
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Un-recuerdo-para-${String(cfg.name).replace(/[^a-zA-ZÀ-ÿ0-9]/g,'-')}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);toast('Tu recuerdo está listo para guardar. ♡');
    }catch{toast('No pudimos crear la imagen. Puedes conservar una captura de tu carta.');}
    finally{button.disabled=false;button.innerHTML=`Guardar mi recuerdo ${icon('heart')}`;}
  }
  function journal(){
    showModal(`<p class="modal-eyebrow">EL DIARIO DE ${name}</p><h2 id="modal-title">Lo que la noche<br>te ha regalado.</h2>${state.done?rewards.slice(0,state.done).map((r,i)=>`<div class="journal-entry"><h3>0${i+1} · ${r.word}</h3><p>${r.meaning}</p></div>`).join(''):'<p class="journal-empty">Tu historia aún está por escribirse.</p><p>Comienza la aventura y tus fragmentos de luz aparecerán aquí.</p>'}${state.wish?`<div class="journal-entry"><h3>Tu deseo para este año</h3><p>${esc(state.wish)}</p></div>`:''}<p class="credits-list">${state.done} / 3 fragmentos recuperados · Tu progreso se guarda en este navegador.</p>`);
  }
  function help(){showModal(`<span class="modal-icon">${icon('spark')}</span><p class="modal-eyebrow">UN PEQUEÑO MAPA PARA TU VIAJE</p><h2 id="modal-title">Déjate sorprender.</h2><p>Lee cada capítulo y toca los elementos del escenario. Lúmen te acompaña con las instrucciones; si necesitas una pista, toca <strong>«Un susurro de ayuda»</strong>.</p><p>Puedes jugar con el dedo, el ratón o las teclas Tab y Enter. No hay límite de tiempo. Tu progreso se guarda automáticamente en este navegador.</p><p>Activa «Sonido» en la esquina superior para escuchar la música de Noctilucia. Unos auriculares y una habitación tranquila hacen el resto.</p><blockquote>Esta noche no tienes que ganarte nada, ${name}. La sorpresa ya es tuya. Solo disfruta el camino.</blockquote>`);}
  $('#journal-button').addEventListener('click',journal);$('#help-button').addEventListener('click',help);
  $('#brand').addEventListener('click',event=>{event.preventDefault();navigate('home');});
  $$('[data-name]').forEach(el=>el.textContent=cfg.name);

  // An original, quiet music-box arrangement. Audio starts only by explicit tap.
  let audio,master,delay,feedback,soundEnabled=false,musicTimer;
  const melody=[440,0,523.25,659.25,587.33,523.25,0,392,440,0,523.25,783.99,659.25,0,587.33,523.25,349.23,0,440,523.25,659.25,587.33,0,440,392,0,493.88,587.33,523.25,440,0,0];
  function initAudio(){
    const AudioEngine=window.AudioContext||window.webkitAudioContext;if(!AudioEngine)throw Error('Audio no disponible');
    audio=new AudioEngine();master=audio.createGain();master.gain.value=.24;master.connect(audio.destination);
    delay=audio.createDelay(1);delay.delayTime.value=.42;feedback=audio.createGain();feedback.gain.value=.22;delay.connect(feedback);feedback.connect(delay);delay.connect(master);
  }
  function note(freq,when,duration=2.2,volume=.11){
    if(!audio||!soundEnabled||document.hidden)return;
    const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type='sine';oscillator.frequency.value=freq;
    gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(volume,when+.025);gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
    oscillator.connect(gain);gain.connect(master);gain.connect(delay);oscillator.start(when);oscillator.stop(when+duration+.05);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  }
  function scheduleMusic(){
    if(!soundEnabled||!audio)return;const now=audio.currentTime+.1;
    melody.forEach((freq,i)=>{if(freq)note(freq,now+i*.48,2.2,.1);if(i%8===0){note([220,174.61,196,164.81][Math.floor(i/8)],now+i*.48,4.5,.055);}});
    musicTimer=setTimeout(scheduleMusic,melody.length*.48*1000);
  }
  function updateSoundButton(){const b=$('#sound-button');b.setAttribute('aria-pressed',String(soundEnabled));b.setAttribute('aria-label',soundEnabled?'Desactivar música':'Activar música');b.innerHTML=`${icon(soundEnabled?'sound':'mute')}<span>Sonido</span>`;}
  $('#sound-button').addEventListener('click',async()=>{
    try{if(!audio)initAudio();if(soundEnabled){soundEnabled=false;clearTimeout(musicTimer);await audio.suspend();}else{soundEnabled=true;await audio.resume();scheduleMusic();}updateSoundButton();}
    catch{soundEnabled=false;updateSoundButton();toast('Tu navegador no permite reproducir audio aquí. La aventura continúa.');}
  });
  document.addEventListener('visibilitychange',()=>{if(!audio||!soundEnabled)return;if(document.hidden){clearTimeout(musicTimer);audio.suspend().catch(()=>{});}else{audio.resume().then(scheduleMusic).catch(()=>{});}});
  function chime(freq){if(audio&&soundEnabled)note(freq,audio.currentTime+.01,1,.14);}

  // Lightweight ambient particles, plus celebratory stardust at chapter endings.
  const canvas=$('#atmosphere'),ctx=canvas.getContext('2d');
  let width=0,height=0,animationId=0,lastFrame=0;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let motes=[];
  function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);motes=Array.from({length:width<700?18:34},()=>({x:Math.random()*width,y:Math.random()*height,r:Math.random()*1.4+.4,v:.1+Math.random()*.25,phase:Math.random()*6.28}));}
  function burst(){if(reduced.matches)return;for(let i=0;i<65;i++)fireworks.push({x:width/2,y:height*.38,vx:(Math.random()-.5)*6,vy:(Math.random()-.65)*6,life:1,size:Math.random()*2.5+1});}
  function animate(time){
    animationId=requestAnimationFrame(animate);if(time-lastFrame<30)return;const step=Math.min((time-lastFrame)/16.67,3);lastFrame=time;
    ctx.clearRect(0,0,width,height);
    motes.forEach(p=>{p.y-=p.v*step;p.x+=Math.sin(time*.0003+p.phase)*.13*step;if(p.y<-10)p.y=height+10;const alpha=.15+Math.sin(time*.001+p.phase)*.15;ctx.fillStyle=`rgba(236,192,128,${alpha})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();});
    fireworks=fireworks.filter(p=>p.life>0);fireworks.forEach(p=>{p.x+=p.vx*step;p.y+=p.vy*step;p.vy+=.025*step;p.life-=.008*step;ctx.fillStyle=`rgba(240,200,149,${Math.max(0,p.life)})`;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.life*4);ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);ctx.restore();});
  }
  function motion(){cancelAnimationFrame(animationId);if(!reduced.matches&&!document.hidden){lastFrame=performance.now();animationId=requestAnimationFrame(animate);}else ctx.clearRect(0,0,width,height);}
  window.addEventListener('resize',resize);reduced.addEventListener('change',motion);document.addEventListener('visibilitychange',motion);resize();motion();updateSoundButton();renderHome();
})();

