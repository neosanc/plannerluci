# Mi salud

Una sola app para el día a día: cuenta atrás de calorías, recetas con productos
chilenos y control de peso, cintura e IMC. Sin registro, sin publicidad y sin
internet: todo se guarda dentro del teléfono.

## Cómo se instala en el móvil (Android)

El APK se compila solo en GitHub y está siempre en la misma dirección:

**https://github.com/neosanc/plannerluci/releases/download/apk/mi-salud.apk**

1. Abrir ese enlace con Chrome, en el móvil. Se descarga `mi-salud.apk`.
2. Tocar la descarga. Android dirá que esa fuente no puede instalar aplicaciones:
   **Ajustes → Permitir de esta fuente**, y volver atrás.
3. Si sale un aviso de Play Protect: **Más detalles → Instalar de todos modos**.
   Aparece porque la app no está en la Play Store, no porque tenga nada raro.

También funciona como página web instalable en
`https://neosanc.github.io/plannerluci/calorias/` (Chrome → tres puntos → Añadir a la
pantalla de inicio), pero ahí **no** funcionan los recordatorios: el navegador no puede
avisar con la app cerrada.

## Las cinco pestañas

**Hoy** — El número grande es lo que le **queda** por comer: empieza en el tope del día
(1.500 por defecto) y va bajando con cada cosa que apunta. El anillo se vacía igual. Si
se pasa, todo se pone ámbar y dice cuánto se pasó.

Debajo van los **macros** (proteína, carbohidratos y grasa en gramos y en % de las
calorías del día), las **raciones de carbohidratos** (de 10 o de 15 g, se elige en
Ajustes) y los **micronutrientes**: fibra en gramos y sodio, calcio, hierro, potasio y
vitamina C en miligramos, cada uno con su % de lo recomendado al día. El sodio se
muestra como tope, no como meta.

Después, los vasos de agua y las cinco comidas (desayuno, comida, merienda, cena y
picoteo). Cada comida tiene un **título automático** con lo que lleva y un botón de
**cámara** para guardarle una foto al plato. Cuando una comida está vacía y ayer tenía
algo, aparece **«Repetir el de ayer»**.

Al añadir un alimento, la pantalla se abre en los **habituales de esa comida** y arriba
hay pestañas por tipo (frutas, verduras, proteínas, lácteos, legumbres, cereales,
grasas, condimentos, bebidas y dulces), más ⭐ favoritos y la lista ampliada. Las
cantidades se ponen en **unidades, gramos, cucharadas, cucharaditas, tazas o pizcas**,
con botones de − y +. El **＋** de cada fila lo añade de una vez con la medida habitual.

**Menú** — El menú de la semana: cada día con el título de cada comida y su foto, con
flechas para ver semanas anteriores y un botón para copiarlo y mandarlo por WhatsApp.

**Recetas** — Se le escribe lo que se antoja («yogur con proteína, plátano y frutos
secos», «ensalada de atún») y devuelve recetas del recetario y una **hecha con lo que
pidió**. Cada receta trae cantidades por persona, qué comprar en el súper chileno, los
pasos y un botón para **anotarla en el día de hoy** con sus calorías.

**Progreso** — Se apuntan peso, cintura y altura, y con eso calcula el **IMC** y el
**índice cintura-altura**. Hay gráficas de peso, cintura, IMC, índice y una con **los dos
índices juntos**, además de las calorías de los últimos 7 días, la racha y las medallas.

**Ajustes** — Tope de calorías, recordatorios con hora, datos personales, personas por
receta, recetas sin carne y copia de seguridad.

## Archivos

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | La pantalla de la app |
| `estilos.css` | Colores, gradientes y disposición |
| `app.js` | Comidas, agua, racha, medallas, medidas, recetas y avisos |
| `nutricion.js` | 111 alimentos habituales con macros y micros completos |
| `alimentos.js` | 240 alimentos más, solo con calorías (incluidos 42 chilenos) |
| `ingredientes.js` | 72 ingredientes con producto chileno sugerido |
| `recetas.js` | 28 recetas escritas a mano |
| `motor.js` | Entiende lo que se escribe y arma recetas con plantillas |
| `manifest.webmanifest`, `sw.js` | Para instalarla desde el navegador y que funcione sin internet |

Para añadir alimentos se edita `alimentos.js` (`k` son las calorías por 100 g y `p` las
porciones habituales en gramos). Para añadir recetas, `recetas.js`, con las cantidades
por porción. El proyecto Android que envuelve todo esto está en `../app-android`.

## Dónde se guardan los datos

En el propio teléfono: los datos en `localStorage` y las fotos en `IndexedDB`. Si se borran los datos de la app o se cambia de
móvil se pierden, salvo que se use **Ajustes → Copiar mis datos** y luego **Pegar datos
de otro móvil**.

## Sobre los números

Las calorías, los macros y los micros salen de tablas de composición de alimentos, que
son valores medios: sirven para llevar la cuenta del día, no son un análisis del
producto exacto que se compró. Los micronutrientes, sobre todo, son orientativos. Los
porcentajes se calculan sobre lo recomendado al día para una mujer adulta (fibra 25 g,
calcio 1.200 mg, hierro 8 mg, potasio 3.500 mg, vitamina C 75 mg) y el sodio sobre el
tope de 2.000 mg de la OMS.
