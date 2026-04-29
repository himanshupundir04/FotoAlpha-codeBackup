// ADD THIS CODE TO YOUR EXISTING Header.jsx
// Replace the upgrade button section with this updated version

import React, { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import axios from "axios";

// This component should be integrated into your existing Header.jsx
// Place this alongside your existing upgrade button
const baseURL = process.env.REACT_APP_BASE_URL;

const CoinBalanceDisplay = ({ token, onClick }) => {
  const [coinBalance, setCoinBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchCoinBalance();
      // Refresh coin balance every 30 seconds
      const interval = setInterval(fetchCoinBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchCoinBalance = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseURL}/coins/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setCoinBalance(response.data.data.availableCoins || 0);
      }
    } catch (error) {
      console.error("Error fetching coin balance:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh balance when component mounts
  const handleRefresh = () => {
    fetchCoinBalance();
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition group"
      title="View your coin balance"
    >
      <div className="relative">
        <Zap className="h-5 w-5 text-yellow-500 group-hover:scale-110 transition" />
        {coinBalance > 0 && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
        )}
      </div>

      <div className="flex flex-col items-start">
        <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
          Coins
        </span>
        <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
          {loading ? "..." : coinBalance}
        </span>
      </div>
    </button>
  );
};
   

export default Header;
