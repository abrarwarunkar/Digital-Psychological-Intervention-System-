const axios = require('axios');

// ML Service URL (default to localhost:8000)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Get chat analysis from ML service
 * @param {string} message - User message
 * @param {object} context - Optional context
 * @param {Array} history - Chat history
 * @returns {Promise<object>} - Analysis result (risk, intent)
 */
const analyzeMessage = async (message, context = {}, history = []) => {
    try {
        const response = await axios.post(`${ML_SERVICE_URL}/predict/chat`, {
            message,
            context,
            history
        });
        return response.data;
    } catch (error) {
        console.error('ML Service Error:', error.message);
        // Fallback response if ML service is down
        return {
            riskLevel: 'low',
            riskScore: 0.0,
            intent: 'general',
            intentScore: 0.0,
            emergency: false,
            confidence: 0.0,
            error: true
        };
    }
};

/**
 * Get screening result from ML service
 * @param {string} type - PHQ9 or GAD7
 * @param {Array<number>} answers - List of scores
 * @returns {Promise<object>} - Screening result
 */
const analyzeScreening = async (type, answers) => {
    try {
        const response = await axios.post(`${ML_SERVICE_URL}/predict/screening`, {
            type,
            answers
        });
        return response.data;
    } catch (error) {
        console.error('ML Service Error:', error.message);
        // Fallback logic should be handled by caller or here
        throw error;
    }
};

module.exports = {
    analyzeMessage,
    analyzeScreening
};
