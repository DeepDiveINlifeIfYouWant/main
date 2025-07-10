#!/usr/bin/env python3
"""
Video Generator Script for 3D WebGL Game
Converts captured frame sequences to MP4 video using FFmpeg
"""

import os
import sys
import json
import base64
import tempfile
import subprocess
import argparse
from datetime import datetime
from pathlib import Path

class VideoGenerator:
    def __init__(self, output_dir="videos", temp_dir=None):
        """
        Initialize the video generator
        
        Args:
            output_dir (str): Directory to save output videos
            temp_dir (str): Temporary directory for frame processing
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        if temp_dir:
            self.temp_dir = Path(temp_dir)
        else:
            self.temp_dir = Path(tempfile.gettempdir()) / "webgl_game_frames"
        
        self.temp_dir.mkdir(exist_ok=True)
        
        # Check if FFmpeg is available
        if not self._check_ffmpeg():
            raise RuntimeError("FFmpeg not found. Please install FFmpeg to use video generation.")
    
    def _check_ffmpeg(self):
        """Check if FFmpeg is available in the system"""
        try:
            subprocess.run(['ffmpeg', '-version'], 
                         capture_output=True, check=True)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False
    
    def _decode_base64_image(self, data_url, output_path):
        """
        Decode base64 image data and save to file
        
        Args:
            data_url (str): Base64 encoded image data URL
            output_path (Path): Path to save the decoded image
        """
        try:
            # Remove data URL prefix (e.g., "data:image/jpeg;base64,")
            if ',' in data_url:
                header, data = data_url.split(',', 1)
            else:
                data = data_url
            
            # Decode base64 data
            image_data = base64.b64decode(data)
            
            # Write to file
            with open(output_path, 'wb') as f:
                f.write(image_data)
            
            return True
        except Exception as e:
            print(f"Error decoding image: {e}")
            return False
    
    def _cleanup_temp_files(self, frame_paths):
        """Clean up temporary frame files"""
        for path in frame_paths:
            try:
                if path.exists():
                    path.unlink()
            except Exception as e:
                print(f"Warning: Could not delete temp file {path}: {e}")
    
    def generate_from_frames(self, frames_data, fps=30, quality='medium'):
        """
        Generate video from frame data
        
        Args:
            frames_data (list): List of frame objects with 'data' and 'timestamp'
            fps (int): Frames per second for output video
            quality (str): Video quality ('low', 'medium', 'high')
            
        Returns:
            str: Path to generated video file or None if failed
        """
        if not frames_data:
            print("Error: No frames provided")
            return None
        
        print(f"Processing {len(frames_data)} frames...")
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"webgl_game_{timestamp}.mp4"
        output_path = self.output_dir / output_filename
        
        # Create temporary frame files
        frame_paths = []
        for i, frame in enumerate(frames_data):
            frame_filename = f"frame_{i:06d}.jpg"
            frame_path = self.temp_dir / frame_filename
            
            if self._decode_base64_image(frame['data'], frame_path):
                frame_paths.append(frame_path)
            else:
                print(f"Warning: Failed to decode frame {i}")
        
        if not frame_paths:
            print("Error: No valid frames to process")
            return None
        
        print(f"Decoded {len(frame_paths)} frames to temporary files")
        
        # Set quality parameters
        quality_settings = {
            'low': ['-crf', '28', '-preset', 'fast'],
            'medium': ['-crf', '23', '-preset', 'medium'],
            'high': ['-crf', '18', '-preset', 'slow']
        }
        
        quality_params = quality_settings.get(quality, quality_settings['medium'])
        
        # Build FFmpeg command
        input_pattern = str(self.temp_dir / "frame_%06d.jpg")
        
        ffmpeg_cmd = [
            'ffmpeg',
            '-y',  # Overwrite output file
            '-framerate', str(fps),
            '-i', input_pattern,
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            *quality_params,
            '-movflags', '+faststart',  # Optimize for web playback
            str(output_path)
        ]
        
        try:
            print("Running FFmpeg...")
            print(f"Command: {' '.join(ffmpeg_cmd)}")
            
            result = subprocess.run(
                ffmpeg_cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode == 0:
                print(f"Video generated successfully: {output_path}")
                file_size = output_path.stat().st_size / (1024 * 1024)  # MB
                print(f"File size: {file_size:.2f} MB")
                
                # Clean up temporary files
                self._cleanup_temp_files(frame_paths)
                
                return str(output_path)
            else:
                print(f"FFmpeg error: {result.stderr}")
                return None
                
        except subprocess.TimeoutExpired:
            print("Error: FFmpeg process timed out")
            return None
        except Exception as e:
            print(f"Error running FFmpeg: {e}")
            return None
        finally:
            # Always try to clean up temp files
            self._cleanup_temp_files(frame_paths)
    
    def generate_from_json_file(self, json_file_path, fps=30, quality='medium'):
        """
        Generate video from JSON file containing frame data
        
        Args:
            json_file_path (str): Path to JSON file with frame data
            fps (int): Frames per second
            quality (str): Video quality
            
        Returns:
            str: Path to generated video file or None if failed
        """
        try:
            with open(json_file_path, 'r') as f:
                data = json.load(f)
            
            frames = data.get('frames', [])
            fps = data.get('fps', fps)
            
            return self.generate_from_frames(frames, fps, quality)
            
        except Exception as e:
            print(f"Error reading JSON file: {e}")
            return None

def main():
    """Command line interface"""
    parser = argparse.ArgumentParser(description='Generate video from WebGL game frames')
    parser.add_argument('input', help='JSON file containing frame data')
    parser.add_argument('-o', '--output-dir', default='videos', 
                       help='Output directory for videos')
    parser.add_argument('-f', '--fps', type=int, default=30,
                       help='Frames per second (default: 30)')
    parser.add_argument('-q', '--quality', choices=['low', 'medium', 'high'],
                       default='medium', help='Video quality (default: medium)')
    parser.add_argument('-t', '--temp-dir', help='Temporary directory for processing')
    
    args = parser.parse_args()
    
    try:
        generator = VideoGenerator(args.output_dir, args.temp_dir)
        output_file = generator.generate_from_json_file(
            args.input, args.fps, args.quality
        )
        
        if output_file:
            print(f"\n✅ Success! Video saved to: {output_file}")
            sys.exit(0)
        else:
            print("\n❌ Failed to generate video")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
