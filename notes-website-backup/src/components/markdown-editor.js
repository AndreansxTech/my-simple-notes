class MarkdownEditor {
    constructor(element) {
        this.editor = element;
        this.preview = document.createElement('div');
        this.preview.className = 'markdown-preview';
        this.preview.style.display = 'none';
        this.preview.style.color = 'inherit'; // Add this line
        this.editor.parentNode.insertBefore(this.preview, this.editor.nextSibling);
        this.isPreviewMode = false;
    }

    getValue() {
        return this.editor.value;
    }

    setValue(content) {
        this.editor.value = content;
        if (this.isPreviewMode) {
            this.updatePreview();
        }
    }

    togglePreview() {
        this.isPreviewMode = !this.isPreviewMode;
        this.editor.style.display = this.isPreviewMode ? 'none' : 'block';
        this.preview.style.display = this.isPreviewMode ? 'block' : 'none';
        if (this.isPreviewMode) {
            this.updatePreview();
        }
    }

    updatePreview() {
        const markdown = this.editor.value || 'No content to preview';
        const html = window.marked.parse(markdown); // Use marked.parse instead of window.marked
        const cleanHtml = window.DOMPurify.sanitize(html);
        this.preview.innerHTML = cleanHtml;
    }
}

export default MarkdownEditor;