/* Mis calorías — app sencilla y sin registro. Todo se guarda en el propio móvil. */

const VERSION = "1.0";
const CLAVE = "miscalorias.v1";

const COMIDAS = [
  ["desayuno", "Desayuno", "☕"],
  ["comida",   "Comida",   "🍽️"],
  ["merienda", "Merienda", "🍪"],
  ["cena",     "Cena",     "🌙"],
  ["picoteo",  "Picoteo",  "🍿"]
];

/* ---------------- datos ---------------- */

const porDefecto = () => ({
  perfil: {nombre:"", objetivo:1800, sexo:"m", edad:55, altura:162, peso:70, actividad:"1.375", plan:"0"},
  dias: {}, pesos: [], propios: [], recientes: []
});

let datos = cargar();
let fechaActual = hoyISO();
let vista = "hoy";

function cargar(){
  try{
    const bruto = localStorage.getItem(CLAVE);
    if(!bruto) return porDefecto();
    return Object.assign(porDefecto(), JSON.parse(bruto));
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

/* ---------------- fechas ---------------- */

function hoyISO(d){
  const x = d || new Date();
  return x.getFullYear() + "-" + String(x.getMonth()+1).padStart(2,"0") + "-" + String(x.getDate()).padStart(2,"0");
}
function mover(f, n){
  const [a,m,d] = f.split("-").map(Number);
  const x = new Date(a, m-1, d + n);
  return hoyISO(x);
}
function bonita(f){
  const [a,m,d] = f.split("-").map(Number);
  return new Date(a, m-1, d).toLocaleDateString("es-ES", {weekday:"long", day:"numeric", month:"long"});
}
function cortita(f){
  const [a,m,d] = f.split("-").map(Number);
  return d + "/" + m;
}

/* ---------------- utilidades ---------------- */

const $ = s => document.querySelector(s);
const esc = t => String(t).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
/* en España se escribe «70,4»: aceptamos coma y punto */
const num = v => parseFloat(String(v == null ? "" : v).replace(",", "."));
const sinTildes = t => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

let avisoTemporizador;
function aviso(texto, accion){
  const anterior = document.querySelector(".aviso");
  if(anterior) anterior.remove();
  const el = document.createElement("div");
  el.className = "aviso";
  el.textContent = texto;
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

/* ---------------- pantalla del día ---------------- */

function pintar(){
  const esHoy = fechaActual === hoyISO();
  $("#fecha-titulo").textContent = esHoy ? "Hoy" : bonita(fechaActual).replace(/,.*/, "");
  $("#fecha-sub").textContent = bonita(fechaActual);
  $("#dia-despues").disabled = fechaActual >= hoyISO();

  const objetivo = datos.perfil.objetivo || 1800;
  const total = totalDia(fechaActual);
  const restan = objetivo - total;

  $("#kcal-comidas").textContent = Math.round(total);
  $("#kcal-objetivo").textContent = objetivo;
  $("#kcal-porcentaje").textContent = Math.round(total/objetivo*100) + " %";

  const resto = $("#kcal-restantes");
  resto.classList.toggle("pasado", restan < 0);
  resto.innerHTML = restan >= 0
    ? "quedan <b>" + Math.round(restan) + "</b>"
    : "se ha pasado <b>" + Math.round(-restan) + "</b>";

  const aro = $("#anillo-progreso");
  const parte = Math.min(1, total/objetivo);
  aro.style.strokeDashoffset = 553 * (1 - parte);
  aro.setAttribute("stroke", restan < 0 ? "#d97706" : "#16a34a");

  $("#comidas").innerHTML = COMIDAS.map(([id, nombre, emoji]) => {
    const lista = entradas(fechaActual, id);
    const suma = lista.reduce((t,e) => t + e.kcal, 0);
    return '<div class="comida">' +
      '<h2><span class="emoji">' + emoji + '</span>' + nombre +
        '<span class="kcal">' + (suma ? Math.round(suma) + " kcal" : "") + '</span></h2>' +
      lista.map(e =>
        '<div class="linea-alimento">' +
          '<div class="nom"><b>' + esc(e.n) + '</b><span>' + esc(e.det) + '</span></div>' +
          '<div class="val">' + Math.round(e.kcal) + '</div>' +
          '<button class="quitar" data-quitar="' + id + '|' + e.id + '" aria-label="Quitar">✕</button>' +
        '</div>').join("") +
      '<button class="anadir" data-comida="' + id + '">＋ Añadir a ' + nombre.toLowerCase() + '</button>' +
    '</div>';
  }).join("");
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
  const propios = datos.propios.map(a => Object.assign({propio:true}, a));
  return propios.concat(ALIMENTOS);
}

function listar(texto){
  const q = sinTildes(texto.trim());
  const caja = $("#resultados");
  let html = "";

  if(!q){
    const recientes = datos.recientes.slice(0, 6);
    if(recientes.length){
      html += '<div class="grupo">Lo que más usa</div>' + recientes.map(fila).join("");
    }
    html += '<button class="item" data-nuevo><div class="nom"><b>✎ Otro alimento</b>' +
            '<span>Apuntarlo a mano con sus calorías</span></div></button>';
    CATEGORIAS.forEach(([id, nombre, emoji]) => {
      const lista = catalogo().filter(a => a.c === id);
      if(!lista.length) return;
      html += '<div class="grupo">' + emoji + " " + nombre + '</div>' + lista.map(fila).join("");
    });
  }else{
    const lista = catalogo().filter(a => sinTildes(a.n).includes(q)).slice(0, 60);
    html = lista.length
      ? lista.map(fila).join("")
      : '<div class="vacio">No aparece nada con ese nombre.<br>Puede apuntarlo a mano:</div>';
    html += '<button class="item" data-nuevo><div class="nom"><b>✎ Otro alimento</b>' +
            '<span>Apuntarlo a mano con sus calorías</span></div></button>';
  }
  caja.innerHTML = html;
}

function fila(a){
  const p = a.p[0];
  const kcal = Math.round(a.k * p[1] / 100);
  const detalle = a.c === "propio" ? p[0] : p[0] + " · " + p[1] + (a.c === "bebida" ? " ml" : " g");
  return '<button class="item" data-alimento="' + esc(a.n) + '">' +
    '<div class="nom"><b>' + esc(a.n) + '</b><span>' + esc(detalle) + '</span></div>' +
    '<div class="val">' + kcal + ' kcal</div></button>';
}

function buscarAlimento(nombre){
  return catalogo().find(a => a.n === nombre);
}

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
          '<label class="campo" style="margin-top:12px"><span>O ponga la cantidad exacta (' + (liquido ? "ml" : "gramos") + ')</span>' +
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
  const kcal = alimentoElegido.k * gramosElegidos / 100;
  $("#cant-kcal").textContent = Math.round(kcal) + " kcal";
  $("#cant-detalle").textContent = Math.round(gramosElegidos) + (liquido ? " ml" : " g");
  $("#cant-gramos").value = Math.round(gramosElegidos);
}

function apuntar(alimento, gramos){
  const liquido = alimento.c === "bebida";
  const porcion = alimento.p.find(p => p[1] === gramos);
  const detalle = alimento.c === "propio"
    ? "1 ración"
    : (porcion ? porcion[0] + " · " : "") + Math.round(gramos) + (liquido ? " ml" : " g");
  const lista = entradas(fechaActual, comidaDestino).slice();
  lista.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
    n: alimento.n,
    det: detalle,
    kcal: Math.round(alimento.k * gramos / 100)
  });
  dia(fechaActual)[comidaDestino] = lista;

  datos.recientes = [alimento].concat(datos.recientes.filter(a => a.n !== alimento.n)).slice(0, 12)
    .map(a => ({n:a.n, c:a.c, k:a.k, p:a.p}));
  guardar();
  cerrarHoja();
  pintar();
  aviso(alimento.n + " · " + Math.round(alimento.k * gramos / 100) + " kcal");
}

let ultimoBorrado = null;
function deshacer(){
  if(!ultimoBorrado) return;
  const {fecha, comida, posicion, entrada} = ultimoBorrado;
  const lista = entradas(fecha, comida).slice();
  lista.splice(Math.min(posicion, lista.length), 0, entrada);
  dia(fecha)[comida] = lista;
  ultimoBorrado = null;
  guardar();
  fechaActual = fecha;
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
  const kcal = parseFloat($("#nue-kcal").value);
  if(!nombre) return aviso("Falta el nombre");
  if(!(kcal > 0)) return aviso("Faltan las calorías");
  // se guarda como alimento de 1 ración = 100 g, así las cuentas salen exactas
  const alimento = {n:nombre, c:"propio", k:Math.round(kcal), p:[["1 ración",100]]};
  datos.propios = [alimento].concat(datos.propios.filter(a => a.n !== nombre)).slice(0, 60);
  guardar();
  apuntar(alimento, 100);
}

/* ---------------- peso ---------------- */

function pintarPeso(){
  const lista = datos.pesos.slice().sort((a,b) => a.f < b.f ? -1 : 1);
  const resumen = $("#peso-resumen");
  if(!lista.length){
    resumen.innerHTML = '<div class="vacio">Todavía no ha apuntado ningún peso.</div>';
    $("#peso-grafico").innerHTML = "";
    $("#peso-lista").innerHTML = "";
    return;
  }
  const ultimo = lista[lista.length-1];
  const primero = lista[0];
  const dif = ultimo.p - primero.p;
  resumen.innerHTML =
    '<div class="grande">' + ultimo.p.toString().replace(".", ",") + '<small> kg</small></div>' +
    '<div class="restante">' + (lista.length > 1
      ? (dif === 0 ? "igual que al empezar"
        : (dif < 0 ? "ha bajado " : "ha subido ") + Math.abs(dif).toFixed(1).replace(".", ",") + " kg desde el " + cortita(primero.f))
      : "primer peso apuntado") + '</div>';

  dibujarGrafico(lista.slice(-30));
  $("#peso-lista").innerHTML = lista.slice().reverse().slice(0, 12).map(p =>
    '<div class="lista-peso"><span class="f">' + bonita(p.f) + '</span><b>' +
    p.p.toString().replace(".", ",") + ' kg</b>' +
    '<button class="quitar" data-peso="' + p.f + '" aria-label="Quitar">✕</button></div>').join("");
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
    '<polyline points="' + puntos + '" fill="none" stroke="#16a34a" stroke-width="2.5" ' +
      'stroke-linejoin="round" stroke-linecap="round"></polyline>' +
    lista.map((p,i) => '<circle cx="' + x(i) + '" cy="' + y(p.p) + '" r="3" fill="#16a34a"></circle>').join("") +
    '<text x="2" y="' + (m - 8) + '" font-size="11" fill="#6e6e6e">' + max.toFixed(1).replace(".", ",") + ' kg</text>' +
    '<text x="2" y="' + (H - m + 14) + '" font-size="11" fill="#6e6e6e">' + min.toFixed(1).replace(".", ",") + ' kg</text>';
}

function guardarPeso(){
  const valor = num($("#peso-entrada").value);
  if(!(valor >= 20 && valor <= 300)) return aviso("Escriba un peso válido");
  const f = hoyISO();
  datos.pesos = datos.pesos.filter(p => p.f !== f).concat([{f, p:Math.round(valor*10)/10}]);
  datos.perfil.peso = Math.round(valor*10)/10;
  guardar();
  $("#peso-entrada").value = "";
  pintarPeso();
  aviso("Peso apuntado");
}

/* ---------------- ajustes ---------------- */

function cargarAjustes(){
  const p = datos.perfil;
  $("#aj-objetivo").value = p.objetivo;
  $("#aj-nombre").value = p.nombre;
  $("#aj-edad").value = p.edad;
  $("#aj-altura").value = p.altura;
  $("#aj-peso").value = String(p.peso).replace(".", ",");
  $("#aj-sexo").value = p.sexo;
  $("#aj-actividad").value = p.actividad;
  $("#aj-plan").value = p.plan;
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
  guardar();
  pintar();
}

/* Mifflin-St Jeor: gasto en reposo × actividad, y luego el plan. */
function calcularObjetivo(){
  guardarAjustes();
  const p = datos.perfil;
  const base = 10*p.peso + 6.25*p.altura - 5*p.edad + (p.sexo === "h" ? 5 : -161);
  const gasto = base * parseFloat(p.actividad);
  let objetivo = Math.round((gasto + parseInt(p.plan, 10)) / 10) * 10;
  const suelo = p.sexo === "h" ? 1500 : 1300;
  let recorte = false;
  if(objetivo < suelo){ objetivo = suelo; recorte = true; }
  p.objetivo = objetivo;
  guardar();
  cargarAjustes();
  pintar();
  aviso(recorte ? "Objetivo: " + objetivo + " kcal (no bajamos de ahí)" : "Objetivo: " + objetivo + " kcal al día");
}

function exportar(){
  const texto = JSON.stringify(datos);
  navigator.clipboard && navigator.clipboard.writeText(texto)
    .then(() => aviso("Datos copiados. Péguelos en un correo o WhatsApp"))
    .catch(() => window.prompt("Copie este texto y guárdelo:", texto));
}

function importar(){
  const texto = window.prompt("Pegue aquí el texto de la copia:");
  if(!texto) return;
  try{
    const nuevo = JSON.parse(texto);
    if(!nuevo || typeof nuevo !== "object" || !nuevo.perfil) throw new Error("formato");
    datos = Object.assign(porDefecto(), nuevo);
    guardar();
    cargarAjustes(); pintar(); pintarPeso();
    aviso("Datos recuperados");
  }catch(e){ aviso("Ese texto no vale, vuelva a copiarlo entero"); }
}

function borrarTodo(){
  if(!confirm("¿Seguro? Se borran todas las comidas y pesos apuntados.")) return;
  datos = porDefecto();
  guardar();
  cargarAjustes(); pintar(); pintarPeso();
  aviso("Todo borrado");
}

/* ---------------- navegación ---------------- */

function cambiarVista(v){
  vista = v;
  ["hoy","peso","ajustes"].forEach(x => $("#vista-" + x).classList.toggle("oculto", x !== v));
  document.querySelectorAll("nav button").forEach(b => b.classList.toggle("activa", b.dataset.vista === v));
  document.querySelector("header").classList.toggle("oculto", v !== "hoy");
  if(v === "peso") pintarPeso();
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
  if(t.dataset.comida) return abrirBuscador(t.dataset.comida);
  if(t.hasAttribute("data-cerrar")) return cerrarHoja();
  if(t.hasAttribute("data-nuevo")) return abrirNuevo();
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
    guardar(); pintarPeso();
    return;
  }
  if(t.id === "peso-guardar") return guardarPeso();
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

if("serviceWorker" in navigator){
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
