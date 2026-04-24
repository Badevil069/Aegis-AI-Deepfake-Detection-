const API_URL = '/api'; // Proxied through Vite dev server to backend on port 8001

export const analyzeEmail = async (content) => {
    try {
        const response = await fetch(`${API_URL}/analyze-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email_content: content }),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Analysis failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error("Email Analysis Error:", error);
        return { success: false, error: error.message };
    }
};