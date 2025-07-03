// Simple client-side database simulation
class Database {
    constructor() {
        this.users = this.loadUsers();
        this.trainingData = this.loadTrainingData();
        this.chatHistory = this.loadChatHistory();
    }

    loadUsers() {
        const defaultUsers = {
            'admin': { password: 'admin123', type: 'administrator', name: 'Administrator' },
            'teacher1': { password: 'teach123', type: 'teacher', name: 'John Teacher' },
            'student1': { password: 'stud123', type: 'student', name: 'Alice Student' },
            'parent1': { password: 'parent123', type: 'parent', name: 'Bob Parent' },
            'user1': { password: 'user123', type: 'simple', name: 'Simple User' }
        };
        
        const stored = localStorage.getItem('school_users');
        return stored ? JSON.parse(stored) : defaultUsers;
    }

    loadTrainingData() {
        const defaultTraining = [
            {
                id: 1,
                question: "What are the school hours?",
                response: "School hours are from 8:00 AM to 3:30 PM, Monday through Friday.",
                category: "general",
                timestamp: Date.now()
            },
            {
                id: 2,
                question: "How do I contact the principal?",
                response: "You can contact the principal by calling the main office at (555) 123-4567 or emailing principal@school.edu",
                category: "administrative",
                timestamp: Date.now()
            },
            {
                id: 3,
                question: "When is the next parent-teacher conference?",
                response: "The next parent-teacher conference is scheduled for November 15th from 6:00 PM to 8:00 PM.",
                category: "events",
                timestamp: Date.now()
            }
        ];
        
        const stored = localStorage.getItem('training_data');
        return stored ? JSON.parse(stored) : defaultTraining;
    }

    loadChatHistory() {
        const stored = localStorage.getItem('chat_history');
        return stored ? JSON.parse(stored) : [];
    }

    saveUsers() {
        localStorage.setItem('school_users', JSON.stringify(this.users));
    }

    saveTrainingData() {
        localStorage.setItem('training_data', JSON.stringify(this.trainingData));
    }

    saveChatHistory() {
        localStorage.setItem('chat_history', JSON.stringify(this.chatHistory));
    }

    authenticateUser(username, password, userType) {
        const user = this.users[username];
        return user && user.password === password && user.type === userType ? user : null;
    }

    addTrainingData(question, response, category) {
        const newTraining = {
            id: Date.now(),
            question: question.toLowerCase(),
            response,
            category,
            timestamp: Date.now()
        };
        
        this.trainingData.push(newTraining);
        this.saveTrainingData();
        return newTraining;
    }

    addChatMessage(username, message, response) {
        const chatEntry = {
            username,
            message: message.toLowerCase(),
            response,
            timestamp: Date.now()
        };
        
        this.chatHistory.push(chatEntry);
        this.saveChatHistory();
    }

    getTrainingData() {
        return this.trainingData;
    }

    getChatHistory() {
        return this.chatHistory;
    }
}

// Initialize database
const db = new Database();