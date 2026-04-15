import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Leaderboard from "./pages/Leaderboard";
import RoundDetails from "./pages/RoundDetails";
import Scorecard from "./pages/Scorecard";
import Admin from "./pages/Admin";
import SignIn from "./pages/SignIn";
import History from "./pages/History";
import PrivateRoute from "./components/PrivateRoute";

import LeagueStandings from "./components/LeagueStandings";
import PuttingDashboard from "./components/PuttingDashboard";
import Navigation from "./components/Navigation";
import VenueDashboard from "./pages/VenueDashboard";
import { Toaster } from "react-hot-toast";
import "./App.css";

function App() {
  //

  useEffect(() => {
    // Force dark theme globally for the new design
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-dark-bg text-white font-sans flex flex-col">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1B1B1B",
              color: "#fff",
              border: "1px solid #334155",
            },
            success: {
              iconTheme: {
                primary: "#4CBB17",
                secondary: "#1B1B1B",
              },
            },
          }}
        />
        <Navigation />

        <main className="flex-1 w-full">
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/venue" element={<VenueDashboard />} />
            <Route path="/tv" element={<VenueDashboard />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <PuttingDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <PrivateRoute>
                  <Leaderboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/history"
              element={
                <PrivateRoute>
                  <History />
                </PrivateRoute>
              }
            />
            <Route
              path="/rounds/:id"
              element={
                <PrivateRoute>
                  <RoundDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/scorecard/:roundId"
              element={
                <PrivateRoute>
                  <Scorecard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <Admin />
                </PrivateRoute>
              }
            />
            <Route path="/preview-standings" element={<LeagueStandings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
