const express = require("express");
const app = express();
const server = require("http").createServer(app);
const cors = require("cors");
const io = require("socket.io").listen(server);

// Pour prevenir les erreur de CORS
app.use(cors());

// socket
let passengerSocket; // le socket du passager
let taxiSocket; // le socket du taxi

// pour savoir si la demande du taxi a deja été envoyé au taxi
let hasRequestATaxi = false;

// les infos du passager
let passInfo;

// Au cas où le passager se connecte en premier
function requestATaxi(taxi, info) {
  return new Promise((resolve, reject) => {
    if (taxi) {
      taxi.emit("requestTaxi", info);
      console.log("resolve", info);
      resolve(true);
    } else {
      console.log("rejected");
      reject("Ejected");
    }
  });
}
io.on("connection", socket => {
  console.log("user connected");
  console.log("taxisocket = ", taxiSocket);
  console.log("hasRequestATaxi = ", hasRequestATaxi);
  socket.on("quit", type => {
    console.log("need to quit");
    if (type === "taxi") {
      taxiSocket = null;
    } else {
      passengerSocket = null;
    }
    socket.disconnect();
  });
  socket.on("requestTaxi", passengerInfo => {
    console.log("someone is looking for a taxi | passengerInfo", passengerInfo);
    // on obtient et stocke la reference du socket du passager
    passengerSocket = socket;
    passInfo = passengerInfo;
    if (taxiSocket) {
      taxiSocket.emit("requestTaxi", passengerInfo);
      console.log("passenger has request a taxi");
      hasRequestATaxi = true;
    } else {
      hasRequestATaxi = false;
    }
  });
  socket.on("requestPassenger", async taxiLocation => {
    console.log(
      "someone is looking for a passenger | taxiLocation",
      taxiLocation
    );
    // on obtient et stocke la reference du socket du taxi
    taxiSocket = socket;

    if (passengerSocket && hasRequestATaxi) {
      // le passager a dejà envoyé sa requette au taxi
      if (taxiSocket && passInfo) {
        console.log("passInfo", passInfo);
        taxiSocket.emit("requestTaxi", passInfo);
      } else {
        console.log("no pass info");
      }
      console.log("1ère condition", taxiLocation);
      passengerSocket.emit("requestPassenger", taxiLocation);
    } else if (passengerSocket && !hasRequestATaxi && passInfo) {
      // le passager n'a pas encore evonyé sa requette au taxi
      console.log("2è condition");
      await requestATaxi(taxiSocket, passInfo);
      passengerSocket.emit("requestPassenger", taxiLocation);
    } else {
      console.log("else condition");
    }
  });
});

// lancer le serveur sur le port 4000
server.listen("4000", () => {
  console.log("App listening on Port 4000");
});
