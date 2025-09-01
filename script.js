// LeadConnector webhook (registration sink)
const WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/LgasrYy14nTkruCt8nIq/webhook-trigger/2121797a-0e36-4c1c-8853-8d69c613376f';

function publishRegistration(data) {
    try {
        const payloadObj = {
            event: 'webinar_registration',
            source: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            ...data,
        };
        let sent = false;

        // Prefer sendBeacon for reliability (fires on navigation)
        if (navigator.sendBeacon) {
            try {
                const blob = new Blob([JSON.stringify(payloadObj)], { type: 'application/json;charset=UTF-8' });
                sent = navigator.sendBeacon(WEBHOOK_URL, blob);
            } catch (_) { sent = false; }
        }

        // Fallback: post via hidden form to bypass CORS entirely
        if (!sent) {
            postViaHiddenForm(WEBHOOK_URL, payloadObj);
        }
    } catch (e) {
        console.warn('Webhook publish error', e);
    }
}

function ensureHiddenIframe(name) {
    let iframe = document.querySelector(`iframe[name="${name}"]`);
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.name = name;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    }
    return iframe;
}

function postViaHiddenForm(url, data) {
    ensureHiddenIframe('webhook_sink');
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.target = 'webhook_sink';
    form.style.display = 'none';

    Object.entries(data).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = typeof value === 'string' ? value : JSON.stringify(value);
        form.appendChild(input);
    });

    document.body.appendChild(form);
    try { form.submit(); } finally { form.remove(); }
}

// Countdown / Status Logic
function updateCountdown() {
    const start = new Date('September 8, 2025 20:00:00 EDT').getTime();
    const end = new Date('September 8, 2025 21:00:00 EDT').getTime();
    const now = Date.now();
    const countdownElement = document.getElementById('countdown');

    if (!countdownElement) return;

    if (now < start) {
        const timeLeft = start - now;
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        if (days > 0) {
            countdownElement.textContent = `⏰ ${days}d ${hours}h ${minutes}m ${seconds}s until live event`;
        } else if (hours > 0) {
            countdownElement.textContent = `⏰ ${hours}h ${minutes}m ${seconds}s until live event`;
        } else {
            countdownElement.textContent = `⏰ ${minutes}m ${seconds}s until live event`;
        }
        countdownElement.style.background = '';
        countdownElement.style.animation = '';
    } else if (now >= start && now < end) {
        countdownElement.textContent = '🔴 Live Now';
        countdownElement.style.background = 'rgba(220, 53, 69, 0.9)';
        countdownElement.style.animation = 'pulse 2s infinite';
    } else {
        // Event ended: clear status
        countdownElement.textContent = '';
        countdownElement.style.background = '';
        countdownElement.style.animation = '';
    }
}

// Update countdown every second
setInterval(updateCountdown, 1000);

// Initialize countdown on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCountdown();
    
    // Form validation and handling
    const form = document.getElementById('registrationForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic form validation
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const email = document.getElementById('email').value.trim();
            const specialty = document.getElementById('specialty').value;
            const stage = document.getElementById('stage').value;
            const agreement = document.getElementById('agreement').checked;
            
            // Validation checks
            if (!firstName) {
                alert('Please enter your first name.');
                document.getElementById('firstName').focus();
                return;
            }
            
            if (!lastName) {
                alert('Please enter your last name.');
                document.getElementById('lastName').focus();
                return;
            }
            
            if (!email || !isValidEmail(email)) {
                alert('Please enter a valid email address.');
                document.getElementById('email').focus();
                return;
            }
            
            if (!specialty) {
                alert('Please select your specialty.');
                document.getElementById('specialty').focus();
                return;
            }
            
            if (!stage) {
                alert('Please select your current stage.');
                document.getElementById('stage').focus();
                return;
            }
            
            if (!agreement) {
                alert('Please agree to receive event updates from AMON.');
                document.getElementById('agreement').focus();
                return;
            }
            // Store form data in localStorage for the thank you page
            const formData = {
                firstName,
                lastName,
                email,
                specialty,
                stage,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('registrationData', JSON.stringify(formData));
            
            // Publish asynchronously to LeadConnector webhook
            publishRegistration(formData);
            
            // Show loading state
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = 'Registering...';
            submitButton.disabled = true;
            
            // Redirect to thank you page (webhook fire-and-forget)
            setTimeout(() => {
                window.location.href = 'thank-you.html';
            }, 1500);
        });
    }

    // Debug helper: trigger a webhook POST with dummy data
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('debug_webhook') === '1') {
            publishRegistration({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                specialty: 'debug',
                stage: 'debug',
            });
            console.log('Debug webhook POST fired');
        }
    } catch (_) {}
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add animation to form elements on focus
    const formInputs = document.querySelectorAll('input, select');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.transform = 'scale(1.02)';
            this.style.transition = 'transform 0.2s ease';
        });
        
        input.addEventListener('blur', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Add pulse animation for live event
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
});

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Track form interactions for analytics (optional)
function trackFormInteraction(action, field) {
    // This would integrate with your analytics platform
    console.log(`Form interaction: ${action} on ${field}`);
}

// Add event listeners for analytics tracking
document.addEventListener('DOMContentLoaded', function() {
    const formFields = document.querySelectorAll('#registrationForm input, #registrationForm select');
    
    formFields.forEach(field => {
        field.addEventListener('focus', () => trackFormInteraction('focus', field.id));
        field.addEventListener('change', () => trackFormInteraction('change', field.id));
    });
    
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', () => trackFormInteraction('click', 'submit_button'));
    }
});

// Handle browser back button to prevent form resubmission
window.addEventListener('beforeunload', function() {
    const form = document.getElementById('registrationForm');
    if (form) {
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton.disabled) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Register Free →';
        }
    }
});

// Thank you page personalization
if (window.location.pathname.includes('thank-you')) {
    document.addEventListener('DOMContentLoaded', function() {
        const registrationData = localStorage.getItem('registrationData');
        if (registrationData) {
            try {
                const data = JSON.parse(registrationData);
                
                // Personalize the thank you message
                const titleElement = document.querySelector('.thank-you-title');
                if (titleElement && data.firstName) {
                    titleElement.innerHTML = `You're in, ${data.firstName}! ✅`;
                }
                
                // Add registration timestamp
                const confirmationDetails = document.querySelector('.confirmation-details');
                if (confirmationDetails && data.timestamp) {
                    const timestamp = new Date(data.timestamp).toLocaleString();
                    const timestampElement = document.createElement('p');
                    timestampElement.innerHTML = `<small>Registered on: ${timestamp}</small>`;
                    timestampElement.style.opacity = '0.8';
                    timestampElement.style.fontSize = '0.9rem';
                    confirmationDetails.appendChild(timestampElement);
                }
                
            } catch (error) {
                console.error('Error parsing registration data:', error);
            }
        }
    });
}
