import { test, expect } from '../../fixtures';
import { BlogPage } from '../../pages/blog.page';
import { EditorPage } from '../../pages/editor.page';

// Requires IFRAMELY_KEY to be configured in the backend environment.
// The key is set via CI secrets; the backend resolves the embed URL.

const YOUTUBE_URL = 'https://www.youtube.com/watch?v=Ksd-a9lIIDc';

test('adds a youtube embed in the editor', async ({ authenticatedPage }) => {
    test.skip(!process.env.IFRAMELY_KEY, 'IFRAMELY_KEY not set');
    // Iframely fetch can be slow. If flaky with timeout, consider uncommenting the line below.
    // test.setTimeout(60000);

    const blog = new BlogPage(authenticatedPage);
    const editor = new EditorPage(authenticatedPage);

    await blog.open(0);
    await blog.openEditorPanel();
    await editor.addEmbedBlock();
    await editor.typeEmbed(YOUTUBE_URL);

    await expect(editor.embedPreviewIframe()).toBeVisible();
});
