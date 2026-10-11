# Publicar Code Fenix gratis en internet

Esta guía es para alguien que **no programa**. Seguí los pasos en orden. Lleva unos 30 minutos la primera vez.

Al terminar vas a tener:
- El juego publicado en una dirección propia, por ejemplo `https://code-fenix-1a2b3.web.app`, que se puede jugar en PC y en el celular.
- La opción de instalarlo como app ("Agregar a pantalla de inicio") y jugarlo sin conexión.
- Inicio de sesión con Google, opcional, para guardar la partida en la nube y seguirla en otro dispositivo.

Todo esto usa el plan gratuito **Spark** de Firebase, que **no pide tarjeta de crédito**.

> Si en algún paso algo no te sale, no pasa nada. El juego funciona igual sin la nube (en *modo invitado*), y la partida se guarda en el dispositivo.

---

## Lo que necesitás
1. Una cuenta de Google (un Gmail).
2. Una computadora con Windows, Mac o Linux.
3. La carpeta del juego descomprimida (la carpeta `juego-gotico` que viene dentro de `code-fenix.zip`).

---

## Paso 1. Crear el proyecto de Firebase
1. Entrá a **https://console.firebase.google.com** con tu cuenta de Google.
2. Tocá **"Crear un proyecto"** (o "Agregar proyecto").
3. De nombre, poné `code-fenix` y tocá **Continuar**.
4. Cuando pregunte por **Google Analytics**, podés desactivarlo, porque no hace falta. Tocá **Crear proyecto** y esperá a que termine.
5. Firebase le asigna al proyecto un **ID del proyecto**, que suele ser el nombre con números al final, por ejemplo `code-fenix-1a2b3`. Lo ves en ⚙️ **Configuración del proyecto**. **Anotalo**, porque lo vas a usar después.

## Paso 2. Registrar el juego como "app web"
1. En la página principal del proyecto, tocá el ícono **`</>`** (Web).
2. De apodo, poné `Code Fenix`. La casilla de Firebase Hosting podés dejarla sin marcar: el hosting se configura después.
3. Tocá **Registrar app**.
4. Firebase te muestra un bloque de código parecido a este:
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "code-fenix-1a2b3.firebaseapp.com",
     projectId: "code-fenix-1a2b3",
     storageBucket: "code-fenix-1a2b3.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abc123..."
   };
   ```
   **Dejá esa página abierta** o copiá esos valores en un bloc de notas.
   (Si la cerraste, los encontrás en ⚙️ Configuración del proyecto → *Tus apps*.)

## Paso 3. Activar el inicio de sesión con Google
1. En el menú de la izquierda, entrá a **Compilación → Authentication** y tocá **Comenzar**.
2. En la pestaña **Método de acceso**, elegí **Google**.
3. Activá el interruptor **Habilitar**, elegí tu correo como "correo electrónico de asistencia" y tocá **Guardar**.
4. En **Configuración → Dominios autorizados** ya deberían figurar `localhost`, `TU-ID.firebaseapp.com` y `TU-ID.web.app`. Si más adelante usás un dominio propio, agregalo acá.

## Paso 4. Crear la base de datos (Firestore)
1. En el menú de la izquierda, entrá a **Compilación → Firestore Database** y tocá **Crear base de datos**.
2. **Ubicación:** elegí una cercana, por ejemplo `southamerica-east1 (São Paulo)`. Después no se puede cambiar.
3. Elegí **modo de producción** y tocá **Crear**.
4. Las reglas de seguridad ya vienen escritas en el archivo `firestore.rules`: cada persona solo puede leer y escribir su propia partida. Se suben solas en el paso 8, así que acá no tenés que tocar nada.

## Paso 5. Pegar la configuración en el juego
1. En la carpeta `juego-gotico`, abrí el archivo **`firebase-config.js`** con el **Bloc de notas** (Windows) o con **TextEdit** (Mac, en modo texto sin formato).
2. Reemplazá cada valor `"PEGAR_..."` por el valor correspondiente del paso 2. Respetá las comillas. Por ejemplo:
   ```js
   window.FIREBASE_CONFIG = {
     apiKey: "AIzaSy...",
     authDomain: "code-fenix-1a2b3.firebaseapp.com",
     projectId: "code-fenix-1a2b3",
     storageBucket: "code-fenix-1a2b3.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abc123..."
   };
   ```
3. Guardá el archivo.
4. Abrí también el archivo **`.firebaserc`** y cambiá `PEGAR_ID_DEL_PROYECTO` por tu ID del proyecto, por ejemplo `code-fenix-1a2b3`. Guardalo.
   *Es un archivo oculto.* En Windows: Explorador → **Ver → Mostrar → Elementos ocultos**. En Mac: en la carpeta, apretá **Cmd + Shift + .** (punto).

> Que la `apiKey` quede visible en el juego es normal y no es un riesgo. Lo que protege los datos son las reglas de `firestore.rules`.

## Paso 6. Instalar las herramientas (una sola vez)
1. Instalá **Node.js**: entrá a **https://nodejs.org**, descargá la versión **LTS** e instalala con las opciones por defecto (Siguiente, Siguiente…).
2. Abrí una **terminal**:
   - **Windows:** botón Inicio, escribí `cmd` y abrí **Símbolo del sistema**.
   - **Mac:** abrí **Terminal** (está en Aplicaciones → Utilidades).
3. Escribí este comando y apretá Enter:
   ```
   npm install -g firebase-tools
   ```
   En Mac, si te da un error de permisos, usá: `sudo npm install -g firebase-tools` (te va a pedir la contraseña de la Mac).
4. Para comprobar que se instaló, escribí `firebase --version`. Tiene que aparecer un número de versión.

## Paso 7. Iniciar sesión en Firebase desde la terminal
```
firebase login
```
Se abre el navegador. Elegí la misma cuenta de Google del paso 1 y aceptá. Si te pregunta si querés compartir datos de uso, podés contestar que no.

## Paso 8. Publicar
1. En la terminal, entrá a la carpeta del juego:
   - **Windows:** abrí la carpeta `juego-gotico` en el Explorador, hacé clic en la barra de direcciones, escribí `cmd` y apretá Enter. Se abre una terminal ya ubicada en esa carpeta.
   - **Mac:** escribí `cd ` (con un espacio al final), arrastrá la carpeta `juego-gotico` a la ventana de la Terminal y apretá Enter.
2. Escribí:
   ```
   firebase deploy
   ```
3. Cuando termine, vas a ver algo como:
   ```
   ✔  Deploy complete!
   Hosting URL: https://code-fenix-1a2b3.web.app
   ```
   **Esa es la dirección de tu juego.** Compartila con quien quieras.

`firebase deploy` sube el juego (Hosting) y también las reglas de seguridad de la base de datos.

## Paso 9. Probar
- **En la PC:** abrí la dirección. En la pantalla de título, arriba a la derecha, aparece el botón **"Iniciar sesión con Google"** (también figura en el menú). Iniciá sesión y descansá en una pira: la partida se sube a la nube.
- **En el celular:** abrí la misma dirección y poné el teléfono **en horizontal**. Aparecen los controles táctiles. Para instalar el juego:
  - **Android (Chrome):** menú ⋮ → **Instalar app** (o *Agregar a pantalla principal*).
  - **iPhone (Safari):** botón Compartir → **Agregar a inicio**.
  Una vez instalado, se abre a pantalla completa y funciona sin conexión.
- **Guardado en la nube:** cada vez que descansás en una pira, la partida se guarda en el dispositivo y, si iniciaste sesión, también en la nube. Al iniciar sesión o al elegir CONTINUAR, el juego compara las dos copias y se queda con la más reciente.

## Publicar una versión nueva
1. Hacé los cambios en la carpeta.
2. Abrí `sw.js` y cambiá el número de `VERSION`, por ejemplo de `codefenix-m4-1` a `codefenix-m4-2`. Así los celulares que tengan el juego instalado descargan la versión nueva.
3. Volvé a ejecutar `firebase deploy`.
4. A quienes ya jugaron, la versión nueva les aparece la **segunda** vez que abren el juego (la primera se descarga en segundo plano).

## Problemas comunes
| Qué pasa | Qué hacer |
|---|---|
| `firebase` no se reconoce como comando | Cerrá y volvé a abrir la terminal. Si sigue sin andar, reinstalá Node.js (paso 6). |
| En Windows PowerShell aparece "la ejecución de scripts está deshabilitada" | Usá **Símbolo del sistema** (`cmd`) en lugar de PowerShell. |
| `Error: Invalid project id` o `No project active` | Revisá que el ID esté bien escrito en `.firebaserc` (paso 5.4). También podés ejecutar `firebase use --add` y elegir el proyecto de la lista. |
| Al iniciar sesión aparece `auth/unauthorized-domain` | Agregá tu dominio en Authentication → Configuración → **Dominios autorizados**. |
| La ventana de Google no se abre | El navegador bloqueó la ventana emergente. Permití las ventanas emergentes para el sitio y probá de nuevo. |
| El botón de Google dice "Nube no configurada" | `firebase-config.js` todavía tiene valores `PEGAR_...`. Repetí el paso 5 y publicá de nuevo. |
| Sigo viendo la versión vieja | Cerrá y abrí el juego dos veces, o recargá con Ctrl + F5. |

## Límites del plan gratuito (Spark)
Son aproximados y Google puede cambiarlos:
- **Hosting:** unos 10 GB de almacenamiento y unos 360 MB de transferencia por día. El juego pesa menos de 1 MB por visita.
- **Firestore:** 1 GiB de datos, unas 50.000 lecturas y 20.000 escrituras por día. Cada partida guardada ocupa unos pocos KB y se escribe solo cuando descansás en una pira.

Si se superan los límites, el servicio se pausa hasta el día siguiente. **Nunca se cobra nada** en el plan Spark.

---

# Alternativa: publicar en itch.io (sin Firebase)
itch.io es una tienda de juegos independientes donde podés subir juegos gratis que se juegan en el navegador.

1. Creá una cuenta en **https://itch.io** y entrá a **Dashboard → Create new project**.
2. Completá los datos:
   - **Title:** `Code Fenix`
   - **Kind of project:** **HTML**
   - **Pricing:** *No payments* (gratis) o *Donate* (gratis, con donación opcional).
3. En **Uploads**, subí el archivo **`code-fenix-itch.zip`**. Ese zip ya tiene el `index.html` en la raíz, como pide itch.io. Marcá **"This file will be played in the browser"**.
4. En **Embed options**:
   - **Viewport dimensions:** `1280 × 720`.
   - Marcá **Mobile friendly**, con **Orientation: Landscape**.
   - Marcá **Fullscreen button**.
   - Si preferís, marcá **Click to launch in fullscreen**, que en celulares funciona mejor.
5. Agregá una descripción, capturas (están en la carpeta `screenshots/`) y la etiqueta de género (*Action*, *Platformer*, *Metroidvania*).
6. **Visibility:** dejalo en *Draft*, probalo con **View page** y, cuando esté bien, cambialo a **Public** y guardá.

> En itch.io el juego corre **en modo invitado**: la partida se guarda en el navegador de cada jugador. El inicio de sesión con Google y la nube no funcionan dentro del marco de itch.io. Para tener la nube, usá Firebase Hosting (la primera parte de esta guía). Podés publicar en los dos lugares a la vez.
