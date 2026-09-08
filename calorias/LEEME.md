# Mis calorías

Contador de calorías sencillo, en español, pensado para usarse a diario desde el móvil.
No pide registro, no tiene publicidad y funciona sin internet.

## Cómo se pone en el móvil (Android)

1. En el ordenador, activa GitHub Pages en este repositorio:
   **Settings → Pages → Source: Deploy from a branch → Branch: `main` / carpeta `/ (root)` → Save**.
2. Espera un par de minutos. La app queda publicada en:
   `https://neosanc.github.io/plannerluci/calorias/`
3. Abre esa dirección **en Chrome**, en el móvil.
4. Menú de los tres puntos (arriba a la derecha) → **Añadir a la pantalla de inicio** →
   **Instalar**. Aparece un icono verde llamado «Calorías» junto al resto de aplicaciones.
5. A partir de ahí se abre como cualquier otra app, a pantalla completa y sin barra del
   navegador. Funciona aunque no haya cobertura.

## Qué hace

- Cinco comidas al día: desayuno, comida, merienda, cena y picoteo.
- Buscador con unos 200 alimentos habituales en España, con raciones ya calculadas
  («1 unidad», «1 plato», «1 caña»…), o los gramos exactos si se prefiere.
- Alimentos propios: se apunta el nombre y las calorías de la ración y queda guardado
  para volver a usarlo.
- Anillo con lo que lleva comido y lo que le queda; se pone naranja si se pasa.
- Se puede ir a días anteriores con las flechas de arriba.
- Registro de peso con una gráfica.
- Objetivo diario a mano, o calculado con la fórmula de Mifflin-St Jeor a partir de
  edad, altura, peso, sexo y actividad. Es una estimación orientativa.

## Dónde se guardan los datos

En el propio teléfono (`localStorage` del navegador), en ningún servidor. Nadie más los ve.
Como contrapartida: si se borran los datos de Chrome o se cambia de móvil, se pierden,
salvo que se use **Ajustes → Copiar mis datos** y luego **Pegar datos de otro móvil**.

## Archivos

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | La pantalla de la app |
| `estilos.css` | Colores, tamaños y disposición |
| `app.js` | Toda la lógica: comidas, peso, objetivo, copias |
| `alimentos.js` | La tabla de alimentos y sus calorías |
| `manifest.webmanifest` | Lo que hace que se pueda instalar como app |
| `sw.js` | Guarda la app en el móvil para que funcione sin internet |
| `icono-192.png`, `icono-512.png` | El icono de la pantalla de inicio |

Para cambiar o añadir alimentos basta con editar `alimentos.js`: `k` son las calorías por
100 g (o por 100 ml en bebidas) y `p` son las raciones habituales, en gramos.
