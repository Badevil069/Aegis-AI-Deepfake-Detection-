import React, { useState } from 'react';

const EmailPasteCard = ({ onAnalyze }) => {
    const [emailText, setEmailText] = useState('');

    const handleSubmit = () => {
        if (!emailText.trim()) return alert("Please paste an email source first!");
        onAnalyze(emailText);
    };

    return (
        <div className="bg-[#1e1e2e] p-6 rounded-xl border border-gray-700 shadow-xl max-w-4xl mx-auto mt-8">
            <h2 className="text-2xl font-bold text-white mb-2">Email Source Analysis</h2>
            <p className="text-gray-400 mb-6">
                Paste the "Raw Original" email content (including headers) to detect spoofing and phishing.
            </p>
            
            <textarea
                className="w-full h-64 bg-[#0f0f1a] text-green-400 p-4 rounded-lg border border-gray-600 font-mono text-sm focus:border-blue-500 focus:outline-none placeholder-gray-600"
                placeholder="--- Paste Email Source Here ---"
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
            />

            <div className="mt-6 flex justify-between items-center">
                <span className="text-xs text-gray-500 italic">
                    *Tip: In Gmail, use 'Show Original' to get this content.
                </span>
                <button
                    onClick={handleSubmit}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg active:scale-95"
                >
                    Run Sentinel Scan
                </button>
            </div>
        </div>
    );
};

export default EmailPasteCard;