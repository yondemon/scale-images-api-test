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

## Ficheros de configuración

Se han añadido fiucheros .dist que tienen que ser renombrados sin la extensión para añadir la configuración necesaria:

* .env - variables de entorno para docker-compose.
* API
  * config
    * gcp.config.js - datos de la configuración de GCP: bucket y domain
* GCP
  * .env - variables para despliegue
  * config.json - variables de entorno de ejecución: GCP bucket y anchos que se generarán

## Arranque local
## Despliegue API
docker-compose

### Despliegue GCP
* [Instala el CLI de gcloud](https://cloud.google.com/sdk/docs/install)
* `gcloud init`

## Flujo de aplicación
- API `POST /task`, se envía una imagen desde un formulario multipart, en el campo 'image'.
  - OK. El fichero se envio a GCP para ser procesado y se lanzó el procesado.
- API `GET /task/:taskID` al acceder se comprueba que la tarea está terminada y en tal caso se descargan los fichero resultantes a output.
  - OK. Los fichero fueron descargados de GCP a la carpeta output. Se recibe un array con las URLs de los ficheros.