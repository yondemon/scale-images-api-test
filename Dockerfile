FROM node

RUN mkdir -p /opt/app
WORKDIR /opt/app

COPY ./wait-for.sh .

COPY ./api/package*.json .
RUN npm install
# RUN npm install --quiet

RUN npm install nodemon -g --quiet

EXPOSE 3200

# CMD nodemon -L --watch . api/index.js