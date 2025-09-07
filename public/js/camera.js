class CameraManager {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.stream = null;
        this.currentDeviceId = null;
        this.devices = [];
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
       
        if (!this.video || !this.canvas) {
            console.error('Video or canvas elements not found');
            return;
        }

        try {
            await this.getDevices();
            this.setupEventListeners();
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize camera:', error);
            showAlert('Camera initialization failed. Please check your browser permissions.', 'error');
        }
    }

    async getDevices() {
        try {
            // First request permission
            const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
            tempStream.getTracks().forEach(track => track.stop());

            // Get available devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.devices = devices.filter(device => device.kind === 'videoinput');
           
            this.populateDeviceSelect();
        } catch (error) {
            console.error('Error getting camera devices:', error);
            throw error;
        }
    }

    populateDeviceSelect() {
        const select = document.getElementById('cameraSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Select Camera</option>';
       
        this.devices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
           
            // Create friendly names for cameras
            let label = device.label || `Camera ${index + 1}`;
            if (label.toLowerCase().includes('front') || label.toLowerCase().includes('user')) {
                label += ' (Front)';
            } else if (label.toLowerCase().includes('back') || label.toLowerCase().includes('environment')) {
                label += ' (Back)';
            }
           
            option.textContent = label;
            select.appendChild(option);
        });

        // Auto-select first available camera
        if (this.devices.length > 0) {
            select.value = this.devices[0].deviceId;
            this.currentDeviceId = this.devices[0].deviceId;
        }
    }

    setupEventListeners() {
        const cameraBtn = document.getElementById('cameraBtn');
        const startCamera = document.getElementById('startCamera');
        const switchCamera = document.getElementById('switchCamera');
        const captureBtn = document.getElementById('captureBtn');
        const retakeBtn = document.getElementById('retakeBtn');
        const cameraSelect = document.getElementById('cameraSelect');

        if (cameraBtn) {
            cameraBtn.addEventListener('click', () => this.toggleCameraSection());
        }

        if (startCamera) {
            startCamera.addEventListener('click', () => this.startCamera());
        }

        if (switchCamera) {
            switchCamera.addEventListener('click', () => this.switchCamera());
        }

        if (captureBtn) {
            captureBtn.addEventListener('click', () => this.capturePhoto());
        }

        if (retakeBtn) {
            retakeBtn.addEventListener('click', () => this.retakePhoto());
        }

        if (cameraSelect) {
            cameraSelect.addEventListener('change', (e) => {
                this.currentDeviceId = e.target.value;
                if (this.stream) {
                    this.startCamera();
                }
            });
        }
    }

    toggleCameraSection() {
        const cameraSection = document.getElementById('cameraSection');
        const uploadBtn = document.getElementById('uploadBtn');
       
        if (cameraSection) {
            if (cameraSection.classList.contains('hidden')) {
                cameraSection.classList.remove('hidden');
                if (uploadBtn) uploadBtn.style.opacity = '0.5';
            } else {
                cameraSection.classList.add('hidden');
                this.stopCamera();
                if (uploadBtn) uploadBtn.style.opacity = '1';
            }
        }
    }

    async startCamera() {
        try {
            // Stop existing stream
            this.stopCamera();

            const constraints = {
                video: {
                    deviceId: this.currentDeviceId ? { exact: this.currentDeviceId } : undefined,
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
           
            await new Promise((resolve) => {
                this.video.onloadedmetadata = resolve;
            });

            this.video.play();

            // Update UI
            const startBtn = document.getElementById('startCamera');
            const captureBtn = document.getElementById('captureBtn');
           
            if (startBtn) startBtn.textContent = 'Stop Camera';
            if (captureBtn) captureBtn.disabled = false;

        } catch (error) {
            console.error('Error starting camera:', error);
            showAlert('Failed to start camera. Please check permissions and try again.', 'error');
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.video) {
            this.video.srcObject = null;
        }

        // Update UI
        const startBtn = document.getElementById('startCamera');
        const captureBtn = document.getElementById('captureBtn');
       
        if (startBtn) startBtn.textContent = 'Start Camera';
        if (captureBtn) captureBtn.disabled = true;
    }

    async switchCamera() {
        if (this.devices.length <= 1) {
            showAlert('No additional cameras available', 'info');
            return;
        }

        const currentIndex = this.devices.findIndex(device => device.deviceId === this.currentDeviceId);
        const nextIndex = (currentIndex + 1) % this.devices.length;
       
        this.currentDeviceId = this.devices[nextIndex].deviceId;
       
        const select = document.getElementById('cameraSelect');
        if (select) {
            select.value = this.currentDeviceId;
        }

        if (this.stream) {
            await this.startCamera();
        }
    }

    capturePhoto() {
        if (!this.stream || !this.video || !this.canvas) {
            showAlert('Camera not ready. Please start the camera first.', 'error');
            return;
        }

        const context = this.canvas.getContext('2d');
       
        // Set canvas dimensions to match video
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
       
        // Draw video frame to canvas
        context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
       
        // Convert to blob and create file
        this.canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `camera_capture_${Date.now()}.jpg`, {
                    type: 'image/jpeg'
                });
               
                this.handleCapturedImage(file);
            }
        }, 'image/jpeg', 0.8);
    }

    handleCapturedImage(file) {
        // Hide video, show canvas
        this.video.classList.add('hidden');
        this.canvas.classList.remove('hidden');
       
        // Update UI buttons
        const captureBtn = document.getElementById('captureBtn');
        const retakeBtn = document.getElementById('retakeBtn');
       
        if (captureBtn) captureBtn.classList.add('hidden');
        if (retakeBtn) retakeBtn.classList.remove('hidden');
       
        // Stop camera stream
        this.stopCamera();
       
        // Show preview and set file for form submission
        this.showImagePreview(file);
        this.setFormFile(file);
       
        showAlert('Photo captured successfully!', 'success');
    }

    retakePhoto() {
        // Show video, hide canvas
        this.video.classList.remove('hidden');
        this.canvas.classList.add('hidden');
       
        // Update UI buttons
        const captureBtn = document.getElementById('captureBtn');
        const retakeBtn = document.getElementById('retakeBtn');
       
        if (captureBtn) captureBtn.classList.remove('hidden');
        if (retakeBtn) retakeBtn.classList.add('hidden');
       
        // Clear preview
        this.clearImagePreview();
       
        // Restart camera
        this.startCamera();
    }

    showImagePreview(file) {
        const preview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
       
        if (preview && previewImg) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    }

    clearImagePreview() {
        const preview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
       
        if (preview && previewImg) {
            preview.classList.add('hidden');
            previewImg.src = '';
        }
    }

    setFormFile(file) {
        // Create a new DataTransfer object to set the file input
        const dt = new DataTransfer();
        dt.items.add(file);
       
        const fileInput = document.getElementById('imageFile');
        if (fileInput) {
            fileInput.files = dt.files;
        }
       
        // Store reference for form submission
        window.capturedImageFile = file;
    }

    cleanup() {
        this.stopCamera();
        this.isInitialized = false;
    }
}

// Initialize camera manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('cameraSection')) {
        window.cameraManager = new CameraManager();
        window.cameraManager.initialize().catch(error => {
            console.error('Failed to initialize camera manager:', error);
        });
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.cameraManager) {
        window.cameraManager.cleanup();
    }
});