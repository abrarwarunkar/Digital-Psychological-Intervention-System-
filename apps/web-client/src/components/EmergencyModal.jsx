import React, { useEffect } from 'react';
import { AlertCircle, Phone, MessageSquare, X } from 'lucide-react';

/**
 * Emergency Modal Component
 * 
 * Displays when AI detects crisis/suicidal ideation in chat messages.
 * Cannot be easily dismissed - requires deliberate user action.
 * 
 * Props:
 * - isOpen: boolean
 * - onClose: function (requires confirmation)
 * - riskLevel: 'emergency' | 'high'
 * - confidence: number (0-1)
 */

const EmergencyModal = ({ isOpen, onClose, riskLevel = 'emergency', confidence = 0.95 }) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCallCrisisLine = () => {
        // In a real app, this could trigger a direct call on mobile
        window.open('tel:988');
    };

    const handleTextCrisisLine = () => {
        window.open('sms:741741?body=HELLO');
    };

    const handleConnectCounselor = () => {
        // Navigate to counselor connection
        window.location.href = '/booking?priority=urgent';
    };

    const handleSafetyPlan = () => {
        // Open safety planning resource
        window.open('https://suicidepreventionlifeline.org/create-safety-plan/', '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
            <div
                className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                role="dialog"
                aria-modal="true"
                aria-labelledby="emergency-modal-title"
            >
                {/* Header */}
                <div className="bg-blue-600 text-white p-6 rounded-t-2xl">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white bg-opacity-20 p-3 rounded-full">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 id="emergency-modal-title" className="text-2xl font-bold">
                                    We're Concerned About You
                                </h2>
                                <p className="text-blue-100 text-sm mt-1">
                                    You're not alone. Help is available 24/7.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Main Message */}
                    <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                        <p className="text-gray-800 text-lg leading-relaxed">
                            Based on what you've shared, we want to make sure you get the support you need right away.
                            {' '}
                            <strong>You matter, and there are people who want to help.</strong>
                        </p>
                    </div>

                    {/* Immediate Help Options */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                            Get Help Right Now:
                        </h3>

                        {/* Crisis Hotline */}
                        <button
                            onClick={handleCallCrisisLine}
                            className="w-full bg-red-600 hover:bg-red-700 text-white p-6 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-left">
                                    <Phone className="w-8 h-8" />
                                    <div>
                                        <div className="text-xl font-bold">Call Crisis Hotline</div>
                                        <div className="text-red-100 text-sm">Available 24/7 - Free & Confidential</div>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold">988</div>
                            </div>
                        </button>

                        {/* Crisis Text Line */}
                        <button
                            onClick={handleTextCrisisLine}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-left">
                                    <MessageSquare className="w-8 h-8" />
                                    <div>
                                        <div className="text-xl font-bold">Text Crisis Line</div>
                                        <div className="text-purple-100 text-sm">If you prefer to text</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-purple-200">Text "HELLO" to</div>
                                    <div className="text-2xl font-bold">741741</div>
                                </div>
                            </div>
                        </button>

                        {/* Connect with Campus Counselor */}
                        <button
                            onClick={handleConnectCounselor}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-lg shadow transition-all duration-200 hover:scale-102 focus:outline-none focus:ring-4 focus:ring-blue-300"
                        >
                            <div className="flex items-center justify-center space-x-3">
                                <span className="text-lg font-semibold">Connect with Campus Counselor</span>
                                <span className="bg-blue-500 px-3 py-1 rounded-full text-sm">Priority Booking</span>
                            </div>
                        </button>
                    </div>

                    {/* Additional Resources */}
                    <div className="border-t pt-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Other Resources:</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <span className="text-gray-700">Safety Planning Guide</span>
                                <button
                                    onClick={handleSafetyPlan}
                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Open
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <span className="text-gray-700">Emergency Services (911)</span>
                                <a
                                    href="tel:911"
                                    className="text-red-600 hover:text-red-700 font-medium"
                                >
                                    Call
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Important Notes */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2 text-yellow-600" />
                            Important to Know:
                        </h4>
                        <ul className="text-sm text-gray-700 space-y-1.5 ml-6 list-disc">
                            <li>All crisis services are <strong>free and confidential</strong></li>
                            <li>You can call or text <strong>anonymously</strong></li>
                            <li>Trained counselors are available <strong>24/7</strong></li>
                            <li>They won't judge you or force you to do anything</li>
                        </ul>
                    </div>

                    {/* Close Button */}
                    <div className="border-t pt-4">
                        <button
                            onClick={() => {
                                if (window.confirm('Are you sure you want to close this? Please save the crisis numbers (988 or 741741) before closing.')) {
                                    onClose();
                                }
                            }}
                            className="w-full text-gray-600 hover:text-gray-800 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-300"
                        >
                            I've Saved the Numbers - Close
                        </button>
                        <p className="text-xs text-gray-500 text-center mt-2">
                            This conversation has been flagged for follow-up by our support team
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmergencyModal;
