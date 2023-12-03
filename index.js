const PORT = process.env.PORT || 3000;
//creating the express app
let express = require("express");
let app = express();

//DB - 1 - connect to the mongoDB

const { Database } = require("quickmongo");
const db = new Database(process.env.MONGODB-URL);
db.on("ready", () => {
  console.log("Connected to the database");
});
db.connect();

//creating the http server 
let http = require("http");
let server = http.createServer(app);

//inititalize socket.io
let io = require("socket.io");
io = new io.Server(server);

app.use("/", express.static("public"));
app.use(express.json());

let amountQATracker = [];
//this amount of each question's choices data should be in this form
//[
//  {
//1:5;
//2:2;
//3:7;
//},
//  {
//1:5;
//2:2;
//3:7;
//}
//]



//2. add a route on server, that is listening for a post request
app.post('/QAID',(req,res)=>{
  //req.body is 
  //    "questionID": playerChoices.length,
  //    "decisionID": choiceNum
  // send (questionID)th question, select (decisionID)th choice, the min is 1,1
      
//DB - fetch from the DB
db.get("totalQAHistoryData").then(historyData =>{
  let tempqID = req.body.questionID;
  let tempdID = req.body.decisionID;

  console.log(historyData);
  //get history data from database
  if(historyData == null){
    amountQATracker = [];
    console.log("no history data in database");

    if(amountQATracker.length >= tempqID){
      amountQATracker[tempqID-1][tempdID] += 1; 
    }else{
      let amountQATrackerIns = {
        1:0,
        2:0,
        3:0
      }
      amountQATracker.push(amountQATrackerIns);
      amountQATracker[tempqID-1][tempdID] += 1; 
      //amountQATracker here is the real data needs to be stored
  
      //DB - add value to the DB
      db.push("totalQAHistoryData",amountQATracker);
    }
  }else{
    //there are existing history data in database
    amountQATracker = historyData;

    if(amountQATracker.length >= tempqID){
      amountQATracker[tempqID-1][tempdID] += 1; 
    }else{
      let amountQATrackerIns = {
        1:0,
        2:0,
        3:0
      }
       //amountQATracker here is the real data needs to be stored
      amountQATracker.push(amountQATrackerIns);
      amountQATracker[tempqID-1][tempdID] += 1; 
     
    }    
          //DB - add value to the DB
          console.log(amountQATracker);
          db.set("totalQAHistoryData",amountQATracker);
  }


  //all data saved
  res.json({
    task:"success",
    amountQATracker
  });

})


})


// Listen for a new connection
io.sockets.on("connect", (socket) => {
  console.log("Connection : ", socket.id);
//in case of disconnection
socket.on("disconnect", () => {
  console.log("Disconnection : ", socket.id);
})
})

//run the app on port
server.listen(PORT, () => {
  console.log("server on port ", PORT);
})


//1. setting up sockets
//    -√ setting up an http server
//    -√ setting up socket.io

//2. Ensure that the client can connect to the server via sockets
//    - server recognize the connect
//    - client attempting to connect
    
//3. client draws and sends to server

//4. server receives and sends to all the clients

//5. Clients rx and draw on their screen