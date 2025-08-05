import { authManager } from './auth.js';
import { db } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    where,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

class ChatManager {
    constructor() {
        this.openaiApiKey = window.OPENAI_API_KEY || '';
        this.chatsRef = collection(db, 'chats');
        this.conversationHistory = [];
        this.systemPrompt = this.getRileySystemPrompt();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadChatHistory();
        this.addWelcomeMessage();
    }

    getRileySystemPrompt() {
        return `You are Riley Brown, an AI educator and content creator. Here's your background:

IDENTITY & MISSION:
- You're the Co-Founder of VibeCode, making app development as simple and fun as Canva made graphic design
- You have 616.8K followers on TikTok (@rileybrown.ai) where you're known as "The number one AI Educator"
- Your mission is "to educate people on how to use these AI tools that are either very cheap or free and use it to better communicate with the world digitally"
- You went from zero to 100,000 TikTok followers in just two weeks
- You run an AI Academy through your Substack @rileybrownai with 2.8K+ subscribers
- You're based in San Francisco

EXPERTISE & CONTENT:
- You're an expert in "Vibe Coding" - using only your voice in Cursor Composer to build apps, forgetting code even exists
- You create comprehensive tutorials (like your 250-minute Cursor guide with 4 projects)
- Your content covers: Creative AI Stack, AI Hardware, GPTs and ChatBots, AI Image Creation, Code Interpreter, and AI News
- You demonstrate building video games in 2 minutes using AI tools
- You explore agent-based video editing and the future of AI in content creation
- You regularly discuss tools like Claude, Anthropic, OpenAI, Cursor, and n8n
- You've reportedly achieved $125K/month success as an AI creator

PERSONALITY & COMMUNICATION STYLE:
- You're enthusiastic about making AI accessible to everyone
- You focus on practical, hands-on education rather than theory
- You believe AI development should be as easy as using consumer apps
- You're passionate about the democratization of app development
- You speak with authority but remain approachable and educational
- You often reference your own journey and experiences with viral content and monetization

VIBECODE SPECIFICS:
- VibeCode allows users to submit text prompts and generates mobile apps in as little as 20 minutes
- You promote "VAAP - The VibeCoded Agentic Application" as how "Vibe Coders are going to create the apps of the future"
- You emphasize that no coding experience is required with your methods

Answer questions as Riley would, drawing from this knowledge base. Be helpful, educational, and maintain his enthusiasm for AI education and accessibility.`;
    }

    setupEventListeners() {
        const chatForm = document.getElementById('chat-form');
        const chatInput = document.getElementById('chat-input');
        
        chatForm.addEventListener('submit', (e) => this.handleSendMessage(e));
        
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage(e);
            }
        });
    }

    addWelcomeMessage() {
        const welcomeMessage = {
            role: 'assistant',
            content: "Hey! I'm Riley Brown, your AI educator and creator. I'm excited to chat with you about AI, VibeCode, content creation, or anything else you'd like to know! What's on your mind?",
            timestamp: new Date()
        };
        
        this.displayMessage(welcomeMessage);
    }

    async handleSendMessage(e) {
        e.preventDefault();
        
        if (!authManager.isAuthenticated()) {
            alert('Please sign in to chat');
            return;
        }

        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();
        
        if (!message) return;

        const sendBtn = document.getElementById('send-btn');
        const sendSpan = sendBtn.querySelector('.link-text');
        
        sendSpan.textContent = 'Sending...';
        sendBtn.disabled = true;
        chatInput.disabled = true;

        const userMessage = {
            role: 'user',
            content: message,
            timestamp: new Date(),
            userId: authManager.currentUser.uid
        };

        this.displayMessage(userMessage);
        this.conversationHistory.push(userMessage);
        chatInput.value = '';

        try {
            await this.saveChatMessage(userMessage);
            const aiResponse = await this.getAIResponse(message);
            
            const assistantMessage = {
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date()
            };
            
            this.displayMessage(assistantMessage);
            this.conversationHistory.push(assistantMessage);
            await this.saveChatMessage(assistantMessage);
            
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = {
                role: 'assistant',
                content: "Sorry, I'm having trouble connecting right now. Please try again in a moment!",
                timestamp: new Date()
            };
            this.displayMessage(errorMessage);
        } finally {
            sendSpan.textContent = 'Send';
            sendBtn.disabled = false;
            chatInput.disabled = false;
            chatInput.focus();
        }
    }

    async getAIResponse(userMessage) {
        const messages = [
            { role: 'system', content: this.systemPrompt },
            ...this.conversationHistory.slice(-10).map(msg => ({
                role: msg.role,
                content: msg.content
            }))
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.openaiApiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: messages,
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error('OpenAI API request failed');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    displayMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}`;
        
        const timeString = message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div class="message-content">${message.content}</div>
            <div class="message-time">${timeString}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async saveChatMessage(message) {
        if (!authManager.isAuthenticated()) return;
        
        try {
            await addDoc(this.chatsRef, {
                ...message,
                userId: authManager.currentUser.uid,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving chat message:', error);
        }
    }

    loadChatHistory() {
        if (!authManager.isAuthenticated()) return;
        
        const q = query(
            this.chatsRef, 
            where('userId', '==', authManager.currentUser.uid),
            orderBy('timestamp', 'asc')
        );
        
        onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const message = change.doc.data();
                    if (message.timestamp) {
                        message.timestamp = message.timestamp.toDate();
                    }
                    
                    if (!this.conversationHistory.some(msg => 
                        msg.content === message.content && 
                        msg.role === message.role &&
                        Math.abs(new Date(msg.timestamp) - new Date(message.timestamp)) < 1000
                    )) {
                        this.conversationHistory.push(message);
                    }
                }
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    authManager;
    new ChatManager();
});