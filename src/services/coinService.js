import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://fotoalpha.com";

// Create axios instance with default headers
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to all requests
export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
  }
};

// ============================================
// COINS SERVICE
// ============================================

class CoinService {
  /**
   * Get user's coin balance
   * Returns: {
   *   totalCoins: number,
   *   earnedCoins: number,
   *   usedCoins: number,
   *   availableCoins: number,
   *   coinValue: number (in rupees)
   * }
   */
  async getCoinBalance() {
    try {
      const response = await apiClient.get("/api/coins/balance");
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch coin balance",
      };
    }
  }

  /**
   * Get coin transaction history with pagination
   * @param {number} limit - Number of records per page (default: 10)
   * @param {number} skip - Number of records to skip (default: 0)
   */
  async getCoinHistory(limit = 10, skip = 0) {
    try {
      const response = await apiClient.get(
        `/api/coins/history?limit=${limit}&skip=${skip}`
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch coin history",
      };
    }
  }

  /**
   * Get detailed coin statistics
   * Returns: {
   *   totalCoins: number,
   *   availableCoins: number,
   *   usedCoins: number,
   *   earnedFromReferrals: {
   *     fromBeingReferred: number,
   *     fromReferringOthers: number
   *   },
   *   nextRenewalEligible: boolean
   * }
   */
  async getCoinStatistics() {
    try {
      const response = await apiClient.get("/api/coins/statistics");
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch statistics",
      };
    }
  }

  /**
   * Get discount preview for a specific subscription plan
   * @param {string} planId - MongoDB ObjectId of the subscription plan
   * Returns: {
   *   originalPrice: number,
   *   availableCoins: number,
   *   maxCoinsUsable: number,
   *   discountAmount: number (if coins applied),
   *   finalPrice: number (after discount)
   * }
   */
  async getDiscountPreview(planId) {
    try {
      const response = await apiClient.post("/api/coins/preview-discount", {
        planId,
      });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to calculate discount preview",
      };
    }
  }

  /**
   * Calculate discount for custom coin amount
   * @param {number} coinsToUse - Number of coins to use
   * @param {number} planPrice - Original plan price
   * Returns: {
   *   coinsToUse: number,
   *   discountAmount: number,
   *   finalPrice: number,
   *   savings: number
   * }
   */
  calculateDiscount(coinsToUse, planPrice) {
    // Maximum discount is 50% of plan price
    const maxDiscount = planPrice * 0.5;
    const discountAmount = Math.min(coinsToUse, maxDiscount);
    const finalPrice = Math.max(planPrice - discountAmount, 0);

    return {
      coinsToUse,
      discountAmount,
      finalPrice,
      savings: discountAmount,
    };
  }

  /**
   * Apply coins discount to next subscription renewal
   * @param {number} coinsToUse - Number of coins to deduct
   * Returns: {
   *   success: boolean,
   *   discountApplied: boolean,
   *   coins: number,
   *   orderId: string (if applicable)
   * }
   */
  async applyCoinsDiscount(coinsToUse) {
    try {
      const response = await apiClient.post("/api/coins/apply-discount", {
        coinsToUse,
      });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to apply coin discount",
      };
    }
  }

  /**
   * Format coin value to rupees
   * @param {number} coins - Number of coins
   * Returns: {string} Formatted rupee value
   */
  formatCoinValue(coins) {
    return `₹${coins}`;
  }

  /**
   * Format coins with proper formatting
   * @param {number} coins - Number of coins
   * Returns: {string} Formatted coin string with icon
   */
  formatCoins(coins) {
    return `${coins} coins`;
  }

  /**
   * Get color class for coin badge based on amount
   * @param {number} coins - Number of coins
   * Returns: {string} Tailwind class for color
   */
  getCoinColorClass(coins) {
    if (coins >= 100) return "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300";
    if (coins >= 50) return "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300";
    if (coins >= 20) return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300";
    return "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300";
  }

  /**
   * Validate coin amount before applying
   * @param {number} coinsToUse - Coins to validate
   * @param {number} availableCoins - Available coins
   * @param {number} planPrice - Plan price
   * Returns: {object} Validation result
   */
  validateCoinsAmount(coinsToUse, availableCoins, planPrice) {
    const errors = [];

    if (coinsToUse < 0) {
      errors.push("Coins cannot be negative");
    }

    if (coinsToUse > availableCoins) {
      errors.push("Not enough coins available");
    }

    const maxDiscount = planPrice * 0.5;
    if (coinsToUse > maxDiscount) {
      errors.push(`Cannot discount more than 50% (max ${Math.floor(maxDiscount)} coins)`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get transaction type badge color
   * @param {string} type - Transaction type (earned/redeemed/refunded)
   * Returns: {object} Color classes
   */
  getTransactionTypeColor(type) {
    const colors = {
      earned: {
        bg: "bg-green-100 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-300",
        badge: "bg-green-200 dark:bg-green-800/30",
      },
      redeemed: {
        bg: "bg-blue-100 dark:bg-blue-900/20",
        text: "text-blue-700 dark:text-blue-300",
        badge: "bg-blue-200 dark:bg-blue-800/30",
      },
      refunded: {
        bg: "bg-orange-100 dark:bg-orange-900/20",
        text: "text-orange-700 dark:text-orange-300",
        badge: "bg-orange-200 dark:bg-orange-800/30",
      },
    };

    return colors[type] || colors.earned;
  }

  /**
   * Format transaction history for display
   * @param {array} transactions - Raw transactions from API
   * Returns: {array} Formatted transactions
   */
  formatTransactions(transactions) {
    return transactions.map((transaction) => ({
      ...transaction,
      displayDate: new Date(transaction.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      displayAmount:
        transaction.type === "redeemed" || transaction.type === "refunded"
          ? `-${transaction.coins}`
          : `+${transaction.coins}`,
      colorClass: this.getTransactionTypeColor(transaction.type),
    }));
  }
}

export default new CoinService();
