import { test, expect } from '../../fixtures';
import { BlogPage } from '../../pages/blog.page';
import { EditorPage } from '../../pages/editor.page';

// Blog index 0 = 'title: end to end image' — 0 published posts, clean slate

const TEST_IMAGE = '../app/images/superdesk-icon-large.png';

test('uploads an image and shows it in the editor', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const editor = new EditorPage(authenticatedPage);

    await blog.open(0);
    await blog.openEditorPanel();
    await editor.addImageBlock(TEST_IMAGE);

    await editor.imageBlockImg().waitFor();
    await expect(editor.imageBlockImg()).toHaveAttribute('src', /.+/);
    await expect(editor.imageBlockError()).toHaveCount(0);
});
