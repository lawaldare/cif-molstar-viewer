// Mock Angular component structure
class CifViewerComponent {
  constructor() {
    this.plugin = null;
    this.currentFile = null;
    this.isSpinning = false;
    this.animation = null;

    this.initializeElements();
    this.setupEventListeners();
    this.initMolstar();
  }

  initializeElements() {
    this.dropArea = document.getElementById('drop-area');
    this.fileInput = document.getElementById('file-input');
    this.browseBtn = document.getElementById('browse-btn');
    this.fileInfo = document.getElementById('file-info');
    this.fileName = document.getElementById('file-name');
    this.fileSize = document.getElementById('file-size');
    this.viewer = document.getElementById('molstar-viewer');
    this.loading = document.getElementById('loading');
    this.errorMessage = document.getElementById('error-message');
    this.successMessage = document.getElementById('success-message');
  }

  setupEventListeners() {
    this.browseBtn.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

    // Drag and drop events
    this.dropArea.addEventListener('dragover', (e) => this.preventDefault(e));
    this.dropArea.addEventListener('dragleave', () =>
      this.removeDropHighlight(),
    );
    this.dropArea.addEventListener('drop', (e) => this.handleFileDrop(e));
  }

  preventDefault(e) {
    e.preventDefault();
    e.stopPropagation();
    this.dropArea.style.borderColor = '#2196f3';
    this.dropArea.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
  }

  removeDropHighlight() {
    this.dropArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    this.dropArea.style.backgroundColor = 'transparent';
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  handleFileDrop(e) {
    this.preventDefault(e);
    const file = e.dataTransfer.files[0];
    if (file) {
      this.processFile(file);
    }
    this.removeDropHighlight();
  }

  processFile(file) {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.cif')) {
      this.showError('Please select a valid .cif file');
      return;
    }

    this.currentFile = file;
    this.displayFileInfo(file);
    this.hideError();
    this.showSuccess('File selected successfully. Loading structure...');
    this.loadFileToViewer(file);
  }

  displayFileInfo(file) {
    this.fileName.textContent = file.name;
    this.fileSize.textContent = this.formatFileSize(file.size);
    this.fileInfo.style.display = 'block';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async initMolstar() {
    try {
      // Molstar is loaded via CDN in the head
      this.showLoading();

      // Create Molstar plugin instance
      this.plugin = await window.molstar.Viewer.create(this.viewer, {
        // Disable all UI panels
        layoutIsExpanded: false,
        layoutShowControls: false,
        layoutShowRemoteState: false,
        layoutShowSequence: false,
        layoutShowLog: false,
        layoutShowLeftPanel: false,
        collapseLeftPanel: true,
        collapseRightPanel: true,

        // Disable canvas controls
        viewportShowControls: false,

        // Style
        canvas3d: {
          backgroundColor: { r: 0, g: 0, b: 0 }, // black bg
        },
      });

      this.hideLoading();
    } catch (error) {
      console.error('Error initializing Molstar:', error);
      this.showError('Error initializing Molstar');
    }
  }

  async loadFileToViewer(file) {
    if (!this.plugin) {
      this.showError('Viewer not initialized');
      return;
    }

    try {
      this.showLoading();

      const fileContent = await this.readFileAsText(file);

      // Load CIF data
      await this.plugin.loadStructureFromData(fileContent, 'mmcif');

      this.hideLoading();
      this.showSuccess('Structure loaded successfully');
    } catch (error) {
      console.error('Error loading CIF file:', error);
      this.showError('Failed to load the CIF file. Please try another file.');
      this.hideLoading();
    }
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  resetView() {
    if (this.plugin) {
      this.plugin.canvas3d().requestCameraReset();
    }
  }

  showLoading() {
    this.loading.style.display = 'flex';
  }

  hideLoading() {
    this.loading.style.display = 'none';
  }

  showError(message) {
    this.errorMessage.textContent = message;
    this.errorMessage.style.display = 'block';
    this.successMessage.style.display = 'none';
  }

  hideError() {
    this.errorMessage.style.display = 'none';
  }

  showSuccess(message) {
    this.successMessage.textContent = message;
    this.successMessage.style.display = 'block';
    this.errorMessage.style.display = 'none';
  }
}

// Initialize the component when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new CifViewerComponent();
});
