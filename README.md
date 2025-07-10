# 🏠 House Explorer - 3D WebGL Game

A complete 3D game environment built **entirely from scratch** using pure WebGL 1.0 and vanilla JavaScript. No external libraries, no frameworks, no engines - everything is custom-built to demonstrate advanced 3D graphics programming.

![House Explorer Screenshot](https://img.shields.io/badge/WebGL-1.0-blue) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow) ![No Dependencies](https://img.shields.io/badge/Dependencies-None-green)

## 🎮 Features

### 3D Game Environment
- **Pure WebGL Implementation**: No external libraries (Three.js, React, etc.)
- **Complete 3D Scene**: House, terrain, skybox, and dynamic lighting
- **First-Person Camera**: WASD movement + mouse look controls
- **Physics**: Basic gravity and ground collision
- **Real-time Rendering**: 60fps with custom shaders

### Video Capture System
- **Frame Buffer**: Continuously captures last 2 minutes of gameplay
- **On-Demand Recording**: Press 'S' to save video
- **Multi-Language Integration**: JavaScript → PHP → Python → FFmpeg
- **High Quality Output**: Configurable video quality and framerate

## 🚀 Quick Start

### Prerequisites
- Web server with PHP support (Apache, Nginx, or local development server)
- Python 3.6+
- FFmpeg installed and accessible via command line

### Installation

1. **Clone/Download the files** to your web server directory:
   ```
   3d-game.html
   capture_handler.php
   video_generator.py
   ```

2. **Install FFmpeg**:
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt install ffmpeg
   
   # macOS
   brew install ffmpeg
   
   # Windows
   # Download from https://ffmpeg.org/download.html
   ```

3. **Set up Python environment** (optional but recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

4. **Make Python script executable**:
   ```bash
   chmod +x video_generator.py
   ```

5. **Create required directories**:
   ```bash
   mkdir videos
   ```

### Running the Game

1. **Start your web server** and navigate to `3d-game.html`
2. **Click on the canvas** to lock mouse cursor
3. **Use controls**:
   - `WASD`: Move around
   - `Mouse`: Look around
   - `Space`: Jump
   - `S`: Save video of last 2 minutes

## 🎯 Controls

| Key/Action | Function |
|------------|----------|
| **W** | Move forward |
| **A** | Move left |
| **S** | Move backward (also saves video when pressed) |
| **D** | Move right |
| **Space** | Jump |
| **Mouse** | Look around (after clicking canvas) |
| **Click Canvas** | Lock mouse cursor |

## 🏗️ Architecture

### Frontend (3D Game)
- **WebGL Context**: Manual setup with custom shaders
- **3D Math Library**: Matrix operations, vector math
- **Geometry System**: Procedural cube, plane, and terrain generation
- **Scene Management**: Object creation and rendering pipeline
- **Input System**: Keyboard and mouse event handling
- **Frame Capture**: Canvas-to-base64 conversion with circular buffer

### Backend (Video Processing)
- **PHP Handler**: Receives frame data, validates, and triggers processing
- **Python Generator**: Decodes base64 images and uses FFmpeg for video creation
- **File Management**: Temporary file handling and cleanup

## 📁 File Structure

```
project/
├── 3d-game.html          # Main game file (HTML + JavaScript)
├── capture_handler.php   # PHP endpoint for video processing
├── video_generator.py    # Python script for video generation
├── README.md            # This file
├── videos/              # Generated videos (created automatically)
└── logs/                # Debug logs (created automatically)
```

## ⚙️ Configuration

### Video Quality Settings
Edit `video_generator.py` to modify quality presets:
```python
quality_settings = {
    'low': ['-crf', '28', '-preset', 'fast'],
    'medium': ['-crf', '23', '-preset', 'medium'],
    'high': ['-crf', '18', '-preset', 'slow']
}
```

### Frame Buffer Size
Modify in `3d-game.html`:
```javascript
maxFrames: 120 * 60 * 2, // 2 minutes at 60fps
```

### PHP Configuration
Edit `capture_handler.php`:
```php
$config = [
    'max_frames' => 7200,              // Maximum frames to process
    'max_file_size' => 100 * 1024 * 1024, // 100MB limit
];
```

## 🔧 Technical Details

### WebGL Shaders
- **Vertex Shader**: Handles 3D transformations and lighting calculations
- **Fragment Shader**: Implements Phong lighting model with ambient, diffuse, and specular components

### 3D Scene Components
- **Terrain**: Procedurally generated with sine wave height variations
- **House**: Constructed from multiple cube primitives (base, roof, door, windows)
- **Lighting**: Directional light with configurable color and direction
- **Camera**: First-person perspective with proper view and projection matrices

### Video Pipeline
1. **Capture**: Canvas frames converted to JPEG base64
2. **Buffer**: Circular buffer maintains last 2 minutes
3. **Transfer**: AJAX POST to PHP handler
4. **Processing**: Python decodes images and calls FFmpeg
5. **Output**: MP4 video with H.264 encoding

## 🐛 Troubleshooting

### Common Issues

**Video generation fails:**
- Ensure FFmpeg is installed and accessible
- Check PHP error logs and `capture_handler.log`
- Verify Python script has execute permissions

**WebGL not working:**
- Check browser WebGL support: https://get.webgl.org/
- Enable hardware acceleration in browser settings
- Update graphics drivers

**Performance issues:**
- Reduce frame capture frequency in game loop
- Lower video quality settings
- Decrease terrain complexity

### Debug Information
- Check browser console for JavaScript errors
- Monitor `capture_handler.log` for PHP/Python issues
- Use browser dev tools to inspect network requests

## 🎨 Customization

### Adding New 3D Objects
```javascript
// Create custom geometry
const myGeometry = {
    vertices: [...], // Position, normal, UV data
    indices: [...]   // Triangle indices
};

// Add to scene
const myObject = Scene.createObject(myGeometry, position, rotation, scale, color);
Scene.add(myObject);
```

### Modifying Shaders
Edit the shader source strings in `3d-game.html`:
- `vertexShaderSource`: Vertex transformations
- `fragmentShaderSource`: Pixel color calculations

### Custom Controls
Add new key bindings in the `initInput()` function:
```javascript
if (Game.input.keys['KeyE']) {
    // Custom action
}
```

## 📊 Performance

### Optimization Tips
- Frame capture occurs every 2nd frame to reduce memory usage
- Circular buffer prevents unlimited memory growth
- WebGL uses efficient buffer management
- Video encoding uses hardware acceleration when available

### System Requirements
- **Minimum**: Modern browser with WebGL support, 4GB RAM
- **Recommended**: Dedicated graphics card, 8GB+ RAM, SSD storage
- **For video generation**: Multi-core CPU, 16GB+ RAM recommended

## 🤝 Contributing

This is a self-contained educational project demonstrating:
- Pure WebGL programming without frameworks
- 3D mathematics and graphics programming
- Multi-language system integration
- Real-time video capture and processing

Feel free to extend and modify for your own projects!

## 📄 License

This project is provided as-is for educational purposes. Feel free to use, modify, and distribute.

## 🙏 Acknowledgments

- WebGL specification and documentation
- FFmpeg for video processing capabilities
- Modern browser WebGL implementations
