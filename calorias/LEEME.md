# Mis calorías

Contador de calorías sencillo, en español, pensado para el día a día desde el móvil.
Sin registro, sin publicidad, sin servidor: funciona entero dentro del teléfono.

Tiene dos formas de instalarse. Son la misma app.

## 1. Como aplicación de Android (APK)

Cada vez que cambia algo, GitHub Actions compila el APK y lo deja publicado siempre
en la misma dirección:

**https://github.com/neosanc/plannerluci/releases/download/apk/mis-calorias.apk**

En el móvil de Gema:

1. Abrir ese enlace con Chrome. Se descarga `mis-calorias.apk`.
2. Tocar la descarga. Android dirá que esa fuente no puede instalar aplicaciones:
   **Ajustes → Permitir de esta fuente**, y volver atrás.
3. Puede salir otro aviso de Play Protect diciendo que la app no es conocida:
   **Más detalles → Instalar de todos modos**. Sale porque la app no está en la
   Play Store, no porque tenga nada raro.
4. Aparece «Mis calorías» entre sus aplicaciones.

Para actualizarla, se descarga el APK otra vez y se instala encima: los datos se
mantienen porque todas las versiones van firmadas con la misma clave.

## 2. Como página web instalable (sin APK)

1. Activar GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / `(root)`**.
2. Abrir `https://neosanc.github.io/plannerluci/calorias/` en Chrome, en el móvil.
3. Menú de los tres puntos → **Añadir a la pantalla de inicio**.

Funciona igual y también sin internet, pero **los recordatorios solo funcionan en el APK**:
el navegador no puede avisar con la app cerrada.

## Qué hace

- Cinco comidas al día: desayuno, comida, merienda, cena y picoteo.
- Unos 200 alimentos habituales en España, con raciones ya calculadas («1 plato»,
  «1 caña», «1 onza»…) o los gramos exactos.
- Alimentos propios: nombre y calorías de la ración, y queda guardado para repetirlo.
- Anillo con lo comido y lo que queda; se pone naranja si se pasa del objetivo.
- Vasos de agua del día (se tocan para llenarlos).
- Racha de días seguidos apuntando y 12 medallas.
- Recordatorios diarios (desayuno, comida, cena y agua) con la hora que se quiera.
- Peso con gráfica, y las calorías de los últimos 7 días.
- Objetivo diario a mano o calculado con Mifflin-St Jeor. Es una estimación orientativa.

## Dónde se guardan los datos

En el propio teléfono (`localStorage`), en ningún servidor. Si se borran los datos de
la app o se cambia de móvil se pierden, salvo que se use
**Ajustes → Copiar mis datos** y luego **Pegar datos de otro móvil**.

## Archivos

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | La pantalla de la app |
| `estilos.css` | Colores, gradientes y disposición |
| `app.js` | Comidas, agua, racha, medallas, peso, avisos y copias |
| `alimentos.js` | La tabla de alimentos y sus calorías |
| `manifest.webmanifest` | Lo que permite instalarla desde el navegador |
| `sw.js` | Guarda la app en el móvil para que funcione sin internet |
| `icono-192.png`, `icono-512.png` | El icono |

Para cambiar o añadir alimentos basta con editar `alimentos.js`: `k` son las calorías
por 100 g (o por 100 ml en bebidas) y `p` son las raciones habituales, en gramos.

El proyecto Android que envuelve todo esto está en `../app-android` y se compila solo
con el flujo `.github/workflows/apk.yml`.
