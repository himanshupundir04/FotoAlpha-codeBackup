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
// SUBSCRIPTION RENEWAL SERVICE
// ============================================

class SubscriptionRenewalService {
  /**
   * Get renewal preview with coin discount options
   * @param {string} planId - MongoDB ObjectId of subscription plan
   * Returns: {
   *   planName: string,
   *   originalPrice: number,
   *   availableCoins: number,
   *   maxCoinsUsable: number,
   *   discountAmount: number (if coins applied),
   *   finalAmount: number (after discount),
   *   renewalDate: date,
   *   billingCycle: string
   * }
   */
  async getRenewalPreview(planId) {
    try {
      const response = await apiClient.get(
        `/api/subscription-renewal/renewal-preview?planId=${planId}`
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message || "Failed to fetch renewal preview",
      };
    }
  }

  /**
   * Renew subscription with coin discount
   * @param {string} planId - MongoDB ObjectId of subscription plan
   * @param {number} coinsToUse - Number of coins to use as discount (0 if none)
   * Returns: {
   *   subscriptionId: string,
   *   orderId: string,
   *   paymentLink: string (for Razorpay),
   *   originalPrice: number,
   *   discountAmount: number,
   *   finalAmount: number,
   *   nextBillingDate: date
   * }
   */
  async renewSubscriptionWithCoins(planId, coinsToUse = 0) {
    try {
      const response = await apiClient.post(
        "/api/subscription-renewal/renew-with-coins",
        { planId, coinsToUse }
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message || "Failed to renew subscription",
      };
    }
  }

  /**
   * Get subscription details including coin information
   * @param {string} subscriptionId - MongoDB ObjectId of subscription
   * Returns: {
   *   subscriptionId: string,
   *   planName: string,
   *   price: number,
   *   billingCycle: string,
   *   status: string,
   *   nextRenewalDate: date,
   *   coinHistory: array,
   *   totalCoinsUsed: number,
   *   totalCoinsRefunded: number
   * }
   */
  async getSubscriptionDetails(subscriptionId) {
    try {
      const response = await apiClient.get(
        `/api/subscription-renewal/${subscriptionId}/details`
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          "Failed to fetch subscription details",
      };
    }
  }

  /**
   * Calculate final amount with coin discount
   * @param {number} planPrice - Original plan price
   * @param {number} coinsToUse - Number of coins to use
   * Returns: {
   *   originalPrice: number,
   *   coinsUsed: number,
   *   discountAmount: number,
   *   finalAmount: number,
   *   savings: number,
   *   savingsPercent: number
   * }
   */
  calculateFinalAmount(planPrice, coinsToUse) {
    // Maximum discount is 50% of plan price
    const maxDiscount = planPrice * 0.5;
    const discountAmount = Math.min(coinsToUse, maxDiscount);
    const finalAmount = Math.max(planPrice - discountAmount, 0);
    const savingsPercent =
      planPrice > 0 ? ((discountAmount / planPrice) * 100).toFixed(0) : 0;

    return {
      originalPrice: planPrice,
      coinsUsed: coinsToUse,
      discountAmount: discountAmount,
      finalAmount: finalAmount,
      savings: discountAmount,
      savingsPercent: savingsPercent,
    };
  }

  /**
   * Format renewal preview for UI display
   * @param {object} preview - Raw preview data from API
   * Returns: {object} Formatted preview
   */
  formatRenewalPreview(preview) {
    const calculation = this.calculateFinalAmount(
      preview.originalPrice,
      preview.maxCoinsUsable
    );

    return {
      ...preview,
      formattedPrice: `₹${preview.originalPrice}`,
      formattedFinalAmount: `₹${preview.finalAmount}`,
      availableCoinsText: `You have ${preview.availableCoins} coins (₹${preview.availableCoins} value)`,
      maxCoinsText: `Max discount: ${preview.maxCoinsUsable} coins (₹${preview.maxCoinsUsable})`,
      potentialSavings: `Potential savings: ₹${calculation.discountAmount}`,
    };
  }

  /**
   * Validate coin amount for renewal
   * @param {number} coinsToUse - Coins to validate
   * @param {number} availableCoins - Available coins
   * @param {number} planPrice - Plan price
   * Returns: {object} Validation result
   */
  validateCoinsForRenewal(coinsToUse, availableCoins, planPrice) {
    const errors = [];

    if (coinsToUse < 0) {
      errors.push("Coins cannot be negative");
    }

    if (coinsToUse > availableCoins) {
      errors.push("Not enough coins available");
    }

    const maxDiscount = planPrice * 0.5;
    if (coinsToUse > maxDiscount) {
      errors.push(
        `Cannot discount more than 50% of plan price (max ${Math.floor(maxDiscount)} coins)`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get suggested coin amount based on available coins and max discount
   * @param {number} availableCoins - Available coins
   * @param {number} planPrice - Plan price
   * Returns: {number} Suggested coin amount
   */
  getSuggestedCoinAmount(availableCoins, planPrice) {
    const maxDiscount = planPrice * 0.5;
    return Math.min(availableCoins, Math.floor(maxDiscount));
  }

  /**
   * Format subscription details for display
   * @param {object} subscription - Raw subscription data
   * Returns: {object} Formatted subscription
   */
  formatSubscriptionDetails(subscription) {
    return {
      ...subscription,
      formattedPrice: `₹${subscription.price}`,
      formattedRenewalDate: new Date(
        subscription.nextRenewalDate
      ).toLocaleDateString("en-IN"),
      formattedLastPaymentDate: subscription.lastPaymentDate
        ? new Date(subscription.lastPaymentDate).toLocaleDateString("en-IN")
        : "N/A",
      statusColor:
        subscription.status === "active"
          ? "text-green-600 dark:text-green-400"
          : subscription.status === "pending"
          ? "text-yellow-600 dark:text-yellow-400"
          : "text-red-600 dark:text-red-400",
      statusBg:
        subscription.status === "active"
          ? "bg-green-100 dark:bg-green-900/20"
          : subscription.status === "pending"
          ? "bg-yellow-100 dark:bg-yellow-900/20"
          : "bg-red-100 dark:bg-red-900/20",
    };
  }

  /**
   * Check if subscription is eligible for renewal
   * @param {object} subscription - Subscription object
   * Returns: {boolean}
   */
  isEligibleForRenewal(subscription) {
    if (subscription.status !== "active" && subscription.status !== "expired") {
      return false;
    }

    const renewalDate = new Date(subscription.nextRenewalDate);
    const today = new Date();

    // Can renew if next renewal date is today or in the past
    return renewalDate <= today;
  }

  /**
   * Get days until next renewal
   * @param {date} nextRenewalDate - Next renewal date
   * Returns: {number} Days remaining
   */
  getDaysUntilRenewal(nextRenewalDate) {
    const renewal = new Date(nextRenewalDate);
    const today = new Date();
    const diffTime = renewal - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  }

  /**
   * Get renewal status badge color
   * @param {string} status - Subscription status
   * Returns: {object} Color classes
   */
  getStatusBadgeColor(status) {
    const colors = {
      active: {
        bg: "bg-green-100 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-300",
        icon: "text-green-600 dark:text-green-400",
      },
      pending: {
        bg: "bg-yellow-100 dark:bg-yellow-900/20",
        text: "text-yellow-700 dark:text-yellow-300",
        icon: "text-yellow-600 dark:text-yellow-400",
      },
      expired: {
        bg: "bg-red-100 dark:bg-red-900/20",
        text: "text-red-700 dark:text-red-300",
        icon: "text-red-600 dark:text-red-400",
      },
      cancelled: {
        bg: "bg-slate-100 dark:bg-slate-700",
        text: "text-slate-700 dark:text-slate-300",
        icon: "text-slate-600 dark:text-slate-400",
      },
    };

    return colors[status] || colors.pending;
  }
}

export default new SubscriptionRenewalService();
