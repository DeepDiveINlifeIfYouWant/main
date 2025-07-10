#!/usr/bin/env python3
"""
Test script for the video generator
Creates a simple test video with colored frames
"""

import json
import base64
from PIL import Image, ImageDraw
import io
from video_generator import VideoGenerator

def create_test_frame(width=800, height=600, color=(255, 0, 0), text="Frame"):
    """Create a test frame with specified color and text"""
    img = Image.new('RGB', (width, height), color)
    draw = ImageDraw.Draw(img)
    
    # Add text
    try:
        draw.text((width//2 - 50, height//2), text, fill=(255, 255, 255))
    except:
        # If font loading fails, just create colored frame
        pass
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=80)
    img_data = buffer.getvalue()
    
    return base64.b64encode(img_data).decode('utf-8')

def create_test_data():
    """Create test frame data similar to what the game would generate"""
    frames = []
    colors = [
        (255, 0, 0),    # Red
        (0, 255, 0),    # Green
        (0, 0, 255),    # Blue
        (255, 255, 0),  # Yellow
        (255, 0, 255),  # Magenta
        (0, 255, 255),  # Cyan
    ]
    
    # Create 30 frames (1 second at 30fps)
    for i in range(30):
        color = colors[i % len(colors)]
        frame_data = create_test_frame(color=color, text=f"Frame {i+1}")
        
        frames.append({
            'data': f'data:image/jpeg;base64,{frame_data}',
            'timestamp': 1000 * i  # Milliseconds
        })
    
    return {
        'frames': frames,
        'fps': 30
    }

def main():
    """Run the test"""
    print("🧪 Testing Video Generator...")
    
    try:
        # Create test data
        print("Creating test frames...")
        test_data = create_test_data()
        
        # Save test data to JSON file
        test_file = 'test_frames.json'
        with open(test_file, 'w') as f:
            json.dump(test_data, f)
        
        print(f"Saved {len(test_data['frames'])} test frames to {test_file}")
        
        # Initialize video generator
        generator = VideoGenerator(output_dir='test_videos')
        
        # Generate video
        print("Generating test video...")
        output_file = generator.generate_from_json_file(test_file)
        
        if output_file:
            print(f"✅ Test successful! Video saved to: {output_file}")
            
            # Clean up test file
            import os
            os.remove(test_file)
            print("Cleaned up test files")
            
        else:
            print("❌ Test failed - video generation unsuccessful")
            
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

if __name__ == '__main__':
    main()
