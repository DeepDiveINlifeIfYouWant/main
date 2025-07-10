/**
 * Main Entry Point - House Explorer 3D Game
 * Initializes and starts the complete game engine
 * Built from scratch with pure WebGL and JavaScript
 */

// Global game instance
let game = null;

// Debug mode
const DEBUG_MODE = true;

// Initialize the game when the page loads
window.addEventListener('load', async () => {
    console.log('🏠 House Explorer - Starting initialization...');
    
    try {
        // Get the canvas element
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found');
        }
        
        // Set canvas size to full window
        resizeCanvas(canvas);
        
        // Initialize the game engine
        game = new GameEngine(canvas);
        
        // Set up debug console if in debug mode
        if (DEBUG_MODE) {
            setupDebugConsole();
        }
        
        // Set up additional event listeners
        setupEventListeners();
        
        console.log('🎮 House Explorer initialized successfully!');
        console.log('📋 Instructions:');
        console.log('   • Click the canvas to start');
        console.log('   • WASD: Move around');
        console.log('   • Mouse: Look around');
        console.log('   • Space: Jump');
        console.log('   • E: Interact with door');
        console.log('   • C: Toggle camera mode');
        console.log('   • ESC: Release mouse');
        
    } catch (error) {
        console.error('❌ Failed to initialize House Explorer:', error);
        showErrorMessage(error.message);
    }
});

// Resize canvas to match window size
function resizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Update canvas style to fill the window
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
}

// Set up additional event listeners
function setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', () => {
        if (game && game.canvas) {
            resizeCanvas(game.canvas);
            game.handleResize();
        }
    });
    
    // Handle visibility change (pause when tab is not visible)
    document.addEventListener('visibilitychange', () => {
        if (game) {
            if (document.hidden) {
                console.log('🔇 Tab hidden - pausing game');
                // Don't auto-pause as it might be annoying
                // game.pause();
            } else {
                console.log('🔊 Tab visible - resuming game');
                // game.pause(); // Resume if paused
            }
        }
    });
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
        if (game) {
            game.destroy();
        }
    });
    
    // Keyboard shortcuts for debug
    if (DEBUG_MODE) {
        document.addEventListener('keydown', (event) => {
            // Don't interfere with game input when pointer is locked
            if (game && game.inputManager && game.inputManager.mouse.locked) {
                return;
            }
            
            switch (event.code) {
                case 'F1':
                    event.preventDefault();
                    toggleDebugInfo();
                    break;
                case 'F2':
                    event.preventDefault();
                    if (game) game.pause();
                    break;
                case 'F3':
                    event.preventDefault();
                    toggleWireframe();
                    break;
                case 'F4':
                    event.preventDefault();
                    if (game && game.lightingSystem) {
                        game.lightingSystem.toggleTimeAnimation();
                    }
                    break;
            }
        });
    }
}

// Set up debug console
function setupDebugConsole() {
    // Create debug panel
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debugPanel';
    debugPanel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        z-index: 1000;
        max-width: 300px;
        display: none;
    `;
    document.body.appendChild(debugPanel);
    
    // Update debug info periodically
    setInterval(updateDebugInfo, 1000);
    
    console.log('🔧 Debug mode enabled');
    console.log('   F1: Toggle debug info');
    console.log('   F2: Pause/Resume game');
    console.log('   F3: Toggle wireframe');
    console.log('   F4: Toggle time animation');
}

// Toggle debug information display
function toggleDebugInfo() {
    const debugPanel = document.getElementById('debugPanel');
    if (debugPanel) {
        debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
    }
}

// Update debug information
function updateDebugInfo() {
    if (!game || !DEBUG_MODE) return;
    
    const debugPanel = document.getElementById('debugPanel');
    if (!debugPanel || debugPanel.style.display === 'none') return;
    
    try {
        const debugInfo = game.getDebugInfo();
        
        debugPanel.innerHTML = `
            <h4>🔧 Debug Info</h4>
            <div><strong>Performance:</strong></div>
            <div>FPS: ${debugInfo.fps}</div>
            <div>Frame Time: ${debugInfo.frameTime}</div>
            <div>Render Time: ${debugInfo.renderTime}</div>
            <div>Update Time: ${debugInfo.updateTime}</div>
            <div>Draw Calls: ${debugInfo.drawCalls}</div>
            
            <div><strong>Scene:</strong></div>
            <div>Visible Objects: ${debugInfo.visibleObjects}</div>
            <div>Total Objects: ${debugInfo.totalObjects}</div>
            
            <div><strong>Camera:</strong></div>
            <div>Position: ${debugInfo.camera.position}</div>
            <div>Mode: ${debugInfo.camera.mode}</div>
            <div>Grounded: ${debugInfo.camera.isGrounded}</div>
            
            <div><strong>Lighting:</strong></div>
            <div>Time: ${debugInfo.lighting.timeOfDay}h</div>
            <div>Sun Intensity: ${debugInfo.lighting.sunIntensity}</div>
            
            <div><strong>Input:</strong></div>
            <div>Pointer Locked: ${debugInfo.input.pointerLocked}</div>
            <div>Keys: ${debugInfo.input.pressedKeys.join(', ') || 'None'}</div>
        `;
    } catch (error) {
        debugPanel.innerHTML = `<div style="color: red;">Debug Error: ${error.message}</div>`;
    }
}

// Toggle wireframe mode (if supported)
function toggleWireframe() {
    if (game && game.webglManager) {
        const gl = game.webglManager.gl;
        // WebGL doesn't support wireframe mode directly
        // This would require implementing it in shaders
        console.log('⚠️ Wireframe mode not implemented (requires shader modification)');
    }
}

// Show error message to user
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        z-index: 10000;
        font-family: Arial, sans-serif;
    `;
    
    errorDiv.innerHTML = `
        <h3>❌ Error</h3>
        <p>${message}</p>
        <p>Please check the console for more details.</p>
        <button onclick="location.reload()" style="
            background: white;
            color: red;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 10px;
        ">Reload Page</button>
    `;
    
    document.body.appendChild(errorDiv);
}

// Utility function to check WebGL support
function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
    } catch (e) {
        return false;
    }
}

// Performance monitoring
function setupPerformanceMonitoring() {
    if (!DEBUG_MODE) return;
    
    // Monitor memory usage (if available)
    if (performance.memory) {
        setInterval(() => {
            const memory = performance.memory;
            console.log(`📊 Memory: ${(memory.usedJSHeapSize / 1048576).toFixed(2)}MB used, ${(memory.totalJSHeapSize / 1048576).toFixed(2)}MB total`);
        }, 10000); // Every 10 seconds
    }
    
    // Monitor frame rate
    let frameCount = 0;
    let lastTime = performance.now();
    
    function monitorFrameRate() {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 5000) { // Every 5 seconds
            const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
            if (fps < 30) {
                console.warn(`⚠️ Low FPS detected: ${fps}`);
            }
            frameCount = 0;
            lastTime = currentTime;
        }
        
        requestAnimationFrame(monitorFrameRate);
    }
    
    monitorFrameRate();
}

// Initialize performance monitoring
if (DEBUG_MODE) {
    setupPerformanceMonitoring();
}

// Check for WebGL support on page load
if (!checkWebGLSupport()) {
    window.addEventListener('load', () => {
        showErrorMessage('WebGL is not supported in your browser. Please use a modern browser with WebGL support.');
    });
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('🚨 Global error:', event.error);
    if (DEBUG_MODE) {
        showErrorMessage(`Unexpected error: ${event.error.message}`);
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
    if (DEBUG_MODE) {
        showErrorMessage(`Promise rejection: ${event.reason}`);
    }
});

// Export game instance for console debugging
if (DEBUG_MODE) {
    window.game = game;
    window.debugGame = () => {
        if (game) {
            console.log('🎮 Game Debug Info:', game.getDebugInfo());
        } else {
            console.log('❌ Game not initialized');
        }
    };
}

console.log('🏠 House Explorer main script loaded');
console.log('🔗 GitHub: Built from scratch with pure WebGL and JavaScript');
console.log('📚 No external libraries used - everything is custom built!');

// Welcome message
console.log(`
🏠 Welcome to House Explorer! 🏠

A complete 3D game environment built from scratch using:
• Pure WebGL 1.0 (no Three.js)
• Vanilla JavaScript (no frameworks)
• Custom 3D math library
• Hand-written shaders (GLSL)
• Procedural terrain generation
• Real-time lighting system
• First/third-person camera
• Interactive house with door
• Physics and collision detection

Everything you see is built from the ground up!
Enjoy exploring! 🎮
`);
