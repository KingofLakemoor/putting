# Coordinator Operating Guide

Welcome to the Putting League! As a **Coordinator**, you have elevated privileges to manage the league's day-to-day operations, ensure scores are accurate, handle seasonal transitions, and manage the player roster.

This guide will walk you through your core responsibilities using the **Admin Dashboard**.

---

## 1. Accessing the Admin Dashboard

To access the administrative tools:
1. Log in to the application using your authorized Coordinator account.
2. Navigate to the Admin Dashboard (usually accessible via the navigation menu or the `/admin` route).
3. If you are authorized, you will see a screen with the following tabs:
   * **Manage Players**
   * **Manage Events**
   * **Manage Scores**

*(Note: The "Manage Courses" and "Manage Coordinators" tabs are restricted to Administrators only.)*

---

## 2. Managing Players

The **Manage Players** tab allows you to maintain the league's roster.

### Adding a New Player
When a new player joins the league:
1. Navigate to the **Manage Players** tab.
2. Under "Add New Player", enter the player's **First Name** and **Last Name**.
   * *Note:* The system automatically formats the display name (e.g., "John Doe" becomes "John D.").
3. (Optional) Enter their **Email**.
4. (Optional) Provide a **Firebase UID**. If the player hasn't created an account yet, you can leave this blank or click the refresh icon (↻) to generate a placeholder UUID.
5. Click **Add Player**.

### Editing or Deleting a Player
* **Edit:** Locate the player in the "Players List" table and click **Edit**. You can update their name, email, or UID, then click **Update Player**.
* **Delete:** Click **Delete** next to a player's name. **Warning:** Deleting a player will permanently delete all associated scores for that player.
* **Generate Missing UIDs:** If you have added multiple players without UIDs, you can click the **Generate Missing UIDs** button at the top of the list to automatically assign placeholder UIDs to them.

---

## 3. Managing Events & Seasons (Annual Tasks)

The **Manage Events** tab is crucial for setting up events and handling the transition between different seasons or years.

### Creating a New Event
To schedule a new league event:
1. Navigate to the **Manage Events** tab.
2. Under "Create New Event", enter a descriptive **Event Name** (e.g., "Summer League - Week 1").
3. Select the **Date** of the event.
4. Choose the **Location / Venue** from the dropdown list.
5. Choose the **Event Format** (Open, Cut Down, Match Play, Tour).
   * Depending on the format, you may need to specify additional parameters like the **Cut Line** or **Number of Rounds**.
   * Note that multi-round formats like "Cut Down" and "Tour" will automatically generate multiple individual round templates linked to the single parent Event when you specify the "Number of Rounds".
6. Click **Create Event**.

### Managing Existing Events
In the events table, you can update the details of any event round:
* **Assign Season:** Type the name of the season (e.g., "Summer 2024" or "2024 Annual") into the input box and click outside the box to save. This groups rounds together for leaderboards.
* **Change Status:** Use the dropdown to update the status:
  * `Active`: The event round is currently ongoing and open for scoring.
  * `Completed`: The event round is finished, and final scores are recorded. Changing status to completed will also automatically trigger cup point distribution unless it's an "Open" format event.
  * `Archived`: The event round is closed and hidden from standard active views.
* **Manage/Delete:** You can click **Manage** to view specific details or **Delete** to remove the event round and all its associated scores.

### Annual Rollover & Season Settings
When a season ends and a new one begins, you need to update the global settings:
1. **Live Season:** Use the "Live Season" dropdown to select the current, active season. This setting determines which season's data is displayed by default on the main dashboard and leaderboards.
2. **Archive Seasons:** When a season is completely finished (e.g., at the end of the year), locate it in the "Archive Seasons" list and click **Archive**.
   * Archiving a season hides its individual rounds from public leaderboard dropdown filters, restricting users to viewing only the overall aggregated standings for that complete season.
   * You can view archived rounds in your admin table by clicking **View Archived Rounds**.

---

## 4. Managing Scores

The **Manage Scores** tab allows you to review, correct, and input all submitted scores across the league.

### Checking and Correcting Scores
If a player submitted an incorrect score or needs an adjustment:
1. Navigate to the **Manage Scores** tab.
2. Locate the specific score record in the table. You can identify it by the Round details and the Player's name.
3. Click **Edit**.
4. Change the score value in the input box.
5. Click **Save** to confirm the change.

### Deleting Invalid Scores
If a score was submitted in error (e.g., a duplicate entry or test score):
1. Locate the score in the table.
2. Click **Delete**.
3. Confirm the deletion when prompted.

---

## 5. Determining the Winner

To determine the winner of a specific round or an entire season, you will use the public-facing **Leaderboard** and **Dashboard** rather than the Admin panel.

1. Navigate to the **Leaderboard** page.
2. Use the filters at the top of the page to select the specific **Season** or **Round** you want to view.
3. The leaderboard will automatically aggregate the scores, calculate averages, and sort the players based on the lowest total score or lowest average relative to par.
4. The player ranked #1 at the end of the season is your winner!

*(Note: Remember that in golf scoring, a lower score is better. Players with a negative score relative to par are under par.)*
