/**
 * Perlin Noise Generator - Built from scratch
 * Implementation of Ken Perlin's improved noise function
 * Used for procedural mountain generation
 * No external dependencies
 */

class PerlinNoise {
    constructor(seed = null) {
        // Initialize permutation table
        this.permutation = [];
        this.p = [];
        
        // Default permutation table (Ken Perlin's original)
        const defaultPermutation = [
            151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
            140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
            247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
            57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
            74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
            60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
            65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
            200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
            52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
            207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
            119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
            129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
            218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
            81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
            184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
            222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
        ];
        
        if (seed !== null) {
            this.setSeed(seed);
        } else {
            this.permutation = [...defaultPermutation];
        }
        
        // Duplicate the permutation table to avoid overflow
        for (let i = 0; i < 512; i++) {
            this.p[i] = this.permutation[i % 256];
        }
    }

    // Set seed for reproducible noise
    setSeed(seed) {
        // Simple seeded random number generator
        let rng = this.seededRandom(seed);
        
        // Create array of indices
        this.permutation = [];
        for (let i = 0; i < 256; i++) {
            this.permutation[i] = i;
        }
        
        // Fisher-Yates shuffle with seeded random
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
        }
        
        // Duplicate for overflow protection
        for (let i = 0; i < 512; i++) {
            this.p[i] = this.permutation[i % 256];
        }
    }

    // Simple seeded random number generator
    seededRandom(seed) {
        let state = seed;
        return function() {
            state = (state * 1664525 + 1013904223) % 4294967296;
            return state / 4294967296;
        };
    }

    // Fade function (6t^5 - 15t^4 + 10t^3)
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    // Linear interpolation
    lerp(a, b, t) {
        return a + t * (b - a);
    }

    // Gradient function
    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    // 3D Perlin noise
    noise3D(x, y, z) {
        // Find unit cube that contains point
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;
        
        // Find relative x, y, z of point in cube
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        
        // Compute fade curves for each of x, y, z
        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);
        
        // Hash coordinates of the 8 cube corners
        const A = this.p[X] + Y;
        const AA = this.p[A] + Z;
        const AB = this.p[A + 1] + Z;
        const B = this.p[X + 1] + Y;
        const BA = this.p[B] + Z;
        const BB = this.p[B + 1] + Z;
        
        // Add blended results from 8 corners of cube
        return this.lerp(
            this.lerp(
                this.lerp(
                    this.grad(this.p[AA], x, y, z),
                    this.grad(this.p[BA], x - 1, y, z),
                    u
                ),
                this.lerp(
                    this.grad(this.p[AB], x, y - 1, z),
                    this.grad(this.p[BB], x - 1, y - 1, z),
                    u
                ),
                v
            ),
            this.lerp(
                this.lerp(
                    this.grad(this.p[AA + 1], x, y, z - 1),
                    this.grad(this.p[BA + 1], x - 1, y, z - 1),
                    u
                ),
                this.lerp(
                    this.grad(this.p[AB + 1], x, y - 1, z - 1),
                    this.grad(this.p[BB + 1], x - 1, y - 1, z - 1),
                    u
                ),
                v
            ),
            w
        );
    }

    // 2D Perlin noise (simplified version of 3D)
    noise2D(x, y) {
        return this.noise3D(x, y, 0);
    }

    // 1D Perlin noise
    noise1D(x) {
        return this.noise3D(x, 0, 0);
    }

    // Fractal Brownian Motion (fBm) - multiple octaves of noise
    fbm2D(x, y, octaves = 4, frequency = 1, amplitude = 1, lacunarity = 2, persistence = 0.5) {
        let value = 0;
        let currentAmplitude = amplitude;
        let currentFrequency = frequency;
        let maxValue = 0; // Used for normalizing result to [-1, 1]
        
        for (let i = 0; i < octaves; i++) {
            value += currentAmplitude * this.noise2D(x * currentFrequency, y * currentFrequency);
            maxValue += currentAmplitude;
            
            currentAmplitude *= persistence;
            currentFrequency *= lacunarity;
        }
        
        return value / maxValue;
    }

    // Fractal Brownian Motion for 3D
    fbm3D(x, y, z, octaves = 4, frequency = 1, amplitude = 1, lacunarity = 2, persistence = 0.5) {
        let value = 0;
        let currentAmplitude = amplitude;
        let currentFrequency = frequency;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            value += currentAmplitude * this.noise3D(
                x * currentFrequency,
                y * currentFrequency,
                z * currentFrequency
            );
            maxValue += currentAmplitude;
            
            currentAmplitude *= persistence;
            currentFrequency *= lacunarity;
        }
        
        return value / maxValue;
    }

    // Ridged noise (inverted absolute value)
    ridgedNoise2D(x, y, octaves = 4, frequency = 1, amplitude = 1, lacunarity = 2, persistence = 0.5) {
        let value = 0;
        let currentAmplitude = amplitude;
        let currentFrequency = frequency;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            const n = this.noise2D(x * currentFrequency, y * currentFrequency);
            value += currentAmplitude * (1 - Math.abs(n));
            maxValue += currentAmplitude;
            
            currentAmplitude *= persistence;
            currentFrequency *= lacunarity;
        }
        
        return value / maxValue;
    }

    // Turbulence (absolute value of noise)
    turbulence2D(x, y, octaves = 4, frequency = 1, amplitude = 1, lacunarity = 2, persistence = 0.5) {
        let value = 0;
        let currentAmplitude = amplitude;
        let currentFrequency = frequency;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            value += currentAmplitude * Math.abs(this.noise2D(x * currentFrequency, y * currentFrequency));
            maxValue += currentAmplitude;
            
            currentAmplitude *= persistence;
            currentFrequency *= lacunarity;
        }
        
        return value / maxValue;
    }

    // Domain warping - use noise to distort the input coordinates
    domainWarp2D(x, y, warpStrength = 0.1, warpFrequency = 1) {
        const warpX = this.noise2D(x * warpFrequency, y * warpFrequency) * warpStrength;
        const warpY = this.noise2D((x + 100) * warpFrequency, (y + 100) * warpFrequency) * warpStrength;
        
        return {
            x: x + warpX,
            y: y + warpY
        };
    }

    // Generate heightmap for terrain
    generateHeightmap(width, height, scale = 0.01, octaves = 6, amplitude = 1, frequency = 1) {
        const heightmap = new Float32Array(width * height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                
                // Apply domain warping for more interesting terrain
                const warped = this.domainWarp2D(x * scale, y * scale, 0.5, 0.02);
                
                // Generate height using fractal Brownian motion
                let height_value = this.fbm2D(
                    warped.x,
                    warped.y,
                    octaves,
                    frequency,
                    amplitude,
                    2.0,    // lacunarity
                    0.5     // persistence
                );
                
                // Add some ridged noise for mountain ridges
                const ridged = this.ridgedNoise2D(
                    warped.x * 0.5,
                    warped.y * 0.5,
                    3,
                    frequency * 2,
                    amplitude * 0.3
                );
                
                height_value += ridged;
                
                // Normalize and store
                heightmap[index] = (height_value + 1) * 0.5; // Convert from [-1,1] to [0,1]
            }
        }
        
        return heightmap;
    }

    // Generate texture noise (for procedural textures)
    generateTextureNoise(width, height, scale = 0.05, octaves = 4) {
        const noise = new Float32Array(width * height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                
                const value = this.fbm2D(
                    x * scale,
                    y * scale,
                    octaves,
                    1.0,    // frequency
                    1.0,    // amplitude
                    2.0,    // lacunarity
                    0.5     // persistence
                );
                
                noise[index] = (value + 1) * 0.5; // Convert from [-1,1] to [0,1]
            }
        }
        
        return noise;
    }
}

// ============================================================================
// Utility Functions for Terrain Generation
// ============================================================================

// Generate mountain terrain with realistic features
function generateMountainTerrain(width, height, options = {}) {
    const {
        scale = 0.005,
        octaves = 8,
        amplitude = 50,
        frequency = 1,
        seed = null,
        ridgeStrength = 0.3,
        valleyDepth = 0.2
    } = options;
    
    const noise = new PerlinNoise(seed);
    const heightmap = new Float32Array(width * height);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            
            // Base terrain using fBm
            let height_value = noise.fbm2D(
                x * scale,
                y * scale,
                octaves,
                frequency,
                amplitude,
                2.0,
                0.5
            );
            
            // Add ridges for mountain peaks
            const ridged = noise.ridgedNoise2D(
                x * scale * 2,
                y * scale * 2,
                4,
                frequency,
                amplitude * ridgeStrength
            );
            
            // Add valleys
            const valleys = -noise.turbulence2D(
                x * scale * 0.5,
                y * scale * 0.5,
                3,
                frequency,
                amplitude * valleyDepth
            );
            
            // Combine all features
            height_value = height_value + ridged + valleys;
            
            // Apply some erosion-like effects
            const erosion = Math.pow(Math.abs(height_value / amplitude), 0.8) * Math.sign(height_value);
            height_value = erosion * amplitude;
            
            heightmap[index] = Math.max(0, height_value);
        }
    }
    
    return heightmap;
}

// Generate rolling hills terrain
function generateHillsTerrain(width, height, options = {}) {
    const {
        scale = 0.01,
        octaves = 4,
        amplitude = 20,
        frequency = 1,
        seed = null
    } = options;
    
    const noise = new PerlinNoise(seed);
    const heightmap = new Float32Array(width * height);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            
            let height_value = noise.fbm2D(
                x * scale,
                y * scale,
                octaves,
                frequency,
                amplitude,
                2.0,
                0.6
            );
            
            // Smooth out negative values for gentle hills
            height_value = Math.max(0, height_value);
            
            // Apply smoothing function
            height_value = Math.pow(height_value / amplitude, 1.5) * amplitude;
            
            heightmap[index] = height_value;
        }
    }
    
    return heightmap;
}

// Export for global use
window.PerlinNoise = PerlinNoise;
window.generateMountainTerrain = generateMountainTerrain;
window.generateHillsTerrain = generateHillsTerrain;
