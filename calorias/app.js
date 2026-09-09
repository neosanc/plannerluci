/* Mi salud — calorías del día, recetas y control de peso.
   Todo se guarda en el propio móvil, sin registro y sin internet. */

const VERSION = "3.0";
const CLAVE = "miscalorias.v1";

const COMIDAS = [
  ["desayuno", "Desayuno", "☕"],
  ["comida",   "Almuerzo", "🍽️"],
  ["merienda", "Once",     "🍪"],
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
  {id:"peso-primero", e:"⚖️", n:"A la pesa",        d:"Apuntar el primer peso"},
  {id:"cintura",      e:"📏", n:"Con la huincha",   d:"Apuntar la cintura"},
  {id:"peso-kilo",    e:"📉", n:"El primer kilo",   d:"Bajar 1 kg"},
  {id:"peso-cinco",   e:"🎉", n:"Cinco kilos",      d:"Bajar 5 kg"},
  {id:"objetivo-cinco",e:"🎯", n:"Cinco dianas",    d:"5 días dentro del tope"}
];

const FILTROS_RECETAS = [
  ["guardadas", "❤️ Guardadas"], ["todas","Todas"], ["desayuno","Desayuno"], ["almuerzo","Almuerzo"],
  ["once","Once"], ["cena","Cena"], ["snack","Snack"], ["rápido","Rápidas"],
  ["económico","Económicas"], ["chileno","Chilenas"], ["alto en proteína","Con proteína"]
];

/* ---------------- datos ---------------- */

const porDefecto = () => ({
  perfil: {nombre:"", objetivo:1500, sexo:"m", edad:55, altura:160, peso:70,
           actividad:"1.375", plan:"0", vasos:8, porciones:2, vegetariano:false},
  avisos: {activos:false, desayuno:"09:00", comida:"14:00", cena:"21:00", agua:"12:00"},
  dias: {}, agua: {}, medidas: [], propios: [], recientes: [], favoritos: [],
  logros: {}, guardadas: []
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
    /* versiones anteriores guardaban solo el peso, en «pesos» */
    if(guardado.pesos && (!guardado.medidas || !guardado.medidas.length)){
      fusion.medidas = guardado.pesos.map(x => ({f:x.f, p:x.p}));
    }
    delete fusion.pesos;
    return fusion;
  }catch(e){ return porDefecto(); }
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

/* ---------------- fechas y utilidades ---------------- */

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
function bonita(f){ return fecha(f).toLocaleDateString("es-CL", {weekday:"long", day:"numeric", month:"long"}); }
function cortita(f){ const [,m,d] = f.split("-").map(Number); return d + "/" + m; }

const $ = s => document.querySelector(s);
const esc = t => String(t).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const num = v => parseFloat(String(v == null ? "" : v).replace(",", "."));
const coma = n => String(n).replace(".", ",");
const mayus = t => t.replace(/^./, c => c.toUpperCase());

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
  avisoTemporizador = setTimeout(() => el.remove(), accion ? 5000 : 2300);
}

/* ---------------- racha y medallas ---------------- */

function racha(){
  let f = hoyISO();
  if(!hayComidas(f)) f = mover(f, -1);
  let dias = 0;
  while(hayComidas(f)){ dias++; f = mover(f, -1); }
  return dias;
}
function diasConTodoElAgua(){
  const meta = datos.perfil.vasos || 8;
  return Object.keys(datos.agua).filter(f => datos.agua[f] >= meta).length;
}
function diasDentroDelObjetivo(){
  const objetivo = datos.perfil.objetivo || 1500;
  return Object.keys(datos.dias).filter(f => {
    const t = totalDia(f);
    return t > 0 && t <= objetivo;
  }).length;
}
function kilosBajados(){
  const orden = datos.medidas.filter(m => m.p).sort((a,b) => a.f < b.f ? -1 : 1);
  if(orden.length < 2) return 0;
  return orden[0].p - orden[orden.length-1].p;
}
function conseguido(id){
  const r = racha();
  switch(id){
    case "primer-dia":     return Object.keys(datos.dias).some(hayComidas);
    case "tres-dias":      return r >= 3;
    case "semana":         return r >= 7;
    case "quince":         return r >= 15;
    case "mes":            return r >= 30;
    case "agua-dia":       return diasConTodoElAgua() >= 1;
    case "agua-cinco":     return diasConTodoElAgua() >= 5;
    case "peso-primero":   return datos.medidas.some(m => m.p);
    case "cintura":        return datos.medidas.some(m => m.c);
    case "peso-kilo":      return kilosBajados() >= 1;
    case "peso-cinco":     return kilosBajados() >= 5;
    case "objetivo-cinco": return diasDentroDelObjetivo() >= 5;
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
  if($("#celebracion").innerHTML) return;
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

/* ---------------- pantalla de hoy: la cuenta atrás ---------------- */

function pintar(){
  const esHoy = fechaActual === hoyISO();
  const hora = new Date().getHours();
  const saludo = hora < 13 ? "Buenos días" : (hora < 21 ? "Buenas tardes" : "Buenas noches");
  const nombre = datos.perfil.nombre;
  $("#saludo").textContent = esHoy
    ? saludo + (nombre ? ", " + nombre : "")
    : mayus(bonita(fechaActual).replace(/,.*/, ""));
  $("#fecha-sub").textContent = mayus(bonita(fechaActual));
  $("#dia-despues").disabled = fechaActual >= hoyISO();

  const dias = racha();
  $("#racha-num").textContent = dias;
  $("#chip-racha").classList.toggle("apagada", dias === 0);

  const objetivo = datos.perfil.objetivo || 1500;
  const comido = totalDia(fechaActual);
  const quedan = objetivo - comido;
  const pasado = quedan < 0;

  /* el número grande va bajando: es lo que le queda por comer */
  $("#rotulo-hero").textContent = pasado ? "Se ha pasado" : "Te quedan";
  $("#kcal-restantes").textContent = Math.round(Math.abs(quedan));
  $("#kcal-comidas").textContent = "de " + objetivo + " · lleva " + Math.round(comido);
  $("#mini-objetivo").textContent = objetivo;
  $("#mini-comido").textContent = Math.round(comido);
  $("#mini-agua").textContent = vasosDia(fechaActual) + "/" + (datos.perfil.vasos || 8);
  $("#hero").classList.toggle("pasado", pasado);

  /* el anillo empieza lleno y se va vaciando conforme come */
  const gastado = Math.min(1, comido/objetivo);
  $("#anillo-progreso").style.strokeDashoffset = 541 * gastado;

  pintarAgua();

  const ayer = mover(fechaActual, -1);
  $("#comidas").innerHTML = COMIDAS.map(([id, nombreComida, emoji]) => {
    const lista = entradas(fechaActual, id);
    const suma = lista.reduce((t,e) => t + e.kcal, 0);
    const puedeRepetir = !lista.length && entradas(ayer, id).length > 0;
    return '<div class="comida">' +
      '<h2><span class="insignia i-' + id + '">' + emoji + '</span>' + nombreComida +
        '<span class="kcal">' + (suma ? Math.round(suma) + " kcal" : "") + '</span></h2>' +
      lista.map(e =>
        '<div class="linea-alimento">' +
          '<div class="nom"><b>' + esc(e.n) + '</b><span>' + esc(e.det) + '</span></div>' +
          '<div class="val">' + Math.round(e.kcal) + '</div>' +
          '<button class="quitar" data-quitar="' + id + '|' + e.id + '" aria-label="Quitar">✕</button>' +
        '</div>').join("") +
      (puedeRepetir
        ? '<button class="anadir repetir" data-repetir="' + id + '">↺ Repetir el de ayer</button>' : "") +
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
  guardar(); pintar(); revisarLogros();
}

function repetirComida(comida){
  const ayer = entradas(mover(fechaActual, -1), comida);
  if(!ayer.length) return;
  dia(fechaActual)[comida] = ayer.map(e => Object.assign({}, e,
    {id: Date.now().toString(36) + Math.random().toString(36).slice(2,6)}));
  guardar(); pintar(); revisarLogros();
  aviso("Copiado lo de ayer");
}

/* ---------------- buscar alimentos ---------------- */

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

function catalogo(){ return datos.propios.map(a => Object.assign({}, a)).concat(ALIMENTOS); }
function buscarAlimento(nombre){ return catalogo().find(a => a.n === nombre); }
const sinTildes = t => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function listar(texto){
  const q = sinTildes(texto.trim());
  let html = "";
  const botonNuevo = '<div class="item"><button class="principal" data-nuevo>' +
    '<span class="nom"><b>✎ Otro alimento</b><span>Apuntarlo a mano con sus calorías</span></span></button></div>';

  if(!q){
    const favoritos = datos.favoritos.map(buscarAlimento).filter(Boolean);
    if(favoritos.length) html += '<div class="grupo">⭐ Sus favoritos</div>' + favoritos.map(fila).join("");
    const recientes = datos.recientes.filter(r => !datos.favoritos.includes(r.n)).slice(0, 5);
    if(recientes.length) html += '<div class="grupo">🕒 Lo último que usó</div>' + recientes.map(fila).join("");
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
  const favorito = datos.favoritos.includes(a.n);
  return '<div class="item">' +
    '<button class="principal" data-alimento="' + esc(a.n) + '">' +
      '<span class="nom"><b>' + esc(a.n) + '</b><span>' + esc(detalle) + '</span></span>' +
      '<span class="val">' + kcal + ' kcal</span>' +
    '</button>' +
    '<button class="estrella' + (favorito ? " si" : "") + '" data-favorito="' + esc(a.n) + '" ' +
      'aria-label="Favorito">⭐</button>' +
  '</div>';
}

function alternarFavorito(nombre){
  if(datos.favoritos.includes(nombre)){
    datos.favoritos = datos.favoritos.filter(n => n !== nombre);
    aviso("Quitado de favoritos");
  }else{
    datos.favoritos = [nombre].concat(datos.favoritos).slice(0, 40);
    aviso("⭐ " + nombre + " en favoritos");
  }
  guardar();
  if($("#busca")) listar($("#busca").value);
}

/* ---------------- cantidad ---------------- */

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
          '<div class="resumen-kcal"><div class="n" id="cant-kcal">0</div><div class="d" id="cant-detalle"></div></div>' +
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
  marcarPorciones(); refrescarCantidad();
}
function marcarPorciones(){
  document.querySelectorAll("#cant-chips .chip").forEach((c,i) =>
    c.classList.toggle("sel", alimentoElegido.p[i][1] === gramosElegidos));
}
function refrescarCantidad(){
  const liquido = alimentoElegido.c === "bebida";
  $("#cant-kcal").textContent = Math.round(alimentoElegido.k * gramosElegidos / 100) + " kcal";
  $("#cant-detalle").textContent = Math.round(gramosElegidos) + (liquido ? " ml" : " g");
  $("#cant-gramos").value = Math.round(gramosElegidos);
}

function apuntarEntrada(comida, nombre, detalle, kcal){
  const lista = entradas(fechaActual, comida).slice();
  lista.push({id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
              n:nombre, det:detalle, kcal:Math.round(kcal)});
  dia(fechaActual)[comida] = lista;
  guardar();
}

function apuntar(alimento, gramos){
  const liquido = alimento.c === "bebida";
  const porcion = alimento.p.find(p => p[1] === gramos);
  const detalle = alimento.c === "propio"
    ? "1 ración"
    : (porcion ? porcion[0] + " · " : "") + Math.round(gramos) + (liquido ? " ml" : " g");
  const kcal = Math.round(alimento.k * gramos / 100);
  apuntarEntrada(comidaDestino, alimento.n, detalle, kcal);
  datos.recientes = [alimento].concat(datos.recientes.filter(a => a.n !== alimento.n)).slice(0, 12)
    .map(a => ({n:a.n, c:a.c, k:a.k, p:a.p}));
  guardar();
  cerrarHoja(); pintar();
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
  fechaActual = f; pintar();
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
            '<input id="nue-nombre" type="text" placeholder="Ej. Guiso de la abuela"></label>' +
          '<label class="campo"><span>Calorías de la porción que se tomó</span>' +
            '<input id="nue-kcal" type="number" inputmode="numeric" min="1" max="5000" placeholder="Ej. 350"></label>' +
          '<div class="nota">Suele venir en el envase como «kcal por porción». Si solo dice «por 100 g», ' +
          'multiplique por los gramos y divida entre 100.</div>' +
        '</div>' +
        '<button class="boton" id="nue-guardar">Añadir</button>' +
        '<div class="nota" style="text-align:center">Se guarda en su lista para volver a usarlo.</div>' +
      '</div>' +
    '</div>';
  setTimeout(() => $("#nue-nombre").focus(), 60);
}
function guardarNuevo(){
  const nombre = $("#nue-nombre").value.trim();
  const kcal = num($("#nue-kcal").value);
  if(!nombre) return aviso("Falta el nombre");
  if(!(kcal > 0)) return aviso("Faltan las calorías");
  const alimento = {n:nombre, c:"propio", k:Math.round(kcal), p:[["1 porción",100]]};
  datos.propios = [alimento].concat(datos.propios.filter(a => a.n !== nombre)).slice(0, 60);
  guardar();
  apuntar(alimento, 100);
}

/* ---------------- recetas ---------------- */

let filtroRecetas = "todas";
let recetasEnPantalla = [];
let recetaAbierta = null, porcionesAbiertas = 2;

function recordarRecetas(lista){
  lista.forEach(r => {
    if(!recetasEnPantalla.some(x => x.id === r.id && x.n === r.n)) recetasEnPantalla.push(r);
  });
}
function recetaPorClave(id, nombre){
  return recetasEnPantalla.find(r => r.id === id && r.n === nombre) ||
         datos.guardadas.find(r => r.id === id && r.n === nombre) ||
         RECETAS.find(r => r.id === id);
}
function estaGuardada(r){ return datos.guardadas.some(x => x.id === r.id && x.n === r.n); }

function tarjetaReceta(r){
  const {kcal, prot} = calcular(r, 1);
  const etiquetas = (r.etiquetas || []).slice(0, 2)
    .map(e => '<span class="etq' + (r.inventada ? " lima" : "") + '">' + esc(e) + '</span>').join("");
  return '<button class="receta' + (r.inventada ? " inventada" : "") + '" data-receta="' + esc(r.id) + '|' + esc(r.n) + '">' +
    '<span class="icono">' + r.e + '</span>' +
    '<span class="txt"><b>' + esc(r.n) + '</b>' +
      '<span>' + r.t + ' min · ' + kcal + ' kcal · ' + prot + ' g de proteína</span>' +
      '<span>' + etiquetas + '</span></span>' +
    '<span class="flecha-r">›</span></button>';
}

function pintarRecetas(){
  $("#chips-recetas").innerHTML = FILTROS_RECETAS.map(([id, nombre]) =>
    '<button class="chip' + (filtroRecetas === id ? " sel" : "") + '" data-filtro="' + esc(id) + '">' +
    esc(nombre) + '</button>').join("");

  let lista;
  if(filtroRecetas === "guardadas"){
    lista = datos.guardadas;
  }else{
    lista = RECETAS.slice();
    if(datos.perfil.vegetariano) lista = lista.filter(esVegetariana);
    if(filtroRecetas !== "todas"){
      lista = lista.filter(r => r.cat === filtroRecetas || r.etiquetas.includes(filtroRecetas));
    }
  }
  recordarRecetas(lista);
  $("#resultados-recetas").innerHTML = lista.length
    ? lista.map(tarjetaReceta).join("")
    : '<div class="tarjeta"><div class="vacio"><span class="em">' +
      (filtroRecetas === "guardadas" ? "❤️" : "🥄") + '</span>' +
      (filtroRecetas === "guardadas"
        ? "Todavía no ha guardado ninguna.<br>Abra una receta y pulse «Guardar»."
        : "Nada por aquí con ese filtro.") + '</div></div>';
}

function buscarReceta(texto){
  const peticion = (texto || "").trim();
  if(!peticion) return pintarRecetas();
  SIN_CARNE = !!datos.perfil.vegetariano;

  let encontradas = buscarRecetas(peticion);
  if(datos.perfil.vegetariano) encontradas = encontradas.filter(esVegetariana);
  const inventada = inventarReceta(peticion);
  const todas = encontradas.concat(inventada ? [inventada] : []);
  recordarRecetas(todas);
  filtroRecetas = "";
  $("#chips-recetas").innerHTML = '<button class="chip" data-filtro="todas">← Volver al recetario</button>';

  $("#resultados-recetas").innerHTML = todas.length
    ? (encontradas.length
        ? '<div class="grupo">🍽️ Del recetario</div>' + encontradas.map(tarjetaReceta).join("") : "") +
      (inventada
        ? '<div class="grupo">✨ Hecha con lo que ha pedido</div>' + tarjetaReceta(inventada) : "")
    : '<div class="tarjeta"><div class="vacio"><span class="em">🤔</span>' +
      'No he pillado ningún ingrediente en eso.<br>Pruebe nombrando algo concreto: ' +
      '«pollo», «atún», «yogur», «lentejas»…</div></div>';
}

function abrirReceta(r){
  recetaAbierta = r;
  porcionesAbiertas = datos.perfil.porciones || 2;
  pintarDetalleReceta();
}

function pintarDetalleReceta(){
  const r = recetaAbierta;
  const {lista, kcal, prot} = calcular(r, porcionesAbiertas);
  $("#hoja").innerHTML =
  '<div class="hoja">' +
    '<div class="hoja-cab"><b>' + esc(r.n) + '</b><button class="cerrar" data-cerrar>Cerrar</button></div>' +
    '<div class="hoja-cuerpo">' +
      '<div class="cabecera-receta">' +
        '<div class="emoji">' + r.e + '</div><h2>' + esc(r.n) + '</h2>' +
        '<div class="datos">' +
          '<div><b>' + r.t + ' min</b><span>Tiempo</span></div>' +
          '<div><b>' + kcal + '</b><span>kcal porción</span></div>' +
          '<div><b>' + prot + ' g</b><span>Proteína</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="tarjeta"><div class="porciones">' +
        '<b>Para ' + porcionesAbiertas + (porcionesAbiertas === 1 ? " persona" : " personas") + '</b>' +
        '<button data-porciones="-1" aria-label="Menos">−</button>' +
        '<span class="n">' + porcionesAbiertas + '</span>' +
        '<button data-porciones="1" aria-label="Más">+</button>' +
      '</div></div>' +
      '<div class="tarjeta"><div class="titulo">🛒 Ingredientes y qué comprar</div>' +
        lista.map(x => '<div class="ingrediente"><span class="marca"></span>' +
          '<span class="txt"><b>' + esc(x.n) + '</b><i>' + esc(x.prod) + '</i></span>' +
          '<span class="cant">' + esc(x.cantidad) + '</span></div>').join("") +
      '</div>' +
      '<div class="tarjeta"><div class="titulo">👩‍🍳 Cómo se hace</div>' +
        r.pasos.map((p,i) => '<div class="paso"><span class="num">' + (i+1) + '</span><span>' + esc(p) + '</span></div>').join("") +
      '</div>' +
      (r.tip ? '<div class="consejo"><b>Consejo</b>' + esc(r.tip) + '</div>' : "") +
      '<div class="tarjeta"><div class="titulo">🍽️ Anotarla en el día de hoy (' + kcal + ' kcal)</div>' +
        '<div class="chips">' + COMIDAS.map(([id, nombre, emoji]) =>
          '<button class="chip" data-receta-comida="' + id + '">' + emoji + " " + nombre + '</button>').join("") +
        '</div></div>' +
      '<button class="boton" id="copiar-lista">Copiar la lista para el súper</button>' +
      '<button class="boton ' + (estaGuardada(r) ? "roja" : "gris") + '" id="guardar-receta">' +
        (estaGuardada(r) ? "Quitar de guardadas" : "Guardar esta receta") + '</button>' +
    '</div>' +
  '</div>';
}

function anotarReceta(comida){
  const {kcal} = calcular(recetaAbierta, porcionesAbiertas);
  const antes = fechaActual;
  fechaActual = hoyISO();
  apuntarEntrada(comida, recetaAbierta.n, "1 porción · receta", kcal);
  cerrarHoja();
  if(antes !== fechaActual) aviso("Anotado en el día de hoy");
  else aviso(recetaAbierta.n + " · " + kcal + " kcal");
  cambiarVista("hoy");
  pintar();
  revisarLogros();
}

function alternarGuardada(){
  const r = recetaAbierta;
  if(estaGuardada(r)){
    datos.guardadas = datos.guardadas.filter(x => !(x.id === r.id && x.n === r.n));
    aviso("Quitada de guardadas");
  }else{
    datos.guardadas = [r].concat(datos.guardadas).slice(0, 60);
    aviso("Guardada ❤️");
  }
  guardar();
  pintarDetalleReceta();
}
function copiarLista(){
  const texto = listaCompra(recetaAbierta, porcionesAbiertas);
  if(navigator.clipboard){
    navigator.clipboard.writeText(texto)
      .then(() => aviso("Lista copiada, ya puede pegarla"))
      .catch(() => window.prompt("Copie la lista:", texto));
  }else{ window.prompt("Copie la lista:", texto); }
}

/* ---------------- progreso: peso, cintura e IMC ---------------- */

let serieGrafico = "peso";

function medidasOrdenadas(){ return datos.medidas.slice().sort((a,b) => a.f < b.f ? -1 : 1); }
function ultimaMedida(campo){
  const lista = medidasOrdenadas().filter(m => m[campo]);
  return lista.length ? lista[lista.length-1] : null;
}
function calcularIMC(peso){
  const altura = (datos.perfil.altura || 160) / 100;
  return peso / (altura * altura);
}
function categoriaIMC(imc){
  if(imc < 18.5) return ["Bajo peso", "por debajo de lo recomendado"];
  if(imc < 25)   return ["Peso normal", "dentro de lo recomendado"];
  if(imc < 30)   return ["Sobrepeso", "un poco por encima"];
  return ["Obesidad", "conviene verlo con el médico"];
}

function pintarProgreso(){
  const up = ultimaMedida("p"), uc = ultimaMedida("c");
  const altura = datos.perfil.altura || 160;
  let html = "";

  if(up){
    const imc = calcularIMC(up.p);
    const [cat, txt] = categoriaIMC(imc);
    const pos = Math.max(0, Math.min(100, (imc - 15) / 25 * 100));
    html += '<div class="medidor"><div class="n">' + coma(imc.toFixed(1)) + '</div>' +
      '<div class="txt"><b>' + cat + '</b><span>IMC con ' + coma(up.p) + ' kg y ' + altura + ' cm · ' + txt + '</span></div></div>' +
      '<div class="barra-imc"><i style="left:' + pos + '%"></i></div>' +
      '<div class="escala"><span style="left:14%">18,5</span>' +
      '<span style="left:40%">25</span><span style="left:60%">30</span></div>';
  }else{
    html += '<div class="vacio"><span class="em">⚖️</span>Apunte su peso y aquí verá el IMC.</div>';
  }

  if(uc){
    const indice = uc.c / altura;
    const bien = indice < 0.5;
    html += '<div style="height:16px"></div><div class="medidor">' +
      '<div class="n">' + coma(uc.c) + '<small style="font-size:16px"> cm</small></div>' +
      '<div class="txt"><b>Cintura · índice ' + coma(indice.toFixed(2)) + '</b>' +
      '<span>' + (bien ? "por debajo de 0,50: bien" : "por encima de 0,50: conviene bajarla") +
      ' (cintura dividida por la altura)</span></div></div>';
  }
  $("#resumen-imc").innerHTML = html;

  const series = [["peso","Peso"], ["cintura","Cintura"], ["imc","IMC"]];
  $("#chips-grafico").innerHTML = series.map(([id, nombre]) =>
    '<button class="chip' + (serieGrafico === id ? " sel" : "") + '" data-serie="' + id + '">' + nombre + '</button>').join("");
  dibujarGrafico();

  $("#lista-medidas").innerHTML = medidasOrdenadas().reverse().slice(0, 12).map(m =>
    '<div class="lista-medida"><span class="f">' + mayus(bonita(m.f)) + '</span>' +
    (m.p ? '<b>' + coma(m.p) + ' kg</b>' : "") +
    (m.c ? '<span class="c">' + coma(m.c) + ' cm</span>' : "") +
    '<button class="quitar" data-medida="' + m.f + '" aria-label="Quitar">✕</button></div>').join("");

  pintarBarras();
}

function dibujarGrafico(){
  const svg = $("#grafico");
  const puntos = medidasOrdenadas()
    .map(m => {
      if(serieGrafico === "peso")    return m.p ? {f:m.f, v:m.p} : null;
      if(serieGrafico === "cintura") return m.c ? {f:m.f, v:m.c} : null;
      return m.p ? {f:m.f, v:calcularIMC(m.p)} : null;
    })
    .filter(Boolean).slice(-30);

  if(puntos.length < 2){
    svg.innerHTML = '<text x="160" y="90" text-anchor="middle" font-size="13" fill="#6b7d75">' +
      'Con dos apuntes o más se dibuja la línea</text>';
    return;
  }
  const W = 320, H = 180, m = 28;
  const valores = puntos.map(p => p.v);
  const min = Math.min(...valores), max = Math.max(...valores);
  const rango = (max - min) || 1;
  const x = i => m + i * (W - m*2) / (puntos.length - 1);
  const y = v => H - m - ((v - min) / rango) * (H - m*2);
  const unidad = serieGrafico === "peso" ? " kg" : (serieGrafico === "cintura" ? " cm" : "");
  svg.innerHTML =
    '<defs><linearGradient id="gr" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="#047857"></stop><stop offset="100%" stop-color="#34d399"></stop>' +
    '</linearGradient></defs>' +
    '<polyline points="' + puntos.map((p,i) => x(i) + "," + y(p.v)).join(" ") + '" fill="none" ' +
      'stroke="url(#gr)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"></polyline>' +
    puntos.map((p,i) => '<circle cx="' + x(i) + '" cy="' + y(p.v) + '" r="3.5" fill="#059669"></circle>').join("") +
    '<text x="2" y="' + (m - 10) + '" font-size="11" fill="#6b7d75">' + coma(max.toFixed(1)) + unidad + '</text>' +
    '<text x="2" y="' + (H - m + 16) + '" font-size="11" fill="#6b7d75">' + coma(min.toFixed(1)) + unidad + '</text>' +
    '<text x="' + (W-2) + '" y="' + (H - m + 16) + '" font-size="11" fill="#6b7d75" text-anchor="end">' +
      cortita(puntos[puntos.length-1].f) + '</text>';
}

function pintarBarras(){
  const objetivo = datos.perfil.objetivo || 1500;
  const dias = [];
  for(let i = 6; i >= 0; i--){
    const f = mover(hoyISO(), -i);
    dias.push({f, t: totalDia(f)});
  }
  const tope = Math.max(objetivo, ...dias.map(d => d.t)) || 1;
  const letras = ["D","L","M","M","J","V","S"];
  $("#barras").innerHTML = dias.map(d =>
    '<div><i class="' + (d.t > objetivo ? "pasado" : "") + '" style="height:' +
    Math.max(3, Math.round(d.t/tope*100)) + '%"></i><span>' + letras[fecha(d.f).getDay()] + '</span></div>').join("");
  const conDatos = dias.filter(d => d.t > 0);
  $("#media-semana").textContent = conDatos.length
    ? "Media de los días apuntados: " + Math.round(conDatos.reduce((s,d) => s+d.t, 0)/conDatos.length) + " kcal al día"
    : "Cuando apunte unos días verá aquí la media de la semana.";
}

function guardarMedida(){
  const peso = num($("#med-peso").value);
  const cintura = num($("#med-cintura").value);
  const hayPeso = peso >= 20 && peso <= 300;
  const hayCintura = cintura >= 40 && cintura <= 200;
  if(!hayPeso && !hayCintura) return aviso("Escriba un peso o una cintura");

  const f = hoyISO();
  const anterior = datos.medidas.find(m => m.f === f) || {f};
  if(hayPeso){ anterior.p = Math.round(peso*10)/10; datos.perfil.peso = anterior.p; }
  if(hayCintura) anterior.c = Math.round(cintura*10)/10;
  datos.medidas = datos.medidas.filter(m => m.f !== f).concat([anterior]);
  guardar();
  $("#med-peso").value = ""; $("#med-cintura").value = "";
  pintarProgreso(); cargarAjustes();
  aviso("Apuntado");
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
  desayuno: ["¿Ya desayunó?", "Apúntelo antes de que se le olvide ☕"],
  comida:   ["¿Qué tal el almuerzo?", "Apúntelo y siga con su racha 🔥"],
  cena:     ["Última del día", "Apunte la cena y cierre el día 🌙"],
  agua:     ["¿Va tomando agua?", "Toque los vasos que lleva 💧"]
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
      await p.schedule({notifications: cuales.map((c,i) => {
        const [h,m] = (datos.avisos[c] || "09:00").split(":").map(Number);
        return {id:i+1, title:TEXTOS_AVISO[c][0], body:TEXTOS_AVISO[c][1],
                smallIcon:"ic_stat_calorias",
                schedule:{on:{hour:h, minute:m}, allowWhileIdle:true, repeats:true}};
      })});
    }catch(e){ /* si el móvil no deja programar, la app sigue igual */ }
  },
  async probar(){
    const p = this.plugin();
    if(!p) return aviso("Los avisos solo funcionan en la app instalada");
    if(!await this.permiso()) return aviso("Hay que dar permiso de notificaciones");
    try{
      await p.schedule({notifications:[{id:99, title:"Así se verán los avisos",
        body:"¿Ya apuntó lo que comió? 🍽️", smallIcon:"ic_stat_calorias",
        schedule:{at:new Date(Date.now() + 5000)}}]});
      aviso("Le llegará un aviso en 5 segundos");
    }catch(e){ aviso("Este móvil no dejó programar el aviso"); }
  }
};

async function cambiarAvisos(){
  const encender = !datos.avisos.activos;
  if(encender && Nativo.enMovil() && !await Nativo.permiso()){
    return aviso("Sin permiso de notificaciones no puedo avisar");
  }
  datos.avisos.activos = encender;
  guardar(); cargarAjustes(); Nativo.programar();
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
  $("#aj-porciones").value = p.porciones;
  $("#aj-vegetariano").classList.toggle("si", !!p.vegetariano);
  $("#aj-avisos").classList.toggle("si", !!a.activos);
  $("#horas-avisos").classList.toggle("oculto", !a.activos);
  ["desayuno","comida","cena","agua"].forEach(c => { $("#aj-hora-" + c).value = a[c]; });
  $("#nota-avisos").textContent = Nativo.enMovil()
    ? "Los avisos llegan aunque la app esté cerrada."
    : "Desde el navegador no puedo avisar: los recordatorios funcionan en la app instalada (el APK).";
  $("#version-app").textContent = "Mi salud · versión " + VERSION;
  SIN_CARNE = !!p.vegetariano;
}

function guardarAjustes(){
  const p = datos.perfil;
  p.objetivo = Math.max(800, Math.min(5000, parseInt($("#aj-objetivo").value, 10) || 1500));
  p.nombre = $("#aj-nombre").value.trim();
  p.edad = parseInt($("#aj-edad").value, 10) || p.edad;
  p.altura = parseInt($("#aj-altura").value, 10) || p.altura;
  p.peso = num($("#aj-peso").value) || p.peso;
  p.sexo = $("#aj-sexo").value;
  p.actividad = $("#aj-actividad").value;
  p.plan = $("#aj-plan").value;
  p.vasos = Math.max(4, Math.min(12, parseInt($("#aj-agua").value, 10) || 8));
  p.porciones = Math.max(1, Math.min(8, parseInt($("#aj-porciones").value, 10) || 2));
  ["desayuno","comida","cena","agua"].forEach(c => {
    if($("#aj-hora-" + c).value) datos.avisos[c] = $("#aj-hora-" + c).value;
  });
  guardar(); pintar(); Nativo.programar();
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
  guardar(); cargarAjustes(); pintar();
  aviso(recorte ? "Tope: " + objetivo + " kcal (no bajamos de ahí)" : "Tope: " + objetivo + " kcal al día");
}

function exportar(){
  const texto = JSON.stringify(datos);
  if(navigator.clipboard){
    navigator.clipboard.writeText(texto)
      .then(() => aviso("Datos copiados. Péguelos en un correo o WhatsApp"))
      .catch(() => window.prompt("Copie este texto y guárdelo:", texto));
  }else{ window.prompt("Copie este texto y guárdelo:", texto); }
}
function importar(){
  const texto = window.prompt("Pegue aquí el texto de la copia:");
  if(!texto) return;
  try{
    const nuevo = JSON.parse(texto);
    if(!nuevo || typeof nuevo !== "object" || !nuevo.perfil) throw new Error("formato");
    datos = Object.assign(porDefecto(), nuevo);
    if(nuevo.pesos && !nuevo.medidas) datos.medidas = nuevo.pesos.map(x => ({f:x.f, p:x.p}));
    guardar(); cargarAjustes(); pintar(); pintarProgreso(); pintarLogros();
    aviso("Datos recuperados");
  }catch(e){ aviso("Ese texto no vale, vuelva a copiarlo entero"); }
}
function borrarTodo(){
  if(!confirm("¿Seguro? Se borra todo: comidas, medidas, favoritos y medallas.")) return;
  datos = porDefecto();
  guardar(); cargarAjustes(); pintar(); pintarProgreso(); pintarLogros(); Nativo.programar();
  aviso("Todo borrado");
}

/* ---------------- navegación ---------------- */

const VISTAS = ["hoy","recetas","progreso","logros","ajustes"];

function cambiarVista(v){
  vista = v;
  VISTAS.forEach(x => $("#vista-" + x).classList.toggle("oculto", x !== v));
  document.querySelectorAll("nav button").forEach(b => b.classList.toggle("activa", b.dataset.vista === v));
  $("#cabecera").classList.toggle("oculto", v !== "hoy");
  if(v === "recetas" && !$("#resultados-recetas").innerHTML) pintarRecetas();
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
  if(t.dataset.repetir) return repetirComida(t.dataset.repetir);
  if(t.dataset.comida) return abrirBuscador(t.dataset.comida);
  if(t.hasAttribute("data-cerrar")) return cerrarHoja();
  if(t.hasAttribute("data-nuevo")) return abrirNuevo();
  if(t.hasAttribute("data-cerrar-celebra")){
    $("#celebracion").innerHTML = "";
    if(vista === "logros") pintarLogros();
    return siguienteCelebracion();
  }
  if(t.dataset.favorito) return alternarFavorito(t.dataset.favorito);
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
    ultimoBorrado = {fecha:fechaActual, comida, posicion, entrada:lista[posicion]};
    dia(fechaActual)[comida] = lista.filter(e => e.id !== id);
    guardar(); pintar();
    aviso("Quitado " + ultimoBorrado.entrada.n, "Deshacer");
    return;
  }
  if(t.dataset.deshacer) return deshacer();

  /* recetas */
  if(t.id === "buscar-receta") return buscarReceta($("#peticion").value);
  if(t.dataset.filtro){ filtroRecetas = t.dataset.filtro; $("#peticion").value = ""; return pintarRecetas(); }
  if(t.dataset.receta){
    const [id, nombre] = t.dataset.receta.split("|");
    const r = recetaPorClave(id, nombre);
    if(r) abrirReceta(r);
    return;
  }
  if(t.dataset.porciones){
    porcionesAbiertas = Math.max(1, Math.min(8, porcionesAbiertas + parseInt(t.dataset.porciones, 10)));
    return pintarDetalleReceta();
  }
  if(t.dataset.recetaComida) return anotarReceta(t.dataset.recetaComida);
  if(t.id === "copiar-lista") return copiarLista();
  if(t.id === "guardar-receta") return alternarGuardada();

  /* progreso */
  if(t.id === "med-guardar") return guardarMedida();
  if(t.dataset.serie){ serieGrafico = t.dataset.serie; return pintarProgreso(); }
  if(t.dataset.medida){
    datos.medidas = datos.medidas.filter(m => m.f !== t.dataset.medida);
    guardar(); pintarProgreso();
    return;
  }

  /* ajustes */
  if(t.id === "aj-avisos") return cambiarAvisos();
  if(t.id === "aj-probar") return Nativo.probar();
  if(t.id === "aj-calcular") return calcularObjetivo();
  if(t.id === "aj-vegetariano"){
    datos.perfil.vegetariano = !datos.perfil.vegetariano;
    guardar(); cargarAjustes();
    if(vista === "recetas") pintarRecetas();
    aviso(datos.perfil.vegetariano ? "Recetas sin carne ni pescado" : "Recetas con todo");
    return;
  }
  if(t.id === "aj-exportar") return exportar();
  if(t.id === "aj-importar") return importar();
  if(t.id === "aj-borrar") return borrarTodo();
});

document.querySelectorAll("#vista-ajustes input, #vista-ajustes select")
  .forEach(el => el.addEventListener("change", guardarAjustes));

["med-peso","med-cintura"].forEach(id =>
  $("#" + id).addEventListener("keydown", e => { if(e.key === "Enter") guardarMedida(); }));

$("#peticion").addEventListener("keydown", e => {
  if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); buscarReceta($("#peticion").value); }
});

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

if("serviceWorker" in navigator && location.protocol.startsWith("http") && !Nativo.enMovil()){
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
