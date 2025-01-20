class MarkdownEditor {
    constructor(element) {
        this.editor = element;
        this.preview = document.createElement('div');
        this.preview.className = 'markdown-preview';
        this.editor.parentNode.insertBefore(this.preview, this.editor.nextSibling);
        this.bindEvents();
    }

    bindEvents() {
        this.editor.addEventListener('input', () => this.updatePreview());
    }

    updatePreview() {
        const markdown = this.editor.value;
        // Use marked from global scope
        const html = window.marked(markdown);
        // Use DOMPurify for security
        const cleanHtml = window.DOMPurify.sanitize(html);
        this.preview.innerHTML = cleanHtml;
    }

    getValue() {
        return this.editor.value;
    }

    setValue(content) {
        this.editor.value = content;
        this.updatePreview();
    }
}

export default MarkdownEditor;