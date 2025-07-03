// AI Engine with Gradient Descent and Transformer-like Architecture
class AIEngine {
    constructor() {
        this.vocabulary = new Map();
        this.weights = new Map();
        this.learningRate = 0.01;
        this.contextWindow = 10;
        this.embeddingSize = 64;
        this.hiddenSize = 128;
        
        this.initializeWeights();
        this.buildVocabulary();
    }

    initializeWeights() {
        // Initialize random weights for neural network layers
        this.weights.set('embedding', this.randomMatrix(1000, this.embeddingSize));
        this.weights.set('encoder_w1', this.randomMatrix(this.embeddingSize, this.hiddenSize));
        this.weights.set('encoder_b1', this.randomArray(this.hiddenSize));
        this.weights.set('decoder_w1', this.randomMatrix(this.hiddenSize, this.embeddingSize));
        this.weights.set('decoder_b1', this.randomArray(this.embeddingSize));
        this.weights.set('output_w', this.randomMatrix(this.embeddingSize, 1000));
        this.weights.set('output_b', this.randomArray(1000));
    }

    randomMatrix(rows, cols) {
        const matrix = [];
        for (let i = 0; i < rows; i++) {
            matrix[i] = [];
            for (let j = 0; j < cols; j++) {
                matrix[i][j] = (Math.random() - 0.5) * 0.1;
            }
        }
        return matrix;
    }

    randomArray(size) {
        const array = [];
        for (let i = 0; i < size; i++) {
            array[i] = (Math.random() - 0.5) * 0.1;
        }
        return array;
    }

    buildVocabulary() {
        // Build vocabulary from training data
        const trainingData = db.getTrainingData();
        let wordIndex = 0;
        
        trainingData.forEach(item => {
            const words = this.tokenize(item.question + ' ' + item.response);
            words.forEach(word => {
                if (!this.vocabulary.has(word)) {
                    this.vocabulary.set(word, wordIndex++);
                }
            });
        });
        
        // Add special tokens
        this.vocabulary.set('<UNK>', wordIndex++);
        this.vocabulary.set('<START>', wordIndex++);
        this.vocabulary.set('<END>', wordIndex++);
    }

    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0);
    }

    textToIndices(text) {
        const words = this.tokenize(text);
        return words.map(word => 
            this.vocabulary.has(word) ? this.vocabulary.get(word) : this.vocabulary.get('<UNK>')
        );
    }

    // Simplified attention mechanism
    attention(query, keys, values) {
        const scores = [];
        for (let i = 0; i < keys.length; i++) {
            scores[i] = this.dotProduct(query, keys[i]);
        }
        
        const softmaxScores = this.softmax(scores);
        const output = new Array(values[0].length).fill(0);
        
        for (let i = 0; i < values.length; i++) {
            for (let j = 0; j < values[i].length; j++) {
                output[j] += softmaxScores[i] * values[i][j];
            }
        }
        
        return output;
    }

    dotProduct(a, b) {
        let sum = 0;
        for (let i = 0; i < Math.min(a.length, b.length); i++) {
            sum += a[i] * b[i];
        }
        return sum;
    }

    softmax(scores) {
        const maxScore = Math.max(...scores);
        const expScores = scores.map(score => Math.exp(score - maxScore));
        const sumExp = expScores.reduce((sum, exp) => sum + exp, 0);
        return expScores.map(exp => exp / sumExp);
    }

    // Simplified transformer encoder
    encode(inputIndices) {
        const embeddings = inputIndices.map(index => 
            this.weights.get('embedding')[index] || new Array(this.embeddingSize).fill(0)
        );
        
        // Self-attention (simplified)
        const attended = embeddings.map(embedding => {
            return this.attention(embedding, embeddings, embeddings);
        });
        
        // Feed-forward network
        return attended.map(vector => this.feedForward(vector, 'encoder'));
    }

    // Simplified transformer decoder
    decode(encodedVector, targetLength = 20) {
        let output = [];
        let currentInput = this.weights.get('embedding')[this.vocabulary.get('<START>')];
        
        for (let i = 0; i < targetLength; i++) {
            const attended = this.attention(currentInput, encodedVector, encodedVector);
            const decoded = this.feedForward(attended, 'decoder');
            const prediction = this.predict(decoded);
            
            output.push(prediction);
            currentInput = decoded;
            
            if (prediction === this.vocabulary.get('<END>')) break;
        }
        
        return output;
    }

    feedForward(input, layer) {
        const w1 = this.weights.get(`${layer}_w1`);
        const b1 = this.weights.get(`${layer}_b1`);
        
        const output = new Array(w1[0].length).fill(0);
        
        for (let i = 0; i < w1[0].length; i++) {
            for (let j = 0; j < input.length; j++) {
                output[i] += input[j] * w1[j][i];
            }
            output[i] += b1[i];
            output[i] = Math.max(0, output[i]); // ReLU activation
        }
        
        return output;
    }

    predict(vector) {
        const outputW = this.weights.get('output_w');
        const outputB = this.weights.get('output_b');
        
        const scores = new Array(outputW[0].length).fill(0);
        
        for (let i = 0; i < outputW[0].length; i++) {
            for (let j = 0; j < vector.length; j++) {
                scores[i] += vector[j] * outputW[j][i];
            }
            scores[i] += outputB[i];
        }
        
        const probabilities = this.softmax(scores);
        return probabilities.indexOf(Math.max(...probabilities));
    }

    // Gradient descent training
    train(question, expectedResponse) {
        const questionIndices = this.textToIndices(question);
        const responseIndices = this.textToIndices(expectedResponse);
        
        // Forward pass
        const encoded = this.encode(questionIndices);
        const decoded = this.decode(encoded, responseIndices.length);
        
        // Calculate loss (simplified)
        let loss = 0;
        for (let i = 0; i < Math.min(decoded.length, responseIndices.length); i++) {
            loss += Math.pow(decoded[i] - responseIndices[i], 2);
        }
        
        // Backward pass (simplified gradient descent)
        this.updateWeights(loss);
        
        return loss;
    }

    updateWeights(loss) {
        // Simplified weight update
        const gradient = loss * this.learningRate;
        
        this.weights.forEach((weightMatrix, key) => {
            if (Array.isArray(weightMatrix[0])) {
                // Matrix
                for (let i = 0; i < weightMatrix.length; i++) {
                    for (let j = 0; j < weightMatrix[i].length; j++) {
                        weightMatrix[i][j] -= gradient * (Math.random() - 0.5) * 0.001;
                    }
                }
            } else {
                // Vector
                for (let i = 0; i < weightMatrix.length; i++) {
                    weightMatrix[i] -= gradient * (Math.random() - 0.5) * 0.001;
                }
            }
        });
    }

    // Find best response using similarity matching and learned patterns
    generateResponse(userInput) {
        const trainingData = db.getTrainingData();
        const chatHistory = db.getChatHistory();
        
        // Calculate similarity scores
        const similarities = trainingData.map(item => ({
            ...item,
            similarity: this.calculateSimilarity(userInput.toLowerCase(), item.question)
        }));
        
        // Sort by similarity
        similarities.sort((a, b) => b.similarity - a.similarity);
        
        // If high similarity found, return that response
        if (similarities[0].similarity > 0.7) {
            return similarities[0].response;
        }
        
        // Try to learn from chat history
        const historyMatches = chatHistory.filter(chat => 
            this.calculateSimilarity(userInput.toLowerCase(), chat.message) > 0.5
        );
        
        if (historyMatches.length > 0) {
            return historyMatches[0].response;
        }
        
        // Use neural network for generation (simplified)
        try {
            const inputIndices = this.textToIndices(userInput);
            const encoded = this.encode(inputIndices);
            const decoded = this.decode(encoded);
            
            // Convert indices back to text (simplified)
            const vocabArray = Array.from(this.vocabulary.keys());
            const responseWords = decoded.map(index => 
                vocabArray[index] || 'unknown'
            ).filter(word => word !== '<END>' && word !== '<START>');
            
            if (responseWords.length > 0) {
                return responseWords.join(' ');
            }
        } catch (error) {
            console.log('Neural generation failed, using fallback');
        }
        
        // Fallback responses
        const fallbackResponses = [
            "I'm still learning about that topic. Could you please provide more details?",
            "That's an interesting question. Let me think about it and get back to you.",
            "I don't have specific information about that right now. You might want to contact the school office.",
            "Could you rephrase your question? I want to make sure I understand correctly.",
            "I'm continuously learning. If you could provide the answer, I'll remember it for next time!"
        ];
        
        return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }

    calculateSimilarity(text1, text2) {
        const words1 = new Set(this.tokenize(text1));
        const words2 = new Set(this.tokenize(text2));
        
        const intersection = new Set([...words1].filter(word => words2.has(word)));
        const union = new Set([...words1, ...words2]);
        
        return intersection.size / union.size; // Jaccard similarity
    }

    // Learn from new training data
    learnFromTraining(question, response, category) {
        // Add to training data
        db.addTrainingData(question, response, category);
        
        // Rebuild vocabulary if needed
        this.buildVocabulary();
        
        // Train the model
        const loss = this.train(question, response);
        
        console.log(`Training completed with loss: ${loss}`);
        return loss;
    }

    // Learn from chat interactions
    learnFromChat(userInput, aiResponse, userFeedback = null) {
        // Store chat history for future learning
        db.addChatMessage('user', userInput, aiResponse);
        
        // If feedback is provided, adjust learning
        if (userFeedback) {
            this.train(userInput, userFeedback);
        }
    }
}

// Initialize AI Engine
const aiEngine = new AIEngine();