1.- Descargar e instalar Node.js la versión: 24.14.1 (LTS), fuera de ellos no es necesario descargar nada más sobre Node ya que ya estan los paquetenes necesarios.

2.- XAMPP a la mano, solo se usara SQL (Si no les carga tienen que encender el apache para que les permita hacer cambios a la hora de presionar el boton Admin) para la BD cuyo nombre es Ambar.

3.- Extras: No es necesario hacer más cambios, todo esta programado de forma general para que solo lo corran.

METODO DE EJECUCUIÓN

1.- Abrir terminal en el Visual Studio Code.
2.- Tener abierto XAMPP y activar SQL (Si no funciona enciende un momento el Apache y luego lo puedes apagar para dejar solo el SQL activo).
3.- En la terminal del Visual pegar el siguiente comando: node conexion.js
            Esto hará posible encontrar la pagina en tu Localhost mediante el puerto 3000
4.- En el Navegador escribir lo siguiente "Localhost:3000/login.html"
5.- Listo


(Esta madre esta sujeta a cambios, de momento no se haga porque se verá una conexión con SQL server)




Se ocupa la libreria de  multer papaparse
escribir npm install multer papaparse en el proyecto