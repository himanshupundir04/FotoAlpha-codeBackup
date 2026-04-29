import axios from 'axios';

const baseURL = process.env.REACT_APP_BASE_URL;

/**
 * Fetch current subscription for photographer/user
 * Returns subscription data from UserSubscription collection
 * @param {string} token - JWT token for authentication
 * @returns {Promise<Object>} subscription object with status, dates, plan info
 */
export const fetchCurrentSubscription = async (token) => {
  try {
    const response = await axios.get(`${baseURL}/users/current-subscription`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "ngrok-skip-browser-warning": "69420",
      },
    });
    
    return response; // Returns subscription object
  } catch (error) {
    console.error('Error fetching subscription:', error);
    // Return null if no subscription found or error occurs
    return error;
  }
};

/**
 * Get subscription status display info
 * @param {Object} subscription - subscription object from API
 * @returns {Object} { statusMessage, showUpgradeButton }
 */
export const getSubscriptionStatus = (subscription) => {
  if (!subscription) {
    return {
      statusMessage: '',
      showUpgradeButton: true,
      canCancel: false,
    };
  }

  const now = new Date();

  // 🟡 TRIAL
  if (subscription.status === 'trial') {
    const trialEnd = new Date(subscription.trial_end);

    if (trialEnd > now) {
      return {
        statusMessage: `Trial ends on ${trialEnd.toLocaleDateString()}`,
        showUpgradeButton: true,
        canCancel: false, // ❌ cannot cancel trial
        type: 'trial-active',
      };
    }

    return {
      statusMessage: 'Your trial period has ended',
      showUpgradeButton: true,
      canCancel: false,
      type: 'trial-expired',
    };
  }

  // 🟢 ACTIVE PAID SUBSCRIPTION
  if (subscription.status === 'active') {
    const periodEnd = new Date(subscription.current_period_end);

    if (periodEnd > now) {
      return {
        statusMessage: '',
        showUpgradeButton: false,
        canCancel: true, // ✅ SHOW Cancel Auto-Renewal
        type: 'subscription-active',
      };
    }

    return {
      statusMessage: 'Your subscription has ended',
      showUpgradeButton: true,
      canCancel: false,
      type: 'subscription-expired',
    };
  }

  // 🟠 PENDING
  if (subscription.status === 'pending') {
    return {
      statusMessage: 'Your subscription is pending',
      showUpgradeButton: false,
      canCancel: false,
      type: 'subscription-pending',
    };
  }

  // 🔴 CANCELLED
  if (subscription.status === 'cancelled') {
    return {
      statusMessage: 'Your subscription has been cancelled',
      showUpgradeButton: true,
      canCancel: false,
      type: 'subscription-cancelled',
    };
  }

  return {
    statusMessage: '',
    showUpgradeButton: true,
    canCancel: false,
  };
};
