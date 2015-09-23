# othello
Se usa el codigo de http://davidbau.com/reversi/ como base para meter la IA.


## Desarrollo
### Instalacion

Para instalar se necesita de tener instalado **Node.js** y **npm** Las instrucciones para instalar Node.js en Ubuntu se puede seguir este tutorial: https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-an-ubuntu-14-04-server

Para instalar npm en ubuntu se puede ejecutar lo siguiente:
```
sudo apt-get install npm
```

Una vez instalado todo ubicarse en el directorio de este proyecto y ejecutar

```
$ npm install
```

para instalar todas las dependencias todas las dependencias.

### Ejecutar Othello

```
$ npm start
```

## Estructura del proyecto
La estructura es asi:
* ***index.js***: Archivo donde se configura como se va a correr la aplicación. Basicamente se le dice cual es la pagina principal.
* ***reversijs***: Carpeta donde están los archivos de los que está hecho importante. ***ESTA ES LA CARPETA REALMENTE IMPORTANTE***
    * ***index.html***: Archivo HTML de la aplicacioón.
    * ***scripts***: Carpeta donde está el código javascript
        * ***tablero.js***: Archivo que contiene toda la lógica interna del tablero de reversi
        * ***gui.js***: Archivo que contiene el código que se encarga de mostrar el tablero en la pantalla
        * ***reversi.js***: Archivo donde se inicia el juego. Acá deberían estar implementados los algoritmos de IA y toda la lógica del juego.


El resto de las carpetas y archivos son internos y son para configuración y para almacenar las librerías de dependencias.
