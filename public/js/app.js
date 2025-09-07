// Global app functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips, smooth scrolling, etc.
    console.log('App initialized');
});

// Utility function to show alerts
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    // Clear existing alerts
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);

    // Auto-hide after 5 seconds
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 300);
    }, 5000);
}

// Utility function to validate form fields
function validateField(field, rules) {
    const value = field.value.trim();
    const errors = [];

    if (rules.required && !value) {
        errors.push(`${field.name} is required`);
    }

    if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field.name} must be at least ${rules.minLength} characters`);
    }

    if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field.name} must not exceed ${rules.maxLength} characters`);
    }

    if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(rules.patternMessage || `${field.name} format is invalid`);
    }

    return errors;
}

// Utility function to sanitize input
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Utility function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
   
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
   
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Utility function to check if file type is valid
function isValidFileType(file, allowedTypes) {
    return allowedTypes.includes(file.type);
}

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});
