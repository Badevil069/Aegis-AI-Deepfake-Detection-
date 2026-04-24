import React, { useState } from 'react';
import { Mail, Send, Sparkles } from 'lucide-react';

const EmailPasteCard = ({ onAnalyze }) => {
    const [emailText, setEmailText] = useState('');

    const handleSubmit = () => {
        if (!emailText.trim()) return alert("Please paste an email source first!");
        onAnalyze(emailText);
    };

    return (
        <div className="deepshield-feature-card mx-auto max-w-4xl" style={{ padding: '2rem 2.5rem' }}>
            <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/15">
                    <Mail className="h-5 w-5 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white deepshield-glow-text">Email Source Analysis</h2>
            </div>
            <p className="text-slate-400 mb-6">
                Paste the "Raw Original" email content (including headers) to detect spoofing and phishing.
            </p>

            <textarea
                className="cyber-input w-full h-64 font-mono text-sm resize-none"
                placeholder="--- Paste Email Source Here ---"
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
            />

            <div className="mt-6 flex justify-between items-center">
                <span className="text-xs text-slate-500 italic">
                    *Tip: In Gmail, use 'Show Original' to get this content.
                </span>
                <button
                    onClick={handleSubmit}
                    className="deepshield-btn-primary inline-flex items-center gap-2 interactive"
                >
                    <Sparkles className="h-4 w-4" />
                    Run Sentinel Scan
                </button>
            </div>
        </div>
    );
};

export default EmailPasteCard;