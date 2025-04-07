# SecureApplicationProject
 
Make sure to have node and npm installed, nagivate here -- https://nodejs.org/en/download, to download the node installer 

To start the backend(server) of the apllication, navigate into the server dircetory and run "node secure.js".

To start the frontend of the application, first you will need to install http-server using "npm install -g http-server", this is used to run the frontend. Once installed navigate into the frontend dircetory and run "http-server -p 5001 -a localhost".This will run the frontend on localhost using port 5001, then navigate to http://localhost:5001.

To run tests, install @playwright/test using "npm install --save-dev @playwright/test" or to install the full package use "npx playwright install". To start executing the tests, the backend and frontend must be started. Once ready, nagigate into the projects directory and run "npx playwright test"
