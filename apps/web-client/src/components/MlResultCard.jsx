import React from 'react';
import { AlertCircle, CheckCircle, Info, TrendingUp } from 'lucide-react';

/**
 * ML Result Card Component
 * 
 * Displays ML screening predictions with:
 * - Risk level badge
 * - Confidence score
 * - Explainability (top contributing questions)
 * - AI-assisted badge
 */

const MlResultCard = ({ prediction, screeningType }) => {
    if (!prediction) return null;

    const { riskLevel, score, confidence, explanation, modelVersion } = prediction;

    // Risk level styling
    const getRiskColor = (level) => {
        switch (level) {
            case 'none':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'mild':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'moderate':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'moderately-severe':
                return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'severe':
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getRiskIcon = (level) => {
        if (level === 'none') return <CheckCircle className="w-5 h-5" />;
        if (level === 'severe' || level === 'moderately-severe') return <AlertCircle className="w-5 h-5" />;
        return <Info className="w-5 h-5" />;
    };

    const getRiskDescription = (level) => {
        const descriptions = {
            'none': 'No significant symptoms detected',
            'mild': 'Mild symptoms present',
            'moderate': 'Moderate symptoms - consider professional support',
            'moderately-severe': 'Moderately severe symptoms - professional help recommended',
            'severe': 'Severe symptoms - immediate professional help strongly recommended'
        };
        return descriptions[level] || 'Assessment complete';
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* AI-Assisted Badge */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-600">AI-Assisted Analysis</span>
                </div>
                <span className="text-xs text-gray-500">Model v{modelVersion}</span>
            </div>

            {/* Risk Level Badge */}
            <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 ${getRiskColor(riskLevel)}`}>
                {getRiskIcon(riskLevel)}
                <div>
                    <div className="font-semibold text-lg capitalize">{riskLevel} Risk Level</div>
                    <div className="text-sm opacity-90">{getRiskDescription(riskLevel)}</div>
                </div>
            </div>

            {/* Score and Confidence */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Score</div>
                    <div className="text-3xl font-bold text-gray-800">{score}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {screeningType === 'PHQ9' ? 'out of 27' : 'out of 21'}
                    </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Confidence</div>
                    <div className="text-3xl font-bold text-gray-800">
                        {Math.round(confidence * 100)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Model confidence</div>
                </div>
            </div>

            {/* Score Progress Bar */}
            <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Severity Level</span>
                    <span>{score}/{screeningType === 'PHQ9' ? '27' : '21'}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className={`h-3 rounded-full transition-all duration-500 ${riskLevel === 'severe' || riskLevel === 'moderately-severe'
                                ? 'bg-red-500'
                                : riskLevel === 'moderate'
                                    ? 'bg-yellow-500'
                                    : riskLevel === 'mild'
                                        ? 'bg-blue-500'
                                        : 'bg-green-500'
                            }`}
                        style={{
                            width: `${(score / (screeningType === 'PHQ9' ? 27 : 21)) * 100}%`,
                        }}
                    />
                </div>
            </div>

            {/* Explainability Section */}
            {explanation?.topContributors && explanation.topContributors.length > 0 && (
                <div className="border-t pt-4">
                    <div className="text-sm font-semibold text-gray-700 mb-3">
                        Key Contributing Factors
                    </div>
                    <div className="space-y-2">
                        {explanation.topContributors.slice(0, 3).map((contributor, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                    Question {contributor.question.replace('q', '')}
                                </span>
                                <div className="flex items-center space-x-2">
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-indigo-600 h-2 rounded-full"
                                            style={{ width: `${(contributor.weight || 0) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-gray-500 text-xs w-12 text-right">
                                        {Math.round((contributor.weight || 0) * 100)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                        {explanation.method === 'ml-model'
                            ? 'Based on SHAP explainability analysis'
                            : 'Based on clinical scoring guidelines'}
                    </div>
                </div>
            )}

            {/* Resources CTA */}
            {(riskLevel === 'moderate' || riskLevel === 'moderately-severe' || riskLevel === 'severe') && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                            <div className="text-sm font-medium text-blue-900 mb-1">
                                Professional Support Recommended
                            </div>
                            <div className="text-sm text-blue-700 mb-3">
                                Based on your results, speaking with a mental health professional could be helpful.
                            </div>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
                                Connect with a Counselor
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Emergency Resources (for severe cases) */}
            {riskLevel === 'severe' && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                        <div className="flex-1">
                            <div className="text-sm font-semibold text-red-900 mb-2">
                                Immediate Support Available
                            </div>
                            <div className="text-sm text-red-800 mb-3">
                                If you're in crisis or thinking about self-harm, please reach out immediately:
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="bg-white rounded p-2">
                                    <span className="font-medium">Crisis Hotline:</span>
                                    <span className="ml-2 text-red-600 font-semibold">988</span>
                                </div>
                                <div className="bg-white rounded p-2">
                                    <span className="font-medium">Crisis Text Line:</span>
                                    <span className="ml-2 text-red-600 font-semibold">Text "HELLO" to 741741</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MlResultCard;
