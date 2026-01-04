// Simple rule-based AI service
// In a real production app, this would connect to an LLM API (OpenAI, HuggingFace, etc.)

const getResponse = async (message) => {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
        return "Hello! I'm here to listen. How are you feeling today?";
    }

    if (lowerMsg.includes('sad') || lowerMsg.includes('depressed') || lowerMsg.includes('unhappy')) {
        return "I'm sorry to hear you're feeling down. It's okay to feel this way. Have you tried talking to a friend or maybe taking a short walk?";
    }

    if (lowerMsg.includes('anxious') || lowerMsg.includes('worry') || lowerMsg.includes('nervous')) {
        return "It sounds like you're feeling anxious. Deep breathing can help. Try breathing in for 4 seconds, holding for 7, and exhaling for 8.";
    }

    if (lowerMsg.includes('sleep') || lowerMsg.includes('tired') || lowerMsg.includes('insomnia')) {
        return "Sleep is so important for mental health. Establishing a regular bedtime routine and avoiding screens before bed might help.";
    }

    if (lowerMsg.includes('suicide') || lowerMsg.includes('kill myself') || lowerMsg.includes('die')) {
        return "I'm very concerned about what you're saying. Please reach out for help immediately. You can call the National Suicide Prevention Lifeline at 988 or go to the nearest emergency room.";
    }

    if (lowerMsg.includes('thank')) {
        return "You're welcome. I'm always here if you need to chat.";
    }

    return "I hear you. Can you tell me more about that? I'm here to support you.";
};

module.exports = {
    getResponse
};
