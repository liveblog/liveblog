/**
 * German Quotation Marks Module
 *
 * Handles automatic conversion of standard English quotation marks (")
 * to German quotation marks („ and ").
 *
 * Usage:
 *   const germanQuotation = new GermanQuotation();
 *   germanQuotation.attachToElement(element);
 */
class GermanQuotation {
    constructor() {
        this.GERMAN_OPENING_QUOTE = '\u201E'; // „ (U+201E)
        this.GERMAN_CLOSING_QUOTE = '\u201C'; // " (U+201C)
    }

    /**
     * Convert standard quotes to German quotation marks
     * @param {string} inputText - Text containing standard quotes
     * @returns {string} Text with German quotation marks
     */
    convertToGermanQuotes(inputText) {
        let text = inputText;

        // Convert opening quotes (after space, start of line, or opening brackets)
        text = text.replace(
            /(^|\s|[([{])"([^"]*?)"/g,
            `$1${this.GERMAN_OPENING_QUOTE}$2${this.GERMAN_CLOSING_QUOTE}`
        );

        // Handle nested quotes - convert remaining " to opening quotes if they follow German closing quotes
        text = text.replace(
            new RegExp(`(${this.GERMAN_CLOSING_QUOTE}[\\s]*)"([^"]*?)"`, 'g'),
            `$1${this.GERMAN_OPENING_QUOTE}$2${this.GERMAN_CLOSING_QUOTE}`
        );

        return text;
    }

    /**
     * Restore cursor position after content change
     * @param {jQuery} editor - jQuery wrapped editor element
     * @param {number} caretOffset - Original cursor position
     */
    restoreCursorPosition(editor, caretOffset) {
        const newRange = document.createRange();
        const walker = document.createTreeWalker(
            editor[0],
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        let currentOffset = 0;
        let node;

        // eslint-disable-next-line no-cond-assign
        while ((node = walker.nextNode())) {
            if (currentOffset + node.textContent.length >= caretOffset) {
                newRange.setStart(node, caretOffset - currentOffset);
                newRange.setEnd(node, caretOffset - currentOffset);
                break;
            }
            currentOffset += node.textContent.length;
        }

        const selection = window.getSelection();

        selection.removeAllRanges();
        selection.addRange(newRange);
    }

    /**
     * Handle quote conversion in text blocks
     * @param {Event} event - DOM event
     */
    handleQuoteConversion(event) {
        const target = $(event.target);

        // Check if this is a text block editor
        if (target.closest('.st-text-block').length > 0 && target.attr('contenteditable') === 'true') {
            const content = target.html();
            const convertedContent = this.convertToGermanQuotes(content);

            if (content !== convertedContent) {
                // Save cursor position
                const selection = window.getSelection();

                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const preCaretRange = range.cloneRange();

                    preCaretRange.selectNodeContents(target[0]);
                    preCaretRange.setEnd(range.endContainer, range.endOffset);

                    const caretOffset = preCaretRange.toString().length;

                    // Update content
                    target.html(convertedContent);

                    // Restore cursor position
                    this.restoreCursorPosition(target, caretOffset);
                }
            }
        }
    }

    /**
     * Handle paste events with a delay to allow content to be inserted
     * @param {Event} event - DOM paste event
     */
    handlePasteConversion(event) {
        // Use a longer timeout to ensure pasted content is fully processed
        setTimeout(() => {
            this.handleQuoteConversion(event);
        }, 10);
    }

    /**
     * Attach German quotation conversion to an element
     * @param {jQuery} element - jQuery wrapped element to attach events to
     */
    attachToElement(element) {
        // Bind event handlers with proper context using event delegation
        element.on('input', '.st-text-block [contenteditable]', (event) => this.handleQuoteConversion(event));
        element.on('paste', '.st-text-block [contenteditable]', (event) => this.handlePasteConversion(event));
        element.on('blur', '.st-text-block [contenteditable]', (event) => this.handleQuoteConversion(event));
    }

    /**
     * Detach German quotation conversion from an element
     * @param {jQuery} element - jQuery wrapped element to detach events from
     */
    detachFromElement(element) {
        element.off('input paste blur');
    }
}

export default GermanQuotation;
