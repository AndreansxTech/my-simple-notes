import NotesDB from './services/db.js';
import MarkdownEditor from './components/markdown-editor.js';

// This file contains the main JavaScript logic for the website handling user interactions and managing the note-taking functionality

class NoteTakingApp {
    constructor() {
        this.db = new NotesDB();
        this.notes = [];
        this.currentNoteIndex = null;
        this.autoSaveInterval = null;
        this.isDarkMode = localStorage.getItem('theme') !== 'light';
        this.init();
    }

    async init() {
        await this.db.init();
        this.markdownEditor = new MarkdownEditor(document.getElementById('noteContent'));
        this.loadNotes();
        this.bindEvents();
        this.applyTheme();
        if (!localStorage.getItem('welcomed')) {
            this.showWelcomeWindow();
        }
    }

    bindEvents() {
        document.getElementById('saveNote').addEventListener('click', () => this.saveNote());
        document.getElementById('newNote').addEventListener('click', () => this.createNewNote());
        document.getElementById('noteList').addEventListener('click', (e) => this.selectNote(e));
        document.getElementById('downloadNote').addEventListener('click', () => this.downloadNote());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('searchNotes').addEventListener('input', (e) => this.searchNotes(e.target.value));
        document.getElementById('deleteNote').addEventListener('click', () => this.deleteNote());
        document.getElementById('noteContent').addEventListener('input', () => this.updateWordCount());
        document.addEventListener('keydown', (e) => this.handleShortcuts(e));
        document.getElementById('togglePreview').addEventListener('click', () => this.togglePreview());
        this.startAutoSave();
        document.getElementById('clearAllNotes').addEventListener('click', () => this.showClearAllConfirmation());
        document.getElementById('showHistory').addEventListener('click', () => this.showNoteHistory());
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Trigger reflow for animation
        notification.offsetHeight;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    async loadNotes() {
        try {
            this.notes = await this.db.getNotes() || [];
            this.renderNoteList(this.notes);
        } catch (error) {
            console.error('Error loading notes:', error);
            this.showNotification('Failed to load notes', 'error');
        }
    }

    renderNoteList(notes) {
        const notesContainer = document.getElementById('noteList');
        notesContainer.innerHTML = '';
        
        notes.forEach((note, index) => {
            const noteItem = document.createElement('li');
            noteItem.className = 'note-item';
            
            const titleSpan = document.createElement('span');
            titleSpan.className = 'note-title';
            titleSpan.textContent = note.title;
            titleSpan.dataset.index = index;
            
            const actionsBtn = document.createElement('button');
            actionsBtn.className = 'note-actions-btn';
            actionsBtn.innerHTML = '⋮';
            actionsBtn.onclick = (e) => {
                e.stopPropagation();
                this.showNoteActions(e, index);
            };
            
            noteItem.appendChild(titleSpan);
            noteItem.appendChild(actionsBtn);
            noteItem.addEventListener('click', () => this.selectNote({ target: titleSpan }));
            notesContainer.appendChild(noteItem);
        });
    }

    showNoteActions(event, index) {
        const existingMenu = document.querySelector('.note-actions-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'note-actions-menu';
        menu.innerHTML = `
            <div class="menu-item rename-item">
                <span>✏️ Rename</span>
            </div>
            <div class="menu-item delete">
                <span>🗑️ Delete</span>
            </div>
        `;

        // Add event listeners directly instead of using onclick in HTML
        menu.querySelector('.rename-item').addEventListener('click', () => this.renameNote(index));
        menu.querySelector('.delete').addEventListener('click', () => this.showDeleteConfirmation(index)); // Changed this line

        document.body.appendChild(menu);

        const rect = event.target.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 5}px`;
        menu.style.left = `${rect.left - menu.offsetWidth + 20}px`;

        requestAnimationFrame(() => menu.classList.add('active'));

        // Close menu on outside click
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && !event.target.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        document.addEventListener('click', closeMenu);
    }

     async showDeleteConfirmation(index) {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        modal.innerHTML = `
            <h3>⚠️ Delete Note</h3>
            <p>Are you sure you want to delete this note?</p>
            <div class="button-group">
                <button id="cancelDelete">Cancel</button>
                <button id="confirmDelete" class="confirm-delete">Delete</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const handleCancel = () => {
            overlay.remove();
        };

        const handleConfirm = async () => {
           overlay.remove();
           await this.deleteNote(index);
         };

        modal.querySelector('#cancelDelete').addEventListener('click', handleCancel);
        modal.querySelector('#confirmDelete').addEventListener('click', handleConfirm);
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) handleCancel();
        });

        // Handle Escape key
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                handleCancel();
                document.removeEventListener('keydown', closeOnEscape);
            }
        });
    }
    
    async renameNote(index) {
        const note = this.notes[index];
        
        // Remove any existing modals
        const existingModal = document.querySelector('.rename-modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'rename-modal-overlay';
        
        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'rename-modal';
        modal.innerHTML = `
            <h3>Rename Note</h3>
            <input type="text" id="newNoteName" value="${note.title}" placeholder="Enter new name">
            <div class="button-group">
                <button id="cancelRename">Cancel</button>
                <button id="confirmRename">Rename</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Handle input focus
        const input = modal.querySelector('#newNoteName');
        input.focus();
        input.select();

        // Return promise for async handling
        return new Promise((resolve) => {
            const closeModal = () => {
                overlay.remove();
                resolve(null);
            };

            const handleRename = async () => {
                const newTitle = input.value.trim();
                if (newTitle && newTitle !== note.title) {
                    note.title = newTitle;
                    await this.db.saveNote(note);
                    this.loadNotes();
                }
                overlay.remove();
                resolve(newTitle);
            };

            // Event listeners
            modal.querySelector('#cancelRename').addEventListener('click', closeModal);
            modal.querySelector('#confirmRename').addEventListener('click', handleRename);
            
            // Handle enter and escape keys
            input.addEventListener('keyup', async (e) => {
                if (e.key === 'Enter') await handleRename();
                if (e.key === 'Escape') closeModal();
            });

            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeModal();
            });
        });
    }

    async saveNote(isAutoSave = false) {
        const title = document.getElementById('noteTitle').value.trim();
        const content = this.markdownEditor.getValue();

        if (!title) {
            this.showNotification('Please enter a title for your note', 'error');
            return;
        }

        // Check for existing note with same title
        const existingNote = this.notes.find(note => 
            note.title === title && 
            (this.currentNoteIndex === null || note.id !== this.notes[this.currentNoteIndex]?.id)
        );

        if (existingNote) {
            const shouldOverwrite = await this.showOverwriteConfirmation(title);
            if (!shouldOverwrite) return;

            // If overwriting remove the old note
            await this.db.db.transaction(['notes'], 'readwrite')
                .objectStore('notes')
                .delete(existingNote.id);

            // Update current index to the existing notes position
            this.currentNoteIndex = this.notes.indexOf(existingNote);
        }

        try {
            const note = {
                id: this.currentNoteIndex !== null ? this.notes[this.currentNoteIndex].id : Date.now(),
                title,
                content,
                tags: document.getElementById('noteTags').value.split(',').map(tag => tag.trim()),
                updated: new Date().toISOString()
            };

            await this.db.saveNote(note);
            
            if (this.currentNoteIndex !== null) {
                this.notes[this.currentNoteIndex] = note;
            } else {
                this.notes.push(note);
                this.currentNoteIndex = this.notes.length - 1;
            }
            
            await this.loadNotes();
            if (!isAutoSave) {
                this.showNotification('Note saved successfully!');
            } else {
                this.showAutoSaveIndicator();
            }
        } catch (error) {
            if (error.message === 'duplicate_title') {
                this.showNotification('A note with this title already exists', 'error');
            } else {
                console.error('Error saving note:', error);
                this.showNotification('Failed to save note', 'error');
            }
        }
    }

    showOverwriteConfirmation(title) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'confirm-modal-overlay';
            
            const modal = document.createElement('div');
            modal.className = 'confirm-modal';
            modal.innerHTML = `
                <h3>⚠️ Note Already Exists</h3>
                <p>A note with the title "${title}" already exists. Do you want to overwrite it?</p>
                <div class="button-group">
                    <button id="cancelOverwrite">Cancel</button>
                    <button id="confirmOverwrite" class="confirm-delete">Overwrite</button>
                </div>
            `;
            
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            const handleCancel = () => {
                overlay.remove();
                resolve(false);
            };

            const handleConfirm = () => {
                overlay.remove();
                resolve(true);
            };

            modal.querySelector('#cancelOverwrite').addEventListener('click', handleCancel);
            modal.querySelector('#confirmOverwrite').addEventListener('click', handleConfirm);
            
            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) handleCancel();
            });

            // Handle Escape key
            document.addEventListener('keydown', function closeOnEscape(e) {
                if (e.key === 'Escape') {
                    handleCancel();
                    document.removeEventListener('keydown', closeOnEscape);
                }
            });
        });
    }

    createNewNote() {
        this.currentNoteIndex = null;
        this.clearInputs();
        document.querySelector('.editor').style.display = 'flex';
        const placeholder = document.querySelector('.no-note-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        if (this.markdownEditor.isPreviewMode) {
            this.markdownEditor.togglePreview();
            this.markdownEditor.togglePreview();
        }
    }

    selectNote(event) {
        const index = event.target.dataset.index;
        if (index !== undefined) {
            this.currentNoteIndex = index;
            const note = this.notes[index];
            document.getElementById('noteTitle').value = note.title;
            document.getElementById('noteContent').value = note.content;
            document.querySelector('.editor').style.display = 'flex';
            const placeholder = document.querySelector('.no-note-placeholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
            if (this.markdownEditor.isPreviewMode) {
                this.markdownEditor.togglePreview();
                this.markdownEditor.togglePreview();
            }
            this.updateWordCount(); // Update word and character count
        }
    }

    clearInputs() {
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
    }

    downloadNote() {
        const title = document.getElementById('noteTitle').value || 'untitled';
        const content = document.getElementById('noteContent').value;
        
        const element = document.createElement('a');
        const file = new Blob([content], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `${title}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
        this.applyTheme();
    }

    applyTheme() {
        document.body.classList.toggle('light-mode', !this.isDarkMode);
        document.getElementById('themeToggle').textContent = this.isDarkMode ? '🌙' : '☀️';
        
        // Update meta theme-color for mobile devices
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', this.isDarkMode ? '#1a1a1a' : '#ffffff');
        }
    }

    searchNotes(query) {
        if (!query.trim()) {
            this.loadNotes(); // Show all notes if search is empty
            return;
        }
        
        const filtered = this.notes.filter(note => 
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            note.content.toLowerCase().includes(query.toLowerCase())
        );
        this.renderNoteList(filtered);
    }

    async deleteNote(index) {
        try {
            const note = this.notes[index];
            // Remove from IndexedDB
            const transaction = this.db.db.transaction(['notes'], 'readwrite');
            const store = transaction.objectStore('notes');
            await store.delete(note.id);
            
            // Remove from array
            this.notes.splice(index, 1);
            
            // Clear inputs if we're deleting the current note
            if (this.currentNoteIndex === index) {
                this.currentNoteIndex = null;
                this.clearInputs();
            }
            
            // Refresh the list
            this.loadNotes();
            
            // Close the context menu if it's open
            const menu = document.querySelector('.note-actions-menu');
            if (menu) menu.remove();
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    }

    updateWordCount() {
        const content = document.getElementById('noteContent').value;
        const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
        const chars = content.length;
        document.getElementById('wordCount').textContent = `Words: ${words} | Characters: ${chars}`;
    }

    handleShortcuts(e) {
        if (e.ctrlKey) {
            switch(e.key) {
                case 's':
                    e.preventDefault();
                    this.saveNote();
                    break;
                case 'n':
                    e.preventDefault();
                    this.createNewNote();
                    break;
                case 'd':
                    e.preventDefault();
                    this.deleteNote();
                    break;
            }
        }
    }

    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (document.getElementById('noteTitle').value || document.getElementById('noteContent').value) {
                this.saveNote(true); // Pass true to indicate auto-save
            }
        }, 30000); // Auto-save every 30 seconds
    }

    togglePreview() {
        this.markdownEditor.togglePreview();
        const toggleButton = document.getElementById('togglePreview');
        toggleButton.textContent = this.markdownEditor.isPreviewMode ? 'Edit' : 'Preview';
    }

    showClearAllConfirmation() {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        modal.innerHTML = `
            <h3>⚠️ Clear All Notes</h3>
            <p>Are you sure you want to delete all notes? This action cannot be undone.</p>
            <div class="button-group">
                <button id="cancelClear">Cancel</button>
                <button id="confirmClear" class="confirm-delete">Clear All</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const handleClear = async () => {
            try {
                // Clear IndexedDB
                const transaction = this.db.db.transaction(['notes'], 'readwrite');
                const store = transaction.objectStore('notes');
                await store.clear();
                
                // Clear notes array
                this.notes = [];
                this.currentNoteIndex = null;
                
                // Clear UI
                this.clearInputs();
                this.loadNotes();
                
                overlay.remove();
            } catch (error) {
                console.error('Error clearing notes:', error);
            }
        };

        modal.querySelector('#cancelClear').addEventListener('click', () => overlay.remove());
        modal.querySelector('#confirmClear').addEventListener('click', handleClear);
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        // Handle Escape key
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', closeOnEscape);
            }
        });
    }

    async showNoteHistory() {
        if (this.currentNoteIndex === null) {
            this.showNotification('Please select a note first', 'error');
            return;
        }

        const currentNote = this.notes[this.currentNoteIndex];
        const versions = await this.db.getNoteVersions(currentNote.id);

        const overlay = document.createElement('div');
        overlay.className = 'history-modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'history-modal';
        modal.innerHTML = `
            <div class="history-header">
                <h3>Version History</h3>
                <button id="closeHistory">✕</button>
            </div>
            <div class="history-subheader">
                <h4>${currentNote.title}</h4>
                <p>${versions.length} version${versions.length !== 1 ? 's' : ''}</p>
            </div>
            <ul class="version-list">
                <li class="version-item current">
                    <div class="version-header">
                        <span class="version-title">Current Version</span>
                        <span class="version-date">${new Date(currentNote.updated).toLocaleString()}</span>
                    </div>
                    <div class="version-preview">${currentNote.content.substring(0, 200)}...</div>
                </li>
                ${versions.map(version => `
                    <li class="version-item" data-version-id="${version.versionId}">
                        <div class="version-header">
                            <span class="version-title">${version.title}</span>
                            <span class="version-date">${new Date(version.timestamp).toLocaleString()}</span>
                        </div>
                        <div class="version-preview">${version.content.substring(0, 200)}...</div>
                    </li>
                `).join('')}
            </ul>
        `;
        
        overlay.appendChild(modal); 

        document.body.appendChild(overlay);

        // Add event listeners
        const closeBtn = modal.querySelector('#closeHistory');
        closeBtn.addEventListener('click', () => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        });

        modal.querySelectorAll('.version-item:not(.current)').forEach(item => {
            item.addEventListener('click', () => this.restoreVersion(versions.find(v => v.versionId === parseInt(item.dataset.versionId))));
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 300);
            }
        });

        // Trigger animation
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            modal.style.transform = 'translateX(0)';
        });
    }

    async restoreVersion(version) {
        if (confirm('Do you want to restore this version? Your current changes will be saved as a new version.')) {
            document.getElementById('noteTitle').value = version.title;
            document.getElementById('noteContent').value = version.content;
            await this.saveNote();
            this.showNotification('Version restored successfully!');
        }
    }

    showWelcomeWindow() {
        const overlay = document.createElement('div');
        overlay.className = 'welcome-overlay';
        const modal = document.createElement('div');
        modal.className = 'welcome-modal';
        modal.innerHTML = `
            <h2>Welcome to My Notes</h2>
            <p>Use the sidebar to create and manage notes. Try out the preview mode and version history!</p>
            <button id="closeWelcome">Got It</button>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const closeWelcome = () => {
            localStorage.setItem('welcomed', 'true');
            overlay.remove();
        };
        document.getElementById('closeWelcome').addEventListener('click', closeWelcome);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeWelcome();
        });
    }

    showAutoSaveIndicator() {
        const indicator = document.querySelector('.autosave-indicator');
        if (!indicator) return;
        indicator.style.display = 'block';
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 1500);
    }
}

// Make app instance globally available for menu click handlers
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new NoteTakingApp();
});