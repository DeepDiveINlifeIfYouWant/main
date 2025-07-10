/**
 * Lighting System - Ambient and Lambertian Diffuse Lighting
 * Built from scratch with proper shader integration
 * No external dependencies
 */

class LightingSystem {
    constructor() {
        // Ambient lighting
        this.ambientColor = new Vec3(0.3, 0.3, 0.4);
        this.ambientIntensity = 0.4;
        
        // Directional light (sun)
        this.directionalLight = {
            direction: new Vec3(0.5, -1, 0.3).normalize(),
            color: new Vec3(1.0, 0.95, 0.8),
            intensity: 1.0
        };
        
        // Time of day system
        this.timeOfDay = 12; // 0-24 hours
        this.dayDuration = 120; // seconds for full day cycle
        this.animateTime = true;
        
        // Fog settings
        this.fog = {
            enabled: true,
            color: new Vec3(0.7, 0.8, 0.9),
            near: 50,
            far: 200,
            density: 0.02
        };
        
        // Shadow settings (simplified)
        this.shadows = {
            enabled: false,
            bias: 0.005,
            strength: 0.5
        };
    }

    // Update lighting based on time of day
    update(deltaTime) {
        if (this.animateTime) {
            this.timeOfDay += (deltaTime / this.dayDuration) * 24;
            if (this.timeOfDay >= 24) {
                this.timeOfDay -= 24;
            }
        }
        
        this.updateSunPosition();
        this.updateLightColors();
    }

    // Update sun position based on time of day
    updateSunPosition() {
        // Convert time to angle (0-24 hours -> 0-2π radians)
        const timeAngle = (this.timeOfDay / 24) * Math.PI * 2;
        
        // Sun moves in an arc across the sky
        const sunHeight = Math.sin(timeAngle);
        const sunAngle = timeAngle - Math.PI / 2; // Offset so noon is at top
        
        this.directionalLight.direction = new Vec3(
            Math.cos(sunAngle) * 0.5,
            -Math.abs(sunHeight),
            Math.sin(sunAngle) * 0.3
        ).normalize();
    }

    // Update light colors based on time of day
    updateLightColors() {
        const hour = this.timeOfDay;
        
        // Define color phases throughout the day
        let sunColor, ambientColor, intensity;
        
        if (hour >= 6 && hour < 8) {
            // Dawn
            const t = (hour - 6) / 2;
            sunColor = this.lerpColor(
                new Vec3(1.0, 0.4, 0.2), // Orange dawn
                new Vec3(1.0, 0.95, 0.8), // Daylight
                t
            );
            ambientColor = this.lerpColor(
                new Vec3(0.2, 0.2, 0.3), // Dark blue
                new Vec3(0.3, 0.3, 0.4), // Light blue
                t
            );
            intensity = lerp(0.3, 1.0, t);
        } else if (hour >= 8 && hour < 18) {
            // Day
            sunColor = new Vec3(1.0, 0.95, 0.8);
            ambientColor = new Vec3(0.3, 0.3, 0.4);
            intensity = 1.0;
        } else if (hour >= 18 && hour < 20) {
            // Dusk
            const t = (hour - 18) / 2;
            sunColor = this.lerpColor(
                new Vec3(1.0, 0.95, 0.8), // Daylight
                new Vec3(1.0, 0.3, 0.1), // Red sunset
                t
            );
            ambientColor = this.lerpColor(
                new Vec3(0.3, 0.3, 0.4), // Light blue
                new Vec3(0.1, 0.1, 0.2), // Dark blue
                t
            );
            intensity = lerp(1.0, 0.2, t);
        } else {
            // Night
            sunColor = new Vec3(0.2, 0.2, 0.4); // Moonlight
            ambientColor = new Vec3(0.05, 0.05, 0.1);
            intensity = 0.2;
        }
        
        this.directionalLight.color = sunColor;
        this.directionalLight.intensity = intensity;
        this.ambientColor = ambientColor;
    }

    // Linear interpolation between two colors
    lerpColor(color1, color2, t) {
        return new Vec3(
            lerp(color1.x, color2.x, t),
            lerp(color1.y, color2.y, t),
            lerp(color1.z, color2.z, t)
        );
    }

    // Get lighting uniforms for shaders
    getLightingUniforms() {
        return {
            // Ambient lighting
            uAmbientColor: this.ambientColor.multiply(this.ambientIntensity),
            
            // Directional light
            uLightDirection: this.directionalLight.direction,
            uLightColor: this.directionalLight.color.multiply(this.directionalLight.intensity),
            
            // Fog
            uFogColor: this.fog.color,
            uFogNear: this.fog.near,
            uFogFar: this.fog.far,
            uFogDensity: this.fog.density,
            uFogEnabled: this.fog.enabled ? 1.0 : 0.0,
            
            // Time of day
            uTimeOfDay: this.timeOfDay / 24.0
        };
    }

    // Calculate lighting for a point (CPU-side lighting calculations)
    calculatePointLighting(position, normal, viewDirection, material) {
        // Ambient component
        const ambient = this.ambientColor.multiply(this.ambientIntensity);
        
        // Diffuse component (Lambertian)
        const lightDirection = this.directionalLight.direction.multiply(-1); // Flip direction
        const diffuseFactor = Math.max(0, normal.dot(lightDirection));
        const diffuse = this.directionalLight.color
            .multiply(this.directionalLight.intensity)
            .multiply(diffuseFactor);
        
        // Specular component (Blinn-Phong)
        const halfVector = lightDirection.add(viewDirection).normalize();
        const specularFactor = Math.pow(Math.max(0, normal.dot(halfVector)), material.shininess || 32);
        const specular = this.directionalLight.color
            .multiply(this.directionalLight.intensity)
            .multiply(specularFactor)
            .multiply(material.specularStrength || 0.5);
        
        // Combine components
        const finalColor = ambient
            .add(diffuse.multiply(material.diffuseColor || new Vec3(1, 1, 1)))
            .add(specular.multiply(material.specularColor || new Vec3(1, 1, 1)));
        
        return finalColor;
    }

    // Calculate fog factor
    calculateFogFactor(distance) {
        if (!this.fog.enabled) return 0;
        
        // Linear fog
        const fogFactor = (distance - this.fog.near) / (this.fog.far - this.fog.near);
        return clamp(fogFactor, 0, 1);
    }

    // Apply fog to color
    applyFog(color, distance) {
        const fogFactor = this.calculateFogFactor(distance);
        return color.lerp(this.fog.color, fogFactor);
    }

    // Set time of day manually
    setTimeOfDay(hour) {
        this.timeOfDay = clamp(hour, 0, 24);
        this.updateSunPosition();
        this.updateLightColors();
    }

    // Toggle time animation
    toggleTimeAnimation() {
        this.animateTime = !this.animateTime;
    }

    // Set ambient light
    setAmbientLight(color, intensity = 1.0) {
        this.ambientColor = color;
        this.ambientIntensity = intensity;
    }

    // Set directional light
    setDirectionalLight(direction, color, intensity = 1.0) {
        this.directionalLight.direction = direction.normalize();
        this.directionalLight.color = color;
        this.directionalLight.intensity = intensity;
    }

    // Enable/disable fog
    setFogEnabled(enabled) {
        this.fog.enabled = enabled;
    }

    // Set fog parameters
    setFogParameters(near, far, density, color) {
        this.fog.near = near;
        this.fog.far = far;
        this.fog.density = density;
        if (color) this.fog.color = color;
    }

    // Get debug information
    getDebugInfo() {
        return {
            timeOfDay: this.timeOfDay.toFixed(2),
            sunDirection: this.directionalLight.direction.toString(),
            sunColor: this.directionalLight.color.toString(),
            sunIntensity: this.directionalLight.intensity.toFixed(2),
            ambientColor: this.ambientColor.toString(),
            ambientIntensity: this.ambientIntensity.toFixed(2)
        };
    }
}

// ============================================================================
// Shader Sources with Lighting
// ============================================================================

// Vertex shader with lighting support
const VERTEX_SHADER_SOURCE = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec2 aTexCoord;
    
    uniform mat4 uModelMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uNormalMatrix;
    
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec2 vTexCoord;
    varying float vFogDistance;
    
    void main() {
        // Transform position to world space
        vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        // Transform normal to world space
        vNormal = normalize((uNormalMatrix * vec4(aNormal, 0.0)).xyz);
        
        // Pass through texture coordinates
        vTexCoord = aTexCoord;
        
        // Calculate fog distance
        vec4 viewPosition = uViewMatrix * worldPosition;
        vFogDistance = length(viewPosition.xyz);
        
        // Final position
        gl_Position = uProjectionMatrix * viewPosition;
    }
`;

// Fragment shader with Lambertian diffuse lighting
const FRAGMENT_SHADER_SOURCE = `
    precision mediump float;
    
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec2 vTexCoord;
    varying float vFogDistance;
    
    // Lighting uniforms
    uniform vec3 uAmbientColor;
    uniform vec3 uLightDirection;
    uniform vec3 uLightColor;
    uniform vec3 uCameraPosition;
    
    // Material uniforms
    uniform vec3 uDiffuseColor;
    uniform vec3 uSpecularColor;
    uniform float uShininess;
    uniform float uSpecularStrength;
    
    // Fog uniforms
    uniform vec3 uFogColor;
    uniform float uFogNear;
    uniform float uFogFar;
    uniform float uFogEnabled;
    
    void main() {
        // Normalize interpolated normal
        vec3 normal = normalize(vNormal);
        
        // Calculate view direction
        vec3 viewDirection = normalize(uCameraPosition - vWorldPosition);
        
        // Ambient lighting
        vec3 ambient = uAmbientColor;
        
        // Diffuse lighting (Lambertian)
        vec3 lightDir = normalize(-uLightDirection);
        float diffuseFactor = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = uLightColor * diffuseFactor;
        
        // Specular lighting (Blinn-Phong)
        vec3 halfVector = normalize(lightDir + viewDirection);
        float specularFactor = pow(max(dot(normal, halfVector), 0.0), uShininess);
        vec3 specular = uLightColor * specularFactor * uSpecularStrength;
        
        // Combine lighting components
        vec3 lighting = ambient + diffuse + specular;
        vec3 finalColor = uDiffuseColor * lighting;
        
        // Apply fog
        if (uFogEnabled > 0.5) {
            float fogFactor = clamp((vFogDistance - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);
            finalColor = mix(finalColor, uFogColor, fogFactor);
        }
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

// Simple vertex shader for unlit objects
const SIMPLE_VERTEX_SHADER_SOURCE = `
    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    
    uniform mat4 uModelMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;
    
    varying vec2 vTexCoord;
    
    void main() {
        vTexCoord = aTexCoord;
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
    }
`;

// Simple fragment shader for unlit objects
const SIMPLE_FRAGMENT_SHADER_SOURCE = `
    precision mediump float;
    
    varying vec2 vTexCoord;
    uniform vec3 uColor;
    
    void main() {
        gl_FragColor = vec4(uColor, 1.0);
    }
`;

// Export for global use
window.LightingSystem = LightingSystem;
window.VERTEX_SHADER_SOURCE = VERTEX_SHADER_SOURCE;
window.FRAGMENT_SHADER_SOURCE = FRAGMENT_SHADER_SOURCE;
window.SIMPLE_VERTEX_SHADER_SOURCE = SIMPLE_VERTEX_SHADER_SOURCE;
window.SIMPLE_FRAGMENT_SHADER_SOURCE = SIMPLE_FRAGMENT_SHADER_SOURCE;
