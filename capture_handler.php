<?php
/**
 * Capture Handler for 3D WebGL Game Video Generation
 * Receives frame data from JavaScript and triggers Python video generation
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set content type to JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Configuration
$config = [
    'temp_dir' => sys_get_temp_dir() . '/webgl_game_capture',
    'output_dir' => __DIR__ . '/videos',
    'python_script' => __DIR__ . '/video_generator.py',
    'max_frames' => 7200, // 2 minutes at 60fps
    'max_file_size' => 100 * 1024 * 1024, // 100MB limit
];

// Create directories if they don't exist
foreach (['temp_dir', 'output_dir'] as $dir_key) {
    if (!is_dir($config[$dir_key])) {
        if (!mkdir($config[$dir_key], 0755, true)) {
            echo json_encode(['success' => false, 'error' => "Failed to create {$dir_key}"]);
            exit();
        }
    }
}

/**
 * Log messages to a file for debugging
 */
function logMessage($message) {
    $logFile = __DIR__ . '/capture_handler.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[{$timestamp}] {$message}\n", FILE_APPEND | LOCK_EX);
}

/**
 * Validate and sanitize input data
 */
function validateInput($data) {
    if (!isset($data['frames']) || !is_array($data['frames'])) {
        return ['valid' => false, 'error' => 'Invalid frames data'];
    }
    
    if (count($data['frames']) === 0) {
        return ['valid' => false, 'error' => 'No frames provided'];
    }
    
    if (count($data['frames']) > $GLOBALS['config']['max_frames']) {
        return ['valid' => false, 'error' => 'Too many frames'];
    }
    
    $fps = isset($data['fps']) ? intval($data['fps']) : 30;
    if ($fps < 1 || $fps > 120) {
        $fps = 30; // Default fallback
    }
    
    return ['valid' => true, 'fps' => $fps];
}

/**
 * Save frame data to temporary JSON file
 */
function saveFrameData($data, $tempDir) {
    $timestamp = date('YmdHis');
    $filename = "frames_{$timestamp}_" . uniqid() . ".json";
    $filepath = $tempDir . '/' . $filename;
    
    $jsonData = json_encode($data, JSON_UNESCAPED_SLASHES);
    if ($jsonData === false) {
        return ['success' => false, 'error' => 'Failed to encode JSON data'];
    }
    
    // Check file size
    if (strlen($jsonData) > $GLOBALS['config']['max_file_size']) {
        return ['success' => false, 'error' => 'Data too large'];
    }
    
    if (file_put_contents($filepath, $jsonData, LOCK_EX) === false) {
        return ['success' => false, 'error' => 'Failed to save frame data'];
    }
    
    return ['success' => true, 'filepath' => $filepath, 'filename' => $filename];
}

/**
 * Execute Python video generation script
 */
function generateVideo($jsonFilePath, $outputDir, $pythonScript, $fps = 30) {
    // Build command
    $command = sprintf(
        'python3 %s %s -o %s -f %d -q medium 2>&1',
        escapeshellarg($pythonScript),
        escapeshellarg($jsonFilePath),
        escapeshellarg($outputDir),
        $fps
    );
    
    logMessage("Executing command: {$command}");
    
    // Execute command
    $output = [];
    $returnCode = 0;
    exec($command, $output, $returnCode);
    
    $outputString = implode("\n", $output);
    logMessage("Command output: {$outputString}");
    logMessage("Return code: {$returnCode}");
    
    // Clean up temporary JSON file
    if (file_exists($jsonFilePath)) {
        unlink($jsonFilePath);
    }
    
    if ($returnCode === 0) {
        // Extract filename from output
        $lines = array_reverse($output);
        foreach ($lines as $line) {
            if (strpos($line, 'Success! Video saved to:') !== false) {
                $videoPath = trim(str_replace('✅ Success! Video saved to:', '', $line));
                $filename = basename($videoPath);
                return ['success' => true, 'filename' => $filename, 'path' => $videoPath];
            }
        }
        
        // Fallback: look for .mp4 files in output directory
        $files = glob($outputDir . '/*.mp4');
        if (!empty($files)) {
            $latestFile = array_reduce($files, function($a, $b) {
                return filemtime($a) > filemtime($b) ? $a : $b;
            });
            return ['success' => true, 'filename' => basename($latestFile), 'path' => $latestFile];
        }
    }
    
    return ['success' => false, 'error' => 'Video generation failed', 'output' => $outputString];
}

// Main processing
try {
    // Get input data
    $input = file_get_contents('php://input');
    if ($input === false) {
        throw new Exception('Failed to read input data');
    }
    
    $data = json_decode($input, true);
    if ($data === null) {
        throw new Exception('Invalid JSON data');
    }
    
    logMessage("Received request with " . count($data['frames'] ?? []) . " frames");
    
    // Validate input
    $validation = validateInput($data);
    if (!$validation['valid']) {
        throw new Exception($validation['error']);
    }
    
    $fps = $validation['fps'];
    
    // Save frame data to temporary file
    $saveResult = saveFrameData($data, $config['temp_dir']);
    if (!$saveResult['success']) {
        throw new Exception($saveResult['error']);
    }
    
    logMessage("Saved frame data to: " . $saveResult['filepath']);
    
    // Check if Python script exists
    if (!file_exists($config['python_script'])) {
        throw new Exception('Python video generator script not found');
    }
    
    // Generate video
    $videoResult = generateVideo(
        $saveResult['filepath'],
        $config['output_dir'],
        $config['python_script'],
        $fps
    );
    
    if ($videoResult['success']) {
        logMessage("Video generated successfully: " . $videoResult['filename']);
        echo json_encode([
            'success' => true,
            'filename' => $videoResult['filename'],
            'message' => 'Video generated successfully'
        ]);
    } else {
        throw new Exception($videoResult['error'] . "\nOutput: " . ($videoResult['output'] ?? ''));
    }
    
} catch (Exception $e) {
    logMessage("Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
