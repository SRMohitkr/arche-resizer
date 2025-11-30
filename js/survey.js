// EmailJS Configuration
const EMAILJS_CONFIG = {
    PUBLIC_KEY: 'YOUR_PUBLIC_KEY', // User needs to replace this
    SERVICE_ID: 'YOUR_SERVICE_ID',
    TEMPLATE_ID: 'YOUR_TEMPLATE_ID'
};

// DOM Elements
const surveyForm = document.getElementById('survey-form');
const submitBtn = document.getElementById('submit-btn');
const loader = document.getElementById('loader');
const themeToggle = document.getElementById('theme-toggle');
const iconLight = document.getElementById('theme-icon-light');
const iconDark = document.getElementById('theme-icon-dark');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    setupTheme();
    setupEventListeners();
    checkFileAvailability();
});

function setupTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        updateThemeIcons(true);
    } else {
        document.documentElement.classList.remove('dark');
        updateThemeIcons(false);
    }

    themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.theme = isDark ? 'dark' : 'light';
        updateThemeIcons(isDark);
    });

    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
}

function updateThemeIcons(isDark) {
    if (isDark) {
        iconLight.classList.remove('hidden');
        iconDark.classList.add('hidden');
    } else {
        iconLight.classList.add('hidden');
        iconDark.classList.remove('hidden');
    }
}

function setupEventListeners() {
    surveyForm.addEventListener('submit', handleSurveySubmit);
}

async function checkFileAvailability() {
    try {
        const fileData = await storage.getFile('pending_download');
        if (!fileData) {
            alert('No file found to download. Redirecting to home.');
            window.location.href = 'index.html';
        }
    } catch (e) {
        console.error('Storage error:', e);
    }
}

async function handleSurveySubmit(e) {
    e.preventDefault();

    if (!navigator.onLine) {
        alert('Internet connection required to send survey.');
        return;
    }

    showLoader();

    const formData = new FormData(surveyForm);
    const templateParams = {
        trouble_selling: formData.get('trouble_selling'),
        payment_preference: formData.get('payment_preference'),
        platform_interest: formData.get('platform_interest'),
        location: formData.get('location'),
        to_email: 'sr.mohitkr@gmail.com'
    };

    // Check if keys are configured
    const isConfigured = EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY';

    try {
        if (isConfigured) {
            // Send Email via EmailJS
            await emailjs.send(
                EMAILJS_CONFIG.SERVICE_ID,
                EMAILJS_CONFIG.TEMPLATE_ID,
                templateParams
            );
            console.log('Survey sent successfully');
        } else {
            throw new Error('EmailJS not configured');
        }
    } catch (error) {
        console.warn('EmailJS Failed or Not Configured:', error);

        // Fallback: Open Mailto Link
        const subject = encodeURIComponent('Universal Resizer Survey Response');
        const body = encodeURIComponent(`
Trouble Selling: ${templateParams.trouble_selling}
Payment Preference: ${templateParams.payment_preference}
Platform Interest: ${templateParams.platform_interest}
Location: ${templateParams.location}
        `);

        // Open mail client in a new tab/window to avoid disrupting the flow
        window.open(`mailto:sr.mohitkr@gmail.com?subject=${subject}&body=${body}`, '_blank');

        // Short delay to allow the mail client to trigger
        await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
        await triggerDownload();
    }
}

async function triggerDownload() {
    try {
        const fileData = await storage.getFile('pending_download');
        if (fileData && fileData.content) {
            console.log('Retrieved File Data:', fileData);

            let blob = fileData.content;

            // Ensure it is a Blob
            if (!(blob instanceof Blob)) {
                console.warn('Retrieved content is not a Blob, attempting conversion...');
                // If it was serialized incorrectly, it might be an ArrayBuffer or similar
                if (blob instanceof ArrayBuffer) {
                    blob = new Blob([blob]);
                } else {
                    console.error('Unknown content type:', typeof blob, blob);
                    alert('Error: Retrieved file corrupted.');
                    return;
                }
            }

            console.log('Final Blob for Download:', blob.type, blob.size);

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileData.metadata.filename || 'resized-document';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Cleanup
            // await storage.deleteFile('pending_download'); // Deletion removed to retain file

            // Redirect after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    } catch (e) {
        console.error('Download error:', e);
        alert('Error downloading file.');
        hideLoader();
    }
}

function showLoader() {
    loader.classList.remove('hidden');
    void loader.offsetWidth;
    loader.classList.remove('opacity-0');
}

function hideLoader() {
    loader.classList.add('opacity-0');
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 300);
}
