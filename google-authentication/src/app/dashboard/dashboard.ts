import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GeminiAiService } from '../services/gemini-ai.service';
import { GoogleGenAI, mcpToTool } from '@google/genai';
import { environment } from '../../environments/environment.development';
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
  isError?: boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  messages: ChatMessage[] = [];

  userInput: string = '';
  isTyping: boolean = false;
  isConfigured: boolean = false;
  ai: GoogleGenAI;

  serverParams = new StdioClientTransport({
    command: "node",
    args: [
      "C:\\Users\\dushyanthk\\Downloads\\QuickShare\\MCPApi\\Script\\mcp_local_api.js"
    ],
    env: {
      API_BASE_URL: "http://localhost:5000/api"
    }
  });

  client = new Client(
    {
      name: "example-client",
      version: "1.0.0"
    }
  );

  constructor(private geminiService: GeminiAiService) {
    this.ai = new GoogleGenAI({ apiKey: environment.gemini.apiKey });
  }

  async ngOnInit() {
    await this.client.connect(this.serverParams);
    console.log(this.client.listTools());
  }

  async sendMessage() {
    if (!this.userInput.trim()) return;

    this.messages.push({
      text: this.userInput,
      isUser: true,
      timestamp: new Date()
    });

    const prompt = this.userInput;
    this.userInput = '';
    this.isTyping = true;

    try {


      const response = await this.ai.models.generateContentStream({
        model: environment.gemini.model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          tools: [mcpToTool(this.client)],  // uses the session, will automatically call the tool using automatic function calling
        },
      });

      for await (const chunk of response) {
        if (chunk.text) {
          this.messages.push({
            text: chunk.text,
            isUser: false,
            timestamp: new Date()
          });
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      console.error(error);
      this.messages.push({
        text: 'Error generating response.',
        isUser: false,
        timestamp: new Date(),
        isError: true
      });
    } finally {
      this.isTyping = false;
    }
  }

  private scrollToBottom() {
    const chatBody = document.querySelector('.chat-messages');
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }

  handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearConversation() {
    this.geminiService.clearHistory();
    this.messages = [{
      text: 'Conversation cleared! How can I help you?',
      isUser: false,
      timestamp: new Date()
    }];
  }
}
