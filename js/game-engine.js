/**
 * Game Engine - Core Game Loop and System Management
 * Built from scratch to coordinate all game systems
 * No external dependencies
 */

class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Core systems
        this.webglManager = null;
        this.shaderManager = null;
        this.bufferManager = null;
        this.textureManager = null;
        this.uniformManager = null;
        this.meshRenderer = null;
        
        // Game systems
        this.camera = null;
        this.inputManager = null;
        this.lightingSystem = null;
        this.sceneManager = null;
        
        // Geometry and scene builders
        this.geometryBuilder = null;
        this.houseBuilder = null;
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.fpsUpdateInterval = 1000; // Update FPS every second
        this.lastFpsUpdate = 0;
        
        // Performance monitoring
        this.performance = {
            frameTime: 0,
            renderTime: 0,
            updateTime: 0,
            drawCalls: 0
        };
        
        // Game objects
        this.gameObjects = {
            house: null,
            terrain: null,
            road: null,
            trees: [],
            player: null
        };
        
        // Interaction state
        this.nearDoor = false;
        this.doorInteractionCooldown = 0;
        
        // Initialize the engine
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Game Engine...');
            
            // Initialize WebGL and core systems
            this.initWebGL();
            this.initSystems();
            await this.initScene();
            
            console.log('Game Engine initialized successfully!');
            
            // Hide loading screen
            const loading = document.getElementById('loading');
            if (loading) {
                loading.style.display = 'none';
            }
            
            // Start the game loop
            this.start();
            
        } catch (error) {
            console.error('Failed to initialize Game Engine:', error);
            this.showError('Failed to initialize the game. Please check your browser supports WebGL.');
        }
    }

    initWebGL() {
        // Initialize WebGL manager
        this.webglManager = new WebGLManager(this.canvas);
        const gl = this.webglManager.gl;
        
        // Initialize subsystems
        this.shaderManager = new ShaderManager(gl);
        this.bufferManager = new BufferManager(gl);
        this.textureManager = new TextureManager(gl);
        this.uniformManager = new UniformManager(gl);
        this.meshRenderer = new MeshRenderer(gl, this.bufferManager, this.uniformManager);
        
        // Create shader programs
        this.shaderManager.createProgram(VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE, 'main');
        this.shaderManager.createProgram(SIMPLE_VERTEX_SHADER_SOURCE, SIMPLE_FRAGMENT_SHADER_SOURCE, 'simple');
        
        console.log('WebGL systems initialized');
    }

    initSystems() {
        // Initialize camera
        this.camera = new Camera();
        this.camera.setAspectRatio(this.canvas.width / this.canvas.height);
        this.camera.setPosition(new Vec3(0, 2, 10));
        
        // Initialize input manager
        this.inputManager = new InputManager(this.canvas);
        
        // Initialize lighting system
        this.lightingSystem = new LightingSystem();
        
        // Initialize scene manager
        this.sceneManager = new SceneManager();
        
        // Initialize geometry builders
        this.geometryBuilder = new GeometryBuilder(this.bufferManager);
        this.houseBuilder = new HouseBuilder(this.geometryBuilder);
        
        // Set up input callbacks
        this.setupInputCallbacks();
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
        
        console.log('Game systems initialized');
    }

    async initScene() {
        console.log('Creating scene...');
        
        // Create terrain
        await this.createTerrain();
        
        // Create house
        this.createHouse();
        
        // Create road
        this.createRoad();
        
        // Create trees
        this.createTrees();
        
        // Create player
        this.createPlayer();
        
        console.log('Scene created successfully');
    }

    async createTerrain() {
        // Generate heightmap using Perlin noise
        const terrainSize = 128;
        const heightmap = generateMountainTerrain(terrainSize, terrainSize, {
            scale: 0.02,
            octaves: 6,
            amplitude: 25,
            seed: 12345
        });
        
        // Create terrain mesh
        const terrainMesh = this.geometryBuilder.createTerrain(
            heightmap, terrainSize, terrainSize, 200, 25, 200
        );
        
        // Create terrain object
        this.gameObjects.terrain = new Terrain(terrainMesh, heightmap, terrainSize, terrainSize);
        this.sceneManager.addObject(this.gameObjects.terrain);
        
        console.log('Terrain created');
    }

    createHouse() {
        // Create house using house builder
        const houseData = this.houseBuilder.createHouse();
        this.gameObjects.house = new House(houseData);
        this.sceneManager.addObject(this.gameObjects.house);
        
        console.log('House created');
    }

    createRoad() {
        // Create road mesh
        const roadMesh = this.geometryBuilder.createRoad(100, 6, 50);
        this.gameObjects.road = new Road(roadMesh);
        this.sceneManager.addObject(this.gameObjects.road);
        
        console.log('Road created');
    }

    createTrees() {
        // Create several trees around the scene
        const treePositions = [
            new Vec3(15, 0, -5),
            new Vec3(-12, 0, 8),
            new Vec3(8, 0, 20),
            new Vec3(-20, 0, -15),
            new Vec3(25, 0, 10)
        ];
        
        treePositions.forEach((position, index) => {
            const treeParts = this.geometryBuilder.createTree();
            const tree = new Tree(treeParts);
            tree.setPosition(position);
            
            // Adjust tree height based on terrain
            if (this.gameObjects.terrain) {
                const terrainHeight = this.gameObjects.terrain.getHeightAtPosition(position.x, position.z);
                tree.setPosition(position.x, terrainHeight, position.z);
            }
            
            this.gameObjects.trees.push(tree);
            this.sceneManager.addObject(tree);
        });
        
        console.log(`Created ${this.gameObjects.trees.length} trees`);
    }

    createPlayer() {
        // Create player character
        const playerParts = this.geometryBuilder.createPlayer();
        this.gameObjects.player = new Player(playerParts);
        
        // Position player in third-person mode
        this.gameObjects.player.setPosition(this.camera.position);
        this.sceneManager.addObject(this.gameObjects.player);
        
        console.log('Player created');
    }

    setupInputCallbacks() {
        // Camera toggle
        this.inputManager.addEventListener('keyDown', (event, code) => {
            if (code === 'KeyC') {
                this.camera.toggleMode();
                this.updateUI();
            }
        });
        
        // Door interaction
        this.inputManager.addEventListener('keyDown', (event, code) => {
            if (code === 'KeyE' && this.nearDoor && this.doorInteractionCooldown <= 0) {
                if (this.gameObjects.house) {
                    this.gameObjects.house.toggleDoor();
                    this.doorInteractionCooldown = 0.5; // Half second cooldown
                }
            }
        });
        
        // Mouse look
        this.inputManager.addEventListener('mouseMove', (event, mouse) => {
            if (mouse.locked) {
                this.camera.handleMouseMove(mouse.deltaX, mouse.deltaY);
            }
        });
    }

    handleResize() {
        this.webglManager.resize();
        this.camera.setAspectRatio(this.canvas.width / this.canvas.height);
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.gameLoop();
            console.log('Game started');
        }
    }

    stop() {
        this.isRunning = false;
        console.log('Game stopped');
    }

    pause() {
        this.isPaused = !this.isPaused;
        console.log('Game', this.isPaused ? 'paused' : 'resumed');
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;
        
        // Cap delta time to prevent large jumps
        this.deltaTime = Math.min(this.deltaTime, 1/30); // Max 30 FPS minimum
        
        if (!this.isPaused) {
            // Update phase
            const updateStart = performance.now();
            this.update(this.deltaTime);
            this.performance.updateTime = performance.now() - updateStart;
            
            // Render phase
            const renderStart = performance.now();
            this.render();
            this.performance.renderTime = performance.now() - renderStart;
        }
        
        // Update performance stats
        this.performance.frameTime = performance.now() - currentTime;
        this.updatePerformanceStats(currentTime);
        
        // Continue game loop
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        // Update input
        const movementInput = this.inputManager.getMovementInput();
        const mouseDelta = this.inputManager.getMouseDelta();
        
        // Update camera
        this.camera.handleMovement(movementInput, deltaTime);
        this.camera.update(deltaTime);
        
        // Update lighting system
        this.lightingSystem.update(deltaTime);
        
        // Update scene objects
        this.sceneManager.update(deltaTime);
        
        // Update player position to match camera (in first-person mode)
        if (this.gameObjects.player && this.camera.mode === 'first-person') {
            this.gameObjects.player.setPosition(this.camera.position);
            this.gameObjects.player.setWalking(
                movementInput.forward || movementInput.backward || 
                movementInput.left || movementInput.right
            );
        }
        
        // Check door interaction
        this.checkDoorInteraction();
        
        // Update interaction cooldowns
        if (this.doorInteractionCooldown > 0) {
            this.doorInteractionCooldown -= deltaTime;
        }
        
        // Update UI
        this.updateUI();
    }

    render() {
        const gl = this.webglManager.gl;
        this.performance.drawCalls = 0;
        
        // Clear the screen
        this.webglManager.clear();
        
        // Use main shader program
        const program = this.shaderManager.useProgram('main');
        
        // Set up global uniforms
        const globalUniforms = {
            uViewMatrix: this.camera.getViewMatrix(),
            uProjectionMatrix: this.camera.getProjectionMatrix(),
            uCameraPosition: this.camera.getPosition(),
            ...this.lightingSystem.getLightingUniforms()
        };
        
        // Get visible objects
        const visibleObjects = this.sceneManager.getVisibleObjects(this.camera);
        
        // Render each object
        visibleObjects.forEach(object => {
            const renderData = object.getRenderData();
            
            if (Array.isArray(renderData)) {
                // Composite object (like house, tree, player)
                renderData.forEach(data => {
                    if (data.visible) {
                        this.renderObject(data, globalUniforms);
                    }
                });
            } else if (renderData.visible) {
                // Single object
                this.renderObject(renderData, globalUniforms);
            }
        });
    }

    renderObject(renderData, globalUniforms) {
        const uniforms = {
            ...globalUniforms,
            uModelMatrix: renderData.modelMatrix,
            uNormalMatrix: renderData.normalMatrix,
            uDiffuseColor: renderData.material.diffuseColor || new Vec3(1, 1, 1),
            uSpecularColor: renderData.material.specularColor || new Vec3(1, 1, 1),
            uShininess: renderData.material.shininess || 32,
            uSpecularStrength: renderData.material.specularStrength || 0.5
        };
        
        this.meshRenderer.render(renderData.mesh, this.shaderManager.getProgram('main'), uniforms);
        this.performance.drawCalls++;
    }

    checkDoorInteraction() {
        if (this.gameObjects.house) {
            const playerPosition = this.camera.position;
            this.nearDoor = this.gameObjects.house.isPlayerNearDoor(playerPosition);
            
            // Update UI
            const doorStatus = document.getElementById('doorStatus');
            if (doorStatus) {
                doorStatus.style.display = this.nearDoor ? 'block' : 'none';
            }
        }
    }

    updatePerformanceStats(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFpsUpdate >= this.fpsUpdateInterval) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
    }

    updateUI() {
        // Update FPS
        const fpsElement = document.getElementById('fps');
        if (fpsElement) {
            fpsElement.textContent = this.fps;
        }
        
        // Update position
        const positionElement = document.getElementById('position');
        if (positionElement) {
            const pos = this.camera.position;
            positionElement.textContent = `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
        }
        
        // Update camera mode
        const cameraModeElement = document.getElementById('cameraMode');
        if (cameraModeElement) {
            cameraModeElement.textContent = this.camera.mode === 'first-person' ? 'First Person' : 'Third Person';
        }
    }

    showError(message) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.innerHTML = `
                <div style="color: red;">
                    <h3>Error</h3>
                    <p>${message}</p>
                    <p>Please try refreshing the page or using a different browser.</p>
                </div>
            `;
        }
    }

    // Get debug information
    getDebugInfo() {
        return {
            fps: this.fps,
            frameTime: this.performance.frameTime.toFixed(2) + 'ms',
            renderTime: this.performance.renderTime.toFixed(2) + 'ms',
            updateTime: this.performance.updateTime.toFixed(2) + 'ms',
            drawCalls: this.performance.drawCalls,
            visibleObjects: this.sceneManager.getVisibleObjects(this.camera).length,
            totalObjects: this.sceneManager.objects.length,
            camera: this.camera.getDebugInfo(),
            lighting: this.lightingSystem.getDebugInfo(),
            input: this.inputManager.getDebugInfo()
        };
    }

    // Cleanup
    destroy() {
        this.stop();
        
        if (this.inputManager) {
            this.inputManager.destroy();
        }
        
        console.log('Game engine destroyed');
    }
}

// Export for global use
window.GameEngine = GameEngine;
