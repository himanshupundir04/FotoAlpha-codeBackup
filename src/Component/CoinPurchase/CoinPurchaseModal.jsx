import React, { useState, useEffect } from "react";
import axios from "axios";
import { ShoppingCart, Zap, HardDrive, Calendar, Users, Package } from "lucide-react";

const baseURL = process.env.REACT_APP_BASE_URL;

const CoinPurchaseModal = ({ fetchCoinData }) => {
  const [features, setFeatures] = useState({});
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [activeTab, setActiveTab] = useState("purchase"); // 'purchase' or 'history'

  useEffect(() => {
    fetchFeatures();
    if (activeTab === "history") {
      fetchPurchases();
    }
  }, [activeTab]);

  const fetchFeatures = async () => {
    try {
      const res = await axios.get(`${baseURL}/coin-purchases/features`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (res.data.success) {
        setFeatures(res.data.data);
        // Select first feature by default
        const firstFeature = Object.keys(res.data.data)[0];
        setSelectedFeature(firstFeature);
      }
    } catch (error) {
      console.error("Error fetching features:", error);
      setMessage({
        type: "error",
        text: "Failed to load available features",
      });
    }
  };

  const fetchPurchases = async () => {
    try {
      const res = await axios.get(`${baseURL}/coin-purchases/my-purchases`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (res.data.success) {
        setPurchases(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
    }
  };

  const handlePurchase = async () => {
    if (!selectedFeature || !selectedOption) {
      setMessage({ type: "error", text: "Please select an option" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await axios.post(
        `${baseURL}/coin-purchases/purchase`,
        {
          feature_type: selectedFeature,
          coins: selectedOption.coins || selectedOption,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (res.data.success) {
        fetchCoinData()
        setMessage({
          type: "success",
          text: `✓ Successfully purchased ${res.data.data.purchase.description}!`,
        });

        // Reset selections
        setSelectedOption(null);

        // Refresh purchases
        fetchPurchases();

        // Auto-close after 3 seconds
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const getFeatureIcon = (featureType) => {
    const icons = {
      photo_uploads: <Package className="h-5 w-5" />,
      storage: <HardDrive className="h-5 w-5" />,
      events: <Calendar className="h-5 w-5" />,
      team_members: <Users className="h-5 w-5" />,
    };
    return icons[featureType] || <ShoppingCart className="h-5 w-5" />;
  };

  const getFeatureLabel = (featureType) => {
    const labels = {
      photo_uploads: "Photo Uploads",
      storage: "Storage Space",
      events: "Event Slots",
      team_members: "Team Members",
    };
    return labels[featureType] || featureType;
  };

  const featureOptions = selectedFeature ? features[selectedFeature] : {};

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
          Redeem Coins for Features
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Convert coins into useful features
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab("purchase")}
          className={`pb-2 px-3 text-sm font-medium transition ${
            activeTab === "purchase"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
          }`}
        >
          Purchase
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-2 px-3 text-sm font-medium transition ${
            activeTab === "history"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
          }`}
        >
          Purchase History
        </button>
      </div>

      {/* Purchase Tab */}
      {activeTab === "purchase" && (
        <div className="space-y-4">
          {/* Feature Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Feature Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(features).filter(f => f !== 'subscription_discount').map((featureType) => (
                <button
                  key={featureType}
                  onClick={() => {
                    setSelectedFeature(featureType);
                    setSelectedOption(null);
                  }}
                  className={`p-2 rounded-lg border transition flex items-center gap-1.5 text-xs ${
                    selectedFeature === featureType
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-blue-300"
                  }`}
                >
                  {getFeatureIcon(featureType)}
                  <span className="font-medium">
                    {getFeatureLabel(featureType)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Option Selection */}
          {selectedFeature && Object.keys(featureOptions).length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select Package
              </label>
              <div className="space-y-1.5">
                {Object.entries(featureOptions).map(([coinAmount, option]) => (
                  <button
                    key={coinAmount}
                    onClick={() => setSelectedOption(option)}
                    className={`w-full p-2.5 rounded-lg border transition text-left text-xs ${
                      selectedOption?.coins === parseInt(coinAmount) ||
                      selectedOption?.coins === option.coins
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {option.description}
                        </p>
                        {option.quantity && (
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {option.quantity} {option.unit}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600 dark:text-blue-400">
                          {option.coins || coinAmount}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          coins
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div
              className={`p-2.5 rounded text-xs ${
                message.type === "success"
                  ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                  : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Purchase Button */}
          <button
            onClick={handlePurchase}
            disabled={!selectedFeature || !selectedOption || loading}
            className={`w-full py-2.5 rounded-lg text-sm font-bold transition ${
              !selectedFeature || !selectedOption || loading
                ? "bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-400 cursor-not-allowed"
                : "bg-blue hover:bg-blue active:bg-blue-800 text-white shadow-md hover:shadow-lg"
            }`}
          >
            {loading ? "Processing..." : "Redeem Coins"}
          </button>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div>
          {purchases.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                No purchases yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {purchase.description}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {new Date(purchase.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        purchase.status === "confirmed"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                      }`}
                    >
                      {purchase.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-1 pt-1 border-t border-slate-200 dark:border-slate-600">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Coins
                      </p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {purchase.coins_spent}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Quantity
                      </p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {purchase.quantity} {purchase.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Remaining
                      </p>
                      <p className="font-semibold text-blue-600 dark:text-blue-400">
                        {purchase.remaining} {purchase.unit}
                      </p>
                    </div>
                  </div>

                  {purchase.is_expired && (
                    <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-300">
                      This purchase has expired
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CoinPurchaseModal;
