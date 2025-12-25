export interface GeminiMessage {
    role: 'user' | 'model';
    parts: string;
}

export interface GeminiResponse {
    text: string;
    error?: string;
}

export interface GeminiConfig {
    apiKey: string;
    model: string;
}

export interface ConversationHistory {
    history: GeminiMessage[];
}
