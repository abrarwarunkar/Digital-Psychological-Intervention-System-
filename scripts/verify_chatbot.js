const axios = require('axios');

const API_URL = 'http://localhost:8000/predict/chat';

const testChat = async () => {
    try {
        console.log("Testing Normal Chat...");
        const normalResponse = await axios.post(API_URL, {
            message: "I am feeling very stressed about my upcoming exams."
        });
        console.log("Input: I am feeling very stressed about my upcoming exams.");
        console.log("Response:", normalResponse.data.response);
        console.log("Intent:", normalResponse.data.intent);
        console.log("Risk:", normalResponse.data.riskLevel);
        console.log("------------------------------------------------");

        console.log("Testing Crisis Chat (Safety Layer)...");
        const crisisResponse = await axios.post(API_URL, {
            message: "I want to kill myself."
        });
        console.log("Input: I want to kill myself.");
        console.log("Response:", crisisResponse.data.response);
        console.log("Emergency:", crisisResponse.data.emergency);
        console.log("------------------------------------------------");

    } catch (error) {
        console.error("Error:", error.message);
    }
};

testChat();
