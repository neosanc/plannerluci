/* Mis recetas — le dices lo que se te antoja y te arma la receta con
   cantidades y con los productos que se encuentran en el súper de Chile. */

const VERSION = "1.0";
const CLAVE = "misrecetas.v1";

const IDEAS = [
  "yogur con proteína, plátano y frutos secos",
  "ensalada de atún",
  "algo con pollo y brócoli para la cena",
  "cazuela",
  "sopa de invierno",
  "algo rápido con huevos",
  "desayuno alto en proteína",
  "almuerzo económico con legumbres"
];

const FILTROS = [
  ["todas",            "Todas"],
  ["desayuno",         "Desayuno"],
  ["almuerzo",         "Almuerzo"],
  ["once",             "Once"],
  ["cena",             "Cena"],
  ["snack",            "Snack"],
  ["alto en proteína", "Alto en proteína"],
  ["rápido",           "Rápidas"],
  ["económico",        "Económicas"],
  ["chileno",          "Chilenas"],
  ["vegetariano",      "Sin carne"]
];

/* ---------------- datos ---------------- */

const porDefecto = () => ({
  perfil: {nombre:"", porciones:2, vegetariano:false},
  guardadas: []
});

let datos = cargar();
let vista = "buscar";
let filtro = "todas";
let recetaAbierta = null;
let porcionesAbiertas = 2;

function cargar(){
  try{
    const bruto = localStorage.getItem(CLAVE);
    if(!bruto) return porDefecto();
    const guardado = JSON.parse(bruto);
    const base = porDefecto();
    const fusion = Object.assign(base, guardado);
    fusion.perfil = Object.assign(base.perfil, guardado.perfil || {});
    return fusion;
  }catch(e){ return porDefecto(); }
}
function guardar(){
  try{ localStorage.setItem(CLAVE, JSON.stringify(datos)); }
  catch(e){ aviso("No se han podido guardar los datos"); }
}

/* ---------------- utilidades ---------------- */

const $ = s => document.querySelector(s);
const esc = t => String(t).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

let avisoTemporizador;
function aviso(texto){
  const anterior = document.querySelector(".aviso");
  if(anterior) anterior.remove();
  const el = document.createElement("div");
  el.className = "aviso";
  el.textContent = texto;
  document.body.appendChild(el);
  clearTimeout(avisoTemporizador);
  avisoTemporizador = setTimeout(() => el.remove(), 2400);
}

function estaGuardada(receta){
  return datos.guardadas.some(r => r.id === receta.id && r.n === receta.n);
}

function tarjetaReceta(receta){
  const {kcal, prot} = calcular(receta, 1);
  const etiquetas = (receta.etiquetas || []).slice(0, 2)
    .map(e => '<span class="etq' + (receta.inventada ? " lima" : "") + '">' + esc(e) + '</span>').join("");
  return '<button class="receta' + (receta.inventada ? " inventada" : "") + '" data-abrir="' + esc(receta.id) + '|' + esc(receta.n) + '">' +
    '<span class="icono">' + receta.e + '</span>' +
    '<span class="txt"><b>' + esc(receta.n) + '</b>' +
      '<span>' + receta.t + ' min · ' + kcal + ' kcal · ' + prot + ' g de proteína</span>' +
      '<span>' + etiquetas + '</span></span>' +
    '<span class="flecha">›</span></button>';
}

/* guardamos las recetas que se enseñan para poder abrirlas después */
let enPantalla = [];
function recordar(lista){
  lista.forEach(r => {
    if(!enPantalla.some(x => x.id === r.id && x.n === r.n)) enPantalla.push(r);
  });
}
function buscarEnPantalla(id, nombre){
  return enPantalla.find(r => r.id === id && r.n === nombre) ||
         datos.guardadas.find(r => r.id === id && r.n === nombre) ||
         RECETAS.find(r => r.id === id);
}

/* ---------------- buscar ---------------- */

function pintarIdeas(){
  $("#chips-ideas").innerHTML = IDEAS.map(i =>
    '<button class="chip" data-idea="' + esc(i) + '">' + esc(i) + '</button>').join("");
}

function buscar(texto){
  const peticion = (texto || "").trim();
  if(!peticion){
    $("#resultados").innerHTML = "";
    return aviso("Escriba qué le apetece");
  }
  SIN_CARNE = !!datos.perfil.vegetariano;

  let encontradas = buscarRecetas(peticion);
  if(datos.perfil.vegetariano) encontradas = encontradas.filter(esVegetariana);
  const inventada = inventarReceta(peticion);

  const todas = encontradas.slice();
  if(inventada) todas.push(inventada);
  recordar(todas);

  if(!todas.length){
    $("#resultados").innerHTML =
      '<div class="tarjeta"><div class="vacio"><span class="em">🤔</span>' +
      'No he pillado ningún ingrediente en eso.<br>Pruebe nombrando algo concreto: ' +
      '«pollo», «atún», «yogur», «lentejas»…</div></div>';
    return;
  }

  $("#resultados").innerHTML =
    (encontradas.length
      ? '<div class="titulo" style="margin:4px 4px 10px">🍽️ Del recetario</div>' +
        encontradas.map(tarjetaReceta).join("")
      : "") +
    (inventada
      ? '<div class="titulo" style="margin:18px 4px 10px">✨ Hecha con lo que ha pedido</div>' +
        tarjetaReceta(inventada)
      : "");
  window.scrollTo({top: $("#resultados").offsetTop - 70, behavior:"smooth"});
}

/* ---------------- recetario ---------------- */

function pintarRecetario(){
  $("#chips-cat").innerHTML = FILTROS.map(([id, nombre]) =>
    '<button class="chip' + (filtro === id ? " sel" : "") + '" data-filtro="' + id + '">' +
    esc(nombre) + '</button>').join("");

  let lista = RECETAS.slice();
  if(datos.perfil.vegetariano) lista = lista.filter(esVegetariana);
  if(filtro !== "todas"){
    lista = lista.filter(r => r.cat === filtro || r.etiquetas.includes(filtro) ||
      (filtro === "vegetariano" && esVegetariana(r)));
  }
  recordar(lista);
  $("#lista-recetario").innerHTML = lista.length
    ? lista.map(tarjetaReceta).join("")
    : '<div class="tarjeta"><div class="vacio"><span class="em">🥄</span>Nada por aquí con ese filtro.</div></div>';
}

/* ---------------- guardadas ---------------- */

function pintarGuardadas(){
  recordar(datos.guardadas);
  $("#lista-guardadas").innerHTML = datos.guardadas.length
    ? '<div class="titulo" style="margin:4px 4px 10px">❤️ Sus recetas guardadas</div>' +
      datos.guardadas.map(tarjetaReceta).join("")
    : '<div class="tarjeta"><div class="vacio"><span class="em">❤️</span>' +
      'Todavía no ha guardado ninguna.<br>Abra una receta y pulse «Guardar».</div></div>';
}

/* ---------------- detalle de la receta ---------------- */

function abrirReceta(receta){
  recetaAbierta = receta;
  porcionesAbiertas = datos.perfil.porciones || 2;
  pintarDetalle();
}

function pintarDetalle(){
  const r = recetaAbierta;
  const {lista, kcal, prot} = calcular(r, porcionesAbiertas);
  const guardada = estaGuardada(r);

  $("#hoja").innerHTML =
  '<div class="hoja">' +
    '<div class="hoja-cab"><b>' + esc(r.n) + '</b><button class="cerrar" data-cerrar>Cerrar</button></div>' +
    '<div class="hoja-cuerpo">' +

      '<div class="cabecera-receta">' +
        '<div class="emoji">' + r.e + '</div>' +
        '<h2>' + esc(r.n) + '</h2>' +
        '<div class="datos">' +
          '<div><b>' + r.t + ' min</b><span>Tiempo</span></div>' +
          '<div><b>' + kcal + '</b><span>kcal ración</span></div>' +
          '<div><b>' + prot + ' g</b><span>Proteína</span></div>' +
        '</div>' +
      '</div>' +

      '<div class="tarjeta"><div class="porciones">' +
        '<b>Para ' + porcionesAbiertas + (porcionesAbiertas === 1 ? " persona" : " personas") + '</b>' +
        '<button data-porciones="-1" aria-label="Menos">−</button>' +
        '<span class="n">' + porcionesAbiertas + '</span>' +
        '<button data-porciones="1" aria-label="Más">+</button>' +
      '</div></div>' +

      '<div class="tarjeta">' +
        '<div class="titulo">🛒 Ingredientes y qué comprar</div>' +
        lista.map(x =>
          '<div class="ingrediente"><span class="marca"></span>' +
          '<span class="txt"><b>' + esc(x.n) + '</b><i>' + esc(x.prod) + '</i></span>' +
          '<span class="cant">' + esc(x.cantidad) + '</span></div>').join("") +
      '</div>' +

      '<div class="tarjeta">' +
        '<div class="titulo">👩‍🍳 Cómo se hace</div>' +
        r.pasos.map((p, i) =>
          '<div class="paso"><span class="num">' + (i+1) + '</span><span>' + esc(p) + '</span></div>').join("") +
      '</div>' +

      (r.tip ? '<div class="consejo"><b>Consejo</b>' + esc(r.tip) + '</div>' : "") +

      '<div style="height:14px"></div>' +
      '<button class="boton" id="copiar-lista">Copiar la lista para el súper</button>' +
      '<button class="boton ' + (guardada ? "roja" : "gris") + '" id="guardar-receta">' +
        (guardada ? "Quitar de guardadas" : "Guardar esta receta") + '</button>' +
    '</div>' +
  '</div>';
}

function cambiarPorciones(delta){
  porcionesAbiertas = Math.max(1, Math.min(8, porcionesAbiertas + delta));
  pintarDetalle();
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
  pintarDetalle();
  if(vista === "guardadas") pintarGuardadas();
}

function copiarLista(){
  const texto = listaCompra(recetaAbierta, porcionesAbiertas);
  if(navigator.clipboard){
    navigator.clipboard.writeText(texto)
      .then(() => aviso("Lista copiada, ya puede pegarla"))
      .catch(() => window.prompt("Copie la lista:", texto));
  }else{
    window.prompt("Copie la lista:", texto);
  }
}

/* ---------------- ajustes ---------------- */

function cargarAjustes(){
  const p = datos.perfil;
  $("#aj-nombre").value = p.nombre;
  $("#aj-porciones").value = p.porciones;
  $("#aj-vegetariano").classList.toggle("si", !!p.vegetariano);
  $("#version-app").textContent = "Mis recetas · versión " + VERSION;
  $("#saludo").textContent = "Hola" + (p.nombre ? ", " + p.nombre : "");
  SIN_CARNE = !!p.vegetariano;
}

function guardarAjustes(){
  const p = datos.perfil;
  p.nombre = $("#aj-nombre").value.trim();
  p.porciones = Math.max(1, Math.min(8, parseInt($("#aj-porciones").value, 10) || 2));
  guardar();
  cargarAjustes();
}

function exportar(){
  const texto = JSON.stringify(datos);
  if(navigator.clipboard){
    navigator.clipboard.writeText(texto)
      .then(() => aviso("Copiado. Péguelo en un correo o WhatsApp"))
      .catch(() => window.prompt("Copie este texto:", texto));
  }else{
    window.prompt("Copie este texto:", texto);
  }
}
function importar(){
  const texto = window.prompt("Pegue aquí el texto de la copia:");
  if(!texto) return;
  try{
    const nuevo = JSON.parse(texto);
    if(!nuevo || !nuevo.perfil) throw new Error("formato");
    datos = Object.assign(porDefecto(), nuevo);
    guardar(); cargarAjustes(); pintarGuardadas(); pintarRecetario();
    aviso("Recuperado");
  }catch(e){ aviso("Ese texto no vale, cópielo entero"); }
}

/* ---------------- navegación ---------------- */

function cambiarVista(v){
  vista = v;
  ["buscar","recetario","guardadas","ajustes"].forEach(x =>
    $("#vista-" + x).classList.toggle("oculto", x !== v));
  document.querySelectorAll("nav button").forEach(b => b.classList.toggle("activa", b.dataset.vista === v));
  const textos = {
    buscar:"¿Qué cocinamos hoy?", recetario:"Todas las recetas, por si no sabe qué poner",
    guardadas:"Lo que le ha gustado", ajustes:"A su gusto"
  };
  $("#subtitulo").textContent = textos[v];
  if(v === "recetario") pintarRecetario();
  if(v === "guardadas") pintarGuardadas();
  window.scrollTo(0, 0);
}

/* ---------------- eventos ---------------- */

document.addEventListener("click", ev => {
  const t = ev.target.closest("button");
  if(!t) return;

  if(t.dataset.vista) return cambiarVista(t.dataset.vista);
  if(t.id === "buscar") return buscar($("#peticion").value);
  if(t.dataset.idea){
    $("#peticion").value = t.dataset.idea;
    return buscar(t.dataset.idea);
  }
  if(t.dataset.filtro){ filtro = t.dataset.filtro; return pintarRecetario(); }
  if(t.dataset.abrir){
    const [id, nombre] = t.dataset.abrir.split("|");
    const r = buscarEnPantalla(id, nombre);
    if(r) abrirReceta(r);
    return;
  }
  if(t.hasAttribute("data-cerrar")){ $("#hoja").innerHTML = ""; return; }
  if(t.dataset.porciones) return cambiarPorciones(parseInt(t.dataset.porciones, 10));
  if(t.id === "copiar-lista") return copiarLista();
  if(t.id === "guardar-receta") return alternarGuardada();
  if(t.id === "aj-vegetariano"){
    datos.perfil.vegetariano = !datos.perfil.vegetariano;
    guardar(); cargarAjustes();
    aviso(datos.perfil.vegetariano ? "Sin carne ni pescado" : "Con todo");
    return;
  }
  if(t.id === "aj-exportar") return exportar();
  if(t.id === "aj-importar") return importar();
});

document.querySelectorAll("#vista-ajustes input").forEach(el =>
  el.addEventListener("change", guardarAjustes));

$("#peticion").addEventListener("keydown", e => {
  if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); buscar($("#peticion").value); }
});

/* ---------------- arranque ---------------- */

cargarAjustes();
pintarIdeas();

if("serviceWorker" in navigator && location.protocol.startsWith("http") &&
   !(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())){
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
