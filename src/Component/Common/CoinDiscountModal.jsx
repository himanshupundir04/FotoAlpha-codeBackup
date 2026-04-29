import React, { useState, useEffect } from "react";
import { X, Zap } from "lucide-react";
import axios from "axios";

const CoinDiscountModal = ({ isOpen, onClose, planId, planPrice, token, onApply }) => {
  const [coinsToUse, setCoinsToUse] = useState(0);
  const [preview, setPreview] = useState({
    originalPrice: planPrice || 0,
    availableCoins: 0,
    maxCoinsUsable: 0,
    discountAmount: 0,
    finalPrice: planPrice || 0,
  });
  const [loading, setLoading] = useState(false);
  const [useAllCoins, setUseAllCoins] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDiscountPreview();
    }
  }, [isOpen, planId]);

  useEffect(() => {
    // Update coins based on useAllCoins toggle
    if (useAllCoins) {
      setCoinsToUse(preview.maxCoinsUsable);
    }
  }, [useAllCoins, preview.maxCoinsUsable]);

  // Update preview when coinsToUse changes
  useEffect(() => {
    updatePreview();
  }, [coinsToUse]);

  const fetchDiscountPreview = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        "/api/coins/preview-discount",
        { planId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setPreview(response.data.data);
        setCoinsToUse(0);
        setUseAllCoins(false);
      }
    } catch (error) {
      console.error("Error fetching discount preview:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreview = () => {
    if (coinsToUse > preview.maxCoinsUsable) {
      return;
    }

    const discount = coinsToUse;
    const finalPrice = Math.max(preview.originalPrice - discount, 0);

    setPreview((prev) => ({
      ...prev,
      discountAmount: discount,
      finalPrice: finalPrice,
      coinsToUse: coinsToUse,
    }));
  };

  const handleApply = async () => {
    try {
      setLoading(true);

      // Apply discount via API
      const response = await axios.post(
        "/api/coins/apply-discount",
        { coinsToUse },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        // Call parent callback
        if (onApply) {
          onApply({
            coinsUsed: coinsToUse,
            discountAmount: preview.discountAmount,
            finalPrice: preview.finalPrice,
          });
        }
        onClose();
      }
    } catch (error) {
      console.error("Error applying coins:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-amber-400 dark:from-yellow-600 dark:to-amber-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white dark:bg-slate-800">
              <Zap className="h-6 w-6 text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold text-white">Apply Coin Discount</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin">
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        ) : (
          <div className="p-8 space-y-6">
            {/* Plan Info */}
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Plan Price
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                ₹{preview.originalPrice}
              </p>
            </div>

            {/* Available Coins Info */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800/30">
              <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                Available Coins
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                {preview.availableCoins}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Maximum you can use: {preview.maxCoinsUsable} coins
              </p>
            </div>

            {/* Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Coins to Use
                </label>
                <span className="text-lg font-bold text-blue dark:text-blue-400">
                  {coinsToUse}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max={preview.maxCoinsUsable}
                value={coinsToUse}
                onChange={(e) => {
                  setCoinsToUse(parseInt(e.target.value));
                  setUseAllCoins(parseInt(e.target.value) === preview.maxCoinsUsable);
                }}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue"
              />

              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>0</span>
                <span>{preview.maxCoinsUsable}</span>
              </div>
            </div>

            {/* Use All Coins Button */}
            <button
              onClick={() => setUseAllCoins(!useAllCoins)}
              className={`w-full py-2 px-4 rounded-lg font-medium transition ${
                useAllCoins
                  ? "bg-blue text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              {useAllCoins ? "✓ Using All Coins" : "Use All Coins"}
            </button>

            {/* Discount Preview */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Discount Amount
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  -₹{preview.discountAmount}
                </span>
              </div>

              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Final Price
                </span>
                <span className="text-2xl font-bold text-blue dark:text-blue-400">
                  ₹{preview.finalPrice}
                </span>
              </div>

              {preview.discountAmount > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800/30">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    ✓ You'll save ₹{preview.discountAmount} with this discount!
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <button
                onClick={handleApply}
                disabled={coinsToUse === 0 || loading}
                className="w-full bg-gradient-to-r from-blue to-cyan-400 hover:from-blue/90 hover:to-cyan-400/90 disabled:from-slate-300 disabled:to-slate-300 text-white font-semibold py-3 rounded-lg transition transform hover:scale-105 active:scale-95"
              >
                {coinsToUse > 0
                  ? `Apply ${coinsToUse} Coins (Save ₹${preview.discountAmount})`
                  : "Select Coins to Apply"}
              </button>

              <button
                onClick={onClose}
                className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium py-3 rounded-lg transition"
              >
                Skip (Pay Full Price)
              </button>
            </div>

            {/* Info */}
            <div className="bg-blue/5 dark:bg-blue/10 rounded-lg p-4 border border-blue/10 dark:border-blue/20">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                💡 <span className="font-medium">Tip:</span> Coins are deducted
                only after successful payment. Maximum discount is 50% of plan
                price.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoinDiscountModal;
