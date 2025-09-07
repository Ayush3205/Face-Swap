document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
});

function initializeForm() {
    const form = document.getElementById('submissionForm');
    const imageFile = document.getElementById('imageFile');
    const uploadBtn = document.getElementById('uploadBtn');
    const removeImageBtn = document.getElementById('removeImage');

    if (!form) return;

    // File upload handling
    if (uploadBtn && imageFile) {
        uploadBtn.addEventListener('click', () => {
            imageFile.click();
        });

        imageFile.addEventListener('change', handleFileSelect);
    }

    // Remove image button
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', clearImage);
    }

    // Form submission
    form.addEventListener('submit', handleFormSubmit);

    // Real-time validation
    setupRealTimeValidation();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
        showAlert(validation.message, 'error');
        clearFileInput();
        return;
    }

    // Show preview
    showImagePreview(file);
    showAlert('Image selected successfully!', 'success');
}

function validateImageFile(file) {
    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            message: 'Only JPG, JPEG, and PNG files are allowed'
        };
    }

    if (file.size > maxSize) {
        return {
            isValid: false,
            message: 'File size must not exceed 2MB'
        };
    }

    return { isValid: true };
}

function showImagePreview(file) {
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');

    if (!preview || !previewImg) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        previewImg.src = e.target.result;
        preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    clearFileInput();
    clearImagePreview();
   
    // Clear camera capture if exists
    if (window.cameraManager) {
        window.cameraManager.clearImagePreview();
    }
   
    // Clear captured file reference
    if (window.capturedImageFile) {
        delete window.capturedImageFile;
    }
   
    showAlert('Image removed', 'info');
}

function clearFileInput() {
    const imageFile = document.getElementById('imageFile');
    if (imageFile) {
        imageFile.value = '';
    }
}

function clearImagePreview() {
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');

    if (preview && previewImg) {
        preview.classList.add('hidden');
        previewImg.src = '';
    }
}

function setupRealTimeValidation() {
    const fields = {
        name: {
            element: document.getElementById('name'),
            rules: {
                required: true,
                minLength: 4,
                maxLength: 30,
                pattern: /^[A-Za-z\s]+$/,
                patternMessage: 'Name must contain only alphabetic characters'
            }
        },
        email: {
            element: document.getElementById('email'),
            rules: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                patternMessage: 'Please enter a valid email address'
            }
        },
        phone: {
            element: document.getElementById('phone'),
            rules: {
                required: true,
                pattern: /^\d{10}$/,
                patternMessage: 'Phone number must be exactly 10 digits'
            }
        }
    };

    Object.keys(fields).forEach(fieldName => {
        const field = fields[fieldName];
        if (field.element) {
            field.element.addEventListener('blur', () => {
                validateSingleField(fieldName, field);
            });

            field.element.addEventListener('input', () => {
                // Clear previous errors on input
                clearFieldError(fieldName);
            });
        }
    });

    // Phone number input restriction
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            // Allow only numbers
            this.value = this.value.replace(/\D/g, '');
           
            // Limit to 10 digits
            if (this.value.length > 10) {
                this.value = this.value.slice(0, 10);
            }
        });
    }
}

function validateSingleField(fieldName, field) {
    const errors = validateField(field.element, field.rules);
   
    if (errors.length > 0) {
        showFieldError(fieldName, errors[0]);
        return false;
    } else {
        clearFieldError(fieldName);
        return true;
    }
}

function showFieldError(fieldName, message) {
    const errorElement = document.getElementById(`${fieldName}-error`);
    const inputElement = document.getElementById(fieldName);

    if (errorElement) {
        errorElement.textContent = message;
    }

    if (inputElement) {
        inputElement.classList.add('error');
    }
}

function clearFieldError(fieldName) {
    const errorElement = document.getElementById(`${fieldName}-error`);
    const inputElement = document.getElementById(fieldName);

    if (errorElement) {
        errorElement.textContent = '';
    }

    if (inputElement) {
        inputElement.classList.remove('error');
    }
}

function validateForm() {
    let isValid = true;
    const errors = [];

    // Validate name
    const name = document.getElementById('name');
    if (name) {
        const nameErrors = validateField(name, {
            required: true,
            minLength: 4,
            maxLength: 30,
            pattern: /^[A-Za-z\s]+$/,
            patternMessage: 'Name must contain only alphabetic characters'
        });

        if (nameErrors.length > 0) {
            showFieldError('name', nameErrors[0]);
            errors.push(...nameErrors);
            isValid = false;
        }
    }

    // Validate email
    const email = document.getElementById('email');
    if (email) {
        const emailErrors = validateField(email, {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            patternMessage: 'Please enter a valid email address'
        });

        if (emailErrors.length > 0) {
            showFieldError('email', emailErrors[0]);
            errors.push(...emailErrors);
            isValid = false;
        }
    }

    // Validate phone
    const phone = document.getElementById('phone');
    if (phone) {
        const phoneErrors = validateField(phone, {
            required: true,
            pattern: /^\d{10}$/,
            patternMessage: 'Phone number must be exactly 10 digits'
        });

        if (phoneErrors.length > 0) {
            showFieldError('phone', phoneErrors[0]);
            errors.push(...phoneErrors);
            isValid = false;
        }
    }

    // Validate terms
    const terms = document.getElementById('terms');
    if (terms && !terms.checked) {
        showFieldError('terms', 'You must accept the terms and conditions');
        errors.push('Terms and conditions must be accepted');
        isValid = false;
    }

    // Validate image
    const imageFile = document.getElementById('imageFile');
    const hasFile = imageFile && imageFile.files && imageFile.files.length > 0;
    const hasCapturedFile = window.capturedImageFile;

    if (!hasFile && !hasCapturedFile) {
        showAlert('Please select or capture an image', 'error');
        errors.push('Image is required');
        isValid = false;
    }

    return { isValid, errors };
}

async function handleFormSubmit(event) {
    event.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    try {
        // Show loading state
        submitBtn.disabled = true;
        if (btnText) btnText.classList.add('hidden');
        if (btnLoader) btnLoader.classList.remove('hidden');

        // Validate form
        const validation = validateForm();
        if (!validation.isValid) {
            showAlert('Please correct the errors below', 'error');
            return;
        }

        // Prepare form data
        const formData = new FormData();
       
        // Add form fields
        formData.append('name', sanitizeInput(document.getElementById('name').value.trim()));
        formData.append('email', document.getElementById('email').value.trim().toLowerCase());
        formData.append('phone', document.getElementById('phone').value.trim());
        formData.append('terms', document.getElementById('terms').checked ? 'on' : 'off');

        // Add image file
        const imageFile = document.getElementById('imageFile');
        if (window.capturedImageFile) {
            // Use captured image from camera
            formData.append('image', window.capturedImageFile);
        } else if (imageFile.files && imageFile.files.length > 0) {
            // Use uploaded file
            formData.append('image', imageFile.files[0]);
        }

        // Submit form
        const response = await fetch('/submit', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showAlert('Form submitted successfully! Processing your image...', 'success');
           
            // Reset form after successful submission
            setTimeout(() => {
                resetForm();
                // Optionally redirect to submissions page
                // window.location.href = '/submissions';
            }, 2000);
           
        } else {
            throw new Error(result.message || 'Submission failed');
        }

    } catch (error) {
        console.error('Form submission error:', error);
        showAlert(error.message || 'Failed to submit form. Please try again.', 'error');
       
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        if (btnText) btnText.classList.remove('hidden');
        if (btnLoader) btnLoader.classList.add('hidden');
    }
}

function resetForm() {
    const form = document.getElementById('submissionForm');
    if (form) {
        form.reset();
    }

    // Clear image preview
    clearImage();

    // Clear all error messages
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(element => {
        element.textContent = '';
    });

    // Remove error classes
    const inputElements = document.querySelectorAll('.form-input');
    inputElements.forEach(element => {
        element.classList.remove('error');
    });

    // Hide camera section
    const cameraSection = document.getElementById('cameraSection');
    if (cameraSection && !cameraSection.classList.contains('hidden')) {
        cameraSection.classList.add('hidden');
        if (window.cameraManager) {
            window.cameraManager.stopCamera();
        }
    }

    showAlert('Form reset successfully', 'info');
}