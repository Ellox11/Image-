document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const uploadArea = document.getElementById('upload-area');
    const browseBtn = document.getElementById('browse-btn');
    const fileInput = document.getElementById('file-input');
    const resultsArea = document.getElementById('results-area');
    const resultsList = document.getElementById('results-list');
    const resultTemplate = document.getElementById('result-item-template');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const downloadAllBtn = document.getElementById('download-all-btn');

    let compressedFiles = [];

    // --- Event Listeners ---
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    // Drag and Drop Listeners
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    clearAllBtn.addEventListener('click', () => {
        resultsList.innerHTML = '';
        compressedFiles = [];
        resultsArea.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        downloadAllBtn.classList.add('hidden');
    });
    
    downloadAllBtn.addEventListener('click', downloadAllFiles);

    // --- Core Functions ---
    function handleFiles(files) {
        if (files.length === 0) return;
        uploadArea.classList.add('hidden');
        resultsArea.classList.remove('hidden');

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) {
                console.warn(`${file.name} is not an image.`);
                return;
            }
            compressImage(file);
        });
    }

    function compressImage(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, img.width, img.height);
                
                // The compression happens here!
                // 'image/jpeg' is often best for compression. 0.7 is a good quality balance.
                canvas.toBlob((blob) => {
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    
                    const card = displayResult(file, compressedFile);
                    
                    // Animate the progress bar
                    setTimeout(() => {
                        const progressBar = card.querySelector('.progress-bar');
                        progressBar.style.width = '100%';
                    }, 100);

                }, 'image/jpeg', 0.7);
            };
        };
    }

    function displayResult(originalFile, newFile) {
        const card = resultTemplate.content.cloneNode(true).querySelector('.result-card');
        const savings = 100 - (newFile.size / originalFile.size) * 100;
        
        card.querySelector('.thumbnail').src = URL.createObjectURL(newFile);
        card.querySelector('.filename').textContent = originalFile.name;
        card.querySelector('.original-size').textContent = formatBytes(originalFile.size);
        card.querySelector('.compressed-size').textContent = formatBytes(newFile.size);
        card.querySelector('.savings-percent').textContent = `-${savings.toFixed(1)}%`;
        
        const downloadLink = card.querySelector('.btn-download');
        downloadLink.href = URL.createObjectURL(newFile);
        downloadLink.download = `optipixel-${originalFile.name}`;

        resultsList.appendChild(card);
        compressedFiles.push({ name: `optipixel-${originalFile.name}`, file: newFile });

        if(compressedFiles.length > 1) {
            downloadAllBtn.classList.remove('hidden');
        }

        return card; // Return the card for progress animation
    }

    async function downloadAllFiles() {
        if (compressedFiles.length === 0) return;

        const zip = new JSZip();
        compressedFiles.forEach(item => {
            zip.file(item.name, item.file);
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'optipixel-images.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // --- Utility Function ---
    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
});
