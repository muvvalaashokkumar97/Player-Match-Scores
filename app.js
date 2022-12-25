const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(8080, () => {
      console.log(dbPath);
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.get("/players/", async (request, response) => {
  const getAllStates = `select * from player_details;`;
  const queryResult = await db.all(getAllStates);
  const players = queryResult.map((player) => {
    return {
      playerId: player["player_id"],
      playerName: player["player_name"],
    };
  });
  response.send(players);
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const queryResult = `select * from player_details where player_id = ${playerId};`;
  const getPlayer = await db.get(queryResult);
  response.send({
    playerId: getPlayer.player_id,
    playerName: getPlayer.player_name,
  });
  //   console.log(getPlayer);
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const queryResult = `
  update player_details 
  set 
  player_name='${playerName}'
  where player_id = ${playerId};`;
  await db.run(queryResult);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const queryResult = `
  select * from match_details where match_id = ${matchId}`;
  const matchDetails = await db.get(queryResult);
  response.send({
    matchId: matchDetails.match_id,
    match: matchDetails.match,
    year: matchDetails.year,
  });
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const queryResult = `select * from player_match_score inner join match_details on player_match_score.match_id = match_details.match_id where player_match_score.player_id = ${playerId}`;
  const getPlayers = await db.all(queryResult);
  const matchDetails = getPlayers.map((playerMatch) => {
    return {
      matchId: playerMatch.match_id,
      match: playerMatch.match,
      year: playerMatch.year,
    };
  });
  response.send(matchDetails);
});

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const queryResult = `select * from player_details inner join player_match_score on player_details.player_id = player_match_score.player_id where player_match_score.match_id = ${matchId}`;
  const getPlayers = await db.all(queryResult);
  const playerDetails = getPlayers.map((player) => {
    return {
      playerId: player.player_id,
      playerName: player.player_name,
    };
  });
  response.send(playerDetails);
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const queryResult = `select
      player_details.player_id as playerId,
      player_details.player_name as playerName,
      sum(score),
      sum(fours),
      sum(sixes)
      from player_details inner join player_match_score on player_details.player_id = player_match_score.player_id
      where player_details.player_id = ${playerId}`;
  const getPlayerScores = await db.get(queryResult);
  response.send({
    playerId: getPlayerScores.playerId,
    playerName: getPlayerScores.playerName,
    totalScore: getPlayerScores["sum(score)"],
    totalFours: getPlayerScores["sum(fours)"],
    totalSixes: getPlayerScores["sum(sixes)"],
  });
});

module.exports = app;
