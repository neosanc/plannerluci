/* Motor: entiende lo que escribe la persona, busca recetas y, cuando no hay
   ninguna que encaje, arma una a partir de plantillas con los ingredientes que
   sí ha nombrado. Todo dentro del teléfono, sin internet. */

/* cuando está activado «sin carne», las recetas inventadas usan otra proteína */
let SIN_CARNE = false;

const corto = clave => INGREDIENTES[clave].corto || INGREDIENTES[clave].n.toLowerCase();

const normaliza = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* palabras que la gente usa y a las que respondemos igual */
const SINONIMOS = {
  "aguacate":"palta", "banana":"platano", "banano":"platano", "fresa":"frutilla",
  "maiz":"choclo", "calabacin":"zapallo italiano", "zucchini":"zapallo italiano",
  "calabaza":"zapallo", "remolacha":"betarraga", "frijol":"porotos", "judias":"porotos verdes",
  "yogurt":"yogur", "atun en lata":"atun", "crema de mani":"mantequilla de mani",
  "proteico":"proteina", "proteinas":"proteina", "light":"liviano", "sano":"liviano"
};

function aplicarSinonimos(texto){
  let t = " " + normaliza(texto) + " ";
  Object.keys(SINONIMOS).forEach(k => {
    t = t.split(" " + k).join(" " + normaliza(SINONIMOS[k]));
  });
  return t;
}

/* ---------- qué ingredientes ha nombrado ---------- */

function detectarIngredientes(texto){
  const t = aplicarSinonimos(texto);
  /* por palabra completa: si no, «ensalada» activaba «sal» y «mani» aparecía dentro
     de cualquier palabra que lo llevara */
  const contiene = palabra => new RegExp("(^|[^a-z0-9ñ])" +
      palabra.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(s|es)?([^a-z0-9ñ]|$)").test(t);

  const candidatos = [];
  Object.keys(INGREDIENTES).forEach(clave => {
    const acertadas = INGREDIENTES[clave].claves.map(normaliza).filter(contiene);
    if(!acertadas.length) return;
    const mejor = acertadas.slice().sort((a,b) => b.length - a.length)[0];
    candidatos.push({clave, mejor, acertadas, cat:INGREDIENTES[clave].cat,
                     palabras:INGREDIENTES[clave].n.split(" ").length});
  });

  /* Si dos ingredientes de la misma familia se activaron con la MISMA palabra
     («zapallo» → italiano y camote, «pollo» → pechuga y trutro), nos quedamos
     con uno: no tiene sentido un plato con los dos. */
  candidatos.sort((a,b) => (b.mejor.length - a.mejor.length) || (a.palabras - b.palabras));
  const elegidos = [];
  candidatos.forEach(c => {
    const repetido = elegidos.some(e => {
      if(e.mejor === c.mejor) return true;                     // misma palabra, sobra uno
      if(e.cat !== c.cat) return false;
      return e.acertadas.some(a => c.acertadas.includes(a));   // misma familia
    });
    if(!repetido) elegidos.push(c);
  });

  const claves = elegidos.map(c => c.clave);
  if(/frutos secos|frutas secas/.test(t)){
    ["nueces","almendras"].forEach(k => { if(!claves.includes(k)) claves.push(k); });
  }
  return claves;
}

/* ---------- buscar en el recetario ---------- */

function buscarRecetas(texto){
  const t = aplicarSinonimos(texto);
  const VACIAS = ["con","sin","para","algo","que","una","uno","los","las","del","por","muy",
                 "hoy","mas","mis","tengo","quiero","hacer","comer","rico","bueno","dame","receta"];
  const palabras = t.split(/[^a-z0-9ñ]+/).filter(p => p.length > 2 && !VACIAS.includes(p));
  if(!palabras.length) return [];
  const detectados = detectarIngredientes(texto);

  /* «rápida» y «rápido» son la misma palabra para quien busca */
  const parecido = (a,b) => a === b ||
    (a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a))) ||
    (a.length >= 5 && b.length >= 5 && a.slice(0,5) === b.slice(0,5));

  const puntuadas = RECETAS.map(r => {
    let puntos = 0;
    const claves = r.claves.map(normaliza);
    palabras.forEach(p => {
      if(claves.some(c => parecido(c, p))) puntos += 3;
      if(normaliza(r.n).split(/[^a-z0-9ñ]+/).some(w => parecido(w, p))) puntos += 2;
      if(r.etiquetas.some(e => normaliza(e).split(" ").some(w => parecido(w, p)))) puntos += 3;
      if(parecido(normaliza(r.cat), p)) puntos += 3;
    });
    const suyos = r.ing.map(([k]) => k);
    detectados.forEach(k => { if(suyos.includes(k)) puntos += 4; });
    return {receta:r, puntos};
  });

  /* con una o dos palabras («pollo», «once») pedimos menos para no dejarla sin nada */
  const minimo = palabras.length <= 2 ? 3 : 5;
  return puntuadas.filter(x => x.puntos >= minimo)
    .sort((a,b) => b.puntos - a.puntos)
    .slice(0, 4)
    .map(x => x.receta);
}

/* ---------- inventar una receta con lo que haya escrito ---------- */

const PLANTILLAS = [
  {
    id:"bowl", palabras:["bowl","yogur","desayuno","once","batido"], nombre:"Bowl",
    ranuras:[
      {cat:"lacteo",   def:"yogur-griego"},
      {cat:"fruta",    def:"platano"},
      {cat:"crocante", def:"nueces"},
      {cat:"carbo",    def:"avena", soloSiDetectado:true},
      {cat:"alino",    def:"miel"}
    ],
    pasos:(x) => [
      "Pon " + x.lacteo + " en un bowl hondo.",
      "Corta " + x.fruta + " y repártela por encima.",
      "Pica " + x.crocante + " y espolvorea." + (x.carbo ? " Agrega " + x.carbo + "." : ""),
      "Termina con " + (x.alino || "un hilo de miel") + " y come al momento."
    ],
    tip:"Si lo dejas tapado en el refrigerador, al día siguiente queda más cremoso."
  },
  {
    id:"ensalada", palabras:["ensalada","fria","fresco","liviano"], nombre:"Ensalada",
    ranuras:[
      {cat:"proteina", def:"atun-agua", defVeg:"garbanzos"},
      {cat:"verdura",  def:"tomate"},
      {cat:"verdura",  def:"lechuga"},
      {cat:"grasa",    def:"palta"},
      {cat:"legumbre", def:"porotos", soloSiDetectado:true},
      {cat:"carbo",    def:"quinoa",  soloSiDetectado:true},
      {cat:"alino",    def:"limon"}
    ],
    pasos:(x) => [
      "Escurre y desmenuza " + x.proteina + ".",
      "Pica " + [x.verdura, x.verdura2].filter(Boolean).join(" y ") + " en trozos parejos.",
      (x.legumbre || x.carbo)
        ? "Agrega " + [x.legumbre, x.carbo].filter(Boolean).join(" y ") + " ya cocido y frío."
        : "Mezcla todo en un bowl grande.",
      "Aliña con aceite de oliva, " + (x.alino || "limón") + ", sal y pimienta.",
      "Deja reposar 10 minutos antes de servir: sabe mejor."
    ],
    tip:"Si lleva cebolla cruda, déjala 10 minutos en agua fría con sal y no repite."
  },
  {
    id:"salteado", palabras:["salteado","saltear","sarten","wok","rapido","cena"], nombre:"Salteado",
    ranuras:[
      {cat:"proteina", def:"pollo-pechuga", defVeg:"huevo"},
      {cat:"verdura",  def:"brocoli"},
      {cat:"verdura",  def:"zanahoria"},
      {cat:"carbo",    def:"arroz"},
      {cat:"alino",    def:"ajo"}
    ],
    pasos:(x) => [
      "Corta " + x.proteina + " en tiras y las verduras en trozos parejos.",
      "Calienta bien un sartén con una cucharada de aceite y sella la proteína 4 minutos.",
      "Agrega " + (x.alino || "el ajo") + " y " + [x.verdura, x.verdura2].filter(Boolean).join(" y ") +
        ", y saltea 5 minutos: las verduras deben quedar firmes.",
      "Sirve sobre " + x.carbo + " y prueba de sal."
    ],
    tip:"El sartén tiene que estar caliente antes de echar nada, si no todo se cuece en vez de dorarse."
  },
  {
    id:"guiso", palabras:["guiso","olla","sopa","caldo","cazuela","invierno","abrigador"], nombre:"Guiso",
    ranuras:[
      {cat:"proteina", def:"pollo-trutro", defVeg:"lentejas"},
      {cat:"verdura",  def:"zanahoria"},
      {cat:"verdura",  def:"zapallo"},
      {cat:"carbo",    def:"papa"},
      {cat:"legumbre", def:"lentejas", soloSiDetectado:true},
      {cat:"alino",    def:"comino"}
    ],
    pasos:(x) => [
      "Sofríe una cebolla picada con un diente de ajo en un poco de aceite.",
      "Agrega " + x.proteina + " y dórala por todos lados.",
      "Suma " + [x.verdura, x.verdura2, x.carbo, x.legumbre].filter(Boolean).join(", ") +
        " y agua caliente hasta cubrir.",
      "Cocina tapado a fuego suave 25 minutos, con " + (x.alino || "comino") + ", sal y pimienta.",
      "Prueba de sal antes de servir y termina con cilantro picado."
    ],
    tip:"La sal al final: si la echas al principio, las legumbres quedan duras."
  },
  {
    id:"horno", palabras:["horno","asado","bandeja","gratinado"], nombre:"Bandeja al horno",
    ranuras:[
      {cat:"proteina", def:"salmon", defVeg:"quesillo"},
      {cat:"carbo",    def:"papa"},
      {cat:"verdura",  def:"brocoli"},
      {cat:"alino",    def:"oregano"}
    ],
    pasos:(x) => [
      "Precalienta el horno a 200 °C.",
      "Corta " + x.carbo + " en rodajas finas, aliña con aceite, sal y " + (x.alino || "orégano") +
        ", y hornea 20 minutos.",
      "Pon " + x.proteina + " encima y hornea 12 minutos más.",
      "Cocina " + x.verdura + " al vapor y sirve todo junto con limón."
    ],
    tip:"Todo en una sola bandeja: menos loza y las verduras toman el sabor de la proteína."
  },
  {
    id:"sandwich", palabras:["sandwich","sanguche","pan","marraqueta","wrap","pita","once"], nombre:"Sándwich",
    ranuras:[
      {cat:"carbo",    def:"marraqueta"},
      {cat:"proteina", def:"jamon-pavo", defVeg:"quesillo"},
      {cat:"grasa",    def:"palta"},
      {cat:"verdura",  def:"tomate"},
      {cat:"lacteo",   def:"quesillo", soloSiDetectado:true}
    ],
    pasos:(x) => [
      "Abre " + x.carbo + " y tuéstala un poco.",
      "Muele " + x.grasa + " con una pizca de sal y úntala.",
      "Arma con " + [x.proteina, x.lacteo, x.verdura].filter(Boolean).join(", ") + ".",
      "Cierra, aprieta un poco y córtalo por la mitad."
    ],
    tip:"El pan tostado aguanta la palta sin humedecerse."
  }
];

function elegirPlantilla(texto, detectados){
  const t = aplicarSinonimos(texto);
  const porPalabra = PLANTILLAS.find(p => p.palabras.some(w => t.includes(w)));
  if(porPalabra) return porPalabra;

  const cats = detectados.map(k => INGREDIENTES[k].cat);
  const hay = c => cats.includes(c);
  if(hay("lacteo") && !hay("proteina") && !hay("verdura")) return PLANTILLAS[0];
  if(hay("lacteo") && hay("fruta")) return PLANTILLAS[0];
  if(hay("proteina") && (hay("verdura") || hay("legumbre"))) return PLANTILLAS[1];
  if(hay("fruta")) return PLANTILLAS[0];
  return PLANTILLAS[1];
}

function inventarReceta(texto){
  const detectados = detectarIngredientes(texto);
  if(!detectados.length) return null;
  const plantilla = elegirPlantilla(texto, detectados);

  const disponibles = detectados.slice();
  const usados = [];
  const suyos = [];          // los que ha nombrado la persona, para el título
  const nombres = {};
  const porCategoria = {};

  plantilla.ranuras.forEach(ranura => {
    const i = disponibles.findIndex(k => INGREDIENTES[k].cat === ranura.cat);
    let elegido = null, esSuyo = false;
    if(i >= 0){
      elegido = disponibles.splice(i, 1)[0];
      esSuyo = true;
    }else if(!ranura.soloSiDetectado){
      elegido = (SIN_CARNE && ranura.defVeg) ? ranura.defVeg : ranura.def;
    }
    if(!elegido || usados.includes(elegido)) return;
    usados.push(elegido);
    if(esSuyo) suyos.push(elegido);

    porCategoria[ranura.cat] = (porCategoria[ranura.cat] || 0) + 1;
    const etiqueta = porCategoria[ranura.cat] > 1 ? ranura.cat + porCategoria[ranura.cat] : ranura.cat;
    nombres[etiqueta] = corto(elegido);
  });

  /* Lo que nombró y no cupo se añade solo si suma algo: nada de meter dos
     proteínas ni dos panes en el mismo plato. */
  const apilables = ["verdura","fruta","crocante","alino"];
  disponibles.forEach(k => {
    if(usados.includes(k)) return;
    if(!apilables.includes(INGREDIENTES[k].cat)) return;
    if(usados.filter(u => INGREDIENTES[u].cat === INGREDIENTES[k].cat).length >= 2) return;
    usados.push(k);
    suyos.push(k);
  });

  /* El título se arma con lo que ella escribió, no con los ingredientes por defecto */
  const orden = ["proteina","lacteo","legumbre","fruta","verdura","carbo","crocante"];
  const principales = suyos
    .filter(k => orden.includes(INGREDIENTES[k].cat))
    .sort((a,b) => orden.indexOf(INGREDIENTES[a].cat) - orden.indexOf(INGREDIENTES[b].cat))
    .slice(0, 2)
    .map(corto);

  return {
    id: "inventada",
    inventada: true,
    n: plantilla.nombre + (principales.length ? " de " + principales.join(" con ") : " con lo que tienes"),
    e: "✨",
    cat: "almuerzo",
    t: plantilla.id === "guiso" ? 35 : (plantilla.id === "horno" ? 35 : (plantilla.id === "salteado" ? 20 : 10)),
    etiquetas: ["hecha con lo tuyo"],
    claves: [],
    ing: usados.map(k => [k, INGREDIENTES[k].c]),
    pasos: plantilla.pasos(nombres).filter(Boolean),
    tip: plantilla.tip
  };
}

/* ---------- cantidades y cuentas ---------- */

const FRACCIONES = {0.25:"¼", 0.5:"½", 0.75:"¾", 1.5:"1½", 2.5:"2½"};

function cantidadTexto(clave, cantidad){
  const ing = INGREDIENTES[clave];
  const u = ing.u;
  if(u === "g" || u === "ml"){
    const v = cantidad >= 100 ? Math.round(cantidad/10)*10 : Math.round(cantidad);
    return v + " " + u;
  }
  const bonito = FRACCIONES[cantidad] || (Math.round(cantidad*100)/100).toString().replace(".", ",");
  const plural = cantidad > 1;
  const unidades = {
    unidad: plural ? "unidades" : "unidad",
    cda:    plural ? "cdas" : "cda",
    cdta:   plural ? "cdtas" : "cdta",
    pizca:  plural ? "pizcas" : "pizca"
  };
  return bonito + " " + (unidades[u] || u);
}

function calcular(receta, porciones){
  let kcal = 0, prot = 0;
  const lista = receta.ing.map(([clave, cantidad]) => {
    const ing = INGREDIENTES[clave];
    const total = cantidad * porciones;
    kcal += ing.kcal/100 * total * ing.g;
    prot += ing.prot/100 * total * ing.g;
    return {clave, n:ing.n, prod:ing.prod, cantidad:cantidadTexto(clave, total)};
  });
  return {lista, kcal:Math.round(kcal/porciones), prot:Math.round(prot/porciones)};
}

function listaCompra(receta, porciones){
  const {lista} = calcular(receta, porciones);
  return "🛒 " + receta.n + " (" + porciones + (porciones === 1 ? " porción" : " porciones") + ")\n\n" +
    lista.map(x => "· " + x.n + " — " + x.cantidad + "\n   " + x.prod).join("\n");
}

/* ---------- sin carne ---------- */

const PROTEINAS_ANIMALES = ["atun-agua","pollo-pechuga","pollo-trutro","carne-molida","salmon","merluza","jamon-pavo"];
function esVegetariana(receta){
  return !receta.ing.some(([k]) => PROTEINAS_ANIMALES.includes(k));
}
