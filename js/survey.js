// EmailJS configuration removed; using Google Sheet integration

// DOM Elements
const surveyForm = document.getElementById('survey-form');
const submitBtn = document.getElementById('submit-btn');
const skipBtn = document.getElementById('skip-btn');
const loader = document.getElementById('loader');
const themeToggle = document.getElementById('theme-toggle');
const iconLight = document.getElementById('theme-icon-light');
const iconDark = document.getElementById('theme-icon-dark');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // EmailJS initialization removed
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
    if (skipBtn) {
        skipBtn.addEventListener('click', handleSkip);
    }
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
    const payload = {
        "Are you facing trouble in to sell the scrap?": formData.get('trouble_selling'),
        "How do you prefer to receive your scrap payment when selling?": formData.get('payment_preference'),
        "If an online platform in your area offers fixed scrap prices, fast door-pickup and instant payment, would you be interested in using it?": formData.get('platform_interest'),
        "To check availability & pricing for your area, please enter your location": formData.get('location')
    };

    try {
        await fetch('https://script.google.com/macros/s/AKfycbxqiJeIdhR9AnaxF1uOyf-6yNd7dxLUxMgohPgsqY5Ip-brUu0ylj90s3RemcbzR6XfLw/exec', {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        console.log('Survey data sent to Google Sheet');
    } catch (error) {
        console.warn('Failed to send survey data:', error);
    } finally {
        await triggerDownload();
    }
}

async function handleSkip(e) {
    e.preventDefault();
    console.log('Survey skipped by user.');
    await triggerDownload();
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
