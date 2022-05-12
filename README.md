# Scale Images API

Esta API permite enviar imágenes para ser escaladas. El resultado se guarada en una carpeta `/output`

## Estructura:

* API, plataforma que realiza todas las operaciones. Contanerizada con Docker.
    * image-api, servidor web. Realizada NodeJS + Express.
    * image-db, servidor de base de datos. MongoDB.
* GCP, scripts para NodeJS que se ejecutan en Google Cloud Platform.

## Prerequisitos:

* Docker y Docker compose instalados
* Se apoya en Google Cloud Platform, debes tener una cuenta con Cloud Functions y Cloud Storage.
    * En Google Cloud platform:
      * Crea un fichero de credenciales  [Google Cloud: Autentícate como cuenta de servicio](https://cloud.google.com/docs/authentication/production#manually) y déjalo en `$HOME/gcp/gcp-credentials.json`
    * En Cloud Storage: 
      * Crear un bucket para las imagenes.

## Ficheros de configuración

Se han añadido ficheros .dist de los que se han degenerar copias sin la extensión para añadir la configuración necesaria:

* `.env` - variables de entorno para docker-compose.
* API
    * config
        * `gcp.config.js` - datos de la configuración de GCP: bucket y domain
* GCP
    * `.env` - variables para despliegue
    * `config.json` - variables de entorno de ejecución: GCP bucket y anchos que se generarán

## Arranque local
## Despliegue API
* `docker-compose build`
* `docker-compose up -d`

Tendremos el servidor disponible en `http://localhost:3200`

### Despliegue GCP
* [Instala el CLI de gcloud](https://cloud.google.com/sdk/docs/install)
* `cd gcp`
* `gcloud init`
* `npm run deploy:http`

En línea de comandos se nos indicará la

## Flujo de aplicación
- API `POST /task`, se envía una imagen desde un formulario multipart, en el campo 'image'.
  - OK (200). El fichero se envio a GCP para ser procesado y se lanzó el procesado.
- API `GET /task/:taskID` al acceder se comprueba que la tarea está terminada y en tal caso se descargan los fichero resultantes a output.
  - OK (200). Los fichero fueron descargados de GCP a la carpeta output. Se recibe un array con las URLs de los ficheros.