/* Mi salud — calorías descontando, macros y micros, menú semanal con fotos,
   recetas y control de peso, cintura e IMC. Todo dentro del teléfono. */

const VERSION = "4.0";
const CLAVE = "miscalorias.v1";

const COMIDAS = [
  ["desayuno", "Desayuno", "☕"],
  ["comida",   "Comida",   "🍽️"],
  ["merienda", "Merienda", "🍪"],
  ["cena",     "Cena",     "🌙"],
  ["picoteo",  "Picoteo",  "🍿"]
];
const COMIDAS_MENU = ["desayuno", "comida", "merienda", "cena"];

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
  {id:"foto",         e:"📷", n:"Primera foto",     d:"Sacarle una foto a un plato"},
  {id:"peso-kilo",    e:"📉", n:"El primer kilo",   d:"Bajar 1 kg"},
  {id:"objetivo-cinco",e:"🎯", n:"Cinco dianas",    d:"5 días dentro del tope"}
];

const FILTROS_RECETAS = [
  ["guardadas", "❤️ Guardadas"], ["todas","Todas"], ["desayuno","Desayuno"], ["almuerzo","Comida"],
  ["once","Merienda"], ["cena","Cena"], ["snack","Snack"], ["rápido","Rápidas"],
  ["económico","Económicas"], ["chileno","Chilenas"], ["alto en proteína","Con proteína"]
];

/* ---------------- datos ---------------- */

const porDefecto = () => ({
  perfil: {nombre:"", objetivo:1500, sexo:"m", edad:55, altura:160, peso:70,
           actividad:"1.375", plan:"0", vasos:8, porciones:2, vegetariano:false, racion:10},
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
function diaMes(f){ const [,m,d] = f.split("-").map(Number); return d + "/" + m; }
function lunesDe(f){
  const d = fecha(f);
  const desplaza = (d.getDay() + 6) % 7;      // lunes = 0
  return mover(f, -desplaza);
}

const $ = s => document.querySelector(s);
const esc = t => String(t).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const num = v => parseFloat(String(v == null ? "" : v).replace(",", "."));
const coma = n => String(n).replace(".", ",");
const mayus = t => t.replace(/^./, c => c.toUpperCase());
const redondo = (n, d) => { const p = Math.pow(10, d || 0); return Math.round(n * p) / p; };
const sinTildes = t => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

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

/* ---------------- alimentos: dos fuentes ---------------- */

/* 1) HABITUALES: con macros y micros completos, medidas en unidades/g/cda/cdta
   2) ALIMENTOS: la lista larga de siempre, solo con calorías */

function habitual(id){
  const h = HABITUALES[id];
  if(!h) return null;
  return Object.assign({clave:"h:" + id, id, hab:true}, h);
}
function antiguo(nombre){
  const a = datos.propios.concat(ALIMENTOS).find(x => x.n === nombre);
  if(!a) return null;
  return Object.assign({clave:"a:" + nombre, hab:false}, a);
}
function porClave(clave){
  return clave.slice(0,2) === "h:" ? habitual(clave.slice(2)) : antiguo(clave.slice(2));
}

function gramosDe(a, unidad, cantidad){
  if(unidad === "g" || unidad === "ml") return cantidad;
  return cantidad * (a.gr[unidad] || 1);
}
function nutrientesDe(a, gramos){
  const f = gramos / 100;
  return {kcal: a.kcal*f, prot: a.prot*f, carb: a.carb*f, gras: a.gras*f, fib: a.fib*f,
          na: a.na*f, ca: a.ca*f, fe: a.fe*f, k: a.k*f, vc: a.vc*f};
}
function textoCantidad(unidad, cantidad){
  const fr = {0.25:"¼", 0.5:"½", 0.75:"¾", 1.5:"1½", 2.5:"2½"};
  const n = fr[cantidad] || coma(redondo(cantidad, 2));
  const plural = cantidad > 1;
  const nombres = {unidad: plural?"unidades":"unidad", cda: plural?"cdas":"cda",
                   cdta: plural?"cdtas":"cdta", taza: plural?"tazas":"taza",
                   pizca: plural?"pizcas":"pizca", g:"g", ml:"ml"};
  return (unidad === "g" || unidad === "ml") ? Math.round(cantidad) + " " + unidad
                                             : n + " " + (nombres[unidad] || unidad);
}

/* ---------------- totales del día ---------------- */

function totalesDia(f){
  const t = {kcal:0, prot:0, carb:0, gras:0, fib:0, na:0, ca:0, fe:0, k:0, vc:0, incompletos:0};
  COMIDAS.forEach(([id]) => entradas(f, id).forEach(e => {
    t.kcal += e.kcal;
    if(e.nut){
      ["prot","carb","gras","fib","na","ca","fe","k","vc"].forEach(x => {
        if(typeof e.nut[x] === "number") t[x] += e.nut[x];
      });
      if(typeof e.nut.carb !== "number") t.incompletos++;
    }else{
      t.incompletos++;
    }
  }));
  return t;
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
    const t = totalesDia(f).kcal;
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
    case "foto":           return Fotos.hechas > 0;
    case "peso-kilo":      return kilosBajados() >= 1;
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
      '<div class="disco">' + l.e + '</div><h3>¡Medalla conseguida!</h3>' +
      '<p><b>' + esc(l.n) + '</b><br>' + esc(l.d) + '</p>' +
      '<button class="boton" data-cerrar-celebra>¡Genial!</button>' +
    '</div></div>';
}

/* ---------------- fotos de los platos ---------------- */

const Fotos = {
  bd: null, cache: {}, hechas: 0,
  async abrir(){
    if(this.bd) return this.bd;
    this.bd = await new Promise((res, rej) => {
      const pet = indexedDB.open("misalud", 1);
      pet.onupgradeneeded = () => pet.result.createObjectStore("fotos");
      pet.onsuccess = () => res(pet.result);
      pet.onerror = () => rej(pet.error);
    }).catch(() => null);
    return this.bd;
  },
  clave(f, comida){ return f + "|" + comida; },
  async guardar(f, comida, blob){
    const bd = await this.abrir();
    if(!bd) return aviso("Este móvil no deja guardar fotos");
    await new Promise(res => {
      const t = bd.transaction("fotos", "readwrite");
      t.objectStore("fotos").put(blob, this.clave(f, comida));
      t.oncomplete = res; t.onerror = res;
    });
    delete this.cache[this.clave(f, comida)];
    this.hechas++;
  },
  async leer(f, comida){
    const c = this.clave(f, comida);
    if(this.cache[c] !== undefined) return this.cache[c];
    const bd = await this.abrir();
    if(!bd) return null;
    const blob = await new Promise(res => {
      const t = bd.transaction("fotos", "readonly");
      const p = t.objectStore("fotos").get(c);
      p.onsuccess = () => res(p.result || null);
      p.onerror = () => res(null);
    });
    this.cache[c] = blob ? URL.createObjectURL(blob) : null;
    return this.cache[c];
  },
  async borrar(f, comida){
    const bd = await this.abrir();
    if(!bd) return;
    await new Promise(res => {
      const t = bd.transaction("fotos", "readwrite");
      t.objectStore("fotos").delete(this.clave(f, comida));
      t.oncomplete = res; t.onerror = res;
    });
    delete this.cache[this.clave(f, comida)];
  },
  /* las fotos se achican antes de guardarlas: si no, llenan el teléfono */
  reducir(archivo){
    return new Promise(res => {
      const img = new Image();
      img.onload = () => {
        const max = 720;
        const escala = Math.min(1, max / Math.max(img.width, img.height));
        const lienzo = document.createElement("canvas");
        lienzo.width = Math.round(img.width * escala);
        lienzo.height = Math.round(img.height * escala);
        lienzo.getContext("2d").drawImage(img, 0, 0, lienzo.width, lienzo.height);
        URL.revokeObjectURL(img.src);
        lienzo.toBlob(b => res(b || archivo), "image/jpeg", 0.65);
      };
      img.onerror = () => res(archivo);
      img.src = URL.createObjectURL(archivo);
    });
  }
};

let fotoDestino = null;
function pedirFoto(comida){
  fotoDestino = {f: fechaActual, comida};
  $("#entrada-foto").value = "";
  $("#entrada-foto").click();
}
$("#entrada-foto").addEventListener("change", async e => {
  const archivo = e.target.files && e.target.files[0];
  if(!archivo || !fotoDestino) return;
  aviso("Guardando la foto…");
  const pequena = await Fotos.reducir(archivo);
  await Fotos.guardar(fotoDestino.f, fotoDestino.comida, pequena);
  aviso("Foto guardada 📷");
  pintar();
  revisarLogros();
});

async function pintarFotos(){
  const marcos = document.querySelectorAll("[data-foto-de]");
  for(const marco of marcos){
    const [f, comida] = marco.dataset.fotoDe.split("|");
    const url = await Fotos.leer(f, comida);
    if(url) marco.innerHTML = '<img src="' + url + '" alt="">' +
      '<button class="quitar-foto" data-quitar-foto="' + f + '|' + comida + '">✕</button>';
  }
}

/* ---------------- pantalla de hoy ---------------- */

function pintar(){
  const esHoy = fechaActual === hoyISO();
  const hora = new Date().getHours();
  const saludo = hora < 13 ? "Buenos días" : (hora < 21 ? "Buenas tardes" : "Buenas noches");
  const nombre = datos.perfil.nombre;
  $("#saludo").textContent = esHoy ? saludo + (nombre ? ", " + nombre : "")
                                   : mayus(bonita(fechaActual).replace(/,.*/, ""));
  $("#fecha-sub").textContent = mayus(bonita(fechaActual));
  $("#dia-despues").disabled = fechaActual >= hoyISO();

  const dias = racha();
  $("#racha-num").textContent = dias;
  $("#chip-racha").classList.toggle("apagada", dias === 0);

  const objetivo = datos.perfil.objetivo || 1500;
  const t = totalesDia(fechaActual);
  const quedan = objetivo - t.kcal;
  const pasado = quedan < 0;

  $("#rotulo-hero").textContent = pasado ? "Se ha pasado" : "Te quedan";
  $("#kcal-restantes").textContent = Math.round(Math.abs(quedan));
  $("#kcal-comidas").textContent = "de " + objetivo + " · lleva " + Math.round(t.kcal);
  $("#mini-objetivo").textContent = objetivo;
  $("#mini-comido").textContent = Math.round(t.kcal);
  $("#mini-agua").textContent = vasosDia(fechaActual) + "/" + (datos.perfil.vasos || 8);
  $("#hero").classList.toggle("pasado", pasado);
  $("#anillo-progreso").style.strokeDashoffset = 541 * Math.min(1, t.kcal/objetivo);

  pintarMacros(t);
  pintarMicros(t);
  pintarAgua();
  pintarComidas();
  pintarFotos();
}

function pintarMacros(t){
  const kcalMacros = t.prot*4 + t.carb*4 + t.gras*9;
  const filas = [
    ["Proteína",      t.prot, t.prot*4, "prot"],
    ["Carbohidratos", t.carb, t.carb*4, "carb"],
    ["Grasa",         t.gras, t.gras*9, "gras"]
  ];
  $("#macros").innerHTML = filas.map(([nombre, gramos, kcal, clase]) => {
    const pct = kcalMacros ? Math.round(kcal/kcalMacros*100) : 0;
    return '<div class="macro">' +
      '<div class="macro-cab"><b>' + nombre + '</b>' +
        '<span>' + coma(redondo(gramos,1)) + ' g · ' + pct + ' %</span></div>' +
      '<div class="barra"><i class="' + clase + '" style="width:' + pct + '%"></i></div>' +
    '</div>';
  }).join("");

  const racion = datos.perfil.racion || 10;
  $("#raciones").innerHTML =
    '<div class="racion-caja"><b>' + coma(redondo(t.carb/racion, 1)) + '</b>' +
    '<span>raciones de carbohidratos<br>(' + racion + ' g cada una)</span></div>';
}

function pintarMicros(t){
  $("#micros").innerHTML = MICROS.map(m => {
    const valor = t[m.id] || 0;
    const pct = Math.round(valor / m.rda * 100);
    const exceso = m.tipo === "limite" && pct > 100;
    return '<div class="micro">' +
      '<div class="micro-cab"><b>' + m.n + '</b>' +
        '<span>' + coma(redondo(valor, valor < 10 ? 1 : 0)) + ' ' + m.u +
        ' · <i class="' + (exceso ? "malo" : "") + '">' + pct + ' %</i></span></div>' +
      '<div class="barra"><i class="' + (exceso ? "malo" : (m.tipo === "limite" ? "limite" : "micro")) +
        '" style="width:' + Math.min(100, pct) + '%"></i></div>' +
    '</div>';
  }).join("");
  const t2 = totalesDia(fechaActual);
  $("#nota-micros").textContent = t2.incompletos
    ? "Los porcentajes son sobre lo recomendado al día. Faltan los datos de " + t2.incompletos +
      (t2.incompletos === 1 ? " alimento" : " alimentos") + " (recetas o de la lista ampliada)."
    : "Los porcentajes son sobre lo recomendado al día para una mujer adulta. El sodio es un tope, no una meta.";
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

function pintarComidas(){
  const ayer = mover(fechaActual, -1);
  $("#comidas").innerHTML = COMIDAS.map(([id, nombreComida, emoji]) => {
    const lista = entradas(fechaActual, id);
    const suma = lista.reduce((s,e) => s + e.kcal, 0);
    const puedeRepetir = !lista.length && entradas(ayer, id).length > 0;
    return '<div class="comida">' +
      '<h2><span class="insignia i-' + id + '">' + emoji + '</span>' +
        '<span class="nombre-comida">' + nombreComida +
          (lista.length ? '<i>' + esc(tituloComida(fechaActual, id)) + '</i>' : "") + '</span>' +
        '<span class="kcal">' + (suma ? Math.round(suma) + " kcal" : "") + '</span>' +
        '<button class="foto-boton" data-foto="' + id + '" aria-label="Foto">📷</button></h2>' +
      '<div class="marco-foto" data-foto-de="' + fechaActual + '|' + id + '"></div>' +
      lista.map(e =>
        '<div class="linea-alimento">' +
          '<div class="nom"><b>' + esc(e.n) + '</b><span>' + esc(e.det) + '</span></div>' +
          '<div class="val">' + Math.round(e.kcal) + '</div>' +
          '<button class="quitar" data-quitar="' + id + '|' + e.id + '" aria-label="Quitar">✕</button>' +
        '</div>').join("") +
      (puedeRepetir ? '<button class="anadir repetir" data-repetir="' + id + '">↺ Repetir el de ayer</button>' : "") +
      '<button class="anadir" data-comida="' + id + '">＋ Añadir a ' + nombreComida.toLowerCase() + '</button>' +
    '</div>';
  }).join("");
}

function repetirComida(comida){
  const ayer = entradas(mover(fechaActual, -1), comida);
  if(!ayer.length) return;
  dia(fechaActual)[comida] = ayer.map(e => Object.assign({}, e,
    {id: Date.now().toString(36) + Math.random().toString(36).slice(2,6)}));
  guardar(); pintar(); revisarLogros();
  aviso("Copiado lo de ayer");
}

/* ---------------- títulos automáticos de cada plato ---------------- */

function tituloComida(f, comida){
  const lista = entradas(f, comida);
  if(!lista.length) return "";
  const receta = lista.find(e => /receta/.test(e.det || ""));
  if(receta) return receta.n;
  const nombres = lista.slice().sort((a,b) => b.kcal - a.kcal).slice(0,3).map(e => e.n.toLowerCase());
  if(nombres.length === 1) return mayus(nombres[0]);
  return mayus(nombres.slice(0,-1).join(", ") + " y " + nombres[nombres.length-1]);
}

/* ---------------- añadir alimentos ---------------- */

let comidaDestino = "desayuno";
let pestanaAlimentos = "habituales";

function abrirBuscador(comida){
  comidaDestino = comida;
  pestanaAlimentos = "habituales";
  const nombre = COMIDAS.find(c => c[0] === comida)[1];
  $("#hoja").innerHTML =
    '<div class="hoja">' +
      '<div class="hoja-cab"><b>Añadir a ' + nombre + '</b><button class="cerrar" data-cerrar>Cerrar</button></div>' +
      '<div class="buscador"><input id="busca" type="search" placeholder="Buscar alimento…" autocomplete="off">' +
        '<div class="chips chips-cat" id="chips-alimentos"></div></div>' +
      '<div class="hoja-cuerpo" id="resultados"></div>' +
    '</div>';
  pintarChipsAlimentos();
  listar("");
  $("#busca").addEventListener("input", e => listar(e.target.value));
}

function pintarChipsAlimentos(){
  const chips = [["habituales", "🍽️ Habituales"], ["favoritos", "⭐ Favoritos"]]
    .concat(CATEGORIAS_HAB.map(([id, n, e]) => [id, e + " " + n]))
    .concat([["mas", "🔎 Lista ampliada"]]);
  $("#chips-alimentos").innerHTML = chips.map(([id, n]) =>
    '<button class="chip' + (pestanaAlimentos === id ? " sel" : "") + '" data-pestana="' + id + '">' +
    esc(n) + '</button>').join("");
}

function listar(texto){
  const q = sinTildes((texto || "").trim());
  let html = "";

  if(q){
    const hab = Object.keys(HABITUALES).filter(id => sinTildes(HABITUALES[id].n).includes(q))
      .map(habitual);
    const otros = datos.propios.concat(ALIMENTOS)
      .filter(a => sinTildes(a.n).includes(q))
      .filter(a => !hab.some(h => sinTildes(h.n) === sinTildes(a.n)))
      .slice(0, 40).map(a => antiguo(a.n));
    html = (hab.length ? '<div class="grupo">Con datos completos</div>' + hab.map(fila).join("") : "") +
           (otros.length ? '<div class="grupo">Solo con calorías</div>' + otros.map(fila).join("") : "");
    if(!hab.length && !otros.length) html = '<div class="vacio">No aparece nada con ese nombre.</div>';
    html += botonNuevo();
  }else if(pestanaAlimentos === "habituales"){
    const dela = Object.keys(HABITUALES).filter(id => (HABITUALES[id].com || []).includes(comidaDestino));
    const nombre = COMIDAS.find(c => c[0] === comidaDestino)[1].toLowerCase();
    html = '<div class="grupo">Habituales en ' + (comidaDestino === "desayuno" ? "el " : "la ") + nombre + '</div>' +
      dela.map(habitual).map(fila).join("") + botonNuevo();
  }else if(pestanaAlimentos === "favoritos"){
    const favs = datos.favoritos.map(porClave).filter(Boolean);
    html = favs.length
      ? '<div class="grupo">⭐ Sus favoritos</div>' + favs.map(fila).join("")
      : '<div class="vacio"><span class="em">⭐</span>Marque la estrella de un alimento y aparecerá aquí.</div>';
    html += botonNuevo();
  }else if(pestanaAlimentos === "mas"){
    const recientes = datos.recientes.map(porClave).filter(Boolean).slice(0, 5);
    if(recientes.length) html += '<div class="grupo">🕒 Lo último que usó</div>' + recientes.map(fila).join("");
    CATEGORIAS.forEach(([id, nombre, emoji]) => {
      const lista = datos.propios.concat(ALIMENTOS).filter(a => a.c === id).map(a => antiguo(a.n));
      if(lista.length) html += '<div class="grupo">' + emoji + " " + nombre + '</div>' + lista.map(fila).join("");
    });
    html += botonNuevo();
  }else{
    const lista = Object.keys(HABITUALES).filter(id => HABITUALES[id].cat === pestanaAlimentos).map(habitual);
    const cat = CATEGORIAS_HAB.find(c => c[0] === pestanaAlimentos);
    html = '<div class="grupo">' + cat[2] + " " + cat[1] + '</div>' + lista.map(fila).join("") + botonNuevo();
  }
  $("#resultados").innerHTML = html;
}

function botonNuevo(){
  return '<div class="item"><button class="principal" data-nuevo>' +
    '<span class="nom"><b>✎ Otro alimento</b><span>Apuntarlo a mano con sus calorías</span></span></button></div>';
}

function fila(a){
  const favorito = datos.favoritos.includes(a.clave);
  let detalle, kcal;
  if(a.hab){
    const g = gramosDe(a, a.def.u, a.def.c);
    kcal = Math.round(a.kcal * g / 100);
    detalle = textoCantidad(a.def.u, a.def.c) + (a.def.u === "g" || a.def.u === "ml" ? "" : " · " + Math.round(g) + " g");
  }else{
    const p = a.p[0];
    kcal = Math.round(a.k * p[1] / 100);
    detalle = p[0] + " · " + p[1] + (a.c === "bebida" ? " ml" : " g");
  }
  return '<div class="item">' +
    '<button class="principal" data-abrir-alimento="' + esc(a.clave) + '">' +
      '<span class="nom"><b>' + esc(a.n) + '</b><span>' + esc(detalle) + '</span></span>' +
      '<span class="val">' + kcal + ' kcal</span>' +
    '</button>' +
    '<button class="rapido" data-rapido="' + esc(a.clave) + '" aria-label="Añadir">＋</button>' +
    '<button class="estrella' + (favorito ? " si" : "") + '" data-favorito="' + esc(a.clave) + '" ' +
      'aria-label="Favorito">⭐</button>' +
  '</div>';
}

function alternarFavorito(clave){
  const a = porClave(clave);
  if(datos.favoritos.includes(clave)){
    datos.favoritos = datos.favoritos.filter(c => c !== clave);
    aviso("Quitado de favoritos");
  }else{
    datos.favoritos = [clave].concat(datos.favoritos).slice(0, 60);
    aviso("⭐ " + (a ? a.n : "") + " en favoritos");
  }
  guardar();
  if($("#busca")) listar($("#busca").value);
}

/* ---------------- elegir cantidad ---------------- */

let elegido = null, unidadElegida = "g", cantidadElegida = 1;

function abrirCantidad(clave){
  elegido = porClave(clave);
  if(!elegido) return;
  if(elegido.hab){ unidadElegida = elegido.def.u; cantidadElegida = elegido.def.c; }
  else { unidadElegida = "g"; cantidadElegida = elegido.p[0][1]; }
  pintarCantidad();
}

function pintarCantidad(){
  const a = elegido;
  const unidades = a.hab ? a.u : ["g"];
  const gramos = a.hab ? gramosDe(a, unidadElegida, cantidadElegida) : cantidadElegida;
  const kcal = Math.round((a.hab ? a.kcal : a.k) * gramos / 100);
  const nut = a.hab ? nutrientesDe(a, gramos) : null;
  const paso = (unidadElegida === "g" || unidadElegida === "ml") ? 10 : 0.5;

  $("#hoja").innerHTML =
    '<div class="hoja">' +
      '<div class="hoja-cab"><b>' + esc(a.n) + '</b><button class="cerrar" data-cerrar>Cerrar</button></div>' +
      '<div class="hoja-cuerpo">' +
        '<div class="tarjeta">' +
          '<div class="resumen-kcal"><div class="n">' + kcal + ' kcal</div>' +
            '<div class="d">' + Math.round(gramos) + ' g' +
            (nut ? ' · ' + coma(redondo(nut.prot,1)) + ' g proteína · ' +
                   coma(redondo(nut.carb,1)) + ' g carbos · ' + coma(redondo(nut.gras,1)) + ' g grasa' : "") +
            '</div></div>' +
          (a.hab
            ? '<div class="titulo">Medida</div><div class="chips">' +
                unidades.map(u => '<button class="chip' + (u === unidadElegida ? " sel" : "") +
                  '" data-unidad="' + u + '">' + esc(nombreUnidad(u)) + '</button>').join("") + '</div>'
            : '<div class="titulo">Porción</div><div class="chips">' +
                a.p.map((p,i) => '<button class="chip' + (p[1] === cantidadElegida ? " sel" : "") +
                  '" data-porcion="' + i + '">' + esc(p[0]) + '</button>').join("") + '</div>') +
          '<div class="titulo" style="margin-top:18px">Cuánto</div>' +
          '<div class="contador">' +
            '<button data-paso="' + (-paso) + '">−</button>' +
            '<input id="cant" type="text" inputmode="decimal" value="' + coma(redondo(cantidadElegida,2)) + '">' +
            '<button data-paso="' + paso + '">+</button>' +
          '</div>' +
          '<div class="nota" style="text-align:center">' + esc(nombreUnidad(unidadElegida)) + '</div>' +
        '</div>' +
        '<button class="boton" id="cant-guardar">Añadir</button>' +
      '</div>' +
    '</div>';
  $("#cant").addEventListener("input", e => {
    const v = num(e.target.value);
    if(v > 0){ cantidadElegida = v; refrescarResumen(); }
  });
}

function nombreUnidad(u){
  return {unidad:"unidades", g:"gramos", ml:"mililitros", cda:"cucharadas",
          cdta:"cucharaditas", taza:"tazas", pizca:"pizcas"}[u] || u;
}
function refrescarResumen(){
  const a = elegido;
  const gramos = a.hab ? gramosDe(a, unidadElegida, cantidadElegida) : cantidadElegida;
  const kcal = Math.round((a.hab ? a.kcal : a.k) * gramos / 100);
  const nut = a.hab ? nutrientesDe(a, gramos) : null;
  const caja = document.querySelector(".resumen-kcal");
  if(!caja) return;
  caja.querySelector(".n").textContent = kcal + " kcal";
  caja.querySelector(".d").textContent = Math.round(gramos) + " g" +
    (nut ? " · " + coma(redondo(nut.prot,1)) + " g proteína · " + coma(redondo(nut.carb,1)) +
           " g carbos · " + coma(redondo(nut.gras,1)) + " g grasa" : "");
}

function anotar(clave, unidad, cantidad, comida){
  const a = porClave(clave);
  if(!a) return;
  const gramos = a.hab ? gramosDe(a, unidad, cantidad) : cantidad;
  const kcal = Math.round((a.hab ? a.kcal : a.k) * gramos / 100);
  const detalle = a.hab
    ? textoCantidad(unidad, cantidad) + (unidad === "g" || unidad === "ml" ? "" : " · " + Math.round(gramos) + " g")
    : Math.round(gramos) + (a.c === "bebida" ? " ml" : " g");
  const lista = entradas(fechaActual, comida).slice();
  lista.push({id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
              n: a.n, det: detalle, kcal, g: Math.round(gramos),
              nut: a.hab ? nutrientesDe(a, gramos) : null});
  dia(fechaActual)[comida] = lista;
  datos.recientes = [a.clave].concat(datos.recientes.filter(c => c !== a.clave)).slice(0, 12);
  guardar();
  pintar();
  aviso(a.n + " · " + kcal + " kcal");
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
      '<div class="hoja-cuerpo"><div class="tarjeta">' +
        '<label class="campo"><span>Qué comió</span>' +
          '<input id="nue-nombre" type="text" placeholder="Ej. Guiso de la abuela"></label>' +
        '<label class="campo"><span>Calorías de la porción</span>' +
          '<input id="nue-kcal" type="number" inputmode="numeric" min="1" max="5000" placeholder="Ej. 350"></label>' +
        '<div class="nota">De estos alimentos solo se guardan las calorías, así que no suman en los macros.</div>' +
      '</div><button class="boton" id="nue-guardar">Añadir</button></div>' +
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
  anotar("a:" + nombre, "g", 100, comidaDestino);
  cerrarHoja();
}

/* ---------------- menú de la semana ---------------- */

let semanaActual = lunesDe(hoyISO());

function pintarMenu(){
  const fin = mover(semanaActual, 6);
  const mes = f => fecha(f).toLocaleDateString("es-CL", {month:"long"});
  const mismoMes = mes(semanaActual) === mes(fin);
  $("#menu-rango").textContent = mismoMes
    ? "Del " + fecha(semanaActual).getDate() + " al " + fecha(fin).getDate() + " de " + mes(fin)
    : "Del " + fecha(semanaActual).getDate() + " de " + mes(semanaActual) +
      " al " + fecha(fin).getDate() + " de " + mes(fin);
  $("#semana-despues").disabled = semanaActual >= lunesDe(hoyISO());

  let html = "";
  for(let i = 0; i < 7; i++){
    const f = mover(semanaActual, i);
    const dias = ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"];
    const total = Math.round(totalesDia(f).kcal);
    const comidas = COMIDAS_MENU.filter(c => entradas(f, c).length);
    html += '<div class="tarjeta menu-dia' + (f === hoyISO() ? " hoy" : "") + '">' +
      '<div class="menu-cab"><b>' + mayus(dias[i]) + " " + fecha(f).getDate() + '</b>' +
        '<span>' + (total ? total + " kcal" : "sin apuntar") + '</span></div>' +
      (comidas.length
        ? comidas.map(c => {
            const nombre = COMIDAS.find(x => x[0] === c)[1];
            return '<div class="menu-comida">' +
              '<div class="marco-foto pequeno" data-foto-de="' + f + '|' + c + '"></div>' +
              '<div class="txt"><b>' + nombre + '</b><span>' + esc(tituloComida(f, c)) + '</span></div>' +
            '</div>';
          }).join("")
        : '<div class="nota" style="margin:0">Nada apuntado este día.</div>') +
    '</div>';
  }
  $("#menu-semana").innerHTML = html;
  pintarFotos();
}

function textoMenu(){
  const fin = mover(semanaActual, 6);
  const dias = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  let texto = "🗓️ Menú del " + fecha(semanaActual).getDate() + " al " + fecha(fin).getDate() +
              " de " + fecha(fin).toLocaleDateString("es-CL", {month:"long"}) + "\n";
  for(let i = 0; i < 7; i++){
    const f = mover(semanaActual, i);
    const comidas = COMIDAS_MENU.filter(c => entradas(f, c).length);
    if(!comidas.length) continue;
    texto += "\n" + dias[i] + " " + fecha(f).getDate() + "\n";
    comidas.forEach(c => {
      texto += "  " + COMIDAS.find(x => x[0] === c)[1] + ": " + tituloComida(f, c) + "\n";
    });
  }
  return texto;
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
    ? (encontradas.length ? '<div class="grupo">🍽️ Del recetario</div>' + encontradas.map(tarjetaReceta).join("") : "") +
      (inventada ? '<div class="grupo">✨ Hecha con lo que ha pedido</div>' + tarjetaReceta(inventada) : "")
    : '<div class="tarjeta"><div class="vacio"><span class="em">🤔</span>' +
      'No he pillado ningún ingrediente en eso.<br>Pruebe con «pollo», «atún», «yogur», «lentejas»…</div></div>';
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
      '<div class="cabecera-receta"><div class="emoji">' + r.e + '</div><h2>' + esc(r.n) + '</h2>' +
        '<div class="datos">' +
          '<div><b>' + r.t + ' min</b><span>Tiempo</span></div>' +
          '<div><b>' + kcal + '</b><span>kcal porción</span></div>' +
          '<div><b>' + prot + ' g</b><span>Proteína</span></div>' +
        '</div></div>' +
      '<div class="tarjeta"><div class="porciones">' +
        '<b>Para ' + porcionesAbiertas + (porcionesAbiertas === 1 ? " persona" : " personas") + '</b>' +
        '<button data-porciones="-1" aria-label="Menos">−</button>' +
        '<span class="n">' + porcionesAbiertas + '</span>' +
        '<button data-porciones="1" aria-label="Más">+</button>' +
      '</div></div>' +
      '<div class="tarjeta"><div class="titulo">🛒 Ingredientes y qué comprar</div>' +
        lista.map(x => '<div class="ingrediente"><span class="marca"></span>' +
          '<span class="txt"><b>' + esc(x.n) + '</b><i>' + esc(x.prod) + '</i></span>' +
          '<span class="cant">' + esc(x.cantidad) + '</span></div>').join("") + '</div>' +
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
  const {kcal, prot} = calcular(recetaAbierta, porcionesAbiertas);
  fechaActual = hoyISO();
  const lista = entradas(fechaActual, comida).slice();
  lista.push({id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
              n: recetaAbierta.n, det: "1 porción · receta", kcal, nut: {prot}});
  dia(fechaActual)[comida] = lista;
  guardar(); cerrarHoja(); cambiarVista("hoy"); pintar();
  aviso(recetaAbierta.n + " · " + kcal + " kcal");
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
  guardar(); pintarDetalleReceta();
}
function copiar(texto, mensaje){
  if(navigator.clipboard){
    navigator.clipboard.writeText(texto).then(() => aviso(mensaje))
      .catch(() => window.prompt("Copie esto:", texto));
  }else{ window.prompt("Copie esto:", texto); }
}

/* ---------------- progreso ---------------- */

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
      '<div class="escala"><span style="left:14%">18,5</span><span style="left:40%">25</span><span style="left:60%">30</span></div>';
  }else{
    html += '<div class="vacio"><span class="em">⚖️</span>Apunte su peso y aquí verá el IMC.</div>';
  }
  if(uc){
    const indice = uc.c / altura;
    const bien = indice < 0.5;
    html += '<div style="height:16px"></div><div class="medidor">' +
      '<div class="n">' + coma(indice.toFixed(2)) + '</div>' +
      '<div class="txt"><b>Índice cintura-altura</b><span>' + coma(uc.c) + ' cm ÷ ' + altura + ' cm · ' +
      (bien ? "por debajo de 0,50: bien" : "por encima de 0,50: conviene bajarla") + '</span></div></div>';
  }
  $("#resumen-imc").innerHTML = html;

  const series = [["peso","Peso"], ["cintura","Cintura"], ["imc","IMC"], ["indice","Índice"], ["ambos","Ambos índices"]];
  $("#chips-grafico").innerHTML = series.map(([id, nombre]) =>
    '<button class="chip' + (serieGrafico === id ? " sel" : "") + '" data-serie="' + id + '">' + nombre + '</button>').join("");
  dibujarGrafico();

  $("#lista-medidas").innerHTML = medidasOrdenadas().reverse().slice(0, 12).map(m =>
    '<div class="lista-medida"><span class="f">' + mayus(bonita(m.f)) + '</span>' +
    (m.p ? '<b>' + coma(m.p) + ' kg</b>' : "") +
    (m.c ? '<span class="c">' + coma(m.c) + ' cm</span>' : "") +
    '<button class="quitar" data-medida="' + m.f + '" aria-label="Quitar">✕</button></div>').join("");

  pintarBarras();
  pintarLogros();
}

function serieDe(tipo){
  return medidasOrdenadas().map(m => {
    if(tipo === "peso")    return m.p ? {f:m.f, v:m.p} : null;
    if(tipo === "cintura") return m.c ? {f:m.f, v:m.c} : null;
    if(tipo === "imc")     return m.p ? {f:m.f, v:calcularIMC(m.p)} : null;
    if(tipo === "indice")  return m.c ? {f:m.f, v:m.c / (datos.perfil.altura || 160)} : null;
    return null;
  }).filter(Boolean).slice(-30);
}

function dibujarGrafico(){
  const svg = $("#grafico");
  const W = 320, H = 180, m = 30;
  const series = serieGrafico === "ambos"
    ? [{t:"imc", n:"IMC", c:"#059669", p:serieDe("imc")}, {t:"indice", n:"Índice cintura", c:"#f59e0b", p:serieDe("indice")}]
    : [{t:serieGrafico, n:"", c:"#059669", p:serieDe(serieGrafico)}];

  if(!series.some(s => s.p.length >= 2)){
    svg.innerHTML = '<text x="160" y="90" text-anchor="middle" font-size="13" fill="#6b7d75">' +
      'Con dos apuntes o más se dibuja la línea</text>';
    $("#leyenda").innerHTML = "";
    return;
  }
  let html = "";
  series.forEach(s => {
    if(s.p.length < 2) return;
    const valores = s.p.map(p => p.v);
    const min = Math.min(...valores), max = Math.max(...valores);
    const rango = (max - min) || 1;
    const x = i => m + i * (W - m*2) / (s.p.length - 1);
    const y = v => H - m - ((v - min) / rango) * (H - m*2);
    const dec = (s.t === "indice") ? 2 : 1;
    html += '<polyline points="' + s.p.map((p,i) => x(i) + "," + y(p.v)).join(" ") + '" fill="none" ' +
      'stroke="' + s.c + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"></polyline>' +
      s.p.map((p,i) => '<circle cx="' + x(i) + '" cy="' + y(p.v) + '" r="3.5" fill="' + s.c + '"></circle>').join("") +
      '<text x="2" y="' + (m - 12) + '" font-size="11" fill="' + s.c + '">' + coma(max.toFixed(dec)) + '</text>' +
      '<text x="2" y="' + (H - m + 16) + '" font-size="11" fill="' + s.c + '">' + coma(min.toFixed(dec)) + '</text>';
  });
  svg.innerHTML = html;
  $("#leyenda").innerHTML = serieGrafico === "ambos"
    ? series.map(s => '<span><i style="background:' + s.c + '"></i>' + s.n + '</span>').join("")
    : "";
}

function pintarBarras(){
  const objetivo = datos.perfil.objetivo || 1500;
  const dias = [];
  for(let i = 6; i >= 0; i--){
    const f = mover(hoyISO(), -i);
    dias.push({f, t: totalesDia(f).kcal});
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
  const altura = num($("#med-altura").value);
  const hayPeso = peso >= 20 && peso <= 300;
  const hayCintura = cintura >= 40 && cintura <= 200;
  const hayAltura = altura >= 120 && altura <= 220;
  if(!hayPeso && !hayCintura && !hayAltura) return aviso("Escriba peso, cintura o altura");

  if(hayAltura) datos.perfil.altura = Math.round(altura);
  if(hayPeso || hayCintura){
    const f = hoyISO();
    const anterior = datos.medidas.find(m => m.f === f) || {f};
    if(hayPeso){ anterior.p = redondo(peso,1); datos.perfil.peso = anterior.p; }
    if(hayCintura) anterior.c = redondo(cintura,1);
    datos.medidas = datos.medidas.filter(m => m.f !== f).concat([anterior]);
  }
  guardar();
  $("#med-peso").value = ""; $("#med-cintura").value = "";
  pintarProgreso(); cargarAjustes();
  aviso("Apuntado");
  revisarLogros();
}

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
  comida:   ["¿Qué tal la comida?", "Apúntela y siga con su racha 🔥"],
  cena:     ["Última del día", "Apunte la cena y cierre el día 🌙"],
  agua:     ["¿Va tomando agua?", "Toque los vasos que lleva 💧"]
};
const Nativo = {
  enMovil(){
    return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === "function"
      && window.Capacitor.isNativePlatform());
  },
  plugin(){ return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications; },
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
      await p.schedule({notifications: ["desayuno","comida","cena","agua"].map((c,i) => {
        const [h,m] = (datos.avisos[c] || "09:00").split(":").map(Number);
        return {id:i+1, title:TEXTOS_AVISO[c][0], body:TEXTOS_AVISO[c][1], smallIcon:"ic_stat_calorias",
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
  $("#aj-racion").value = p.racion || 10;
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
  p.racion = parseInt($("#aj-racion").value, 10) || 10;
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
function importar(){
  const texto = window.prompt("Pegue aquí el texto de la copia:");
  if(!texto) return;
  try{
    const nuevo = JSON.parse(texto);
    if(!nuevo || typeof nuevo !== "object" || !nuevo.perfil) throw new Error("formato");
    datos = Object.assign(porDefecto(), nuevo);
    if(nuevo.pesos && !nuevo.medidas) datos.medidas = nuevo.pesos.map(x => ({f:x.f, p:x.p}));
    guardar(); cargarAjustes(); pintar(); pintarProgreso();
    aviso("Datos recuperados");
  }catch(e){ aviso("Ese texto no vale, vuelva a copiarlo entero"); }
}
function borrarTodo(){
  if(!confirm("¿Seguro? Se borra todo: comidas, medidas, favoritos, fotos y medallas.")) return;
  datos = porDefecto();
  guardar();
  Fotos.abrir().then(bd => {
    if(bd){ const t = bd.transaction("fotos", "readwrite"); t.objectStore("fotos").clear(); }
    Fotos.cache = {};
  });
  cargarAjustes(); pintar(); pintarProgreso(); Nativo.programar();
  aviso("Todo borrado");
}

/* ---------------- navegación ---------------- */

const VISTAS = ["hoy","menu","recetas","progreso","ajustes"];
function cambiarVista(v){
  vista = v;
  VISTAS.forEach(x => $("#vista-" + x).classList.toggle("oculto", x !== v));
  document.querySelectorAll("nav button").forEach(b => b.classList.toggle("activa", b.dataset.vista === v));
  $("#cabecera").classList.toggle("oculto", v !== "hoy");
  if(v === "menu") pintarMenu();
  if(v === "recetas" && !$("#resultados-recetas").innerHTML) pintarRecetas();
  if(v === "progreso") pintarProgreso();
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
  if(t.dataset.foto) return pedirFoto(t.dataset.foto);
  if(t.dataset.quitarFoto){
    const [f, c] = t.dataset.quitarFoto.split("|");
    return Fotos.borrar(f, c).then(() => { pintar(); if(vista === "menu") pintarMenu(); });
  }
  if(t.dataset.comida) return abrirBuscador(t.dataset.comida);
  if(t.hasAttribute("data-cerrar")) return cerrarHoja();
  if(t.hasAttribute("data-nuevo")) return abrirNuevo();
  if(t.hasAttribute("data-cerrar-celebra")){
    $("#celebracion").innerHTML = "";
    if(vista === "progreso") pintarLogros();
    return siguienteCelebracion();
  }

  /* alimentos */
  if(t.dataset.pestana){ pestanaAlimentos = t.dataset.pestana; pintarChipsAlimentos(); return listar(""); }
  if(t.dataset.favorito) return alternarFavorito(t.dataset.favorito);
  if(t.dataset.rapido){
    const a = porClave(t.dataset.rapido);
    if(!a) return;
    if(a.hab) anotar(a.clave, a.def.u, a.def.c, comidaDestino);
    else anotar(a.clave, "g", a.p[0][1], comidaDestino);
    return;
  }
  if(t.dataset.abrirAlimento) return abrirCantidad(t.dataset.abrirAlimento);
  if(t.dataset.unidad){
    if(unidadElegida !== t.dataset.unidad){
      const gramos = gramosDe(elegido, unidadElegida, cantidadElegida);
      unidadElegida = t.dataset.unidad;
      /* al cambiar de medida se empieza en una cantidad redonda: nadie quiere
         que «1 pizca» se convierta en «0,1 cucharaditas» */
      cantidadElegida = (unidadElegida === "g" || unidadElegida === "ml")
        ? Math.max(1, Math.round(gramos))
        : (elegido.def.u === unidadElegida ? elegido.def.c : 1);
    }
    return pintarCantidad();
  }
  if(t.dataset.porcion !== undefined){
    cantidadElegida = elegido.p[+t.dataset.porcion][1];
    return pintarCantidad();
  }
  if(t.dataset.paso){
    const paso = parseFloat(t.dataset.paso);
    cantidadElegida = Math.max(paso > 0 ? 0 : 0.5, redondo(cantidadElegida + paso, 2));
    if(cantidadElegida <= 0) cantidadElegida = Math.abs(paso);
    return pintarCantidad();
  }
  if(t.id === "cant-guardar"){
    anotar(elegido.clave, elegido.hab ? unidadElegida : "g", cantidadElegida, comidaDestino);
    return cerrarHoja();
  }
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

  /* menú semanal */
  if(t.id === "semana-antes"){ semanaActual = mover(semanaActual, -7); return pintarMenu(); }
  if(t.id === "semana-despues"){ semanaActual = mover(semanaActual, 7); return pintarMenu(); }
  if(t.id === "copiar-menu") return copiar(textoMenu(), "Menú copiado, ya puede pegarlo");

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
  if(t.id === "copiar-lista") return copiar(listaCompra(recetaAbierta, porcionesAbiertas), "Lista copiada");
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
  if(t.id === "aj-exportar") return copiar(JSON.stringify(datos), "Datos copiados");
  if(t.id === "aj-importar") return importar();
  if(t.id === "aj-borrar") return borrarTodo();
});

document.querySelectorAll("#vista-ajustes input, #vista-ajustes select")
  .forEach(el => el.addEventListener("change", guardarAjustes));
["med-peso","med-cintura","med-altura"].forEach(id =>
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
