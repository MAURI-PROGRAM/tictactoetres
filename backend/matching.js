const game = require("./gameState");

module.exports = () => {
	let players = {},
		onWait = [],
		onMatch = {};

	const loop = setInterval(checkQueue, 5000);

	function printListStatus() {
		console.info(`Queues:{ Players: ${Object.keys(players).length}, Onwait: ${onWait.length}; OnMatch: ${Object.keys(onMatch).length}; }`)
	}

	function checkQueue() {
		printListStatus();
		while (onWait.length >= 2) {
			console.log("Constructing room...");
			/**
			 * 
			 * Reemplazar este bloque
			 * 
			 */
			const p1 = onWait.pop();
			const p2 = onWait.pop();
			console.log(`We created a match for ${players[p1].user.name} and ${players[p2].user.name}`);
			createMathc(p1,p2);
		}
	}
	
	
	function createMathc(p1ID,p2ID){
		const roomId = p1ID+p2ID;
		players[p1ID].roomID =roomId;
		players[p2ID].roomID =roomId;

		if(!onMatch[roomId]) onMatch[roomId]=game.newGame({
			players:[players[p1ID],players[p2ID]],
			roomId
		});
		players[p1ID].socket.emit("gameState",game.newGame({
			players:[players[p1ID],players[p2ID]],
			roomId,
			playerId:0,
			opponentId:1,
		}));
		players[p2ID].socket.emit("gameState",game.newGame({
			players:[players[p1ID],players[p2ID]],
			roomId,
			playerId:1,
			opponentId:0,
		}));

	}

	return {
		// user: {socket, user}
		userConnect: ({ socket, user }) => {
			if (!players[socket.id]) {
				// Add to player list
				players[socket.id] = { user, socket };
				// Add to waiting list
				onWait.push(socket.id);
			}
		},
		clear: () => clearInterval(loop),
		userDisconnect: (id) => {
			// Close ongoing game related to player if any
			console.log("On disconnect", id);
			if (players[id].roomID && onMatch[players[id].roomID]) {
				const roomID = players[id].roomID;
				// Put all players back on onWait
				onMatch[roomID].players.map(player => onWait.push(player.id));
				// Delete match room
				delete onMatch[players[id].roomID];
				// If the object gets deleted, reset it
				if (!onMatch) onMatch = {};
			}
			// Delete all instances of disconnecting player from waiting list (if any)
			onWait = onWait.filter(el => el !== id);
			// Delete from players list
			if (players[id]) {
				delete players[id];
				if (!players) players = {};
			}
		},
	}
};