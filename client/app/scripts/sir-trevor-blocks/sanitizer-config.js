/**
 * This file is part of Superdesk.
 *
 * Copyright 2013 - 2018 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

export default {
    allowedTags: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
        'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
        'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'iframe',
    ],

    transformTags: {
        h1: 'h4',
        h2: 'h5',

        h3: 'h5',
        h4: 'h6',

        h5: 'b',
        h6: 'b',
    },

    allowedAttributes: {
        a: ['href', 'name', 'target'],
        img: ['src'],

        // uncomment the ones below if we want to allow <style> tag or `class` attribute
        // 'style': ['*'],
        // '*': ['class'],
    },

    allowedStyles: {
        '*': {
            // Match HEX and RGB
            color: [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
            'text-align': [/^left$/, /^right$/, /^center$/],
            // Match any number with px, em, or %
            'font-size': [/^\d+$[px|em|%]$/],
        },
        p: {
            'font-size': [/^\d+rem$/],
        },
    },

    // Lots of these won't come up by default because we don't allow them
    selfClosing: ['img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta'],

    // URL schemes we permit
    allowedSchemes: ['http', 'https', 'ftp', 'mailto'],
    allowedSchemesByTag: {},
    allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
    allowProtocolRelative: true,
    allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com'],
};
