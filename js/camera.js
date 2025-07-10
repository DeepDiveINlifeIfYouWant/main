/**
 * Camera System - First-Person and Third-Person Camera
 * Built from scratch with smooth movement and mouse look
 * No external dependencies
 */

class Camera {
    constructor() {
        // Camera position and orientation
        this.position = new Vec3(0, 1.8, 5);
        this.rotation = new Vec3(0, 0, 0); // pitch, yaw, roll
        this.target = new Vec3(0, 0, 0);
        this.up = new Vec3(0, 1, 0);
        
        // Camera properties
        this.fov = toRadians(75);
        this.aspect = 1;
        this.near = 0.1;
        this.far = 1000;
        
        // Movement properties
        this.moveSpeed = 5.0;
        this.mouseSensitivity = 0.002;
        this.smoothing = 0.1;
        
        // Camera modes
        this.mode = 'first-person'; // 'first-person' or 'third-person'
        this.thirdPersonDistance = 5;
        this.thirdPersonHeight = 2;
        
        // Smooth movement
        this.velocity = new Vec3(0, 0, 0);
        this.targetPosition = this.position.clone();
        this.targetRotation = this.rotation.clone();
        
        // Constraints
        this.minPitch = toRadians(-89);
        this.maxPitch = toRadians(89);
        
        // Collision
        this.radius = 0.3;
        this.height = 1.8;
        this.groundLevel = 0;
        this.isGrounded = false;
        this.gravity = -9.8;
        this.jumpForce = 5;
        
        // Matrices
        this.viewMatrix = Mat4.identity();
        this.projectionMatrix = Mat4.identity();
        this.viewProjectionMatrix = Mat4.identity();
        
        this.updateProjectionMatrix();
    }

    // Update projection matrix
    updateProjectionMatrix() {
        this.projectionMatrix = Mat4.perspective(this.fov, this.aspect, this.near, this.far);
        this.updateViewProjectionMatrix();
    }

    // Update view matrix
    updateViewMatrix() {
        if (this.mode === 'first-person') {
            this.updateFirstPersonView();
        } else {
            this.updateThirdPersonView();
        }
        this.updateViewProjectionMatrix();
    }

    // Update first-person view
    updateFirstPersonView() {
        // Calculate forward direction from rotation
        const forward = this.getForwardDirection();
        this.target = this.position.add(forward);
        
        this.viewMatrix = Mat4.lookAt(this.position, this.target, this.up);
    }

    // Update third-person view
    updateThirdPersonView() {
        // Calculate camera position behind the target
        const forward = this.getForwardDirection();
        const cameraPosition = this.targetPosition
            .subtract(forward.multiply(this.thirdPersonDistance))
            .add(new Vec3(0, this.thirdPersonHeight, 0));
        
        this.position = cameraPosition;
        this.viewMatrix = Mat4.lookAt(this.position, this.targetPosition, this.up);
    }

    // Update view-projection matrix
    updateViewProjectionMatrix() {
        this.viewProjectionMatrix = this.projectionMatrix.multiply(this.viewMatrix);
    }

    // Get forward direction vector
    getForwardDirection() {
        const pitch = this.rotation.x;
        const yaw = this.rotation.y;
        
        return new Vec3(
            Math.sin(yaw) * Math.cos(pitch),
            Math.sin(pitch),
            Math.cos(yaw) * Math.cos(pitch)
        ).normalize();
    }

    // Get right direction vector
    getRightDirection() {
        const forward = this.getForwardDirection();
        return forward.cross(this.up).normalize();
    }

    // Get up direction vector (relative to camera)
    getUpDirection() {
        const forward = this.getForwardDirection();
        const right = this.getRightDirection();
        return right.cross(forward).normalize();
    }

    // Handle mouse movement
    handleMouseMove(deltaX, deltaY) {
        // Update rotation based on mouse movement
        this.targetRotation.y -= deltaX * this.mouseSensitivity;
        this.targetRotation.x -= deltaY * this.mouseSensitivity;
        
        // Clamp pitch to prevent over-rotation
        this.targetRotation.x = clamp(this.targetRotation.x, this.minPitch, this.maxPitch);
        
        // Normalize yaw to [0, 2π]
        while (this.targetRotation.y < 0) this.targetRotation.y += Math.PI * 2;
        while (this.targetRotation.y >= Math.PI * 2) this.targetRotation.y -= Math.PI * 2;
    }

    // Handle movement input
    handleMovement(input, deltaTime) {
        const forward = this.getForwardDirection();
        const right = this.getRightDirection();
        
        let moveDirection = new Vec3(0, 0, 0);
        
        // Calculate movement direction
        if (input.forward) {
            moveDirection = moveDirection.add(forward);
        }
        if (input.backward) {
            moveDirection = moveDirection.subtract(forward);
        }
        if (input.left) {
            moveDirection = moveDirection.subtract(right);
        }
        if (input.right) {
            moveDirection = moveDirection.add(right);
        }
        
        // Normalize movement direction
        if (moveDirection.lengthSquared() > 0) {
            moveDirection = moveDirection.normalize();
        }
        
        // Apply movement speed
        const moveVelocity = moveDirection.multiply(this.moveSpeed);
        
        // Update horizontal velocity
        this.velocity.x = moveVelocity.x;
        this.velocity.z = moveVelocity.z;
        
        // Handle jumping
        if (input.jump && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }
        
        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * deltaTime;
        }
        
        // Update target position
        this.targetPosition = this.targetPosition.add(this.velocity.multiply(deltaTime));
        
        // Ground collision
        if (this.targetPosition.y <= this.groundLevel + this.height * 0.5) {
            this.targetPosition.y = this.groundLevel + this.height * 0.5;
            this.velocity.y = 0;
            this.isGrounded = true;
        }
    }

    // Check collision with objects
    checkCollision(objects) {
        for (const obj of objects) {
            if (obj.boundingBox && this.intersectsBoundingBox(obj.boundingBox)) {
                this.resolveCollision(obj.boundingBox);
            }
        }
    }

    // Check if camera intersects with bounding box
    intersectsBoundingBox(bbox) {
        const cameraMin = this.targetPosition.subtract(new Vec3(this.radius, this.height * 0.5, this.radius));
        const cameraMax = this.targetPosition.add(new Vec3(this.radius, this.height * 0.5, this.radius));
        
        return (cameraMin.x < bbox.max.x && cameraMax.x > bbox.min.x &&
                cameraMin.y < bbox.max.y && cameraMax.y > bbox.min.y &&
                cameraMin.z < bbox.max.z && cameraMax.z > bbox.min.z);
    }

    // Resolve collision with bounding box
    resolveCollision(bbox) {
        const center = this.targetPosition;
        const closest = new Vec3(
            clamp(center.x, bbox.min.x, bbox.max.x),
            clamp(center.y, bbox.min.y, bbox.max.y),
            clamp(center.z, bbox.min.z, bbox.max.z)
        );
        
        const distance = center.subtract(closest);
        const length = distance.length();
        
        if (length < this.radius) {
            const pushDirection = distance.normalize();
            const pushDistance = this.radius - length;
            this.targetPosition = this.targetPosition.add(pushDirection.multiply(pushDistance));
        }
    }

    // Update camera (called every frame)
    update(deltaTime) {
        // Smooth rotation interpolation
        this.rotation = this.rotation.lerp(this.targetRotation, this.smoothing);
        
        // Smooth position interpolation (only in first-person mode)
        if (this.mode === 'first-person') {
            this.position = this.position.lerp(this.targetPosition, this.smoothing);
        }
        
        // Update view matrix
        this.updateViewMatrix();
    }

    // Toggle between first-person and third-person
    toggleMode() {
        this.mode = this.mode === 'first-person' ? 'third-person' : 'first-person';
        
        if (this.mode === 'third-person') {
            // Store the player position for third-person view
            this.targetPosition = this.position.clone();
        }
    }

    // Set aspect ratio
    setAspectRatio(aspect) {
        this.aspect = aspect;
        this.updateProjectionMatrix();
    }

    // Set field of view
    setFOV(fov) {
        this.fov = toRadians(fov);
        this.updateProjectionMatrix();
    }

    // Get camera position for rendering
    getPosition() {
        return this.position;
    }

    // Get view matrix
    getViewMatrix() {
        return this.viewMatrix;
    }

    // Get projection matrix
    getProjectionMatrix() {
        return this.projectionMatrix;
    }

    // Get view-projection matrix
    getViewProjectionMatrix() {
        return this.viewProjectionMatrix;
    }

    // Get camera direction for lighting calculations
    getDirection() {
        return this.getForwardDirection();
    }

    // Set position
    setPosition(position) {
        this.position = position.clone();
        this.targetPosition = position.clone();
    }

    // Set rotation
    setRotation(rotation) {
        this.rotation = rotation.clone();
        this.targetRotation = rotation.clone();
    }

    // Look at a specific point
    lookAt(target) {
        const direction = target.subtract(this.position).normalize();
        
        // Calculate yaw and pitch from direction
        this.targetRotation.y = Math.atan2(direction.x, direction.z);
        this.targetRotation.x = Math.asin(-direction.y);
        
        // Clamp pitch
        this.targetRotation.x = clamp(this.targetRotation.x, this.minPitch, this.maxPitch);
    }

    // Get frustum planes for culling (optional optimization)
    getFrustumPlanes() {
        const planes = [];
        const mvp = this.viewProjectionMatrix;
        const m = mvp.elements;
        
        // Extract frustum planes from view-projection matrix
        // Left plane
        planes.push(this.normalizePlane([
            m[3] + m[0],
            m[7] + m[4],
            m[11] + m[8],
            m[15] + m[12]
        ]));
        
        // Right plane
        planes.push(this.normalizePlane([
            m[3] - m[0],
            m[7] - m[4],
            m[11] - m[8],
            m[15] - m[12]
        ]));
        
        // Bottom plane
        planes.push(this.normalizePlane([
            m[3] + m[1],
            m[7] + m[5],
            m[11] + m[9],
            m[15] + m[13]
        ]));
        
        // Top plane
        planes.push(this.normalizePlane([
            m[3] - m[1],
            m[7] - m[5],
            m[11] - m[9],
            m[15] - m[13]
        ]));
        
        // Near plane
        planes.push(this.normalizePlane([
            m[3] + m[2],
            m[7] + m[6],
            m[11] + m[10],
            m[15] + m[14]
        ]));
        
        // Far plane
        planes.push(this.normalizePlane([
            m[3] - m[2],
            m[7] - m[6],
            m[11] - m[10],
            m[15] - m[14]
        ]));
        
        return planes;
    }

    // Normalize frustum plane
    normalizePlane(plane) {
        const length = Math.sqrt(plane[0] * plane[0] + plane[1] * plane[1] + plane[2] * plane[2]);
        return [
            plane[0] / length,
            plane[1] / length,
            plane[2] / length,
            plane[3] / length
        ];
    }

    // Check if point is in frustum
    isPointInFrustum(point, planes) {
        for (const plane of planes) {
            if (plane[0] * point.x + plane[1] * point.y + plane[2] * point.z + plane[3] < 0) {
                return false;
            }
        }
        return true;
    }

    // Check if sphere is in frustum
    isSphereInFrustum(center, radius, planes) {
        for (const plane of planes) {
            if (plane[0] * center.x + plane[1] * center.y + plane[2] * center.z + plane[3] < -radius) {
                return false;
            }
        }
        return true;
    }

    // Get camera info for debugging
    getDebugInfo() {
        return {
            position: this.position.toString(),
            rotation: `(${toDegrees(this.rotation.x).toFixed(1)}°, ${toDegrees(this.rotation.y).toFixed(1)}°, ${toDegrees(this.rotation.z).toFixed(1)}°)`,
            mode: this.mode,
            isGrounded: this.isGrounded,
            velocity: this.velocity.toString()
        };
    }
}

// Export for global use
window.Camera = Camera;
