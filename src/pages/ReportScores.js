import React, { useState, useEffect } from 'react';
import { getRounds } from '../db';
import PuttingDashboard from '../components/PuttingDashboard';

function ReportScores() {
  const [activeRounds, setActiveRounds] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const allRounds = await getRounds();
        const active = allRounds.filter(r => r.status === 'Active');
        setActiveRounds(active);
      } catch (error) {
        console.error("Failed to load rounds:", error);
      }
    };
    loadData();
  }, []);

  return <PuttingDashboard activeRounds={activeRounds} />;
}

export default ReportScores;
