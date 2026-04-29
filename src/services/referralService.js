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
// REFERRAL SERVICE
// ============================================

class ReferralService {
  /**
   * Generate a referral code for the current user
   */
  async generateReferralCode() {
    try {
      const response = await apiClient.post("/api/referrals/generate-code");
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to generate referral code",
      };
    }
  }

  /**
   * Get current user's referral code and statistics
   */
  async getMyReferralCode() {
    try {
      const response = await apiClient.get("/api/referrals/my-code");
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch referral code",
      };
    }
  }

  /**
   * Get detailed referral statistics
   */
  async getReferralStats() {
    try {
      const response = await apiClient.get("/api/referrals/stats");
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
   * Validate a referral code (public endpoint, used during signup)
   * @param {string} code - Referral code to validate
   */
  async validateReferralCode(code) {
    try {
      const response = await apiClient.post("/api/referrals/validate", { code });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Invalid referral code",
      };
    }
  }

  /**
   * Get referrer details from referral code (public endpoint)
   * @param {string} code - Referral code
   */
  async getReferrerDetails(code) {
    try {
      const response = await apiClient.get(`/api/referrals/details/${code}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Referrer not found",
      };
    }
  }

  /**
   * Get referral history with pagination
   * @param {number} limit - Number of records per page (default: 10)
   * @param {number} skip - Number of records to skip (default: 0)
   */
  async getReferralHistory(limit = 10, skip = 0) {
    try {
      const response = await apiClient.get(
        `/api/referrals/history?limit=${limit}&skip=${skip}`
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch referral history",
      };
    }
  }

  /**
   * Share referral code on WhatsApp
   * @param {string} code - Referral code
   * @param {string} link - Referral link
   */
  shareOnWhatsApp(code, link) {
    const message = `🎉 Join FotoAlpha and get 20 free coins! Use my referral code: ${code}\n\nSign up here: ${link}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  }

  /**
   * Share referral code via email
   * @param {string} code - Referral code
   * @param {string} link - Referral link
   */
  shareViaEmail(code, link) {
    const subject = "Join FotoAlpha with My Referral Code";
    const body = `Hi,\n\nI've been using FotoAlpha and would love for you to join me!\n\nUse my referral code: ${code}\nSign up link: ${link}\n\nYou'll get 20 coins when you sign up!\n\nBest regards`;

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  }

  /**
   * Copy referral code to clipboard
   * @param {string} code - Referral code
   */
  async copyToClipboard(code) {
    try {
      await navigator.clipboard.writeText(code);
      return {
        success: true,
        message: "Code copied to clipboard",
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to copy to clipboard",
      };
    }
  }

  /**
   * Get referral link
   * @param {string} code - Referral code
   */
  getReferralLink(code) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/signup?ref=${code}`;
  }
}

export default new ReferralService();
