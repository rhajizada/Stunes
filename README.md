# Stunes App
Allows user to download all his playlists from Spotify as CSV files

# App Schema
App consists of server backend and frontend wriiten using svelte

# Frontend
SvelteJS part of actual website is located at src directory  and html page with other components is located in public directory.

# Backend
Server part is located in server.js file.

# Install and Run
In order to run this application you have to create app in Spotify Developer Dashboard and get the Client ID and Client Secret. Then create .env file in root directory of project and enter data in it:
```
PORT = ${e.g 4000}
IP = ${e.g localhost:4000}
ClientID = ${your Client ID}
ClientSecret = ${your Client Secret}
```

In order to install all the packages run the following command:
``npm install``

You can build Svelte app using following command
``npm run-script build``

You can run the app in development mode by running following command:
``npm run dev``

You can run production version by running following command:
``npm start``
