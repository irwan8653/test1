import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  get,
} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCXU7oqo3m3ry7om9qQ5zfOGTu-mL_YOrc",
  authDomain: "realtime-database-99f23.firebaseapp.com",
  databaseURL: "https://realtime-database-99f23-default-rtdb.firebaseio.com",
  projectId: "realtime-database-99f23",
  storageBucket: "realtime-database-99f23.firebasestorage.app",
  messagingSenderId: "642043922874",
  appId: "1:642043922874:web:4df5d383e2867bcd2cf583"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function App() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [opponentId, setOpponentId] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [status, setStatus] = useState("Masukkan nama dan room");
  const [gameStarted, setGameStarted] = useState(false);

  function joinRoom() {
    const roomRef = ref(db, `rooms/${roomCode}`);
    get(roomRef).then((snapshot) => {
      const data = snapshot.val() || {};
      const keys = Object.keys(data);
      if (keys.length >= 2) return alert("Room penuh!");
      const id = keys.includes("player1") ? "player2" : "player1";
      const enemy = id === "player1" ? "player2" : "player1";
      setPlayerId(id);
      setOpponentId(enemy);
      set(ref(db, `rooms/${roomCode}/${id}`), {
        name: playerName,
        move: null,
        score: 0,
      });
      setGameStarted(true);
      listenRoom(roomCode, id, enemy);
    });
  }

  function listenRoom(room, me, enemy) {
    const roomRef = ref(db, `rooms/${room}`);
    onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      const myData = data[me];
      const enemyData = data[enemy];
      if (!enemyData) return setStatus("Menunggu lawan...");
      setOpponentName(enemyData.name);
      setMyScore(myData.score || 0);
      setOpponentScore(enemyData.score || 0);

      if (myData.move && enemyData.move) {
        const result = checkWinner(myData.move, enemyData.move);
        if (result === "draw") {
          setStatus(`Seri! (${myData.move} vs ${enemyData.move})`);
        } else if (result === myData.move) {
          setStatus("Kamu menang!");
          set(ref(db, `rooms/${room}/${me}/score`), (myData.score || 0) + 1);
        } else {
          setStatus("Kamu kalah!");
          set(ref(db, `rooms/${room}/${enemy}/score`), (enemyData.score || 0) + 1);
        }
        setTimeout(() => {
          update(ref(db, `rooms/${room}/${me}`), { move: null });
          update(ref(db, `rooms/${room}/${enemy}`), { move: null });
          setStatus("Pilih lagi!");
        }, 3000);
      }
    });
  }

  function makeMove(choice) {
    if (!roomCode || !playerId) return;
    set(ref(db, `rooms/${roomCode}/${playerId}/move`), choice);
    setStatus("Menunggu lawan...");
  }

  function checkWinner(a, b) {
    if (a === b) return "draw";
    if (
      (a === "batu" && b === "gunting") ||
      (a === "gunting" && b === "kertas") ||
      (a === "kertas" && b === "batu")
    ) return a;
    return b;
  }

  return (
    <div className="max-w-md mx-auto p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">🪨✂️📄 Batu Gunting Kertas</h1>

      {!gameStarted ? (
        <>
          <input
            className="border p-2 m-2 w-full"
            placeholder="Nama kamu"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <input
            className="border p-2 m-2 w-full"
            placeholder="Kode room"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white p-2 px-6 rounded"
            onClick={joinRoom}
          >
            Gabung Room
          </button>
        </>
      ) : (
        <>
          <p className="mb-2">👤 Kamu: {playerName} vs 👥 {opponentName || "..."}</p>
          <div className="space-x-2 my-4">
            <button onClick={() => makeMove("batu")}>🪨</button>
            <button onClick={() => makeMove("gunting")}>✂️</button>
            <button onClick={() => makeMove("kertas")}>📄</button>
          </div>
          <p className="font-semibold">{status}</p>
          <div className="mt-4">
            <p>Skor Kamu: {myScore}</p>
            <p>Skor Lawan: {opponentScore}</p>
          </div>
        </>
      )}
    </div>
  );
}