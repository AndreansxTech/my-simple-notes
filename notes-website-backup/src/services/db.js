class NotesDB {
    constructor() {
        this.dbName = 'notesDB';
        this.dbVersion = 3; // Increment for new schema
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Create notes store
                if (!db.objectStoreNames.contains('notes')) {
                    const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
                    notesStore.createIndex('title', 'title', { unique: false });
                    notesStore.createIndex('updated', 'updated');
                }
                // Create versions store
                if (!db.objectStoreNames.contains('versions')) {
                    const versionsStore = db.createObjectStore('versions', { keyPath: 'versionId', autoIncrement: true });
                    versionsStore.createIndex('noteId', 'noteId');
                    versionsStore.createIndex('timestamp', 'timestamp');
                }
            };
        });
    }

    async saveNote(note) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notes', 'versions'], 'readwrite');
            const notesStore = transaction.objectStore('notes');
            const versionsStore = transaction.objectStore('versions');

            // Handle transaction errors
            transaction.onerror = () => reject(transaction.error);

            try {
                // First check if note exists
                const getRequest = notesStore.get(note.id);
                
                getRequest.onsuccess = () => {
                    const existingNote = getRequest.result;
                    
                    if (existingNote) {
                        // Check if note changed
                        const hasChanged = existingNote.title !== note.title || existingNote.content !== note.content;
                        if (hasChanged) {
                            // Save current version to history
                            const versionRequest = versionsStore.add({
                                noteId: existingNote.id,
                                title: existingNote.title,
                                content: existingNote.content,
                                timestamp: existingNote.updated
                            });

                            versionRequest.onsuccess = () => {
                                // After saving version, update the note
                                const saveRequest = notesStore.put(note);
                                saveRequest.onsuccess = () => resolve(note);
                                saveRequest.onerror = () => reject(saveRequest.error);
                            };

                            versionRequest.onerror = () => reject(versionRequest.error);
                        } else {
                            // If no changes, just update note record without creating a new version
                            const saveRequest = notesStore.put(note);
                            saveRequest.onsuccess = () => resolve(note);
                            saveRequest.onerror = () => reject(saveRequest.error);
                        }
                    } else {
                        // If note doesn't exist, just save it
                        const saveRequest = notesStore.put(note);
                        saveRequest.onsuccess = () => resolve(note);
                        saveRequest.onerror = () => reject(saveRequest.error);
                    }
                };

                getRequest.onerror = () => reject(getRequest.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getNote(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notes'], 'readonly');
            const store = transaction.objectStore('notes');
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getNoteVersions(noteId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['versions'], 'readonly');
            const store = transaction.objectStore('versions');
            const index = store.index('noteId');
            const request = index.getAll(noteId);
            
            request.onsuccess = () => {
                const versions = request.result;
                versions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                resolve(versions);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getNotes() {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['notes'], 'readonly');
                const store = transaction.objectStore('notes');
                const request = store.getAll();
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }
}

export default NotesDB;