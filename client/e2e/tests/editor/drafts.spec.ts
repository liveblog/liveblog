import { test, expect } from '../../fixtures';
import { BlogPage } from '../../pages/blog.page';
import { EditorPage } from '../../pages/editor.page';

// Blog index 0 = 'title: end to end image' — 0 published posts, clean slate

test('opens drafts panel from url', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);

    await blog.open(0);
    const url = authenticatedPage.url().split('?')[0];

    // Navigate away first so the next goto triggers a fresh controller load.
    // Superdesk activities have reloadOnSearch:false, so a hash-only change
    // does not re-run the controller and the ?panel param would be ignored.
    await authenticatedPage.goto('/#/liveblog');
    await authenticatedPage.locator('ul.card-list').waitFor();
    await authenticatedPage.goto(url + '?panel=drafts');
    await authenticatedPage.locator('.panel--draft').waitFor();

    await expect(authenticatedPage.locator('.panel--draft')).toBeVisible();
});

test('creates a draft and finds it in the drafts panel', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const editor = new EditorPage(authenticatedPage);

    await blog.open(0);
    await blog.openEditorPanel();
    await editor.typeText('draft post text');
    await editor.saveAsDraft();

    await blog.openDraftsPanel();
    await expect(blog.draftPosts()).toHaveCount(1);
    await expect(blog.draftPosts().first().locator('[lb-bind-html]').first()).toContainText('draft post text');
});

test('creates two drafts and shows them newest first', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const editor = new EditorPage(authenticatedPage);

    await blog.open(0);
    await blog.openEditorPanel();
    await editor.typeText('first draft');
    await editor.saveAsDraft();

    await editor.typeText('second draft');
    await editor.saveAsDraft();

    await blog.openDraftsPanel();
    await expect(blog.draftPosts()).toHaveCount(2);
    await expect(blog.draftPosts().nth(0).locator('[lb-bind-html]').first()).toContainText('second draft');
    await expect(blog.draftPosts().nth(1).locator('[lb-bind-html]').first()).toContainText('first draft');
});

test('opens a draft in the editor and publishes it', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const editor = new EditorPage(authenticatedPage);

    await blog.open(0);
    await blog.openEditorPanel();
    await editor.typeText('draft to publish');
    await editor.saveAsDraft();

    await blog.openDraftsPanel();
    await blog.draftPosts().first().hover();
    await blog.draftPosts().first().locator('a[ng-click="onEditClick(post)"]').click();

    await blog.openEditorPanel();
    await editor.publish();

    const timeline = authenticatedPage.locator('.column--timeline .timeline-posts-list:not(.pinned) lb-post');
    await expect(timeline).toHaveCount(1);
    await expect(timeline.first().locator('[lb-bind-html]').first()).toContainText('draft to publish');

    await blog.openDraftsPanel();
    await expect(blog.draftPosts()).toHaveCount(0);
});
