class Sidebar {
    constructor() {
        this.notes = [];
        this.selectedNoteIndex = null;
    }

    addNote(note) {
        this.notes.push(note);
        this.render();
    }

    selectNote(index) {
        this.selectedNoteIndex = index;
        this.render();
    }

    render() {
        const sidebarElement = document.getElementById('sidebar');
        sidebarElement.innerHTML = '';

        this.notes.forEach((note, index) => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            noteElement.innerText = note.title;
            noteElement.onclick = () => this.selectNote(index);
            sidebarElement.appendChild(noteElement);
        });
    }
}

export default Sidebar;