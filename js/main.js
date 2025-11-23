// State
let currentFile = null;
let originalImage = null; // Image object
let pdfDoc = null;
let currentPage = 1;
let isPDF = false;

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const previewContainer = document.getElementById('preview-container');
const canvas = document.getElementById('preview-canvas');
const ctx = canvas.getContext('2d');
const widthInput = document.getElementById('width-input');
const heightInput = document.getElementById('height-input');
const maintainAspect = document.getElementById('maintain-aspect');
const presetSelect = document.getElementById('preset-select');
const downloadBtn = document.getElementById('download-btn');
const fileInfo = document.getElementById('file-info');
const loader = document.getElementById('loader');
const pdfControls = document.getElementById('pdf-controls');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageNumSpan = document.getElementById('page-num');

// Theme Elements
const themeToggle = document.getElementById('theme-toggle');
const iconLight = document.getElementById('theme-icon-light');
const iconDark = document.getElementById('theme-icon-dark');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

// Presets
const PRESETS = {
    passport: { w: 600, h: 600 },
    college: { w: 200, h: 230 },
    signature: { w: 140, h: 60 },
    a4: { w: 3508, h: 2480 }
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Ensure format-select has a default value
    const formatSelect = document.getElementById('format-select');
    if (formatSelect && !formatSelect.value) {
        formatSelect.value = 'image/jpeg';
    }
    setupTheme();
    setupEventListeners();

    // Restore last used preset
    const lastPreset = localStorage.getItem('lastPreset');
    if (lastPreset && PRESETS[lastPreset]) {
        presetSelect.value = lastPreset;
    }
});

function setupTheme() {
    // Check localStorage or system preference
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

    // Mobile Menu
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
    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-primary', 'bg-indigo-50', 'dark:bg-indigo-900/20');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-primary', 'bg-indigo-50', 'dark:bg-indigo-900/20');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-primary', 'bg-indigo-50', 'dark:bg-indigo-900/20');
        handleFile(e.dataTransfer.files[0]);
    });

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    // Controls
    widthInput.addEventListener('input', () => {
        presetSelect.value = 'custom';
        if (maintainAspect.checked && originalImage) {
            const aspect = originalImage.width / originalImage.height;
            heightInput.value = Math.round(widthInput.value / aspect);
        }
        updatePreview();
    });

    heightInput.addEventListener('input', () => {
        presetSelect.value = 'custom';
        if (maintainAspect.checked && originalImage) {
            const aspect = originalImage.width / originalImage.height;
            widthInput.value = Math.round(heightInput.value * aspect);
        }
        updatePreview();
    });

    presetSelect.addEventListener('change', () => {
        const val = presetSelect.value;
        if (val !== 'custom' && PRESETS[val]) {
            widthInput.value = PRESETS[val].w;
            heightInput.value = PRESETS[val].h;
            localStorage.setItem('lastPreset', val);
            updatePreview();
        }
    });

    downloadBtn.addEventListener('click', handleDownloadFlow);

    // PDF Controls
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderPDFPage(currentPage);
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (pdfDoc && currentPage < pdfDoc.numPages) {
            currentPage++;
            renderPDFPage(currentPage);
        }
    });
}

async function handleFile(file) {
    if (!file) return;

    showLoader();
    currentFile = file;
    fileInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    // downloadBtn.disabled = false; // Moved to after render

    // Reset state
    isPDF = file.type === 'application/pdf';
    previewContainer.classList.remove('hidden');

    // Hide dropzone content slightly or just show preview below
    // dropZone.classList.add('hidden'); // Optional: keep dropzone visible for re-upload

    if (isPDF) {
        pdfControls.classList.remove('hidden');
        const fileReader = new FileReader();
        fileReader.onload = async function () {
            const typedarray = new Uint8Array(this.result);
            pdfDoc = await pdfjsLib.getDocument(typedarray).promise;
            currentPage = 1;
            renderPDFPage(currentPage);
            hideLoader();
        };
        fileReader.readAsArrayBuffer(file);
    } else {
        pdfControls.classList.add('hidden');
        const reader = new FileReader();
        reader.onload = (e) => {
            originalImage = new Image();
            originalImage.onload = () => {
                // Set initial dimensions
                widthInput.value = originalImage.width;
                heightInput.value = originalImage.height;
                updatePreview();
                hideLoader();
                downloadBtn.disabled = false;
            };
            originalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

async function renderPDFPage(num) {
    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale: 1.5 });

    if (!widthInput.value || presetSelect.value === 'custom') {
        widthInput.value = Math.round(viewport.width);
        heightInput.value = Math.round(viewport.height);
    }

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.height = viewport.height;
    tempCanvas.width = viewport.width;

    await page.render({
        canvasContext: tempCtx,
        viewport: viewport
    }).promise;

    originalImage = new Image();
    originalImage.onload = () => {
        updatePreview();
        downloadBtn.disabled = false;
    };
    originalImage.src = tempCanvas.toDataURL();

    pageNumSpan.textContent = `Page ${num} of ${pdfDoc.numPages}`;
}

function updatePreview() {
    if (!originalImage) return;

    const targetW = parseInt(widthInput.value) || originalImage.width;
    const targetH = parseInt(heightInput.value) || originalImage.height;

    canvas.width = targetW;
    canvas.height = targetH;

    ctx.drawImage(originalImage, 0, 0, targetW, targetH);
}

async function handleDownloadFlow() {
    if (!originalImage) {
        alert('Please upload a file first.');
        return;
    }
    showLoader();

    // Determine selected output format
    const format = document.getElementById('format-select').value || 'image/jpeg';
    const sizeLimitKB = parseInt(document.getElementById('size-limit').value);

    let blob;

    try {
        if (format === 'application/pdf') {
            const { jsPDF } = window.jspdf;
            const orientation = canvas.width > canvas.height ? 'l' : 'p';
            const pdf = new jsPDF({
                orientation: orientation,
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
            blob = pdf.output('blob');

        } else {
            let quality = 0.9;
            blob = await new Promise(resolve => canvas.toBlob(resolve, format, quality));

            if (sizeLimitKB > 0 && format === 'image/jpeg') {
                let attempts = 0;
                while (blob.size > sizeLimitKB * 1024 && attempts < 10 && quality > 0.1) {
                    quality -= 0.1;
                    blob = await new Promise(resolve => canvas.toBlob(resolve, format, quality));
                    attempts++;
                }
            }
        }

        // Save to IndexedDB and Redirect
        // Map MIME type to proper file extension
        let ext = '';
        if (format === 'application/pdf') {
            ext = 'pdf';
        } else if (format === 'image/jpeg') {
            ext = 'jpg'; // use .jpg for JPEG images
        } else if (format === 'image/png') {
            ext = 'png';
        } else {
            // fallback to generic extension from MIME type
            ext = format.split('/')[1] || 'bin';
        }
        console.log('Saving file with name:', `resized.${ext}`);
        const filename = `resized.${ext}`;
        await storage.saveFile('pending_download', blob, { filename });

        // Redirect to Survey
        window.location.href = 'survey.html';

    } catch (e) {
        console.error('Processing error:', e);
        alert('Failed to process file. Please try again.');
        hideLoader();
    }
}

function showLoader() {
    loader.classList.remove('hidden');
    // Trigger reflow
    void loader.offsetWidth;
    loader.classList.remove('opacity-0');
}

function hideLoader() {
    loader.classList.add('opacity-0');
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 300);
}
