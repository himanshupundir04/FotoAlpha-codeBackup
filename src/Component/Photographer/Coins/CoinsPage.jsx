import React, { useState, useEffect, useContext } from "react";
import { Coins, TrendingUp, TrendingDown, Download } from "lucide-react";
import axios from "axios";
import CoinPurchaseModal from "../../CoinPurchase/CoinPurchaseModal";
import { PhotographerEventContext } from "../Context/PhotographerEventContext";

const baseURL = process.env.REACT_APP_BASE_URL;

const CoinsPage = () => {
  const [coinBalance, setCoinBalance] = useState({
    totalCoins: 0,
    earnedCoins: 0,
    usedCoins: 0,
    availableCoins: 0,
  });
  const [coinHistory, setCoinHistory] = useState([]);
  const [statistics, setStatistics] = useState({
    totalEarned: 0,
    totalUsed: 0,
    available: 0,
    coinsValue: 0,
    referralStats: {
      generatedReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [filterType, setFilterType] = useState("all");
  const {setCoinsglobal} = useContext(PhotographerEventContext)

  useEffect(() => {
    fetchCoinData();
  }, [currentPage, filterType]);

  const fetchCoinData = async () => {
    try {
      setLoading(true);

      // Fetch coin balance
      const balanceResponse = await axios.get(`${baseURL}/coins/balance`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (balanceResponse.data.success) {
        setCoinBalance(balanceResponse.data.data);
        setCoinsglobal(balanceResponse.data.data.availableCoins)
      }

      // Fetch coin history
      const historyResponse = await axios.get(
        `${baseURL}/coins/history?limit=20&skip=${currentPage * 20}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (historyResponse.data.success) {
        let filteredHistory = historyResponse.data.data;
        if (filterType !== "all") {
          filteredHistory = filteredHistory.filter((h) => h.type === filterType);
        }
        setCoinHistory(filteredHistory);
      }

      // Fetch statistics
      const statsResponse = await axios.get(`${baseURL}/coins/statistics`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (statsResponse.data.success) {
        setStatistics(statsResponse.data.data);
      }
    } catch (error) {
      console.error("Error fetching coin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage =
    coinBalance.totalCoins > 0
      ? ((coinBalance.usedCoins / coinBalance.totalCoins) * 100).toFixed(1)
      : 0;

  // Redeem modal state
  const [showRedeem, setShowRedeem] = useState(false);
  const [tiers, setTiers] = useState([]);
  const [selectedTier, setSelectedTier] = useState(null);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState(null);
  const [userSubscription, setUserSubscription] = useState(null);

  const openRedeemModal = async () => {
    setRedeemMessage(null);
    setSelectedTier(null);
    setShowRedeem(true);

    try {
      // Fetch tiers
      const tiersResponse = await axios.get(`${baseURL}/offers/tiers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (tiersResponse.data.success) {
        setTiers(tiersResponse.data.data.tiers);
      }

      // Fetch user's active subscription
      const subResp = await axios.get(`${baseURL}/mysubscriptions/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (subResp.data.success && subResp.data.data) {
        setUserSubscription(subResp.data.data);
      } else {
        setUserSubscription(null);
      }
    } catch (error) {
      console.error('Error opening redeem modal:', error);
      setRedeemMessage({ type: 'error', text: 'Failed to load redemption details. Try again later.' });
    }
  };

  const closeRedeemModal = () => {
    setShowRedeem(false);
    setTiers([]);
    setSelectedTier(null);
    setRedeemLoading(false);
    setRedeemMessage(null);
  };

  const handleRedeem = async () => {
    if (!selectedTier) {
      setRedeemMessage({ type: 'error', text: 'Please select a redemption tier.' });
      return;
    }

    if (!userSubscription || !userSubscription.razorpay_subscription_id) {
      setRedeemMessage({ type: 'error', text: 'No active subscription found. You can attach offers only to existing subscriptions.' });
      return;
    }

    setRedeemLoading(true);
    setRedeemMessage(null);

    try {
      // Call orchestration endpoint to validate -> lock -> create -> attach
      const resp = await axios.post(
        `${baseURL}/offers/redeem-and-attach`,
        { coins: selectedTier.coins, subscriptionId: userSubscription?.razorpay_subscription_id || null },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (!resp.data.success) {
        throw new Error(resp.data.error || 'Redeem failed');
      }

      setRedeemMessage({ type: 'success', text: `Offer created and attached to subscription. ${selectedTier.coins} coins will be applied on next payment.` });

      // Refresh data
      await fetchCoinData();
    } catch (error) {
      console.error('Redeem error:', error);
      setRedeemMessage({ type: 'error', text: error.response?.data?.error || error.message || 'Redeem failed' });
    } finally {
      setRedeemLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-start">

      {/* Coin Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Coins */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Coins
            </p>
            <Coins className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {coinBalance.totalCoins}
          </p>
        </div>

        {/* Available Coins */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Available
            </p>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {coinBalance.availableCoins}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            ₹{coinBalance.availableCoins}
          </p>
        </div>

        {/* Used Coins */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Used
            </p>
            <TrendingDown className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {coinBalance.usedCoins}
          </p>
        </div>

        {/* Rupee Value */}
        <div className="bg-gradient-to-br from-blue/5 to-blue/10 dark:from-blue/20 dark:to-blue/10 rounded-2xl p-6 border border-blue/20 dark:border-blue/30">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Value
            </p>
            <span className="text-lg font-bold text-blue">₹</span>
          </div>
          <p className="text-3xl font-bold text-blue dark:text-blue-400">
            ₹{statistics.coinsValue}
          </p>
        </div>
      </div>

      {/* Redemption Options */}
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 rounded-3xl p-6 border border-blue-200 dark:border-slate-700/50 shadow-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            🎁 Redeem Your Coins
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Choose from amazing features to enhance your photography experience
          </p>
        </div>
        
        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Photo Uploads Card */}
          <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-blue-200/50 dark:border-slate-600/50 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
            onClick={() => {
              const element = document.getElementById('coin-purchase-modal');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="text-3xl mb-2">📸</div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">Photo Uploads</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Add more photos to your sessions</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">50-500 photos</span>
              <span className="text-lg font-bold text-blue-600">→</span>
            </div>
          </div>

          {/* Storage Card */}
          <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-purple-200/50 dark:border-slate-600/50 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
            onClick={() => {
              const element = document.getElementById('coin-purchase-modal');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="text-3xl mb-2">💾</div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">Storage Space</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Expand your cloud storage</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">1-5 GB extra</span>
              <span className="text-lg font-bold text-purple-600">→</span>
            </div>
          </div>

          {/* Events Card */}
          <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-green-200/50 dark:border-slate-600/50 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
            onClick={() => {
              const element = document.getElementById('coin-purchase-modal');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="text-3xl mb-2">🎉</div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">Event Slots</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Create more events & sessions</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-green-600 dark:text-green-400">5-25 events</span>
              <span className="text-lg font-bold text-green-600">→</span>
            </div>
          </div>

          {/* Team Members Card */}
          <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-orange-200/50 dark:border-slate-600/50 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
            onClick={() => {
              const element = document.getElementById('coin-purchase-modal');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">Team Members</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Invite collaborators to work</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">1-5 members</span>
              <span className="text-lg font-bold text-orange-600">→</span>
            </div>
          </div>
        </div>
      </div>

      {/* Coin Purchase & Usage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coin Purchase Modal Section */}
        <div id="coin-purchase-modal">
          <CoinPurchaseModal fetchCoinData={fetchCoinData}/>
        </div>

        {/* Coin Usage Progress */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-lg">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Coin Usage
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Progress
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {coinBalance.usedCoins} / {coinBalance.totalCoins} coins
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>0</span>
              <span>{progressPercentage}%</span>
              <span>{coinBalance.totalCoins}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Stats */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-lg">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
          Referral Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Generated Referrals
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {statistics.referralStats.generatedReferrals}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Completed Referrals
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {statistics.referralStats.completedReferrals}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Pending Referrals
            </p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
              {statistics.referralStats.pendingReferrals}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-700/50 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Transaction History
          </h2>

          {/* Redeem Button */}
          <div className="flex flex-wrap mt-2 md:mt-2 items-center gap-3">
            <button
              onClick={() => openRedeemModal()}
              disabled={loading || coinBalance.availableCoins <= 0}
              className={`px-3 py-2 rounded-md text-sm font-medium transition bg-yellow-400 hover:bg-yellow-500 text-white shadow ${
                loading || coinBalance.availableCoins <= 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Redeem Coins
            </button>

            {/* Filter */}
            <div className="flex flex-wrap gap-2">
              {["all", "earned", "redeemed", "refunded"].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setFilterType(type);
                    setCurrentPage(0);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    filterType === type
                      ? "bg-blue text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {coinHistory.length === 0 ? (
          <div className="text-center py-12">
            <Coins className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">
              No transactions yet
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {coinHistory.map((transaction) => (
              <div
                key={transaction.createdAt}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`flex items-center justify-center h-10 w-10 rounded-full ${
                      transaction.type === "earned"
                        ? "bg-green-100 dark:bg-green-900/30"
                        : transaction.type === "redeemed"
                          ? "bg-orange-100 dark:bg-orange-900/30"
                          : "bg-blue-100 dark:bg-blue-900/30"
                    }`}
                  >
                    {transaction.type === "earned" ? (
                      <TrendingUp
                        className={`h-5 w-5 ${
                          transaction.type === "earned"
                            ? "text-green-600"
                            : "text-blue-600"
                        }`}
                      />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-orange-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 break-all dark:text-white">
                      {transaction.description || "Transaction"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(transaction.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-lg font-bold ${
                    transaction.type === "earned"
                      ? "text-green-600 dark:text-green-400"
                      : "text-orange-600 dark:text-orange-400"
                  }`}
                >
                  {transaction.type === "earned" ? "+" : "-"}
                  {transaction.amount}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {coinHistory.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-3 py-1 rounded text-sm bg-slate-100 dark:bg-slate-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Page {currentPage + 1}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-3 py-1 rounded text-sm bg-slate-100 dark:bg-slate-700"
            >
              Next
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default CoinsPage;
