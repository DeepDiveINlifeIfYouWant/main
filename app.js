// Main Application Logic
class SchoolChatApp {
    constructor() {
        this.currentUser = null;
        this.currentScreen = 'login';
        this.initializeEventListeners();
        this.showScreen('loginScreen');
    }

    initializeEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Chat functionality
        document.getElementById('sendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Logout buttons
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        document.getElementById('logoutAdminBtn').addEventListener('click', () => {
            this.logout();
        });

        // Admin panel
        document.getElementById('backToChatBtn').addEventListener('click', () => {
            this.showScreen('chatScreen');
        });

        document.getElementById('trainBtn').addEventListener('click', () => {
            this.handleTraining();
        });

        // Admin panel access (double-click on header for admins)
        document.querySelector('.chat-header h2').addEventListener('dblclick', () => {
            if (this.currentUser && this.currentUser.type === 'administrator') {
                this.showAdminPanel();
            }
        });
    }

    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const userType = document.getElementById('userType').value;

        const user = db.authenticateUser(username, password, userType);
        
        if (user) {
            this.currentUser = { ...user, username };
            document.getElementById('currentUser').textContent = `${user.name} (${user.type})`;
            this.showScreen('chatScreen');
            this.addWelcomeMessage();
        } else {
            alert('Invalid credentials. Please try again.');
        }
    }

    logout() {
        this.currentUser = null;
        this.showScreen('loginScreen');
        this.clearChat();
        document.getElementById('loginForm').reset();
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;
    }

    addWelcomeMessage() {
        const welcomeMessages = {
            administrator: "Welcome, Administrator! You have full access to all features. Double-click the header to access the AI training panel.",
            teacher: "Welcome, Teacher! I can help you with class schedules, student information, and administrative tasks.",
            student: "Welcome, Student! I can help you with homework, schedules, and school information.",
            parent: "Welcome, Parent! I can help you with your child's progress, school events, and communication with teachers.",
            simple: "Welcome! I can help you with general school information and answer your questions."
        };

        const message = welcomeMessages[this.currentUser.type] || welcomeMessages.simple;
        this.addMessage(message, 'ai');
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        // Generate AI response
        setTimeout(() => {
            this.hideTypingIndicator();
            const response = aiEngine.generateResponse(message);
            this.addMessage(response, 'ai');
            
            // Learn from this interaction
            aiEngine.learnFromChat(message, response);
        }, 1000 + Math.random() * 2000); // Simulate thinking time
    }

    addMessage(content, sender) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message';
        typingDiv.id = 'typingIndicator';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content typing-indicator';
        contentDiv.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        
        typingDiv.appendChild(contentDiv);
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    clearChat() {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = `
            <div class="message ai-message">
                <div class="message-content">
                    Hello! I'm your AI school assistant. How can I help you today?
                </div>
            </div>
        `;
    }

    showAdminPanel() {
        this.showScreen('adminPanel');
        this.loadTrainingData();
    }

    loadTrainingData() {
        const trainingDataList = document.getElementById('trainingDataList');
        const trainingData = db.getTrainingData();
        
        trainingDataList.innerHTML = '';
        
        trainingData.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'training-item';
            itemDiv.innerHTML = `
                <h4>Question: ${item.question}</h4>
                <p><strong>Response:</strong> ${item.response}</p>
                <span class="category">${item.category}</span>
            `;
            trainingDataList.appendChild(itemDiv);
        });
    }

    handleTraining() {
        const question = document.getElementById('trainingQuestion').value.trim();
        const response = document.getElementById('trainingResponse').value.trim();
        const category = document.getElementById('responseCategory').value;

        if (!question || !response) {
            alert('Please fill in both question and response fields.');
            return;
        }

        // Train the AI
        const loss = aiEngine.learnFromTraining(question, response, category);
        
        // Clear form
        document.getElementById('trainingQuestion').value = '';
        document.getElementById('trainingResponse').value = '';
        
        // Reload training data display
        this.loadTrainingData();
        
        alert(`Training completed successfully! Loss: ${loss.toFixed(4)}`);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SchoolChatApp();
});

// Add some demo functionality
window.addEventListener('load', () => {
    console.log('School AI Chatbot System Loaded');
    console.log('Demo Credentials:');
    console.log('Administrator: admin / admin123');
    console.log('Teacher: teacher1 / teach123');
    console.log('Student: student1 / stud123');
    console.log('Parent: parent1 / parent123');
    console.log('Simple User: user1 / user123');
});