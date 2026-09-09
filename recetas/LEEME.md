# Mis recetas

Le dices lo que se te antoja —«yogur con proteína, plátano y frutos secos», «ensalada de
atún», «algo con pollo y brócoli»— y te devuelve una receta con las cantidades exactas y
con los productos que se encuentran en un súper chileno. Sin registro, sin publicidad y
sin internet: todo se resuelve dentro del teléfono.

## Cómo funciona por dentro

No hay inteligencia artificial ni conexión a ningún servidor. Hay tres piezas:

| Archivo | Qué contiene |
| --- | --- |
| `ingredientes.js` | 72 ingredientes con su medida habitual, sus calorías, su proteína y qué comprar (marca o tipo de producto chileno) |
| `recetas.js` | 28 recetas escritas a mano, con pasos y consejos |
| `motor.js` | Entiende lo que se escribe, busca en el recetario y, si no hay nada que encaje, arma una receta con plantillas |

Cuando escribes algo, el motor busca ingredientes por palabra completa (con sinónimos:
palta/aguacate, choclo/maíz, frutilla/fresa) y puntúa las recetas del recetario. Además
siempre propone una receta **inventada con lo que has pedido**: elige una plantilla
(bowl, ensalada, salteado, guiso, bandeja al horno o sándwich), rellena los huecos con lo
que has nombrado, completa lo que falte con ingredientes sensatos y escribe los pasos.

Las calorías y la proteína de cada receta se calculan solas a partir de los ingredientes,
así que si se cambia una cantidad, los números cuadran.

## Qué se puede hacer

- Buscar por antojo, por ingrediente o por momento del día.
- Cambiar el número de personas: todas las cantidades se recalculan.
- Copiar la lista del súper para pegarla en WhatsApp o en las notas.
- Guardar las recetas que gustan (incluidas las inventadas).
- Filtrar el recetario por desayuno, almuerzo, once, cena, snack, rápidas, económicas,
  chilenas o altas en proteína.
- Activar «sin carne ni pescado»: esconde las que llevan y las inventadas pasan a usar
  huevo o legumbres.

## Cómo se instala

Igual que la app de calorías. El APK se compila solo y está siempre en:

**https://github.com/neosanc/plannerluci/releases/download/apk-recetas/mis-recetas.apk**

También funciona como página web instalable en `https://neosanc.github.io/plannerluci/recetas/`
(Chrome → tres puntos → Añadir a la pantalla de inicio).

## Para añadir recetas

Editar `recetas.js` copiando el formato de las que ya hay: las cantidades son **por
porción** y se escriben en la unidad de cada ingrediente. Si hace falta un ingrediente
nuevo, se añade antes en `ingredientes.js` con sus calorías por 100 g y el producto
chileno que se compra.
