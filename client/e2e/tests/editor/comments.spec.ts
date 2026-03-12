import { test, expect } from '../../fixtures';
import { BlogPage } from '../../pages/blog.page';
import { EditorPage } from '../../pages/editor.page';

// Blog index 0 = 'title: end to end image' (blog five in seed data)
// It has 1 pre-seeded comment: text='comment: contents', commenter='comment: first last'

test('opens comments panel from url', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);

    await blog.open(0);
    const url = authenticatedPage.url().split('?')[0];

    await authenticatedPage.goto('/#/liveblog');
    await authenticatedPage.locator('ul.card-list').waitFor();
    await authenticatedPage.goto(url + '?panel=comments');
    await authenticatedPage.locator('.panel--comments').waitFor();

    await expect(authenticatedPage.locator('.panel--comments')).toBeVisible();
});

test('publishes a comment directly from the comments panel', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);

    await blog.open(0);
    await blog.openCommentsPanel();
    await expect(blog.commentPosts()).toHaveCount(1);

    await blog.publishCommentPost(0);

    await expect(blog.timelinePosts()).toHaveCount(1);
    await blog.openCommentsPanel();
    await expect(blog.commentPosts()).toHaveCount(0);
});

test('opens a comment in the editor and publishes it', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const editor = new EditorPage(authenticatedPage);

    await blog.open(0);
    await blog.openCommentsPanel();
    await expect(blog.commentPosts()).toHaveCount(1);

    await blog.editCommentPost(0);
    await blog.openEditorPanel();

    await authenticatedPage.locator('.st-text-block').filter({ hasText: 'comment: contents' }).waitFor();
    await editor.publish();

    await expect(blog.timelinePosts()).toHaveCount(1);
    await blog.openCommentsPanel();
    await expect(blog.commentPosts()).toHaveCount(0);
});
