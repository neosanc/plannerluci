# Envoltorio Android de «Mi salud»

Esto convierte la app web de `../calorias` (calorías, recetas y medidas) en una aplicación de Android de verdad
(un APK que se instala en el móvil), usando [Capacitor](https://capacitorjs.com).

La app web se copia tal cual dentro del APK, así que **hay una sola app**: lo que se
cambie en `../calorias` es lo que sale en el móvil.

## Cómo se compila

Normalmente no hace falta hacer nada a mano: el flujo `.github/workflows/apk.yml`
compila el APK en GitHub cada vez que cambia la app y lo publica en la release `apk`.
También se puede lanzar a mano desde la pestaña **Actions → Construir el APK →
Run workflow**.

Para compilarlo en un ordenador con el SDK de Android instalado:

```bash
npm install
npm run apk        # copia la web, sincroniza y compila
# el archivo sale en android/app/build/outputs/apk/release/app-release.apk
```

## Qué añade respecto a la versión web

- **Recordatorios**: avisos diarios aunque la app esté cerrada
  (`@capacitor/local-notifications`). En el navegador no se pueden dar.
- Icono, pantalla de arranque y nombre propios.
- No necesita navegador ni conexión.

## Sobre la firma

La clave para firmar (`android/app/miscalorias.keystore`, contraseña `miscalorias`)
está guardada en el repositorio **a propósito**. Es una app familiar que se instala a
mano, y así todas las versiones se firman igual y cada actualización se instala encima
de la anterior sin perder los datos.

La contrapartida es que cualquiera con acceso al repositorio podría firmar un APK que
Android aceptaría como actualización de este. Para una app que solo se pasa por
WhatsApp dentro de casa es un riesgo asumible; si algún día esto se publicase de
verdad, habría que sacar la clave de aquí y guardarla como secreto del repositorio.
