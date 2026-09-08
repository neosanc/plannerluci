/* Mis calorías — app sencilla y sin registro. Todo se guarda en el propio móvil. */

const VERSION = "2.0";
const CLAVE = "miscalorias.v1";

const COMIDAS = [
  ["desayuno", "Desayuno", "☕"],
  ["comida",   "Comida",   "🍽️"],
  ["merienda", "Merienda", "🍪"],
  ["cena",     "Cena",     "🌙"],
  ["picoteo",  "Picoteo",  "🍿"]
];

const LOGROS = [
  {id:"primer-dia",   e:"🍽️", n:"El primer día",   d:"Apuntar la primera comida"},
  {id:"tres-dias",    e:"🔥", n:"3 días seguidos",  d:"Racha de 3 días"},
  {id:"semana",       e:"🗓️", n:"Una semana",       d:"Racha de 7 días"},
  {id:"quince",       e:"💪", n:"15 días",          d:"Racha de 15 días"},
  {id:"mes",          e:"🏆", n:"Un mes entero",    d:"Racha de 30 días"},
  {id:"agua-dia",     e:"💧", n:"Bien hidratada",   d:"Todos los vasos en un día"},
  {id:"agua-cinco",   e:"🌊", n:"Cinco días de agua", d:"Todos los vasos, 5 días"},
  {id:"peso-primero", e:"⚖️", n:"A la báscula",     d:"Apuntar el primer peso"},
  {id:"peso-kilo",    e:"📉", n:"El primer kilo",   d:"Bajar 1 kg"},
  {id:"peso-cinco",   e:"🎉", n:"Cinco kilos",      d:"Bajar 5 kg"},
  {id:"objetivo-dia", e:"🎯", n:"En su sitio",      d:"Un día dentro del objetivo"},
  {id:"objetivo-cinco",e:"🥇", n:"Cinco dianas",    d:"5 días dentro del objetivo"}
];

/* ---------------- datos ---------------- */

const porDefecto = () => ({
  perfil: {nombre:"", objetivo:1800, sexo:"m", edad:55, altura:162, peso:70,
           actividad:"1.375", plan:"0", vasos:8},
  avisos: {activos:false, desayuno:"09:00", comida:"14:30", cena:"21:00", agua:"12:00"},
  dias: {}, agua: {}, pesos: [], propios: [], recientes: [], logros: {}
});

let datos = cargar();
let fechaActual = hoyISO();
let vista = "hoy";

function cargar(){
  try{
    const bruto = localStorage.getItem(CLAVE);
    if(!bruto) return porDefecto();
    const guardado = JSON.parse(bruto);
    const base = porDefecto();
    const fusion = Object.assign(base, guardado);
    fusion.perfil = Object.assign(base.perfil, guardado.perfil || {});
    fusion.avisos = Object.assign(base.avisos, guardado.avisos || {});
    return fusion;
  }catch(e){
    return porDefecto();
  }
}
function guardar(){
  try{ localStorage.setItem(CLAVE, JSON.stringify(datos)); }
  catch(e){ aviso("No se han podido guardar los datos"); }
}

function dia(f){
  if(!datos.dias[f]) datos.dias[f] = {};
  return datos.dias[f];
}
function entradas(f, comida){ return dia(f)[comida] || []; }
function totalDia(f){
  return COMIDAS.reduce((s,[id]) => s + entradas(f,id).reduce((t,e) => t + e.kcal, 0), 0);
}
function hayComidas(f){ return COMIDAS.some(([id]) => entradas(f,id).length > 0); }
function vasosDia(f){ return datos.agua[f] || 0; }

/* ---------------- fechas ---------------- */

function hoyISO(d){
  const x = d || new Date();
  return x.getFullYear() + "-" + String(x.getMonth()+1).padStart(2,"0") + "-" + String(x.getDate()).padStart(2,"0");
}
function mover(f, n){
  const [a,m,d] = f.split("-").map(Number);
  return hoyISO(new Date(a, m-1, d + n));
}
function fecha(f){
  const [a,m,d] = f.split("-").map(Number);
  return new Date(a, m-1, d);
}
function bonita(f){
  return fecha(f).toLocaleDateString("es-ES", {weekday:"long", day:"numeric", month:"long"});
}
function cortita(f){
  const [,m,d] = f.split("-").map(Number);
  return d + "/" + m;
}

/* ---------------- utilidades ---------------- */

const $ = s => document.querySelector(s);
const esc = t => String(t).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
/* en España se escribe «70,4»: aceptamos coma y punto */
const num = v => parseFloat(String(v == null ? "" : v).replace(",", "."));
const sinTildes = t => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const coma = n => String(n).replace(".", ",");

let avisoTemporizador;
function aviso(texto, accion){
  const anterior = document.querySelector(".aviso");
  if(anterior) anterior.remove();
  const el = document.createElement("div");
  el.className = "aviso";
  el.appendChild(document.createTextNode(texto));
  if(accion){
    const b = document.createElement("button");
    b.textContent = accion;
    b.className = "aviso-accion";
    b.dataset.deshacer = "1";
    el.appendChild(b);
  }
  document.body.appendChild(el);
  clearTimeout(avisoTemporizador);
  avisoTemporizador = setTimeout(() => el.remove(), accion ? 5000 : 2200);
}

/* ---------------- racha y medallas ---------------- */

function racha(){
  let f = hoyISO();
  if(!hayComidas(f)) f = mover(f, -1);   // el día de hoy todavía cuenta hasta la noche
  let dias = 0;
  while(hayComidas(f)){ dias++; f = mover(f, -1); }
  return dias;
}

function diasConTodoElAgua(){
  const meta = datos.perfil.vasos || 8;
  return Object.keys(datos.agua).filter(f => datos.agua[f] >= meta).length;
}
function diasDentroDelObjetivo(){
  const objetivo = datos.perfil.objetivo || 1800;
  return Object.keys(datos.dias).filter(f => {
    const t = totalDia(f);
    return t > 0 && t <= objetivo;
  }).length;
}
function kilosBajados(){
  if(datos.pesos.length < 2) return 0;
  const orden = datos.pesos.slice().sort((a,b) => a.f < b.f ? -1 : 1);
  return orden[0].p - orden[orden.length-1].p;
}

function conseguido(id){
  const r = racha();
  switch(id){
    case "primer-dia":    return Object.keys(datos.dias).some(hayComidas);
    case "tres-dias":     return r >= 3;
    case "semana":        return r >= 7;
    case "quince":        return r >= 15;
    case "mes":           return r >= 30;
    case "agua-dia":      return diasConTodoElAgua() >= 1;
    case "agua-cinco":    return diasConTodoElAgua() >= 5;
    case "peso-primero":  return datos.pesos.length >= 1;
    case "peso-kilo":     return kilosBajados() >= 1;
    case "peso-cinco":    return kilosBajados() >= 5;
    case "objetivo-dia":  return diasDentroDelObjetivo() >= 1;
    case "objetivo-cinco":return diasDentroDelObjetivo() >= 5;
  }
  return false;
}

let colaCelebracion = [];
function revisarLogros(){
  const nuevos = LOGROS.filter(l => !datos.logros[l.id] && conseguido(l.id));
  if(!nuevos.length) return;
  nuevos.forEach(l => { datos.logros[l.id] = hoyISO(); });
  guardar();
  colaCelebracion = colaCelebracion.concat(nuevos);
  siguienteCelebracion();
}
function siguienteCelebracion(){
  if($("#celebracion").innerHTML) return;      // ya hay una en pantalla
  const l = colaCelebracion.shift();
  if(!l) return;
  $("#celebracion").innerHTML =
    '<div class="celebra"><div class="caja">' +
      '<div class="disco">' + l.e + '</div>' +
      '<h3>¡Medalla conseguida!</h3>' +
      '<p><b>' + esc(l.n) + '</b><br>' + esc(l.d) + '</p>' +
      '<button class="boton" data-cerrar-celebra>¡Genial!</button>' +
    '</div></div>';
}

/* ---------------- pantalla de hoy ---------------- */

function pintar(){
  const esHoy = fechaActual === hoyISO();
  const hora = new Date().getHours();
  const saludo = hora < 13 ? "Buenos días" : (hora < 21 ? "Buenas tardes" : "Buenas noches");
  const nombre = datos.perfil.nombre;
  $("#saludo").textContent = esHoy
    ? saludo + (nombre ? ", " + nombre : "")
    : bonita(fechaActual).replace(/,.*/, "").replace(/^./, c => c.toUpperCase());
  $("#fecha-sub").textContent = bonita(fechaActual).replace(/^./, c => c.toUpperCase());
  $("#dia-despues").disabled = fechaActual >= hoyISO();

  const dias = racha();
  $("#racha-num").textContent = dias;
  $("#chip-racha").classList.toggle("apagada", dias === 0);

  const objetivo = datos.perfil.objetivo || 1800;
  const total = totalDia(fechaActual);
  const restan = objetivo - total;
  const meta = datos.perfil.vasos || 8;

  $("#kcal-comidas").textContent = Math.round(total);
  $("#mini-objetivo").textContent = objetivo;
  $("#mini-porcentaje").textContent = Math.round(total/objetivo*100) + " %";
  $("#mini-agua").textContent = vasosDia(fechaActual) + "/" + meta;
  $("#kcal-restantes").innerHTML = restan >= 0
    ? "te quedan <b>" + Math.round(restan) + "</b>"
    : "te has pasado <b>" + Math.round(-restan) + "</b>";

  const aro = $("#anillo-progreso");
  aro.style.strokeDashoffset = 541 * (1 - Math.min(1, total/objetivo));
  aro.setAttribute("stroke", restan < 0 ? "url(#grad-anillo-pasado)" : "url(#grad-anillo)");

  pintarAgua();

  $("#comidas").innerHTML = COMIDAS.map(([id, nombreComida, emoji]) => {
    const lista = entradas(fechaActual, id);
    const suma = lista.reduce((t,e) => t + e.kcal, 0);
    return '<div class="comida">' +
      '<h2><span class="insignia i-' + id + '">' + emoji + '</span>' + nombreComida +
        '<span class="kcal">' + (suma ? Math.round(suma) + " kcal" : "") + '</span></h2>' +
      lista.map(e =>
        '<div class="linea-alimento">' +
          '<div class="nom"><b>' + esc(e.n) + '</b><span>' + esc(e.det) + '</span></div>' +
          '<div class="val">' + Math.round(e.kcal) + '</div>' +
          '<button class="quitar" data-quitar="' + id + '|' + e.id + '" aria-label="Quitar">✕</button>' +
        '</div>').join("") +
      '<button class="anadir" data-comida="' + id + '">＋ Añadir a ' + nombreComida.toLowerCase() + '</button>' +
    '</div>';
  }).join("");
}

function pintarAgua(){
  const meta = datos.perfil.vasos || 8;
  const llenos = vasosDia(fechaActual);
  $("#agua-cuenta").textContent = llenos + " / " + meta;
  $("#vasos").innerHTML = Array.from({length: meta}, (_,i) =>
    '<button class="vaso' + (i < llenos ? " lleno" : "") + '" data-vaso="' + i + '" ' +
    'aria-label="Vaso ' + (i+1) + '"><i></i></button>').join("");
}

function tocarVaso(i){
  const actual = vasosDia(fechaActual);
  datos.agua[fechaActual] = (actual === i + 1) ? i : i + 1;
  if(!datos.agua[fechaActual]) delete datos.agua[fechaActual];
  guardar();
  pintar();
  revisarLogros();
}

/* ---------------- añadir alimento ---------------- */

let comidaDestino = "desayuno";

function abrirBuscador(comida){
  comidaDestino = comida;
  const nombre = COMIDAS.find(c => c[0] === comida)[1];
  $("#hoja").innerHTML =
    '<div class="hoja">' +
      '<div class="hoja-cab"><b>Añadir a ' + nombre + '</b><button class="cerrar" data-cerrar>Cerrar</button></div>' +
      '<div class="buscador"><input id="busca" type="search" placeholder="Buscar alimento…" autocomplete="off"></div>' +
      '<div class="hoja-cuerpo" id="resultados"></div>' +
    '</div>';
  listar("");
  $("#busca").addEventListener("input", e => listar(e.target.value));
}

function catalogo(){
  return datos.propios.map(a => Object.assign({}, a)).concat(ALIMENTOS);
}

function listar(texto){
  const q = sinTildes(texto.trim());
  let html = "";
  const botonNuevo = '<button class="item" data-nuevo><div class="nom"><b>✎ Otro alimento</b>' +
        '<span>Apuntarlo a mano con sus calorías</span></div></button>';

  if(!q){
    const recientes = datos.recientes.slice(0, 6);
    if(recientes.length) html += '<div class="grupo">⭐ Lo que más usa</div>' + recientes.map(fila).join("");
    html += botonNuevo;
    CATEGORIAS.forEach(([id, nombre, emoji]) => {
      const lista = catalogo().filter(a => a.c === id);
      if(!lista.length) return;
      html += '<div class="grupo">' + emoji + " " + nombre + '</div>' + lista.map(fila).join("");
    });
    const propios = datos.propios;
    if(propios.length) html += '<div class="grupo">✎ Los suyos</div>' + propios.map(fila).join("");
  }else{
    const lista = catalogo().filter(a => sinTildes(a.n).includes(q)).slice(0, 60);
    html = lista.length
      ? lista.map(fila).join("")
      : '<div class="vacio">No aparece nada con ese nombre.<br>Puede apuntarlo a mano:</div>';
    html += botonNuevo;
  }
  $("#resultados").innerHTML = html;
}

function fila(a){
  const p = a.p[0];
  const kcal = Math.round(a.k * p[1] / 100);
  const detalle = a.c === "propio" ? p[0] : p[0] + " · " + p[1] + (a.c === "bebida" ? " ml" : " g");
  return '<button class="item" data-alimento="' + esc(a.n) + '">' +
    '<div class="nom"><b>' + esc(a.n) + '</b><span>' + esc(detalle) + '</span></div>' +
    '<div class="val">' + kcal + ' kcal</div></button>';
}

function buscarAlimento(nombre){ return catalogo().find(a => a.n === nombre); }

/* ---------------- elegir cantidad ---------------- */

let alimentoElegido = null, gramosElegidos = 0;

function abrirCantidad(alimento){
  alimentoElegido = alimento;
  gramosElegidos = alimento.p[0][1];
  const liquido = alimento.c === "bebida";
  $("#hoja").innerHTML =
    '<div class="hoja">' +
      '<div class="hoja-cab"><b>' + esc(alimento.n) + '</b><button class="cerrar" data-cerrar>Cerrar</button></div>' +
      '<div class="hoja-cuerpo">' +
        '<div class="tarjeta">' +
          '<div class="resumen-kcal"><div class="n" id="cant-kcal">0</div>' +
          '<div class="d" id="cant-detalle"></div></div>' +
          '<div class="titulo">Cantidad</div>' +
          '<div class="chips" id="cant-chips">' +
            alimento.p.map((p,i) => '<button class="chip" data-porcion="' + i + '">' + esc(p[0]) + '</button>').join("") +
          '</div>' +
          '<label class="campo" style="margin-top:16px"><span>O la cantidad exacta (' + (liquido ? "ml" : "gramos") + ')</span>' +
            '<input id="cant-gramos" type="number" inputmode="numeric" min="1" max="3000"></label>' +
        '</div>' +
        '<button class="boton" id="cant-guardar">Añadir</button>' +
      '</div>' +
    '</div>';
  $("#cant-gramos").addEventListener("input", e => {
    const g = num(e.target.value);
    if(g > 0){ gramosElegidos = g; marcarPorciones(); refrescarCantidad(); }
  });
  marcarPorciones();
  refrescarCantidad();
}

function marcarPorciones(){
  document.querySelectorAll("#cant-chips .chip").forEach((c,i) => {
    c.classList.toggle("sel", alimentoElegido.p[i][1] === gramosElegidos);
  });
}
function refrescarCantidad(){
  const liquido = alimentoElegido.c === "bebida";
  $("#cant-kcal").textContent = Math.round(alimentoElegido.k * gramosElegidos / 100) + " kcal";
  $("#cant-detalle").textContent = Math.round(gramosElegidos) + (liquido ? " ml" : " g");
  $("#cant-gramos").value = Math.round(gramosElegidos);
}

function apuntar(alimento, gramos){
  const liquido = alimento.c === "bebida";
  const porcion = alimento.p.find(p => p[1] === gramos);
  const detalle = alimento.c === "propio"
    ? "1 ración"
    : (porcion ? porcion[0] + " · " : "") + Math.round(gramos) + (liquido ? " ml" : " g");
  const kcal = Math.round(alimento.k * gramos / 100);
  const lista = entradas(fechaActual, comidaDestino).slice();
  lista.push({id: Date.now().toString(36) + Math.random().toString(36).slice(2,6), n:alimento.n, det:detalle, kcal});
  dia(fechaActual)[comidaDestino] = lista;

  datos.recientes = [alimento].concat(datos.recientes.filter(a => a.n !== alimento.n)).slice(0, 12)
    .map(a => ({n:a.n, c:a.c, k:a.k, p:a.p}));
  guardar();
  cerrarHoja();
  pintar();
  aviso(alimento.n + " · " + kcal + " kcal");
  revisarLogros();
}

let ultimoBorrado = null;
function deshacer(){
  if(!ultimoBorrado) return;
  const {fecha:f, comida, posicion, entrada} = ultimoBorrado;
  const lista = entradas(f, comida).slice();
  lista.splice(Math.min(posicion, lista.length), 0, entrada);
  dia(f)[comida] = lista;
  ultimoBorrado = null;
  guardar();
  fechaActual = f;
  pintar();
  const el = document.querySelector(".aviso");
  if(el) el.remove();
}

/* ---------------- alimento propio ---------------- */

function abrirNuevo(){
  $("#hoja").innerHTML =
    '<div class="hoja">' +
      '<div class="hoja-cab"><b>Otro alimento</b><button class="cerrar" data-cerrar>Cerrar</button></div>' +
      '<div class="hoja-cuerpo">' +
        '<div class="tarjeta">' +
          '<label class="campo"><span>Qué ha comido</span>' +
            '<input id="nue-nombre" type="text" placeholder="Ej. Guiso de mi madre"></label>' +
          '<label class="campo"><span>Calorías de la ración que se ha tomado</span>' +
            '<input id="nue-kcal" type="number" inputmode="numeric" min="1" max="5000" placeholder="Ej. 350"></label>' +
          '<div class="nota">Suele venir en el envase como «kcal por ración». Si solo pone «por 100 g», ' +
          'multiplique por los gramos y divida entre 100.</div>' +
        '</div>' +
        '<button class="boton" id="nue-guardar">Añadir</button>' +
        '<div class="nota" style="text-align:center">Se guardará en su lista para volver a usarlo.</div>' +
      '</div>' +
    '</div>';
  setTimeout(() => $("#nue-nombre").focus(), 60);
}

function guardarNuevo(){
  const nombre = $("#nue-nombre").value.trim();
  const kcal = num($("#nue-kcal").value);
  if(!nombre) return aviso("Falta el nombre");
  if(!(kcal > 0)) return aviso("Faltan las calorías");
  const alimento = {n:nombre, c:"propio", k:Math.round(kcal), p:[["1 ración",100]]};
  datos.propios = [alimento].concat(datos.propios.filter(a => a.n !== nombre)).slice(0, 60);
  guardar();
  apuntar(alimento, 100);
}

/* ---------------- progreso ---------------- */

function pintarProgreso(){
  const lista = datos.pesos.slice().sort((a,b) => a.f < b.f ? -1 : 1);
  const resumen = $("#peso-resumen");
  if(!lista.length){
    resumen.innerHTML = '<div class="vacio">Todavía no ha apuntado ningún peso.</div>';
    $("#peso-grafico").innerHTML = "";
    $("#peso-lista").innerHTML = "";
  }else{
    const ultimo = lista[lista.length-1], primero = lista[0];
    const dif = ultimo.p - primero.p;
    resumen.innerHTML =
      '<div class="grande" style="color:var(--texto)">' + coma(ultimo.p) + '<small style="color:var(--suave)"> kg</small></div>' +
      '<div class="restante" style="color:var(--suave)">' + (lista.length > 1
        ? (dif === 0 ? "igual que al empezar"
          : (dif < 0 ? "ha bajado " : "ha subido ") + coma(Math.abs(dif).toFixed(1)) + " kg desde el " + cortita(primero.f))
        : "primer peso apuntado") + '</div>';
    dibujarGrafico(lista.slice(-30));
    $("#peso-lista").innerHTML = lista.slice().reverse().slice(0, 12).map(p =>
      '<div class="lista-peso"><span class="f">' + bonita(p.f) + '</span><b>' + coma(p.p) + ' kg</b>' +
      '<button class="quitar" data-peso="' + p.f + '" aria-label="Quitar">✕</button></div>').join("");
  }
  pintarBarras();
}

function dibujarGrafico(lista){
  const svg = $("#peso-grafico");
  if(lista.length < 2){ svg.innerHTML = ""; return; }
  const W = 320, H = 170, m = 26;
  const valores = lista.map(p => p.p);
  const min = Math.min(...valores), max = Math.max(...valores);
  const rango = (max - min) || 1;
  const x = i => m + i * (W - m*2) / (lista.length - 1);
  const y = v => H - m - ((v - min) / rango) * (H - m*2);
  const puntos = lista.map((p,i) => x(i) + "," + y(p.p)).join(" ");
  svg.innerHTML =
    '<defs><linearGradient id="grad-peso" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="#7c3aed"></stop><stop offset="100%" stop-color="#db2777"></stop>' +
    '</linearGradient></defs>' +
    '<polyline points="' + puntos + '" fill="none" stroke="url(#grad-peso)" stroke-width="3" ' +
      'stroke-linejoin="round" stroke-linecap="round"></polyline>' +
    lista.map((p,i) => '<circle cx="' + x(i) + '" cy="' + y(p.p) + '" r="3.5" fill="#7c3aed"></circle>').join("") +
    '<text x="2" y="' + (m - 8) + '" font-size="11" fill="#7b7b8c">' + coma(max.toFixed(1)) + ' kg</text>' +
    '<text x="2" y="' + (H - m + 14) + '" font-size="11" fill="#7b7b8c">' + coma(min.toFixed(1)) + ' kg</text>';
}

function pintarBarras(){
  const objetivo = datos.perfil.objetivo || 1800;
  const dias = [];
  for(let i = 6; i >= 0; i--){
    const f = mover(hoyISO(), -i);
    dias.push({f, t: totalDia(f)});
  }
  const tope = Math.max(objetivo, ...dias.map(d => d.t)) || 1;
  const letras = ["D","L","M","X","J","V","S"];
  $("#barras").innerHTML = dias.map(d =>
    '<div><i class="' + (d.t > objetivo ? "pasado" : "") + '" style="height:' +
    Math.max(3, Math.round(d.t/tope*100)) + '%"></i>' +
    '<span>' + letras[fecha(d.f).getDay()] + '</span></div>').join("");
  const conDatos = dias.filter(d => d.t > 0);
  $("#media-semana").textContent = conDatos.length
    ? "Media de los días apuntados: " + Math.round(conDatos.reduce((s,d) => s+d.t, 0)/conDatos.length) + " kcal al día"
    : "Cuando apunte unos días verá aquí la media de la semana.";
}

function guardarPeso(){
  const valor = num($("#peso-entrada").value);
  if(!(valor >= 20 && valor <= 300)) return aviso("Escriba un peso válido");
  const f = hoyISO();
  datos.pesos = datos.pesos.filter(p => p.f !== f).concat([{f, p:Math.round(valor*10)/10}]);
  datos.perfil.peso = Math.round(valor*10)/10;
  guardar();
  $("#peso-entrada").value = "";
  pintarProgreso();
  aviso("Peso apuntado");
  revisarLogros();
}

/* ---------------- logros ---------------- */

function pintarLogros(){
  const dias = racha();
  $("#racha-grande").textContent = dias;
  $("#racha-texto").textContent = dias === 0
    ? "apunte algo hoy y empieza la racha"
    : (dias === 1 ? "día apuntado, ¡a por el segundo!" : "días seguidos apuntando");
  const hechas = LOGROS.filter(l => datos.logros[l.id]).length;
  $("#medallas-cuenta").textContent = "(" + hechas + " de " + LOGROS.length + ")";
  $("#medallas").innerHTML = LOGROS.map(l =>
    '<div class="medalla' + (datos.logros[l.id] ? " si" : "") + '">' +
      '<div class="disco">' + l.e + '</div>' +
      '<b>' + esc(l.n) + '</b><span>' + esc(datos.logros[l.id] ? "conseguida" : l.d) + '</span>' +
    '</div>').join("");
}

/* ---------------- recordatorios ---------------- */

const TEXTOS_AVISO = {
  desayuno: ["¿Ya has desayunado?", "Apúntalo antes de que se te olvide ☕"],
  comida:   ["¿Qué tal la comida?", "Apúntala y sigue con tu racha 🔥"],
  cena:     ["Última del día", "Apunta la cena y cierra el día 🌙"],
  agua:     ["¿Vas bebiendo agua?", "Toca los vasos que llevas 💧"]
};

const Nativo = {
  enMovil(){
    return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === "function"
      && window.Capacitor.isNativePlatform());
  },
  plugin(){
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications;
  },
  async permiso(){
    const p = this.plugin();
    if(!p) return false;
    try{
      let r = await p.checkPermissions();
      if(r.display !== "granted") r = await p.requestPermissions();
      return r.display === "granted";
    }catch(e){ return false; }
  },
  async programar(){
    const p = this.plugin();
    if(!p) return;
    try{
      const puestas = await p.getPending();
      if(puestas.notifications && puestas.notifications.length){
        await p.cancel({notifications: puestas.notifications.map(n => ({id:n.id}))});
      }
      if(!datos.avisos.activos) return;
      const cuales = ["desayuno","comida","cena","agua"];
      const lista = cuales.map((c,i) => {
        const [h,m] = (datos.avisos[c] || "09:00").split(":").map(Number);
        return {
          id: i + 1,
          title: TEXTOS_AVISO[c][0],
          body: TEXTOS_AVISO[c][1],
          smallIcon: "ic_stat_calorias",
          schedule: {on: {hour: h, minute: m}, allowWhileIdle: true, repeats: true}
        };
      });
      await p.schedule({notifications: lista});
    }catch(e){ /* si el móvil no deja programar, la app sigue funcionando igual */ }
  },
  async probar(){
    const p = this.plugin();
    if(!p) return aviso("Los avisos solo funcionan en la app instalada");
    if(!await this.permiso()) return aviso("Hay que dar permiso de notificaciones");
    try{
      await p.schedule({notifications:[{
        id: 99, title:"Así se verán los avisos", body:"¿Has apuntado ya lo que has comido? 🍽️",
        smallIcon:"ic_stat_calorias", schedule:{at: new Date(Date.now() + 5000)}
      }]});
      aviso("Le llegará un aviso en 5 segundos");
    }catch(e){ aviso("Este móvil no ha dejado programar el aviso"); }
  }
};

async function cambiarAvisos(){
  const encender = !datos.avisos.activos;
  if(encender && Nativo.enMovil() && !await Nativo.permiso()){
    return aviso("Sin permiso de notificaciones no puedo avisar");
  }
  datos.avisos.activos = encender;
  guardar();
  cargarAjustes();
  Nativo.programar();
  aviso(encender ? "Recordatorios activados" : "Recordatorios apagados");
}

/* ---------------- ajustes ---------------- */

function cargarAjustes(){
  const p = datos.perfil, a = datos.avisos;
  $("#aj-objetivo").value = p.objetivo;
  $("#aj-nombre").value = p.nombre;
  $("#aj-edad").value = p.edad;
  $("#aj-altura").value = p.altura;
  $("#aj-peso").value = coma(p.peso);
  $("#aj-sexo").value = p.sexo;
  $("#aj-actividad").value = p.actividad;
  $("#aj-plan").value = p.plan;
  $("#aj-agua").value = p.vasos;
  $("#aj-avisos").classList.toggle("si", !!a.activos);
  $("#horas-avisos").classList.toggle("oculto", !a.activos);
  ["desayuno","comida","cena","agua"].forEach(c => { $("#aj-hora-" + c).value = a[c]; });
  $("#nota-avisos").textContent = Nativo.enMovil()
    ? "Los avisos llegan aunque la app esté cerrada."
    : "Desde el navegador no puedo avisar: los recordatorios funcionan en la app instalada (el APK).";
  $("#version-app").textContent = "Mis calorías · versión " + VERSION;
}

function guardarAjustes(){
  const p = datos.perfil;
  p.objetivo = Math.max(800, Math.min(5000, parseInt($("#aj-objetivo").value, 10) || 1800));
  p.nombre = $("#aj-nombre").value.trim();
  p.edad = parseInt($("#aj-edad").value, 10) || p.edad;
  p.altura = parseInt($("#aj-altura").value, 10) || p.altura;
  p.peso = num($("#aj-peso").value) || p.peso;
  p.sexo = $("#aj-sexo").value;
  p.actividad = $("#aj-actividad").value;
  p.plan = $("#aj-plan").value;
  p.vasos = Math.max(4, Math.min(12, parseInt($("#aj-agua").value, 10) || 8));
  ["desayuno","comida","cena","agua"].forEach(c => {
    if($("#aj-hora-" + c).value) datos.avisos[c] = $("#aj-hora-" + c).value;
  });
  guardar();
  pintar();
  Nativo.programar();
}

/* Mifflin-St Jeor: gasto en reposo × actividad, y luego el plan. */
function calcularObjetivo(){
  guardarAjustes();
  const p = datos.perfil;
  const base = 10*p.peso + 6.25*p.altura - 5*p.edad + (p.sexo === "h" ? 5 : -161);
  let objetivo = Math.round((base * parseFloat(p.actividad) + parseInt(p.plan, 10)) / 10) * 10;
  const suelo = p.sexo === "h" ? 1500 : 1300;
  const recorte = objetivo < suelo;
  if(recorte) objetivo = suelo;
  p.objetivo = objetivo;
  guardar();
  cargarAjustes();
  pintar();
  aviso(recorte ? "Objetivo: " + objetivo + " kcal (no bajamos de ahí)" : "Objetivo: " + objetivo + " kcal al día");
}

function exportar(){
  const texto = JSON.stringify(datos);
  if(navigator.clipboard){
    navigator.clipboard.writeText(texto)
      .then(() => aviso("Datos copiados. Péguelos en un correo o WhatsApp"))
      .catch(() => window.prompt("Copie este texto y guárdelo:", texto));
  }else{
    window.prompt("Copie este texto y guárdelo:", texto);
  }
}

function importar(){
  const texto = window.prompt("Pegue aquí el texto de la copia:");
  if(!texto) return;
  try{
    const nuevo = JSON.parse(texto);
    if(!nuevo || typeof nuevo !== "object" || !nuevo.perfil) throw new Error("formato");
    datos = Object.assign(porDefecto(), nuevo);
    guardar();
    cargarAjustes(); pintar(); pintarProgreso(); pintarLogros();
    aviso("Datos recuperados");
  }catch(e){ aviso("Ese texto no vale, vuelva a copiarlo entero"); }
}

function borrarTodo(){
  if(!confirm("¿Seguro? Se borran todas las comidas, pesos y medallas.")) return;
  datos = porDefecto();
  guardar();
  cargarAjustes(); pintar(); pintarProgreso(); pintarLogros();
  Nativo.programar();
  aviso("Todo borrado");
}

/* ---------------- navegación ---------------- */

function cambiarVista(v){
  vista = v;
  ["hoy","progreso","logros","ajustes"].forEach(x => $("#vista-" + x).classList.toggle("oculto", x !== v));
  document.querySelectorAll("nav button").forEach(b => b.classList.toggle("activa", b.dataset.vista === v));
  $("#cabecera").classList.toggle("oculto", v !== "hoy");
  if(v === "progreso") pintarProgreso();
  if(v === "logros") pintarLogros();
  window.scrollTo(0, 0);
}

function cerrarHoja(){ $("#hoja").innerHTML = ""; }

/* ---------------- eventos ---------------- */

document.addEventListener("click", ev => {
  const t = ev.target.closest("button");
  if(!t) return;

  if(t.id === "dia-antes"){ fechaActual = mover(fechaActual, -1); return pintar(); }
  if(t.id === "dia-despues"){ fechaActual = mover(fechaActual, 1); return pintar(); }
  if(t.dataset.vista) return cambiarVista(t.dataset.vista);
  if(t.dataset.vaso !== undefined) return tocarVaso(+t.dataset.vaso);
  if(t.dataset.comida) return abrirBuscador(t.dataset.comida);
  if(t.hasAttribute("data-cerrar")) return cerrarHoja();
  if(t.hasAttribute("data-nuevo")) return abrirNuevo();
  if(t.hasAttribute("data-cerrar-celebra")){
    $("#celebracion").innerHTML = "";
    if(vista === "logros") pintarLogros();
    return siguienteCelebracion();
  }
  if(t.dataset.alimento){
    const a = buscarAlimento(t.dataset.alimento);
    if(a) abrirCantidad(a);
    return;
  }
  if(t.dataset.porcion !== undefined){
    gramosElegidos = alimentoElegido.p[+t.dataset.porcion][1];
    marcarPorciones(); refrescarCantidad();
    return;
  }
  if(t.id === "cant-guardar") return apuntar(alimentoElegido, gramosElegidos);
  if(t.id === "nue-guardar") return guardarNuevo();
  if(t.dataset.quitar){
    const [comida, id] = t.dataset.quitar.split("|");
    const lista = entradas(fechaActual, comida);
    const posicion = lista.findIndex(e => e.id === id);
    if(posicion < 0) return;
    ultimoBorrado = {fecha: fechaActual, comida, posicion, entrada: lista[posicion]};
    dia(fechaActual)[comida] = lista.filter(e => e.id !== id);
    guardar(); pintar();
    aviso("Quitado " + ultimoBorrado.entrada.n, "Deshacer");
    return;
  }
  if(t.dataset.deshacer) return deshacer();
  if(t.dataset.peso){
    datos.pesos = datos.pesos.filter(p => p.f !== t.dataset.peso);
    guardar(); pintarProgreso();
    return;
  }
  if(t.id === "peso-guardar") return guardarPeso();
  if(t.id === "aj-avisos") return cambiarAvisos();
  if(t.id === "aj-probar") return Nativo.probar();
  if(t.id === "aj-calcular") return calcularObjetivo();
  if(t.id === "aj-exportar") return exportar();
  if(t.id === "aj-importar") return importar();
  if(t.id === "aj-borrar") return borrarTodo();
});

document.querySelectorAll("#vista-ajustes input, #vista-ajustes select")
  .forEach(el => el.addEventListener("change", guardarAjustes));

$("#peso-entrada").addEventListener("keydown", e => { if(e.key === "Enter") guardarPeso(); });

/* si la app se queda abierta y cambia el día, que se ponga al día sola */
document.addEventListener("visibilitychange", () => {
  if(!document.hidden && vista === "hoy" && fechaActual !== hoyISO()){
    fechaActual = hoyISO();
    pintar();
  }
});

/* ---------------- arranque ---------------- */

cargarAjustes();
pintar();
if(Nativo.enMovil()) Nativo.programar();

/* Dentro del APK los archivos ya están en el móvil: el service worker solo hace
   falta en la versión web, y ahí además evita que se quede una copia vieja. */
if("serviceWorker" in navigator && location.protocol.startsWith("http") && !Nativo.enMovil()){
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
