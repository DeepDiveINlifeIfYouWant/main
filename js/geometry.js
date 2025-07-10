/**
 * Geometry Builder - 3D Mesh Generation
 * Built from scratch for creating all game objects
 * Includes cube, plane, terrain, and complex mesh utilities
 * No external dependencies
 */

// ============================================================================
// Basic Geometry Primitives
// ============================================================================

class GeometryBuilder {
    constructor(bufferManager) {
        this.bufferManager = bufferManager;
    }

    // Create a cube mesh with proper normals and texture coordinates
    createCube(size = 1) {
        const s = size * 0.5;
        
        // Vertices (position, normal, texCoord)
        const vertices = [
            // Front face
            -s, -s,  s,  0,  0,  1,  0, 0,
             s, -s,  s,  0,  0,  1,  1, 0,
             s,  s,  s,  0,  0,  1,  1, 1,
            -s,  s,  s,  0,  0,  1,  0, 1,
            
            // Back face
            -s, -s, -s,  0,  0, -1,  1, 0,
            -s,  s, -s,  0,  0, -1,  1, 1,
             s,  s, -s,  0,  0, -1,  0, 1,
             s, -s, -s,  0,  0, -1,  0, 0,
            
            // Top face
            -s,  s, -s,  0,  1,  0,  0, 1,
            -s,  s,  s,  0,  1,  0,  0, 0,
             s,  s,  s,  0,  1,  0,  1, 0,
             s,  s, -s,  0,  1,  0,  1, 1,
            
            // Bottom face
            -s, -s, -s,  0, -1,  0,  1, 1,
             s, -s, -s,  0, -1,  0,  0, 1,
             s, -s,  s,  0, -1,  0,  0, 0,
            -s, -s,  s,  0, -1,  0,  1, 0,
            
            // Right face
             s, -s, -s,  1,  0,  0,  1, 0,
             s,  s, -s,  1,  0,  0,  1, 1,
             s,  s,  s,  1,  0,  0,  0, 1,
             s, -s,  s,  1,  0,  0,  0, 0,
            
            // Left face
            -s, -s, -s, -1,  0,  0,  0, 0,
            -s, -s,  s, -1,  0,  0,  1, 0,
            -s,  s,  s, -1,  0,  0,  1, 1,
            -s,  s, -s, -1,  0,  0,  0, 1
        ];
        
        const indices = [
            0,  1,  2,    0,  2,  3,    // front
            4,  5,  6,    4,  6,  7,    // back
            8,  9,  10,   8,  10, 11,   // top
            12, 13, 14,   12, 14, 15,   // bottom
            16, 17, 18,   16, 18, 19,   // right
            20, 21, 22,   20, 22, 23    // left
        ];
        
        return this.createMesh(vertices, indices, 8); // 8 floats per vertex
    }

    // Create a plane mesh
    createPlane(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
        const vertices = [];
        const indices = [];
        
        const halfWidth = width * 0.5;
        const halfHeight = height * 0.5;
        
        // Generate vertices
        for (let iy = 0; iy <= heightSegments; iy++) {
            const y = iy / heightSegments;
            const posY = (y - 0.5) * height;
            
            for (let ix = 0; ix <= widthSegments; ix++) {
                const x = ix / widthSegments;
                const posX = (x - 0.5) * width;
                
                // Position
                vertices.push(posX, 0, posY);
                // Normal (pointing up)
                vertices.push(0, 1, 0);
                // Texture coordinates
                vertices.push(x, y);
            }
        }
        
        // Generate indices
        for (let iy = 0; iy < heightSegments; iy++) {
            for (let ix = 0; ix < widthSegments; ix++) {
                const a = ix + (widthSegments + 1) * iy;
                const b = ix + (widthSegments + 1) * (iy + 1);
                const c = (ix + 1) + (widthSegments + 1) * (iy + 1);
                const d = (ix + 1) + (widthSegments + 1) * iy;
                
                // Two triangles per quad
                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }
        
        return this.createMesh(vertices, indices, 8);
    }

    // Create terrain mesh from heightmap
    createTerrain(heightmap, width, height, scaleX = 1, scaleY = 1, scaleZ = 1) {
        const vertices = [];
        const indices = [];
        
        // Generate vertices
        for (let z = 0; z < height; z++) {
            for (let x = 0; x < width; x++) {
                const heightValue = heightmap[z * width + x] * scaleY;
                
                // Position
                const posX = (x / (width - 1) - 0.5) * scaleX;
                const posZ = (z / (height - 1) - 0.5) * scaleZ;
                vertices.push(posX, heightValue, posZ);
                
                // Calculate normal (using neighboring heights)
                const normal = this.calculateTerrainNormal(heightmap, width, height, x, z, scaleX, scaleY, scaleZ);
                vertices.push(normal.x, normal.y, normal.z);
                
                // Texture coordinates
                vertices.push(x / (width - 1), z / (height - 1));
            }
        }
        
        // Generate indices
        for (let z = 0; z < height - 1; z++) {
            for (let x = 0; x < width - 1; x++) {
                const topLeft = z * width + x;
                const topRight = topLeft + 1;
                const bottomLeft = (z + 1) * width + x;
                const bottomRight = bottomLeft + 1;
                
                // Two triangles per quad
                indices.push(topLeft, bottomLeft, topRight);
                indices.push(topRight, bottomLeft, bottomRight);
            }
        }
        
        return this.createMesh(vertices, indices, 8);
    }

    // Calculate normal for terrain vertex
    calculateTerrainNormal(heightmap, width, height, x, z, scaleX, scaleY, scaleZ) {
        const getHeight = (x, z) => {
            if (x < 0 || x >= width || z < 0 || z >= height) return 0;
            return heightmap[z * width + x] * scaleY;
        };
        
        const hL = getHeight(x - 1, z);
        const hR = getHeight(x + 1, z);
        const hD = getHeight(x, z - 1);
        const hU = getHeight(x, z + 1);
        
        const normal = new Vec3(
            (hL - hR) / (2 * scaleX / (width - 1)),
            2,
            (hD - hU) / (2 * scaleZ / (height - 1))
        );
        
        return normal.normalize();
    }

    // Create a road mesh (long straight road)
    createRoad(length = 100, width = 8, segments = 50) {
        const vertices = [];
        const indices = [];
        
        const halfWidth = width * 0.5;
        
        // Generate vertices along the road
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const z = (t - 0.5) * length;
            
            // Left side
            vertices.push(-halfWidth, 0.01, z); // Slightly above ground
            vertices.push(0, 1, 0); // Normal
            vertices.push(0, t * length / 4); // Texture coordinates (repeating)
            
            // Right side
            vertices.push(halfWidth, 0.01, z);
            vertices.push(0, 1, 0); // Normal
            vertices.push(1, t * length / 4); // Texture coordinates
        }
        
        // Generate indices
        for (let i = 0; i < segments; i++) {
            const base = i * 2;
            
            // Two triangles per road segment
            indices.push(base, base + 2, base + 1);
            indices.push(base + 1, base + 2, base + 3);
        }
        
        return this.createMesh(vertices, indices, 8);
    }

    // Create a tree from cubes (trunk + leaves)
    createTree() {
        const meshes = [];
        
        // Trunk (brown cube, stretched vertically)
        const trunkVertices = [];
        const trunkIndices = [];
        this.addCubeToMesh(trunkVertices, trunkIndices, 0, 1.5, 0, 0.3, 3, 0.3, 0);
        meshes.push({
            mesh: this.createMesh(trunkVertices, trunkIndices, 8),
            color: [0.4, 0.2, 0.1] // Brown
        });
        
        // Leaves (green cubes)
        const leafPositions = [
            [0, 3.5, 0, 1.5, 1.5, 1.5],     // Main leaf cluster
            [-0.8, 3.2, -0.8, 1.2, 1.2, 1.2], // Side clusters
            [0.8, 3.2, 0.8, 1.2, 1.2, 1.2],
            [0.8, 3.2, -0.8, 1.2, 1.2, 1.2],
            [-0.8, 3.2, 0.8, 1.2, 1.2, 1.2]
        ];
        
        leafPositions.forEach(pos => {
            const leafVertices = [];
            const leafIndices = [];
            this.addCubeToMesh(leafVertices, leafIndices, pos[0], pos[1], pos[2], pos[3], pos[4], pos[5], 0);
            meshes.push({
                mesh: this.createMesh(leafVertices, leafIndices, 8),
                color: [0.2, 0.6, 0.2] // Green
            });
        });
        
        return meshes;
    }

    // Create a simple player character from cubes
    createPlayer() {
        const meshes = [];
        
        // Head
        const headVertices = [];
        const headIndices = [];
        this.addCubeToMesh(headVertices, headIndices, 0, 1.7, 0, 0.3, 0.3, 0.3, 0);
        meshes.push({
            mesh: this.createMesh(headVertices, headIndices, 8),
            color: [0.9, 0.7, 0.6] // Skin color
        });
        
        // Body
        const bodyVertices = [];
        const bodyIndices = [];
        this.addCubeToMesh(bodyVertices, bodyIndices, 0, 1.2, 0, 0.4, 0.6, 0.2, 0);
        meshes.push({
            mesh: this.createMesh(bodyVertices, bodyIndices, 8),
            color: [0.2, 0.4, 0.8] // Blue shirt
        });
        
        // Arms
        const armPositions = [
            [-0.5, 1.2, 0, 0.15, 0.5, 0.15], // Left arm
            [0.5, 1.2, 0, 0.15, 0.5, 0.15]   // Right arm
        ];
        
        armPositions.forEach(pos => {
            const armVertices = [];
            const armIndices = [];
            this.addCubeToMesh(armVertices, armIndices, pos[0], pos[1], pos[2], pos[3], pos[4], pos[5], 0);
            meshes.push({
                mesh: this.createMesh(armVertices, armIndices, 8),
                color: [0.9, 0.7, 0.6] // Skin color
            });
        });
        
        // Legs
        const legPositions = [
            [-0.15, 0.4, 0, 0.15, 0.8, 0.15], // Left leg
            [0.15, 0.4, 0, 0.15, 0.8, 0.15]   // Right leg
        ];
        
        legPositions.forEach(pos => {
            const legVertices = [];
            const legIndices = [];
            this.addCubeToMesh(legVertices, legIndices, pos[0], pos[1], pos[2], pos[3], pos[4], pos[5], 0);
            meshes.push({
                mesh: this.createMesh(legVertices, legIndices, 8),
                color: [0.1, 0.1, 0.4] // Dark blue pants
            });
        });
        
        return meshes;
    }

    // Helper function to add a cube to existing mesh data
    addCubeToMesh(vertices, indices, x, y, z, width, height, depth, indexOffset) {
        const w = width * 0.5;
        const h = height * 0.5;
        const d = depth * 0.5;
        
        const cubeVertices = [
            // Front face
            x-w, y-h, z+d,  0,  0,  1,  0, 0,
            x+w, y-h, z+d,  0,  0,  1,  1, 0,
            x+w, y+h, z+d,  0,  0,  1,  1, 1,
            x-w, y+h, z+d,  0,  0,  1,  0, 1,
            
            // Back face
            x-w, y-h, z-d,  0,  0, -1,  1, 0,
            x-w, y+h, z-d,  0,  0, -1,  1, 1,
            x+w, y+h, z-d,  0,  0, -1,  0, 1,
            x+w, y-h, z-d,  0,  0, -1,  0, 0,
            
            // Top face
            x-w, y+h, z-d,  0,  1,  0,  0, 1,
            x-w, y+h, z+d,  0,  1,  0,  0, 0,
            x+w, y+h, z+d,  0,  1,  0,  1, 0,
            x+w, y+h, z-d,  0,  1,  0,  1, 1,
            
            // Bottom face
            x-w, y-h, z-d,  0, -1,  0,  1, 1,
            x+w, y-h, z-d,  0, -1,  0,  0, 1,
            x+w, y-h, z+d,  0, -1,  0,  0, 0,
            x-w, y-h, z+d,  0, -1,  0,  1, 0,
            
            // Right face
            x+w, y-h, z-d,  1,  0,  0,  1, 0,
            x+w, y+h, z-d,  1,  0,  0,  1, 1,
            x+w, y+h, z+d,  1,  0,  0,  0, 1,
            x+w, y-h, z+d,  1,  0,  0,  0, 0,
            
            // Left face
            x-w, y-h, z-d, -1,  0,  0,  0, 0,
            x-w, y-h, z+d, -1,  0,  0,  1, 0,
            x-w, y+h, z+d, -1,  0,  0,  1, 1,
            x-w, y+h, z-d, -1,  0,  0,  0, 1
        ];
        
        const cubeIndices = [
            0,  1,  2,    0,  2,  3,    // front
            4,  5,  6,    4,  6,  7,    // back
            8,  9,  10,   8,  10, 11,   // top
            12, 13, 14,   12, 14, 15,   // bottom
            16, 17, 18,   16, 18, 19,   // right
            20, 21, 22,   20, 22, 23    // left
        ];
        
        // Add vertices
        vertices.push(...cubeVertices);
        
        // Add indices with offset
        const currentVertexCount = indexOffset;
        cubeIndices.forEach(index => {
            indices.push(index + currentVertexCount);
        });
        
        return currentVertexCount + 24; // Return new vertex count
    }

    // Create mesh object with buffers
    createMesh(vertices, indices, stride) {
        const positions = [];
        const normals = [];
        const texCoords = [];
        
        // Separate interleaved vertex data
        for (let i = 0; i < vertices.length; i += stride) {
            // Position
            positions.push(vertices[i], vertices[i + 1], vertices[i + 2]);
            // Normal
            normals.push(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
            // Texture coordinates
            if (stride >= 8) {
                texCoords.push(vertices[i + 6], vertices[i + 7]);
            }
        }
        
        return {
            positions: this.bufferManager.createBuffer(positions),
            normals: this.bufferManager.createBuffer(normals),
            texCoords: stride >= 8 ? this.bufferManager.createBuffer(texCoords) : null,
            indices: this.bufferManager.createBuffer(indices, this.bufferManager.gl.ELEMENT_ARRAY_BUFFER)
        };
    }
}

// ============================================================================
// House Construction
// ============================================================================

class HouseBuilder {
    constructor(geometryBuilder) {
        this.geometryBuilder = geometryBuilder;
    }

    // Create a complete house with interior and exterior
    createHouse() {
        const house = {
            walls: [],
            floor: null,
            ceiling: null,
            roof: null,
            door: null,
            windows: [],
            interior: []
        };
        
        // House dimensions
        const width = 8;
        const height = 4;
        const depth = 6;
        const wallThickness = 0.2;
        
        // Create walls (with door opening)
        house.walls = this.createWalls(width, height, depth, wallThickness);
        
        // Create floor and ceiling
        house.floor = this.createFloor(width, depth);
        house.ceiling = this.createCeiling(width, depth, height);
        
        // Create roof
        house.roof = this.createRoof(width, depth, height);
        
        // Create door
        house.door = this.createDoor(2, 3);
        
        // Create windows
        house.windows = this.createWindows();
        
        // Create interior elements
        house.interior = this.createInterior();
        
        return house;
    }

    createWalls(width, height, depth, thickness) {
        const walls = [];
        const halfWidth = width * 0.5;
        const halfDepth = depth * 0.5;
        const halfHeight = height * 0.5;
        const halfThickness = thickness * 0.5;
        
        // Front wall (with door opening)
        const frontWallVertices = [];
        const frontWallIndices = [];
        
        // Left part of front wall
        let indexOffset = this.geometryBuilder.addCubeToMesh(
            frontWallVertices, frontWallIndices,
            -halfWidth + 1, halfHeight, halfDepth + halfThickness,
            2, height, thickness, 0
        );
        
        // Right part of front wall
        indexOffset = this.geometryBuilder.addCubeToMesh(
            frontWallVertices, frontWallIndices,
            halfWidth - 1, halfHeight, halfDepth + halfThickness,
            2, height, thickness, indexOffset
        );
        
        // Top part of front wall (above door)
        this.geometryBuilder.addCubeToMesh(
            frontWallVertices, frontWallIndices,
            0, height - 0.5, halfDepth + halfThickness,
            2, 1, thickness, indexOffset
        );
        
        walls.push({
            mesh: this.geometryBuilder.createMesh(frontWallVertices, frontWallIndices, 8),
            color: [0.8, 0.7, 0.6]
        });
        
        // Back wall
        const backWallVertices = [];
        const backWallIndices = [];
        this.geometryBuilder.addCubeToMesh(
            backWallVertices, backWallIndices,
            0, halfHeight, -halfDepth - halfThickness,
            width, height, thickness, 0
        );
        walls.push({
            mesh: this.geometryBuilder.createMesh(backWallVertices, backWallIndices, 8),
            color: [0.8, 0.7, 0.6]
        });
        
        // Left wall
        const leftWallVertices = [];
        const leftWallIndices = [];
        this.geometryBuilder.addCubeToMesh(
            leftWallVertices, leftWallIndices,
            -halfWidth - halfThickness, halfHeight, 0,
            thickness, height, depth, 0
        );
        walls.push({
            mesh: this.geometryBuilder.createMesh(leftWallVertices, leftWallIndices, 8),
            color: [0.8, 0.7, 0.6]
        });
        
        // Right wall (with window opening)
        const rightWallVertices = [];
        const rightWallIndices = [];
        
        // Bottom part
        indexOffset = this.geometryBuilder.addCubeToMesh(
            rightWallVertices, rightWallIndices,
            halfWidth + halfThickness, 0.5, 0,
            thickness, 1, depth, 0
        );
        
        // Top part
        indexOffset = this.geometryBuilder.addCubeToMesh(
            rightWallVertices, rightWallIndices,
            halfWidth + halfThickness, height - 0.5, 0,
            thickness, 1, depth, indexOffset
        );
        
        // Front section
        indexOffset = this.geometryBuilder.addCubeToMesh(
            rightWallVertices, rightWallIndices,
            halfWidth + halfThickness, halfHeight, halfDepth - 1,
            thickness, 2, 2, indexOffset
        );
        
        // Back section
        this.geometryBuilder.addCubeToMesh(
            rightWallVertices, rightWallIndices,
            halfWidth + halfThickness, halfHeight, -halfDepth + 1,
            thickness, 2, 2, indexOffset
        );
        
        walls.push({
            mesh: this.geometryBuilder.createMesh(rightWallVertices, rightWallIndices, 8),
            color: [0.8, 0.7, 0.6]
        });
        
        return walls;
    }

    createFloor(width, depth) {
        const floorMesh = this.geometryBuilder.createPlane(width, depth, 4, 4);
        return {
            mesh: floorMesh,
            color: [0.6, 0.4, 0.2] // Wood color
        };
    }

    createCeiling(width, depth, height) {
        const ceilingVertices = [];
        const ceilingIndices = [];
        this.geometryBuilder.addCubeToMesh(
            ceilingVertices, ceilingIndices,
            0, height, 0,
            width, 0.2, depth, 0
        );
        return {
            mesh: this.geometryBuilder.createMesh(ceilingVertices, ceilingIndices, 8),
            color: [0.9, 0.9, 0.9] // White ceiling
        };
    }

    createRoof(width, depth, height) {
        const roofParts = [];
        
        // Sloped roof (two triangular sections)
        const roofHeight = 2;
        const roofOverhang = 0.5;
        
        // Left roof section
        const leftRoofVertices = [];
        const leftRoofIndices = [];
        
        // Create sloped roof geometry manually
        const roofVertices = [
            // Left slope
            -(width/2 + roofOverhang), height, -(depth/2 + roofOverhang),  -0.707, 0.707, 0,  0, 0,
            -(width/2 + roofOverhang), height, depth/2 + roofOverhang,     -0.707, 0.707, 0,  1, 0,
            0, height + roofHeight, depth/2 + roofOverhang,                -0.707, 0.707, 0,  1, 1,
            0, height + roofHeight, -(depth/2 + roofOverhang),             -0.707, 0.707, 0,  0, 1,
            
            // Right slope
            width/2 + roofOverhang, height, -(depth/2 + roofOverhang),     0.707, 0.707, 0,   0, 0,
            0, height + roofHeight, -(depth/2 + roofOverhang),             0.707, 0.707, 0,   1, 0,
            0, height + roofHeight, depth/2 + roofOverhang,                0.707, 0.707, 0,   1, 1,
            width/2 + roofOverhang, height, depth/2 + roofOverhang,        0.707, 0.707, 0,   0, 1
        ];
        
        const roofIndices = [
            0, 1, 2,  0, 2, 3,  // Left slope
            4, 5, 6,  4, 6, 7   // Right slope
        ];
        
        roofParts.push({
            mesh: this.geometryBuilder.createMesh(roofVertices, roofIndices, 8),
            color: [0.6, 0.3, 0.2] // Red roof tiles
        });
        
        return roofParts;
    }

    createDoor(width = 2, height = 3) {
        const doorVertices = [];
        const doorIndices = [];
        this.geometryBuilder.addCubeToMesh(
            doorVertices, doorIndices,
            0, height * 0.5, 3.1, // Slightly in front of wall
            width, height, 0.1, 0
        );
        
        return {
            mesh: this.geometryBuilder.createMesh(doorVertices, doorIndices, 8),
            color: [0.4, 0.2, 0.1], // Dark brown
            position: new Vec3(0, 0, 0),
            isOpen: false,
            openAngle: 0,
            targetAngle: 0
        };
    }

    createWindows() {
        const windows = [];
        
        // Right wall window
        const windowVertices = [];
        const windowIndices = [];
        this.geometryBuilder.addCubeToMesh(
            windowVertices, windowIndices,
            4.1, 2, 0, // Slightly outside right wall
            0.1, 1.5, 1.5, 0
        );
        
        windows.push({
            mesh: this.geometryBuilder.createMesh(windowVertices, windowIndices, 8),
            color: [0.7, 0.9, 1.0] // Light blue glass
        });
        
        return windows;
    }

    createInterior() {
        const interior = [];
        
        // Simple table
        const tableVertices = [];
        const tableIndices = [];
        
        // Table top
        let indexOffset = this.geometryBuilder.addCubeToMesh(
            tableVertices, tableIndices,
            -2, 1.5, -1,
            2, 0.1, 1, 0
        );
        
        // Table legs
        const legPositions = [
            [-2.8, 0.75, -1.4], [-1.2, 0.75, -1.4],
            [-2.8, 0.75, -0.6], [-1.2, 0.75, -0.6]
        ];
        
        legPositions.forEach(pos => {
            indexOffset = this.geometryBuilder.addCubeToMesh(
                tableVertices, tableIndices,
                pos[0], pos[1], pos[2],
                0.1, 1.5, 0.1, indexOffset
            );
        });
        
        interior.push({
            mesh: this.geometryBuilder.createMesh(tableVertices, tableIndices, 8),
            color: [0.6, 0.4, 0.2] // Wood color
        });
        
        return interior;
    }
}

// Export for global use
window.GeometryBuilder = GeometryBuilder;
window.HouseBuilder = HouseBuilder;
