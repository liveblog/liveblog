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

const GERMAN_OPENING_QUOTE = '\u201E'; // „ (U+201E)
const GERMAN_CLOSING_QUOTE = '\u201C'; // “ (U+201C)

class GermanQuotation {
    /**
     * Convert standard quotes to German quotation marks
     */
    convertToGermanQuotes = (inputText: string): string => {
        let text = inputText;

        // 0) Normalize English curly quotes to straight quotes so we can process them.
        // Keep existing German quotes as-is (we don't touch „ or “ here).
        text = text.replace(/[\u201C\u201D]/g, '"');

        // 1) Convert contextual opening quotes based on German typography rules
        // Replace " with „ when preceded by: line start, whitespace, or opening punctuation
        text = text.replace(
            /(^|[\s([{«‚„])"/gm,
            (_, p1) => `${p1}${GERMAN_OPENING_QUOTE}`
        );

        // 2) All remaining " quotes become closing quotes “
        text = text.replace(/"/g, GERMAN_CLOSING_QUOTE);

        return text;
    }

    /**
     * Restore cursor position after content change
     */
    restoreCursorPosition = (editor: JQuery<HTMLElement>, caretOffset: number): void => {
        const newRange = document.createRange();
        const walker = document.createTreeWalker(editor[0], NodeFilter.SHOW_TEXT, null);
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

        if (selection) {
            selection.removeAllRanges();
            selection.addRange(newRange);
        }
    }

    /**
     * Convert quotes in text nodes only, preserving HTML structure
     */
    convertTextNodesOnly = (element: HTMLElement): boolean => {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null
        );

        let node;
        const textNodes = [];

        // collect all text nodes first to avoid modifying while iterating
        while ((node = walker.nextNode())) {
            textNodes.push(node);
        }

        let hasChanges = false;

        textNodes.forEach((textNode) => {
            const originalText = textNode.textContent;
            const convertedText = this.convertToGermanQuotes(originalText);

            if (originalText !== convertedText) {
                textNode.textContent = convertedText;
                hasChanges = true;
            }
        });

        return hasChanges;
    }

    /**
     * Handle quote conversion in text blocks
     */
    handleQuoteConversion = (event: JQuery.TriggeredEvent): void => {
        const target = $(event.target as HTMLElement);

        // check if this is a text block editor
        if (target.closest('.st-text-block').length > 0 && target.attr('contenteditable') === 'true') {
            // save cursor position before conversion
            const selection = window.getSelection();
            let range = null;
            let caretOffset = 0;

            if (selection.rangeCount > 0) {
                range = selection.getRangeAt(0);
                const preCaretRange = range.cloneRange();

                preCaretRange.selectNodeContents(target[0]);
                preCaretRange.setEnd(range.endContainer, range.endOffset);
                caretOffset = preCaretRange.toString().length;
            }

            // convert quotes in text nodes only (preserves HTML)
            const hasChanges = this.convertTextNodesOnly(target[0]);

            // restore cursor position if there were changes
            if (hasChanges && range) {
                this.restoreCursorPosition(target, caretOffset);
            }
        }
    }

    /**
     * Handle paste events with a delay to allow content to be inserted
     */
    handlePasteConversion = (event: JQuery.TriggeredEvent): void => {
        // use multiple timeouts to catch different paste scenarios
        setTimeout(() => {
            this.handleQuoteConversion(event);
        }, 0);

        setTimeout(() => {
            this.handleQuoteConversion(event);
        }, 50);

        setTimeout(() => {
            this.handleQuoteConversion(event);
        }, 200);
    }

    /**
     * Attach German quotation conversion to an element
     */
    attachToElement(element: JQuery<HTMLElement>) {
        element.on('input blur', this.handleQuoteConversion);
        element.on('paste', this.handlePasteConversion);
    }

    /**
     * Detach German quotation conversion from an element
     */
    detachFromElement(element: JQuery<HTMLElement>) {
        element.off('input blur', this.handleQuoteConversion);
        element.off('paste', this.handlePasteConversion);
    }
}

export default GermanQuotation;
