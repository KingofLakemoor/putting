
import { v4 as uuidv4 } from 'uuid';
import { initializeApp } from "firebase/app";
import { getFirestore, setDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "fake_api_key",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "putting-league-dev",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createMockData() {
    try {
        console.log("Creating Course...");
        const courseId = 'mock_course_1';
        await setDoc(doc(db, "putting_league_courses", courseId), {
            course_id: courseId,
            name: "Mock Putting World",
            holes: Array.from({length: 18}, (_, i) => ({hole: i+1, par: 2}))
        });

        console.log("Creating Players...");
        for (let i = 1; i <= 10; i++) {
            await setDoc(doc(db, "putting_league_players", `mock_player_${i}`), {
                player_id: `mock_player_${i}`,
                name: `Tour Player ${i}`
            });
        }

        console.log("Creating Event Rounds...");
        const eventId = 'mock_tour_event_1';
        const round1Id = 'mock_round_1';
        const round2Id = 'mock_round_2';
        const today = new Date().toISOString();

        await setDoc(doc(db, "putting_league_rounds", round1Id), {
            round_id: round1Id,
            event_id: eventId,
            name: "Mock Tour Event - Round 1",
            date: today,
            location: "Mock Putting World",
            course_id: courseId,
            status: "completed",
            round_format: "Tour",
            number_of_rounds: 2
        });

        await setDoc(doc(db, "putting_league_rounds", round2Id), {
            round_id: round2Id,
            event_id: eventId,
            name: "Mock Tour Event - Round 2",
            date: today,
            location: "Mock Putting World",
            course_id: courseId,
            status: "completed",
            round_format: "Tour",
            number_of_rounds: 2
        });

        console.log("Submitting Round 1 Scores...");
        for (let i = 1; i <= 10; i++) {
            const playerId = `mock_player_${i}`;
            const scoreId = `score_r1_${playerId}`;

            if (i === 10) {
                // Player 10 is DNF
                await setDoc(doc(db, "putting_league_scores", scoreId), {
                    score_id: scoreId,
                    round_id: round1Id,
                    event_round_id: round1Id,
                    player_id: playerId,
                    status: 'DNF',
                    timestamp: new Date().toISOString()
                });
            } else {
                await setDoc(doc(db, "putting_league_scores", scoreId), {
                    score_id: scoreId,
                    round_id: round1Id,
                    event_round_id: round1Id,
                    player_id: playerId,
                    score: 35 + i,
                    timestamp: new Date().toISOString()
                });
            }
        }

        console.log("Submitting Round 2 Scores...");
        for (let i = 1; i <= 9; i++) {
            const playerId = `mock_player_${i}`;
            const scoreId = `score_r2_${playerId}`;

            await setDoc(doc(db, "putting_league_scores", scoreId), {
                score_id: scoreId,
                round_id: round2Id,
                event_round_id: round2Id,
                player_id: playerId,
                score: 35 + i,
                timestamp: new Date().toISOString()
            });
        }

        console.log("Mock data created successfully!");
        process.exit(0);

    } catch (e) {
        console.error("Error creating mock data:", e);
        process.exit(1);
    }
}

createMockData();
