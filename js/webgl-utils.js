/**
 * WebGL Utilities - Core WebGL helper functions
 * Built from scratch for shader compilation, buffer management, and rendering
 * No external dependencies
 */

// ============================================================================
// WebGL Context and Initialization
// ============================================================================
class WebGLManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.programs = new Map();
        this.buffers = new Map();
        this.textures = new Map();
        
        this.init();
    }

    init() {
        // Get WebGL context
        this.gl = this.canvas.getContext('webgl', {
            antialias: true,
            depth: true,
            stencil: false,
            alpha: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false
        });

        if (!this.gl) {
            throw new Error('WebGL not supported');
        }

        // Set initial WebGL state
        const gl = this.gl;
        
        // Enable depth testing
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        
        // Enable face culling
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.frontFace(gl.CCW);
        
        // Set clear color (sky blue)
        gl.clearColor(0.53, 0.81, 0.92, 1.0);
        
        // Set viewport
        this.resize();
        
        console.log('WebGL initialized successfully');
        console.log('WebGL Version:', gl.getParameter(gl.VERSION));
        console.log('GLSL Version:', gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
        console.log('Vendor:', gl.getParameter(gl.VENDOR));
        console.log('Renderer:', gl.getParameter(gl.RENDERER));
    }

    resize() {
        const gl = this.gl;
        const canvas = this.canvas;
        
        // Set canvas size to match display size
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            gl.viewport(0, 0, displayWidth, displayHeight);
        }
    }

    clear() {
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
}

// ============================================================================
// Shader Compilation and Program Management
// ============================================================================
class ShaderManager {
    constructor(gl) {
        this.gl = gl;
        this.programs = new Map();
    }

    // Compile a shader from source
    compileShader(source, type) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`Shader compilation error: ${error}\nSource:\n${source}`);
        }
        
        return shader;
    }

    // Create and link a shader program
    createProgram(vertexSource, fragmentSource, name = 'default') {
        const gl = this.gl;
        
        const vertexShader = this.compileShader(vertexSource, gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentSource, gl.FRAGMENT_SHADER);
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const error = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error(`Program linking error: ${error}`);
        }
        
        // Clean up shaders (they're now part of the program)
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        
        // Get attribute and uniform locations
        const programInfo = {
            program: program,
            attributes: {},
            uniforms: {}
        };
        
        // Get all active attributes
        const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < numAttributes; i++) {
            const attribute = gl.getActiveAttrib(program, i);
            programInfo.attributes[attribute.name] = gl.getAttribLocation(program, attribute.name);
        }
        
        // Get all active uniforms
        const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; i++) {
            const uniform = gl.getActiveUniform(program, i);
            programInfo.uniforms[uniform.name] = gl.getUniformLocation(program, uniform.name);
        }
        
        this.programs.set(name, programInfo);
        console.log(`Shader program '${name}' created successfully`);
        
        return programInfo;
    }

    // Get a program by name
    getProgram(name) {
        return this.programs.get(name);
    }

    // Use a program
    useProgram(name) {
        const programInfo = this.programs.get(name);
        if (programInfo) {
            this.gl.useProgram(programInfo.program);
            return programInfo;
        }
        throw new Error(`Program '${name}' not found`);
    }
}

// ============================================================================
// Buffer Management
// ============================================================================
class BufferManager {
    constructor(gl) {
        this.gl = gl;
        this.buffers = new Map();
    }

    // Create a buffer
    createBuffer(data, type = null, usage = null) {
        const gl = this.gl;
        
        // Default parameters
        if (type === null) type = gl.ARRAY_BUFFER;
        if (usage === null) usage = gl.STATIC_DRAW;
        
        const buffer = gl.createBuffer();
        gl.bindBuffer(type, buffer);
        
        // Convert data to appropriate typed array
        let typedData;
        if (data instanceof Float32Array || data instanceof Uint16Array || data instanceof Uint32Array) {
            typedData = data;
        } else if (type === gl.ELEMENT_ARRAY_BUFFER) {
            typedData = new Uint16Array(data);
        } else {
            typedData = new Float32Array(data);
        }
        
        gl.bufferData(type, typedData, usage);
        
        return {
            buffer: buffer,
            type: type,
            size: typedData.length,
            itemSize: this.getItemSize(type, typedData),
            count: this.getCount(type, typedData)
        };
    }

    // Get item size for buffer type
    getItemSize(type, data) {
        if (type === this.gl.ELEMENT_ARRAY_BUFFER) {
            return 1; // Indices are single values
        }
        // For vertex data, assume 3 components per vertex by default
        // This can be overridden when setting up vertex attributes
        return 3;
    }

    // Get count of items in buffer
    getCount(type, data) {
        if (type === this.gl.ELEMENT_ARRAY_BUFFER) {
            return data.length; // Number of indices
        }
        return Math.floor(data.length / this.getItemSize(type, data));
    }

    // Bind a buffer
    bindBuffer(bufferInfo) {
        this.gl.bindBuffer(bufferInfo.type, bufferInfo.buffer);
    }

    // Set up vertex attribute
    setupAttribute(location, bufferInfo, size = 3, type = null, normalized = false, stride = 0, offset = 0) {
        const gl = this.gl;
        
        if (type === null) type = gl.FLOAT;
        
        this.bindBuffer(bufferInfo);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
    }
}

// ============================================================================
// Texture Management
// ============================================================================
class TextureManager {
    constructor(gl) {
        this.gl = gl;
        this.textures = new Map();
    }

    // Create a solid color texture
    createSolidTexture(color, name) {
        const gl = this.gl;
        const texture = gl.createTexture();
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // Create 1x1 pixel texture with solid color
        const pixel = new Uint8Array([
            Math.floor(color[0] * 255),
            Math.floor(color[1] * 255),
            Math.floor(color[2] * 255),
            255
        ]);
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        
        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        const textureInfo = {
            texture: texture,
            width: 1,
            height: 1
        };
        
        this.textures.set(name, textureInfo);
        return textureInfo;
    }

    // Create a procedural texture
    createProceduralTexture(width, height, generator, name) {
        const gl = this.gl;
        const texture = gl.createTexture();
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // Generate texture data
        const data = new Uint8Array(width * height * 4);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const color = generator(x / width, y / height);
                
                data[index] = Math.floor(color[0] * 255);     // R
                data[index + 1] = Math.floor(color[1] * 255); // G
                data[index + 2] = Math.floor(color[2] * 255); // B
                data[index + 3] = 255;                        // A
            }
        }
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        
        // Generate mipmaps
        gl.generateMipmap(gl.TEXTURE_2D);
        
        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        
        const textureInfo = {
            texture: texture,
            width: width,
            height: height
        };
        
        this.textures.set(name, textureInfo);
        return textureInfo;
    }

    // Bind a texture
    bindTexture(name, unit = 0) {
        const gl = this.gl;
        const textureInfo = this.textures.get(name);
        
        if (textureInfo) {
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
            return true;
        }
        
        return false;
    }

    // Get texture info
    getTexture(name) {
        return this.textures.get(name);
    }
}

// ============================================================================
// Uniform Utilities
// ============================================================================
class UniformManager {
    constructor(gl) {
        this.gl = gl;
    }

    // Set uniform value based on type
    setUniform(location, value) {
        if (location === null || location === undefined) return;
        
        const gl = this.gl;
        
        if (typeof value === 'number') {
            gl.uniform1f(location, value);
        } else if (value instanceof Vec3) {
            gl.uniform3f(location, value.x, value.y, value.z);
        } else if (value instanceof Mat4) {
            gl.uniformMatrix4fv(location, false, value.elements);
        } else if (Array.isArray(value)) {
            switch (value.length) {
                case 1:
                    gl.uniform1f(location, value[0]);
                    break;
                case 2:
                    gl.uniform2f(location, value[0], value[1]);
                    break;
                case 3:
                    gl.uniform3f(location, value[0], value[1], value[2]);
                    break;
                case 4:
                    gl.uniform4f(location, value[0], value[1], value[2], value[3]);
                    break;
                case 16:
                    gl.uniformMatrix4fv(location, false, value);
                    break;
                default:
                    console.warn('Unsupported uniform array length:', value.length);
            }
        } else {
            console.warn('Unsupported uniform type:', typeof value, value);
        }
    }

    // Set multiple uniforms from an object
    setUniforms(programInfo, uniforms) {
        for (const [name, value] of Object.entries(uniforms)) {
            const location = programInfo.uniforms[name];
            this.setUniform(location, value);
        }
    }
}

// ============================================================================
// Mesh Rendering
// ============================================================================
class MeshRenderer {
    constructor(gl, bufferManager, uniformManager) {
        this.gl = gl;
        this.bufferManager = bufferManager;
        this.uniformManager = uniformManager;
    }

    // Render a mesh
    render(mesh, programInfo, uniforms = {}) {
        const gl = this.gl;
        
        // Set uniforms
        this.uniformManager.setUniforms(programInfo, uniforms);
        
        // Set up vertex attributes
        if (mesh.positions && programInfo.attributes.aPosition !== undefined) {
            this.bufferManager.setupAttribute(
                programInfo.attributes.aPosition,
                mesh.positions,
                3
            );
        }
        
        if (mesh.normals && programInfo.attributes.aNormal !== undefined) {
            this.bufferManager.setupAttribute(
                programInfo.attributes.aNormal,
                mesh.normals,
                3
            );
        }
        
        if (mesh.texCoords && programInfo.attributes.aTexCoord !== undefined) {
            this.bufferManager.setupAttribute(
                programInfo.attributes.aTexCoord,
                mesh.texCoords,
                2
            );
        }
        
        if (mesh.colors && programInfo.attributes.aColor !== undefined) {
            this.bufferManager.setupAttribute(
                programInfo.attributes.aColor,
                mesh.colors,
                3
            );
        }
        
        // Draw the mesh
        if (mesh.indices) {
            this.bufferManager.bindBuffer(mesh.indices);
            gl.drawElements(gl.TRIANGLES, mesh.indices.count, gl.UNSIGNED_SHORT, 0);
        } else if (mesh.positions) {
            gl.drawArrays(gl.TRIANGLES, 0, mesh.positions.count);
        }
    }
}

// ============================================================================
// Export classes for global use
// ============================================================================
window.WebGLManager = WebGLManager;
window.ShaderManager = ShaderManager;
window.BufferManager = BufferManager;
window.TextureManager = TextureManager;
window.UniformManager = UniformManager;
window.MeshRenderer = MeshRenderer;
