1. **Add `score_limit` setting in `src/pages/Admin.jsx`**
   - In `AdminRounds` component, add a new state `scoreLimit` initialized to an empty string.
   - Update `handleSubmit` to include `score_limit: scoreLimit ? parseInt(scoreLimit, 10) : null` when creating a new round.
   - Add an input field for `score_limit` in the "Create New Round" form in `AdminRounds`.
   - Clear `scoreLimit` after form submission.
2. **Update round rendering in `AdminRounds` table to display the score limit (optional but good for visibility)**
   - Display the score limit in the Rounds Management table, perhaps under the Name or Date column.
3. **Enforce `score_limit` in `src/components/PuttingDashboard.jsx`**
   - Import `getScoresForRound` from `../db.js`.
   - In `handleSelectEventRound`, before calling `createActiveRound`, check if `eventRound.score_limit` is set.
   - If set, fetch scores for the current user and this `eventRound.round_id`.
   - The user might have completed scores (`putting_league_scores` where `round_id` matches and `player_id` matches) AND active rounds (`putting_league_rounds` where `event_round_id` matches and `player_id` matches and status is active).
   - Actually, a better approach is to just fetch the user's past scores for that event round: `getScoresForRound(eventRound.round_id)`. Filter by `player_id === currentUser.uid` (or `player_id === actualId`). If the count of previous scores is `>= eventRound.score_limit`, show an error message and do not create the active round. Also, we need to consider if there are currently *active* rounds the user is playing for this event. Wait, `getActiveRoundForUser` only allows 1 active round at a time globally anyway, but we should make sure they can't start if they already hit the limit.
   - Let's refine the check: When the user clicks "START ROUND" or "SCORE" on an event, we check `eventRound.score_limit`.
   - Let's fetch the actual player ID using `getActualPlayerId` from `../db.js`? Wait, `getScoresForPlayer` returns all scores for a player. We can filter those where `round_id === eventRound.round_id`.
   - If `scores.filter(s => s.round_id === eventRound.round_id).length >= eventRound.score_limit`, show an alert or set an error state and block entry.
4. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
5. **Submit changes**
