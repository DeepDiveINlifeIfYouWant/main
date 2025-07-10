/**
 * Scene Objects - Game Object Management and Rendering
 * Built from scratch for managing all 3D objects in the scene
 * No external dependencies
 */

// ============================================================================
// Base Scene Object Class
// ============================================================================
class SceneObject {
    constructor(mesh, material = {}) {
        this.mesh = mesh;
        this.material = {
            diffuseColor: material.diffuseColor || new Vec3(1, 1, 1),
            specularColor: material.specularColor || new Vec3(1, 1, 1),
            shininess: material.shininess || 32,
            specularStrength: material.specularStrength || 0.5,
            ...material
        };
        
        // Transform properties
        this.position = new Vec3(0, 0, 0);
        this.rotation = new Vec3(0, 0, 0);
        this.scale = new Vec3(1, 1, 1);
        
        // Rendering properties
        this.visible = true;
        this.castShadows = true;
        this.receiveShadows = true;
        
        // Bounding box for collision detection
        this.boundingBox = null;
        this.updateBoundingBox();
        
        // Animation properties
        this.animations = [];
        this.currentAnimation = null;
    }

    // Update object (called every frame)
    update(deltaTime) {
        // Update animations
        if (this.currentAnimation) {
            this.currentAnimation.update(deltaTime);
        }
        
        // Update bounding box if transform changed
        this.updateBoundingBox();
    }

    // Calculate model matrix
    getModelMatrix() {
        const translation = Mat4.translation(this.position);
        const rotationX = Mat4.rotationX(this.rotation.x);
        const rotationY = Mat4.rotationY(this.rotation.y);
        const rotationZ = Mat4.rotationZ(this.rotation.z);
        const scaling = Mat4.scaling(this.scale);
        
        return translation.multiply(rotationY).multiply(rotationX).multiply(rotationZ).multiply(scaling);
    }

    // Calculate normal matrix
    getNormalMatrix() {
        return this.getModelMatrix().inverse().transpose();
    }

    // Update bounding box
    updateBoundingBox() {
        if (!this.mesh || !this.mesh.positions) return;
        
        // Simple bounding box calculation
        const modelMatrix = this.getModelMatrix();
        
        // For now, use a simple box around the object
        const size = Math.max(this.scale.x, this.scale.y, this.scale.z);
        const halfSize = size * 0.5;
        
        this.boundingBox = {
            min: this.position.subtract(new Vec3(halfSize, halfSize, halfSize)),
            max: this.position.add(new Vec3(halfSize, halfSize, halfSize))
        };
    }

    // Set position
    setPosition(x, y, z) {
        if (x instanceof Vec3) {
            this.position = x.clone();
        } else {
            this.position.set(x, y, z);
        }
        this.updateBoundingBox();
    }

    // Set rotation
    setRotation(x, y, z) {
        if (x instanceof Vec3) {
            this.rotation = x.clone();
        } else {
            this.rotation.set(x, y, z);
        }
    }

    // Set scale
    setScale(x, y, z) {
        if (x instanceof Vec3) {
            this.scale = x.clone();
        } else if (typeof x === 'number' && y === undefined) {
            this.scale.set(x, x, x); // Uniform scaling
        } else {
            this.scale.set(x, y, z);
        }
        this.updateBoundingBox();
    }

    // Set material property
    setMaterial(property, value) {
        this.material[property] = value;
    }

    // Get render data for the renderer
    getRenderData() {
        return {
            mesh: this.mesh,
            modelMatrix: this.getModelMatrix(),
            normalMatrix: this.getNormalMatrix(),
            material: this.material,
            visible: this.visible
        };
    }
}

// ============================================================================
// Specialized Scene Objects
// ============================================================================

// House object with door interaction
class House extends SceneObject {
    constructor(houseData) {
        super(null); // House is a composite object
        
        this.parts = {
            walls: houseData.walls || [],
            floor: houseData.floor,
            ceiling: houseData.ceiling,
            roof: houseData.roof || [],
            windows: houseData.windows || [],
            interior: houseData.interior || []
        };
        
        this.door = houseData.door;
        this.doorOpenSpeed = 2.0; // radians per second
        
        // House position
        this.setPosition(0, 0, -10);
        
        // Create bounding box for the entire house
        this.boundingBox = {
            min: new Vec3(-4, 0, -13),
            max: new Vec3(4, 4, -7)
        };
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Update door animation
        if (this.door) {
            const targetAngle = this.door.isOpen ? toRadians(90) : 0;
            const angleDiff = targetAngle - this.door.openAngle;
            
            if (Math.abs(angleDiff) > 0.01) {
                const direction = Math.sign(angleDiff);
                this.door.openAngle += direction * this.doorOpenSpeed * deltaTime;
                this.door.openAngle = clamp(this.door.openAngle, 0, toRadians(90));
            }
        }
    }

    // Toggle door open/closed
    toggleDoor() {
        if (this.door) {
            this.door.isOpen = !this.door.isOpen;
        }
    }

    // Check if player is near door
    isPlayerNearDoor(playerPosition) {
        if (!this.door) return false;
        
        const doorPosition = this.position.add(new Vec3(0, 1.5, 3));
        const distance = playerPosition.distanceTo(doorPosition);
        return distance < 2.0; // 2 meter interaction range
    }

    // Get all renderable parts
    getRenderData() {
        const renderData = [];
        
        // Add all house parts
        Object.values(this.parts).forEach(part => {
            if (Array.isArray(part)) {
                part.forEach(subPart => {
                    if (subPart && subPart.mesh) {
                        renderData.push({
                            mesh: subPart.mesh,
                            modelMatrix: this.getModelMatrix(),
                            normalMatrix: this.getNormalMatrix(),
                            material: { diffuseColor: new Vec3(...subPart.color) },
                            visible: this.visible
                        });
                    }
                });
            } else if (part && part.mesh) {
                renderData.push({
                    mesh: part.mesh,
                    modelMatrix: this.getModelMatrix(),
                    normalMatrix: this.getNormalMatrix(),
                    material: { diffuseColor: new Vec3(...part.color) },
                    visible: this.visible
                });
            }
        });
        
        // Add door with rotation
        if (this.door && this.door.mesh) {
            const doorMatrix = this.getModelMatrix()
                .multiply(Mat4.translation(0, 0, 3))
                .multiply(Mat4.rotationY(this.door.openAngle))
                .multiply(Mat4.translation(-1, 0, 0)); // Pivot point
            
            renderData.push({
                mesh: this.door.mesh,
                modelMatrix: doorMatrix,
                normalMatrix: doorMatrix.inverse().transpose(),
                material: { diffuseColor: new Vec3(...this.door.color) },
                visible: this.visible
            });
        }
        
        return renderData;
    }
}

// Terrain object with heightmap
class Terrain extends SceneObject {
    constructor(mesh, heightmap, width, height) {
        super(mesh, {
            diffuseColor: new Vec3(0.3, 0.7, 0.3),
            specularStrength: 0.1
        });
        
        this.heightmap = heightmap;
        this.width = width;
        this.height = height;
        this.scaleX = 200;
        this.scaleY = 30;
        this.scaleZ = 200;
        
        this.setPosition(0, 0, 0);
        
        // Large bounding box for terrain
        this.boundingBox = {
            min: new Vec3(-this.scaleX * 0.5, 0, -this.scaleZ * 0.5),
            max: new Vec3(this.scaleX * 0.5, this.scaleY, this.scaleZ * 0.5)
        };
    }

    // Get height at world position
    getHeightAtPosition(worldX, worldZ) {
        // Convert world coordinates to heightmap coordinates
        const x = ((worldX / this.scaleX) + 0.5) * (this.width - 1);
        const z = ((worldZ / this.scaleZ) + 0.5) * (this.height - 1);
        
        // Clamp to heightmap bounds
        const clampedX = clamp(Math.floor(x), 0, this.width - 1);
        const clampedZ = clamp(Math.floor(z), 0, this.height - 1);
        
        // Get height from heightmap
        const index = clampedZ * this.width + clampedX;
        return this.heightmap[index] * this.scaleY;
    }
}

// Road object
class Road extends SceneObject {
    constructor(mesh) {
        super(mesh, {
            diffuseColor: new Vec3(0.3, 0.3, 0.3),
            specularStrength: 0.2
        });
        
        this.setPosition(0, 0, 0);
        
        // Road bounding box
        this.boundingBox = {
            min: new Vec3(-4, 0, -50),
            max: new Vec3(4, 0.1, 50)
        };
    }
}

// Tree object
class Tree extends SceneObject {
    constructor(treeParts) {
        super(null); // Tree is a composite object
        
        this.parts = treeParts;
        this.swayAmount = 0.1;
        this.swaySpeed = 1.0;
        this.time = 0;
        
        // Tree bounding box
        this.boundingBox = {
            min: new Vec3(-1, 0, -1),
            max: new Vec3(1, 5, 1)
        };
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Simple wind sway animation
        this.time += deltaTime;
        this.swayRotation = Math.sin(this.time * this.swaySpeed) * this.swayAmount;
    }

    getRenderData() {
        const renderData = [];
        
        this.parts.forEach((part, index) => {
            if (part && part.mesh) {
                let modelMatrix = this.getModelMatrix();
                
                // Apply sway to leaves (not trunk)
                if (index > 0) {
                    modelMatrix = modelMatrix.multiply(Mat4.rotationZ(this.swayRotation));
                }
                
                renderData.push({
                    mesh: part.mesh,
                    modelMatrix: modelMatrix,
                    normalMatrix: modelMatrix.inverse().transpose(),
                    material: { diffuseColor: new Vec3(...part.color) },
                    visible: this.visible
                });
            }
        });
        
        return renderData;
    }
}

// Player character object
class Player extends SceneObject {
    constructor(playerParts) {
        super(null); // Player is a composite object
        
        this.parts = playerParts;
        this.walkCycle = 0;
        this.walkSpeed = 2.0;
        this.isWalking = false;
        
        // Player bounding box
        this.boundingBox = {
            min: new Vec3(-0.3, 0, -0.3),
            max: new Vec3(0.3, 1.8, 0.3)
        };
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Update walk animation
        if (this.isWalking) {
            this.walkCycle += deltaTime * this.walkSpeed;
        }
    }

    setWalking(walking) {
        this.isWalking = walking;
    }

    getRenderData() {
        const renderData = [];
        
        this.parts.forEach((part, index) => {
            if (part && part.mesh) {
                let modelMatrix = this.getModelMatrix();
                
                // Apply walk animation to arms and legs
                if (this.isWalking && (index >= 2)) { // Arms and legs
                    const swingAmount = Math.sin(this.walkCycle) * 0.3;
                    const swingDirection = (index % 2 === 0) ? 1 : -1; // Alternate arms/legs
                    modelMatrix = modelMatrix.multiply(Mat4.rotationX(swingAmount * swingDirection));
                }
                
                renderData.push({
                    mesh: part.mesh,
                    modelMatrix: modelMatrix,
                    normalMatrix: modelMatrix.inverse().transpose(),
                    material: { diffuseColor: new Vec3(...part.color) },
                    visible: this.visible
                });
            }
        });
        
        return renderData;
    }
}

// ============================================================================
// Scene Manager
// ============================================================================
class SceneManager {
    constructor() {
        this.objects = [];
        this.lights = [];
        this.camera = null;
        
        // Culling and optimization
        this.frustumCulling = true;
        this.distanceCulling = true;
        this.maxRenderDistance = 500;
    }

    // Add object to scene
    addObject(object) {
        this.objects.push(object);
    }

    // Remove object from scene
    removeObject(object) {
        const index = this.objects.indexOf(object);
        if (index !== -1) {
            this.objects.splice(index, 1);
        }
    }

    // Update all objects
    update(deltaTime) {
        this.objects.forEach(object => {
            if (object.update) {
                object.update(deltaTime);
            }
        });
    }

    // Get all visible objects for rendering
    getVisibleObjects(camera) {
        const visibleObjects = [];
        const cameraPosition = camera.getPosition();
        const frustumPlanes = this.frustumCulling ? camera.getFrustumPlanes() : null;
        
        this.objects.forEach(object => {
            if (!object.visible) return;
            
            // Distance culling
            if (this.distanceCulling) {
                const distance = cameraPosition.distanceTo(object.position);
                if (distance > this.maxRenderDistance) return;
            }
            
            // Frustum culling
            if (frustumPlanes && object.boundingBox) {
                const center = object.position;
                const radius = Math.max(
                    object.scale.x,
                    object.scale.y,
                    object.scale.z
                ) * 2; // Conservative radius
                
                if (!camera.isSphereInFrustum(center, radius, frustumPlanes)) {
                    return;
                }
            }
            
            visibleObjects.push(object);
        });
        
        return visibleObjects;
    }

    // Get objects for collision detection
    getCollidableObjects() {
        return this.objects.filter(object => object.boundingBox);
    }

    // Find objects by type
    findObjectsByType(type) {
        return this.objects.filter(object => object instanceof type);
    }

    // Find object by name/id
    findObjectById(id) {
        return this.objects.find(object => object.id === id);
    }

    // Clear all objects
    clear() {
        this.objects = [];
    }

    // Get scene statistics
    getStats() {
        return {
            totalObjects: this.objects.length,
            visibleObjects: this.objects.filter(obj => obj.visible).length,
            collidableObjects: this.getCollidableObjects().length
        };
    }
}

// Export for global use
window.SceneObject = SceneObject;
window.House = House;
window.Terrain = Terrain;
window.Road = Road;
window.Tree = Tree;
window.Player = Player;
window.SceneManager = SceneManager;
