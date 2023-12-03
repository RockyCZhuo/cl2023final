//open and connect socket
let socket = io();
let w = 900;
let h = 500;
let player;
let playerChoices = [];
//trail of choices made by player
let startNodeX = 20;
let startNodeY = h / 2;
let storyLength = 120; //with of gap of story section
let decisionLength = 120; //with of gap of decision section
let decisionNodeDiameter = 40;
let branchHeight = 120;
let trail = [];
let cameraXSpeed = 4;
let cameraYSpeed = 4;
let playerSpeed = 6;
let choiceNodeLocations = [];
let isMoving = false;
let ground, circle;
let lineScript;
let storyID, questionID, decisionID;  //accumulate each data in database
let button01, button02, button03;
let finishQuest = false;
let lastNodeY;
let historyQAInfoData = [];


socket.on("connect", () => {
  console.log("Connected");
})


// send story ID, question ID, decision ID to server and database;
// receive total readers on this question ID, and number of reader who made same choice
// ChoiceIDCount / totalQuestionReader = n%,
//show this percent to the reader/player 

window.addEventListener('load', () => {

  document.getElementById('button01').addEventListener('click', () => {
    //console.log("button 01 clicked.");
    addChoice(1);
  })

  document.getElementById('button02').addEventListener('click', () => {
    //console.log("button 02 clicked.");
    addChoice(2);
  })

  document.getElementById('button03').addEventListener('click', () => {
    //console.log("button 03 clicked.");
    addChoice(3);
  })
})

//p5 setup

function setup() {
  
  //get all questions and choices loaded
  lineScript = new QAList();   //lineScript.setQuestion[0] is question, [1][2][3] are choices.

  let canvas = createCanvas(w, h);

  player = new Sprite(startNodeX, startNodeY, 50);
  player.overlaps(allSprites);
  player.color = "pink";
  player.stroke = "red";
  player.layer = 1;
  camera.zoom = 1;

  //x,y,diameter
  circle = new Sprite(startNodeX, startNodeY, decisionNodeDiameter);
  circle.color = (153, 204, 255);
  circle.rotation = 90;
  circle.stroke = "green";
  circle.layer = 2;
  circle.overlaps(allSprites);

  //show first question and choices
  questionID = 0;
  showQuestion(questionID);
  showButtons(questionID);
}

function draw() {
  background(220);
  cameraFocus(player.x, player.y);

  showQuestion(questionID);
}

function showQuestion(QuestID) {
  let tempLine;
  if (finishQuest == true) {
    tempLine = lineScript.instruction[0];
  } else {
    tempLine = lineScript.setQuestion[QuestID];
  }
  textSize(36);
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  text(tempLine[0], w / 2, h / 4, 2 * w / 3, h / 2);
}
//update button's text
function showButtons(QuestID) {
  let tempLine = lineScript.setQuestion[QuestID];
  let btn01 = document.getElementById('button01');
  let btn02 = document.getElementById('button02');
  let btn03 = document.getElementById('button03');
  let hidden01 = btn01.getAttribute("hidden");
  let hidden02 = btn02.getAttribute("hidden");
  let hidden03 = btn03.getAttribute("hidden");

  btn01.innerHTML = tempLine[1];
  btn02.innerHTML = tempLine[2];
  btn03.innerHTML = tempLine[3];

  if (hidden01) {
    btn01.removeAttribute("hidden");
  }
  if (hidden02) {
    btn02.removeAttribute("hidden");
  }
  if (hidden03) {
    btn03.removeAttribute("hidden");
  }
}
//when last question is asked, all choices buttons should be gone
function hideButtons() {
  let btn01 = document.getElementById('button01');
  let btn02 = document.getElementById('button02');
  let btn03 = document.getElementById('button03');
  let hidden01 = btn01.getAttribute("hidden");
  let hidden02 = btn02.getAttribute("hidden");
  let hidden03 = btn03.getAttribute("hidden");

  btn01.setAttribute("hidden", "hidden");

  btn02.setAttribute("hidden", "hidden");

  btn03.setAttribute("hidden", "hidden");

}

//make new choices
function addChoice(choiceNum) {
  if (isMoving == false) {
    let tempPercent;
    let tempInt01=0;

    //send the newest choice to database
    //create the object
    let obj = {
      "questionID": playerChoices.length+1,
      "decisionID": choiceNum
    }
    //stringify the object
    let jsonData = JSON.stringify(obj);
    // send (questionID)th question, select (decisionID)th choice, the min is 1,1
    

    //fetch to route QAID, question and answer IDs of player choice
    fetch("/QAID", {
      method: 'POST',
      headers: {
        "Content-type": "application/json"
      },
      body: jsonData
    }).then(response => response.json())
      .then(data => { 
        //sent to server, and get a response 
        //console.log(data);
        historyQAInfoData = data.amountQATracker;
        console.log(historyQAInfoData);
        for(let j=1;j<4;j++){
          tempInt01+=historyQAInfoData[obj.questionID-1][j];
        }
        //  get the percentage% on this choice from database

        tempPercent = historyQAInfoData[obj.questionID-1][obj.decisionID] / tempInt01;
        console.log(tempPercent);
        playerChoices.push(choiceNum);
        tempPercent = (Math.round(tempPercent * 10000) / 100).toFixed(2);
        lineTrail(choiceNum);
        drawNewBranchBalls(choiceNum,tempPercent);
        MovePlayer(
          player.x + decisionLength,
          player.y + branchHeight * (choiceNum - 2),
          player.x + (storyLength + decisionLength),
          player.y + branchHeight * (choiceNum - 2)
        );
        //console.log(playerChoices.length);
        nextQuestion(questionID);
      })

 
  }
}


//player made a choice and the game load next question, or generate story if it is the last question
function nextQuestion(qID) {
  let totalQuestCount = lineScript.setQuestion.length;
  //console.log("totalQuestCount: " + totalQuestCount);
  if (totalQuestCount > (qID + 1)) {
    //we still have question to ask...
    questionID++;
    showQuestion(questionID);
    showButtons(questionID);
  } else {
    //this is the last question, we proceed to generate story
    hideButtons();
    finishQuest = true;
    questionID = 0;
    generateStory();
  }
}

function generateStory() {
  //
  let tempChoices = playerChoices;
}


//draw all the story lines
function lineTrail(choiceNum) {
  trail.push([decisionLength, (choiceNum - 2) * branchHeight]);
  trail.push([storyLength, 0]);
  //                 (x, y, [distance0, distance1, ...])
  if (ground) {
    ground.remove();
  }
  ground = new Sprite(startNodeX, startNodeY, trail);
  ground.overlaps(allSprites);
  ground.strokeWeight = 5;
  ground.color = "blue";
  ground.stroke = "grey";
  ground.layer = 2;
}

//draw all the decision dot along the storyline
function drawNewBranchBalls(choiceNum,historyPercent) {
  let tempNodeY = startNodeY;

  lastcircle = new Sprite(startNodeX + (playerChoices.length - 1) * (storyLength + decisionLength),
    lastNodeY,
    decisionNodeDiameter);
  lastcircle.textSize = 10;
  lastcircle.rotation = 90;
  lastcircle.text = historyPercent + lineScript.instruction[1];
  lastcircle.overlaps(allSprites);
  lastcircle.color = (153, 204, 255);
  lastcircle.stroke = "green";

  for (let i = 0; i < playerChoices.length; i++) {
    tempNodeY += (playerChoices[i] - 2) * branchHeight;
  }
  lastNodeY = tempNodeY;
  circle = new Sprite(startNodeX + playerChoices.length * (storyLength + decisionLength),
    lastNodeY,
    decisionNodeDiameter);
  circle.overlaps(allSprites);
  circle.color = (153, 204, 255);
  circle.stroke = "green";
}

//camera focus on target location
function cameraFocus(targetx, targety) {
  //camera move to target if distance between is larger than certain amount
  if (abs(targetx - camera.x) > cameraXSpeed) {
    if (targetx > camera.x) {
      camera.x += cameraXSpeed;
    } else {
      camera.x -= cameraXSpeed;
    }
  }
  if (abs(targety - camera.y) > cameraYSpeed) {
    if (targety > camera.y) {
      camera.y += cameraYSpeed;
    } else {
      camera.y -= cameraYSpeed;
    }
  }
}

//zoom out
function keyReleased() {

  if (key == 6) {
    if (camera.zoom == 0.25) {
      camera.zoom = 1;
    } else {
      camera.zoom = 0.25;
    }
  }
}

//move player's circle along the storyline
async function MovePlayer(x1, y1, x2, y2) {
  isMoving = true;
  await player.moveTo(x1, y1, playerSpeed);
  await player.moveTo(x2, y2, playerSpeed);
  isMoving = false;
}
