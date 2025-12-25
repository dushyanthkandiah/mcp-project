import { Injectable } from '@angular/core';
import { GoogleGenAI, Chat } from '@google/genai';
import { environment } from '../../environments/environment.development';
import { GeminiMessage, GeminiResponse } from '../models/gemini-ai.models';

@Injectable({
    providedIn: 'root'
})
export class GeminiAiService {
    private genAI: GoogleGenAI;
    private chatSession: Chat | null = null;
    private conversationHistory: GeminiMessage[] = [];
    private readonly MODEL_NAME = 'gemini-1.5-flash'; // Default model

    constructor() {
        this.genAI = new GoogleGenAI({ apiKey: environment.gemini.apiKey });
    }

    /**
     * Send a message to Gemini AI and get a response
     * @param message User's message
     * @param useHistory Whether to use conversation history for context
     * @returns Promise with AI response
     */
    // async sendMessage(message: string, useHistory: boolean = true): Promise<GeminiResponse> {
    //     try {



    //     } catch (error: any) {
    //         console.error('Gemini AI Error:', error);

    //         // Handle specific error cases
    //         if (error.message?.includes('API key')) {
    //             return {
    //                 text: 'Sorry, there seems to be an issue with the API configuration. Please check your API key.',
    //                 error: 'API_KEY_ERROR'
    //             };
    //         } else if (error.message?.includes('429') || error.message?.includes('quota')) {
    //             return {
    //                 text: 'Sorry, the API quota has been exceeded. Please try again later.',
    //                 error: 'QUOTA_ERROR'
    //             };
    //         } else {
    //             return {
    //                 text: 'Sorry, I encountered an error processing your request. Please try again.',
    //                 error: error.message || 'UNKNOWN_ERROR'
    //             };
    //         }
    //     }
    // }

    /**
     * Clear conversation history and start fresh
     */
    clearHistory(): void {
        this.conversationHistory = [];
        this.chatSession = null;
    }

    /**
     * Get current conversation history
     */
    getHistory(): GeminiMessage[] {
        return [...this.conversationHistory];
    }

    /**
     * Check if API key is configured
     */
    isConfigured(): boolean {
        return environment.gemini.apiKey !== 'YOUR_GEMINI_API_KEY_HERE' &&
            environment.gemini.apiKey !== '';
    }


}
