/**
 * Input Handler - Keyboard and Mouse Input Management
 * Built from scratch for game controls
 * No external dependencies
 */

class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Input state
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 0,
            locked: false,
            buttons: {}
        };
        
        // Input callbacks
        this.callbacks = {
            keyDown: [],
            keyUp: [],
            mouseMove: [],
            mouseDown: [],
            mouseUp: [],
            pointerLockChange: []
        };
        
        // Movement state
        this.movement = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            interact: false,
            toggleCamera: false
        };
        
        // Key mappings
        this.keyMappings = {
            'KeyW': 'forward',
            'KeyS': 'backward',
            'KeyA': 'left',
            'KeyD': 'right',
            'Space': 'jump',
            'KeyE': 'interact',
            'KeyC': 'toggleCamera'
        };
        
        // Initialize input handlers
        this.init();
    }

    init() {
        // Keyboard event listeners
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
        document.addEventListener('keyup', (event) => this.handleKeyUp(event));
        
        // Mouse event listeners
        this.canvas.addEventListener('click', () => this.requestPointerLock());
        document.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        document.addEventListener('mousedown', (event) => this.handleMouseDown(event));
        document.addEventListener('mouseup', (event) => this.handleMouseUp(event));
        
        // Pointer lock event listeners
        document.addEventListener('pointerlockchange', () => this.handlePointerLockChange());
        document.addEventListener('pointerlockerror', () => this.handlePointerLockError());
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
        
        // Window focus/blur events
        window.addEventListener('blur', () => this.handleWindowBlur());
        window.addEventListener('focus', () => this.handleWindowFocus());
        
        // Escape key to release pointer lock
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape' && this.mouse.locked) {
                document.exitPointerLock();
            }
        });
        
        console.log('Input manager initialized');
    }

    // Handle key down events
    handleKeyDown(event) {
        const code = event.code;
        
        // Prevent default behavior for game keys
        if (this.keyMappings[code]) {
            event.preventDefault();
        }
        
        // Update key state
        this.keys[code] = true;
        
        // Update movement state
        const action = this.keyMappings[code];
        if (action && this.movement.hasOwnProperty(action)) {
            this.movement[action] = true;
        }
        
        // Call callbacks
        this.callbacks.keyDown.forEach(callback => callback(event, code));
    }

    // Handle key up events
    handleKeyUp(event) {
        const code = event.code;
        
        // Update key state
        this.keys[code] = false;
        
        // Update movement state
        const action = this.keyMappings[code];
        if (action && this.movement.hasOwnProperty(action)) {
            this.movement[action] = false;
        }
        
        // Call callbacks
        this.callbacks.keyUp.forEach(callback => callback(event, code));
    }

    // Handle mouse movement
    handleMouseMove(event) {
        if (this.mouse.locked) {
            this.mouse.deltaX = event.movementX || 0;
            this.mouse.deltaY = event.movementY || 0;
        } else {
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
            this.mouse.deltaX = 0;
            this.mouse.deltaY = 0;
        }
        
        // Call callbacks
        this.callbacks.mouseMove.forEach(callback => callback(event, this.mouse));
    }

    // Handle mouse down events
    handleMouseDown(event) {
        this.mouse.buttons[event.button] = true;
        
        // Call callbacks
        this.callbacks.mouseDown.forEach(callback => callback(event, event.button));
    }

    // Handle mouse up events
    handleMouseUp(event) {
        this.mouse.buttons[event.button] = false;
        
        // Call callbacks
        this.callbacks.mouseUp.forEach(callback => callback(event, event.button));
    }

    // Handle pointer lock change
    handlePointerLockChange() {
        this.mouse.locked = document.pointerLockElement === this.canvas;
        
        // Update cursor visibility
        if (this.mouse.locked) {
            document.body.style.cursor = 'none';
        } else {
            document.body.style.cursor = 'default';
        }
        
        // Call callbacks
        this.callbacks.pointerLockChange.forEach(callback => callback(this.mouse.locked));
        
        console.log('Pointer lock:', this.mouse.locked ? 'enabled' : 'disabled');
    }

    // Handle pointer lock error
    handlePointerLockError() {
        console.error('Pointer lock failed');
    }

    // Handle window blur (lose focus)
    handleWindowBlur() {
        // Clear all input states when window loses focus
        this.keys = {};
        this.mouse.buttons = {};
        
        // Clear movement state
        Object.keys(this.movement).forEach(key => {
            this.movement[key] = false;
        });
        
        console.log('Window lost focus - input cleared');
    }

    // Handle window focus
    handleWindowFocus() {
        console.log('Window gained focus');
    }

    // Request pointer lock
    requestPointerLock() {
        if (!this.mouse.locked) {
            this.canvas.requestPointerLock();
        }
    }

    // Release pointer lock
    releasePointerLock() {
        if (this.mouse.locked) {
            document.exitPointerLock();
        }
    }

    // Check if key is pressed
    isKeyPressed(keyCode) {
        return !!this.keys[keyCode];
    }

    // Check if mouse button is pressed
    isMouseButtonPressed(button) {
        return !!this.mouse.buttons[button];
    }

    // Get movement input state
    getMovementInput() {
        return {
            forward: this.movement.forward,
            backward: this.movement.backward,
            left: this.movement.left,
            right: this.movement.right,
            jump: this.movement.jump,
            interact: this.movement.interact,
            toggleCamera: this.movement.toggleCamera
        };
    }

    // Get mouse delta (for camera rotation)
    getMouseDelta() {
        const delta = {
            x: this.mouse.deltaX,
            y: this.mouse.deltaY
        };
        
        // Reset delta after reading
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        
        return delta;
    }

    // Add event callback
    addEventListener(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    // Remove event callback
    removeEventListener(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index !== -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    }

    // Set key mapping
    setKeyMapping(keyCode, action) {
        this.keyMappings[keyCode] = action;
    }

    // Get key mapping
    getKeyMapping(keyCode) {
        return this.keyMappings[keyCode];
    }

    // Clear all key mappings
    clearKeyMappings() {
        this.keyMappings = {};
    }

    // Reset input state
    reset() {
        this.keys = {};
        this.mouse.buttons = {};
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        
        Object.keys(this.movement).forEach(key => {
            this.movement[key] = false;
        });
    }

    // Get debug information
    getDebugInfo() {
        const pressedKeys = Object.keys(this.keys).filter(key => this.keys[key]);
        const pressedButtons = Object.keys(this.mouse.buttons).filter(button => this.mouse.buttons[button]);
        
        return {
            pointerLocked: this.mouse.locked,
            pressedKeys: pressedKeys,
            pressedButtons: pressedButtons,
            movement: this.movement,
            mousePosition: { x: this.mouse.x, y: this.mouse.y }
        };
    }

    // Destroy input manager
    destroy() {
        // Remove all event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
        document.removeEventListener('pointerlockerror', this.handlePointerLockError);
        
        this.canvas.removeEventListener('click', this.requestPointerLock);
        this.canvas.removeEventListener('contextmenu', (event) => event.preventDefault());
        
        window.removeEventListener('blur', this.handleWindowBlur);
        window.removeEventListener('focus', this.handleWindowFocus);
        
        // Release pointer lock
        this.releasePointerLock();
        
        console.log('Input manager destroyed');
    }
}

// ============================================================================
// Input Helper Functions
// ============================================================================

// Create a simple input configuration system
class InputConfig {
    constructor() {
        this.configs = {
            default: {
                'KeyW': 'forward',
                'KeyS': 'backward',
                'KeyA': 'left',
                'KeyD': 'right',
                'Space': 'jump',
                'KeyE': 'interact',
                'KeyC': 'toggleCamera',
                'Escape': 'menu'
            },
            alternative: {
                'ArrowUp': 'forward',
                'ArrowDown': 'backward',
                'ArrowLeft': 'left',
                'ArrowRight': 'right',
                'Enter': 'jump',
                'KeyF': 'interact',
                'KeyV': 'toggleCamera',
                'Escape': 'menu'
            }
        };
        
        this.currentConfig = 'default';
    }

    // Get current configuration
    getCurrentConfig() {
        return this.configs[this.currentConfig];
    }

    // Set configuration
    setConfig(configName) {
        if (this.configs[configName]) {
            this.currentConfig = configName;
            return true;
        }
        return false;
    }

    // Add custom configuration
    addConfig(name, config) {
        this.configs[name] = config;
    }

    // Get available configurations
    getAvailableConfigs() {
        return Object.keys(this.configs);
    }
}

// Touch input support for mobile devices
class TouchInputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.touches = {};
        this.virtualJoystick = null;
        this.touchButtons = {};
        
        this.init();
    }

    init() {
        // Touch event listeners
        this.canvas.addEventListener('touchstart', (event) => this.handleTouchStart(event));
        this.canvas.addEventListener('touchmove', (event) => this.handleTouchMove(event));
        this.canvas.addEventListener('touchend', (event) => this.handleTouchEnd(event));
        this.canvas.addEventListener('touchcancel', (event) => this.handleTouchCancel(event));
        
        // Prevent default touch behaviors
        this.canvas.addEventListener('touchstart', (event) => event.preventDefault());
        this.canvas.addEventListener('touchmove', (event) => event.preventDefault());
    }

    handleTouchStart(event) {
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            this.touches[touch.identifier] = {
                x: touch.clientX,
                y: touch.clientY,
                startX: touch.clientX,
                startY: touch.clientY
            };
        }
    }

    handleTouchMove(event) {
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            if (this.touches[touch.identifier]) {
                this.touches[touch.identifier].x = touch.clientX;
                this.touches[touch.identifier].y = touch.clientY;
            }
        }
    }

    handleTouchEnd(event) {
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            delete this.touches[touch.identifier];
        }
    }

    handleTouchCancel(event) {
        this.handleTouchEnd(event);
    }

    // Get touch input as movement
    getTouchMovement() {
        const movement = { x: 0, y: 0 };
        
        // Simple implementation - use first touch for movement
        const touchIds = Object.keys(this.touches);
        if (touchIds.length > 0) {
            const touch = this.touches[touchIds[0]];
            movement.x = touch.x - touch.startX;
            movement.y = touch.y - touch.startY;
        }
        
        return movement;
    }
}

// Export for global use
window.InputManager = InputManager;
window.InputConfig = InputConfig;
window.TouchInputManager = TouchInputManager;
