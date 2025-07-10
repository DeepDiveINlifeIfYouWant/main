/**
 * Math Engine - Complete 3D Mathematics Library
 * Built from scratch for WebGL operations
 * No external dependencies
 */

// ============================================================================
// Vector3 Class - 3D Vector Operations
// ============================================================================
class Vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    // Create a new Vec3 from array
    static fromArray(arr) {
        return new Vec3(arr[0] || 0, arr[1] || 0, arr[2] || 0);
    }

    // Convert to array
    toArray() {
        return [this.x, this.y, this.z];
    }

    // Clone this vector
    clone() {
        return new Vec3(this.x, this.y, this.z);
    }

    // Set values
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    // Add vectors
    add(v) {
        return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    // Add in place
    addInPlace(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }

    // Subtract vectors
    subtract(v) {
        return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    // Subtract in place
    subtractInPlace(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }

    // Multiply by scalar
    multiply(scalar) {
        return new Vec3(this.x * scalar, this.y * scalar, this.z * scalar);
    }

    // Multiply in place
    multiplyInPlace(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
    }

    // Divide by scalar
    divide(scalar) {
        if (scalar === 0) return new Vec3(0, 0, 0);
        return new Vec3(this.x / scalar, this.y / scalar, this.z / scalar);
    }

    // Dot product
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    // Cross product
    cross(v) {
        return new Vec3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }

    // Length (magnitude)
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    // Length squared (faster for comparisons)
    lengthSquared() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    // Distance to another vector
    distanceTo(v) {
        return this.subtract(v).length();
    }

    // Normalize (unit vector)
    normalize() {
        const len = this.length();
        if (len === 0) return new Vec3(0, 0, 0);
        return this.divide(len);
    }

    // Normalize in place
    normalizeInPlace() {
        const len = this.length();
        if (len === 0) {
            this.x = this.y = this.z = 0;
        } else {
            this.x /= len;
            this.y /= len;
            this.z /= len;
        }
        return this;
    }

    // Linear interpolation
    lerp(v, t) {
        return new Vec3(
            this.x + (v.x - this.x) * t,
            this.y + (v.y - this.y) * t,
            this.z + (v.z - this.z) * t
        );
    }

    // Reflect vector across normal
    reflect(normal) {
        const dot2 = this.dot(normal) * 2;
        return this.subtract(normal.multiply(dot2));
    }

    // String representation
    toString() {
        return `Vec3(${this.x.toFixed(3)}, ${this.y.toFixed(3)}, ${this.z.toFixed(3)})`;
    }

    // Static utility methods
    static zero() { return new Vec3(0, 0, 0); }
    static one() { return new Vec3(1, 1, 1); }
    static up() { return new Vec3(0, 1, 0); }
    static down() { return new Vec3(0, -1, 0); }
    static left() { return new Vec3(-1, 0, 0); }
    static right() { return new Vec3(1, 0, 0); }
    static forward() { return new Vec3(0, 0, -1); }
    static back() { return new Vec3(0, 0, 1); }
}

// ============================================================================
// Matrix4 Class - 4x4 Matrix Operations for 3D Transformations
// ============================================================================
class Mat4 {
    constructor(elements = null) {
        // Column-major order (OpenGL/WebGL standard)
        this.elements = elements || [
            1, 0, 0, 0,  // Column 0
            0, 1, 0, 0,  // Column 1
            0, 0, 1, 0,  // Column 2
            0, 0, 0, 1   // Column 3
        ];
    }

    // Create identity matrix
    static identity() {
        return new Mat4();
    }

    // Create from array
    static fromArray(arr) {
        return new Mat4([...arr]);
    }

    // Clone matrix
    clone() {
        return new Mat4([...this.elements]);
    }

    // Set to identity
    setIdentity() {
        this.elements = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
        return this;
    }

    // Get element at row, col
    get(row, col) {
        return this.elements[col * 4 + row];
    }

    // Set element at row, col
    set(row, col, value) {
        this.elements[col * 4 + row] = value;
        return this;
    }

    // Matrix multiplication
    multiply(other) {
        const result = new Mat4();
        const a = this.elements;
        const b = other.elements;
        const r = result.elements;

        for (let col = 0; col < 4; col++) {
            for (let row = 0; row < 4; row++) {
                r[col * 4 + row] = 
                    a[0 * 4 + row] * b[col * 4 + 0] +
                    a[1 * 4 + row] * b[col * 4 + 1] +
                    a[2 * 4 + row] * b[col * 4 + 2] +
                    a[3 * 4 + row] * b[col * 4 + 3];
            }
        }

        return result;
    }

    // Multiply in place
    multiplyInPlace(other) {
        const result = this.multiply(other);
        this.elements = result.elements;
        return this;
    }

    // Transform a Vec3 point (w = 1)
    transformPoint(point) {
        const x = point.x, y = point.y, z = point.z;
        const e = this.elements;
        
        const w = e[3] * x + e[7] * y + e[11] * z + e[15];
        
        return new Vec3(
            (e[0] * x + e[4] * y + e[8] * z + e[12]) / w,
            (e[1] * x + e[5] * y + e[9] * z + e[13]) / w,
            (e[2] * x + e[6] * y + e[10] * z + e[14]) / w
        );
    }

    // Transform a Vec3 direction (w = 0)
    transformDirection(direction) {
        const x = direction.x, y = direction.y, z = direction.z;
        const e = this.elements;
        
        return new Vec3(
            e[0] * x + e[4] * y + e[8] * z,
            e[1] * x + e[5] * y + e[9] * z,
            e[2] * x + e[6] * y + e[10] * z
        );
    }

    // Translation matrix
    static translation(x, y, z) {
        if (x instanceof Vec3) {
            y = x.y;
            z = x.z;
            x = x.x;
        }
        
        return new Mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1
        ]);
    }

    // Scaling matrix
    static scaling(x, y, z) {
        if (x instanceof Vec3) {
            y = x.y;
            z = x.z;
            x = x.x;
        }
        if (y === undefined) y = z = x; // Uniform scaling
        
        return new Mat4([
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1
        ]);
    }

    // Rotation around X axis
    static rotationX(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        
        return new Mat4([
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1
        ]);
    }

    // Rotation around Y axis
    static rotationY(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        
        return new Mat4([
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1
        ]);
    }

    // Rotation around Z axis
    static rotationZ(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        
        return new Mat4([
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    // Rotation from Euler angles (XYZ order)
    static rotationFromEuler(x, y, z) {
        return Mat4.rotationZ(z).multiply(Mat4.rotationY(y)).multiply(Mat4.rotationX(x));
    }

    // Perspective projection matrix
    static perspective(fovY, aspect, near, far) {
        const f = 1.0 / Math.tan(fovY * 0.5);
        const rangeInv = 1.0 / (near - far);
        
        return new Mat4([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ]);
    }

    // Orthographic projection matrix
    static orthographic(left, right, bottom, top, near, far) {
        const w = right - left;
        const h = top - bottom;
        const d = far - near;
        
        return new Mat4([
            2/w, 0, 0, 0,
            0, 2/h, 0, 0,
            0, 0, -2/d, 0,
            -(right+left)/w, -(top+bottom)/h, -(far+near)/d, 1
        ]);
    }

    // Look-at view matrix
    static lookAt(eye, target, up) {
        const zAxis = eye.subtract(target).normalize();
        const xAxis = up.cross(zAxis).normalize();
        const yAxis = zAxis.cross(xAxis);
        
        return new Mat4([
            xAxis.x, yAxis.x, zAxis.x, 0,
            xAxis.y, yAxis.y, zAxis.y, 0,
            xAxis.z, yAxis.z, zAxis.z, 0,
            -xAxis.dot(eye), -yAxis.dot(eye), -zAxis.dot(eye), 1
        ]);
    }

    // Transpose matrix
    transpose() {
        const e = this.elements;
        return new Mat4([
            e[0], e[4], e[8], e[12],
            e[1], e[5], e[9], e[13],
            e[2], e[6], e[10], e[14],
            e[3], e[7], e[11], e[15]
        ]);
    }

    // Determinant
    determinant() {
        const e = this.elements;
        
        const a00 = e[0], a01 = e[1], a02 = e[2], a03 = e[3];
        const a10 = e[4], a11 = e[5], a12 = e[6], a13 = e[7];
        const a20 = e[8], a21 = e[9], a22 = e[10], a23 = e[11];
        const a30 = e[12], a31 = e[13], a32 = e[14], a33 = e[15];
        
        return a30 * a21 * a12 * a03 - a20 * a31 * a12 * a03 - a30 * a11 * a22 * a03 + a10 * a31 * a22 * a03 +
               a20 * a11 * a32 * a03 - a10 * a21 * a32 * a03 - a30 * a21 * a02 * a13 + a20 * a31 * a02 * a13 +
               a30 * a01 * a22 * a13 - a00 * a31 * a22 * a13 - a20 * a01 * a32 * a13 + a00 * a21 * a32 * a13 +
               a30 * a11 * a02 * a23 - a10 * a31 * a02 * a23 - a30 * a01 * a12 * a23 + a00 * a31 * a12 * a23 +
               a10 * a01 * a32 * a23 - a00 * a11 * a32 * a23 - a20 * a11 * a02 * a33 + a10 * a21 * a02 * a33 +
               a20 * a01 * a12 * a33 - a00 * a21 * a12 * a33 - a10 * a01 * a22 * a33 + a00 * a11 * a22 * a33;
    }

    // Inverse matrix
    inverse() {
        const e = this.elements;
        const det = this.determinant();
        
        if (Math.abs(det) < 1e-10) {
            return Mat4.identity(); // Return identity if not invertible
        }
        
        const invDet = 1.0 / det;
        const result = new Mat4();
        const r = result.elements;
        
        // Calculate inverse using cofactor method
        r[0] = (e[5] * (e[10] * e[15] - e[11] * e[14]) - e[9] * (e[6] * e[15] - e[7] * e[14]) + e[13] * (e[6] * e[11] - e[7] * e[10])) * invDet;
        r[1] = -(e[1] * (e[10] * e[15] - e[11] * e[14]) - e[9] * (e[2] * e[15] - e[3] * e[14]) + e[13] * (e[2] * e[11] - e[3] * e[10])) * invDet;
        r[2] = (e[1] * (e[6] * e[15] - e[7] * e[14]) - e[5] * (e[2] * e[15] - e[3] * e[14]) + e[13] * (e[2] * e[7] - e[3] * e[6])) * invDet;
        r[3] = -(e[1] * (e[6] * e[11] - e[7] * e[10]) - e[5] * (e[2] * e[11] - e[3] * e[10]) + e[9] * (e[2] * e[7] - e[3] * e[6])) * invDet;
        
        r[4] = -(e[4] * (e[10] * e[15] - e[11] * e[14]) - e[8] * (e[6] * e[15] - e[7] * e[14]) + e[12] * (e[6] * e[11] - e[7] * e[10])) * invDet;
        r[5] = (e[0] * (e[10] * e[15] - e[11] * e[14]) - e[8] * (e[2] * e[15] - e[3] * e[14]) + e[12] * (e[2] * e[11] - e[3] * e[10])) * invDet;
        r[6] = -(e[0] * (e[6] * e[15] - e[7] * e[14]) - e[4] * (e[2] * e[15] - e[3] * e[14]) + e[12] * (e[2] * e[7] - e[3] * e[6])) * invDet;
        r[7] = (e[0] * (e[6] * e[11] - e[7] * e[10]) - e[4] * (e[2] * e[11] - e[3] * e[10]) + e[8] * (e[2] * e[7] - e[3] * e[6])) * invDet;
        
        r[8] = (e[4] * (e[9] * e[15] - e[11] * e[13]) - e[8] * (e[5] * e[15] - e[7] * e[13]) + e[12] * (e[5] * e[11] - e[7] * e[9])) * invDet;
        r[9] = -(e[0] * (e[9] * e[15] - e[11] * e[13]) - e[8] * (e[1] * e[15] - e[3] * e[13]) + e[12] * (e[1] * e[11] - e[3] * e[9])) * invDet;
        r[10] = (e[0] * (e[5] * e[15] - e[7] * e[13]) - e[4] * (e[1] * e[15] - e[3] * e[13]) + e[12] * (e[1] * e[7] - e[3] * e[5])) * invDet;
        r[11] = -(e[0] * (e[5] * e[11] - e[7] * e[9]) - e[4] * (e[1] * e[11] - e[3] * e[9]) + e[8] * (e[1] * e[7] - e[3] * e[5])) * invDet;
        
        r[12] = -(e[4] * (e[9] * e[14] - e[10] * e[13]) - e[8] * (e[5] * e[14] - e[6] * e[13]) + e[12] * (e[5] * e[10] - e[6] * e[9])) * invDet;
        r[13] = (e[0] * (e[9] * e[14] - e[10] * e[13]) - e[8] * (e[1] * e[14] - e[2] * e[13]) + e[12] * (e[1] * e[10] - e[2] * e[9])) * invDet;
        r[14] = -(e[0] * (e[5] * e[14] - e[6] * e[13]) - e[4] * (e[1] * e[14] - e[2] * e[13]) + e[12] * (e[1] * e[6] - e[2] * e[5])) * invDet;
        r[15] = (e[0] * (e[5] * e[10] - e[6] * e[9]) - e[4] * (e[1] * e[10] - e[2] * e[9]) + e[8] * (e[1] * e[6] - e[2] * e[5])) * invDet;
        
        return result;
    }

    // String representation
    toString() {
        const e = this.elements;
        return `Mat4(\n` +
               `  ${e[0].toFixed(3)}, ${e[4].toFixed(3)}, ${e[8].toFixed(3)}, ${e[12].toFixed(3)}\n` +
               `  ${e[1].toFixed(3)}, ${e[5].toFixed(3)}, ${e[9].toFixed(3)}, ${e[13].toFixed(3)}\n` +
               `  ${e[2].toFixed(3)}, ${e[6].toFixed(3)}, ${e[10].toFixed(3)}, ${e[14].toFixed(3)}\n` +
               `  ${e[3].toFixed(3)}, ${e[7].toFixed(3)}, ${e[11].toFixed(3)}, ${e[15].toFixed(3)}\n` +
               `)`;
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

// Convert degrees to radians
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

// Convert radians to degrees
function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

// Clamp value between min and max
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Linear interpolation
function lerp(a, b, t) {
    return a + (b - a) * t;
}

// Smooth step interpolation
function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
}

// Export for use in other modules
window.Vec3 = Vec3;
window.Mat4 = Mat4;
window.toRadians = toRadians;
window.toDegrees = toDegrees;
window.clamp = clamp;
window.lerp = lerp;
window.smoothstep = smoothstep;
