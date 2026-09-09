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
se pasa, todo se pone ámbar y dice cuánto se pasó. Debajo, los vasos de agua y las cinco
comidas (desayuno, almuerzo, once, cena y picoteo). Cuando una comida está vacía y ayer
tenía algo, aparece **«Repetir el de ayer»**. Al buscar un alimento se puede marcar con
la ⭐ para que salga siempre arriba, en **Sus favoritos**.

**Recetas** — Se le escribe lo que se antoja («yogur con proteína, plátano y frutos
secos», «ensalada de atún») y devuelve recetas del recetario y una **hecha con lo que
pidió**. Cada receta trae cantidades por persona, qué comprar en el súper chileno, los
pasos y un botón para **anotarla en el día de hoy** con sus calorías.

**Progreso** — Se apunta peso y cintura, y calcula el **IMC** (con la altura de Ajustes)
y el **índice cintura-altura**. Gráficas de peso, cintura e IMC, más las calorías de los
últimos 7 días.

**Logros** — Racha de días seguidos apuntando y 12 medallas.

**Ajustes** — Tope de calorías, recordatorios con hora, datos personales, personas por
receta, recetas sin carne y copia de seguridad.

## Archivos

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | La pantalla de la app |
| `estilos.css` | Colores, gradientes y disposición |
| `app.js` | Comidas, agua, racha, medallas, medidas, recetas y avisos |
| `alimentos.js` | 240 alimentos con sus calorías (incluidos 42 chilenos) |
| `ingredientes.js` | 72 ingredientes con producto chileno sugerido |
| `recetas.js` | 28 recetas escritas a mano |
| `motor.js` | Entiende lo que se escribe y arma recetas con plantillas |
| `manifest.webmanifest`, `sw.js` | Para instalarla desde el navegador y que funcione sin internet |

Para añadir alimentos se edita `alimentos.js` (`k` son las calorías por 100 g y `p` las
porciones habituales en gramos). Para añadir recetas, `recetas.js`, con las cantidades
por porción. El proyecto Android que envuelve todo esto está en `../app-android`.

## Dónde se guardan los datos

En el propio teléfono (`localStorage`). Si se borran los datos de la app o se cambia de
móvil se pierden, salvo que se use **Ajustes → Copiar mis datos** y luego **Pegar datos
de otro móvil**.
