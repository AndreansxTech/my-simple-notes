// This file contains the main JavaScript logic for the website, handling user interactions and managing the note-taking functionality.

class NoteTakingApp {
    constructor() {
        this.notes = [];
        this.currentNoteIndex = null;
        this.autoSaveInterval = null;
        this.isDarkMode = localStorage.getItem('theme') !== 'light';
        this.init();
    }

    init() {
        this.loadNotes();
        this.bindEvents();
        this.applyTheme();
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
        this.startAutoSave();
    }

    loadNotes() {
        const notesContainer = document.getElementById('noteList');
        notesContainer.innerHTML = '';
        this.notes.forEach((note, index) => {
            const noteItem = document.createElement('li');
            noteItem.textContent = note.title;
            noteItem.dataset.index = index;
            notesContainer.appendChild(noteItem);
        });
    }

    saveNote() {
        const title = document.getElementById('noteTitle').value;
        const content = document.getElementById('noteContent').value;

        if (this.currentNoteIndex !== null) {
            this.notes[this.currentNoteIndex] = { title, content };
        } else {
            this.notes.push({ title, content });
        }

        this.currentNoteIndex = this.notes.length - 1;
        this.loadNotes();
        this.clearInputs();
    }

    createNewNote() {
        this.currentNoteIndex = null;
        this.clearInputs();
    }

    selectNote(event) {
        const index = event.target.dataset.index;
        if (index !== undefined) {
            this.currentNoteIndex = index;
            const note = this.notes[index];
            document.getElementById('noteTitle').value = note.title;
            document.getElementById('noteContent').value = note.content;
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
        const filtered = this.notes.filter(note => 
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            note.content.toLowerCase().includes(query.toLowerCase())
        );
        this.renderNoteList(filtered);
    }

    deleteNote() {
        if (this.currentNoteIndex !== null) {
            if (confirm('Are you sure you want to delete this note?')) {
                this.notes.splice(this.currentNoteIndex, 1);
                this.currentNoteIndex = null;
                this.loadNotes();
                this.clearInputs();
            }
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
                this.saveNote();
            }
        }, 30000); // Auto-save every 30 seconds
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NoteTakingApp();
});