class Editor {
    constructor() {
        this.notes = [];
        this.currentNote = null;
    }

    createNote(title, content) {
        const note = { title, content, id: Date.now() };
        this.notes.push(note);
        this.currentNote = note;
        this.saveNotes();
    }

    editNote(id, newContent) {
        const note = this.notes.find(note => note.id === id);
        if (note) {
            note.content = newContent;
            this.saveNotes();
        }
    }

    saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }

    loadNotes() {
        const savedNotes = JSON.parse(localStorage.getItem('notes'));
        if (savedNotes) {
            this.notes = savedNotes;
        }
    }

    getCurrentNote() {
        return this.currentNote;
    }
}

export default Editor;