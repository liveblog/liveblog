import { test, expect } from '../../fixtures';
import { BlogPage } from '../../pages/blog.page';
import { TimelinePage } from '../../pages/timeline.page';

// Seed data blog indices (active blogs, sorted by creation):
// 0 = 'title: end to end image'    — 0 published posts
// 1 = 'title: end To end three'   — 16 published posts (pagination)
// 2 = 'title: end to end two'     — 1 published post
// 3 = 'title: end to end One'     — 3 published posts

const BLOG_ONE_POST_COUNT = 3;
const BLOG_THREE_POST_COUNT = 16;

test('shows posts on the timeline', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const timeline = new TimelinePage(authenticatedPage);

    await blog.open(3);

    await expect(timeline.posts()).toHaveCount(BLOG_ONE_POST_COUNT);
    await expect(timeline.postText(0)).toContainText('text post three: end to end item one');
    await expect(timeline.postAuthor(0)).toHaveText('Victor the Editor');
    await expect(timeline.postText(1)).toContainText('text post two: end to end item onE');
    await expect(timeline.postText(2)).toContainText('text post one: end to end item One');
});

test('reorders posts on the timeline', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const timeline = new TimelinePage(authenticatedPage);

    await blog.open(3);

    const originalSecondText = await timeline.postText(1).textContent();

    await timeline.startReorder(1);
    await timeline.moveAbove(0);

    await authenticatedPage.reload();
    await timeline.posts().first().waitFor();

    await expect(timeline.postText(0)).toHaveText(originalSecondText!.trim());
});

test('cannot reorder a single post', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const timeline = new TimelinePage(authenticatedPage);

    await blog.open(2);
    await timeline.posts().first().waitFor();

    await timeline.post(0).hover();
    await expect(timeline.reorderDisabledLocator(0)).toBeVisible();
    await expect(timeline.canReorderLocator(0)).toHaveCount(0);
});

test('cannot publish a blank post', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);

    await blog.open(0);
    await blog.openEditorPanel();
    await authenticatedPage.locator('.st-text-block').click();
    await authenticatedPage.keyboard.type(' ');

    await expect(blog.publishButton()).toBeDisabled();
});

test('adds a post to the top of the timeline', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const timeline = new TimelinePage(authenticatedPage);

    await blog.open(0);
    await blog.openEditorPanel();
    await blog.typeAndPublish('new timeline post');

    await expect(timeline.posts()).toHaveCount(1);
    await expect(timeline.postText(0)).toContainText('new timeline post');
});

test('edits a timeline post', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const timeline = new TimelinePage(authenticatedPage);

    await blog.open(3);
    await timeline.editPost(0);

    await authenticatedPage.locator('.st-text-block').click();
    await authenticatedPage.keyboard.press('Control+A');
    await authenticatedPage.keyboard.type('edited post text');

    await authenticatedPage.locator('[ng-click="publish()"]:not([disabled])').waitFor();
    await authenticatedPage.locator('[ng-click="publish()"]').click();

    await expect(timeline.postText(0)).toContainText('edited post text');
    await expect(authenticatedPage.locator('.column--timeline .updated-time').first()).toBeVisible({ timeout: 10000 });
});

test('unpublishes a post to contributions', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const timeline = new TimelinePage(authenticatedPage);

    await blog.open(3);

    const firstPostText = await timeline.postText(0).textContent();

    await timeline.unpublishPost(0);

    await expect(timeline.posts()).toHaveCount(BLOG_ONE_POST_COUNT - 1);
    await expect(timeline.postText(0)).not.toHaveText(firstPostText!.trim());

    await blog.openContributionsPanel();
    await expect(blog.contributionPosts()).toHaveCount(3); // 2 seeded + 1 unpublished
    await expect(blog.contributionPosts().first().locator('[lb-bind-html]').first())
        .toContainText(firstPostText!.trim());
});

test('highlights a post', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const timeline = new TimelinePage(authenticatedPage);

    await blog.open(3);

    await expect(timeline.postHighlightIcon(0)).not.toHaveClass(/orange/);

    await timeline.highlightPost(0);

    await expect(timeline.postHighlightIcon(0)).toHaveClass(/orange/);
});

test('pins a post', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const timeline = new TimelinePage(authenticatedPage);

    await blog.open(3);

    await expect(timeline.pinDrawer()).not.toBeVisible();

    await timeline.pinPost(0);

    await expect(timeline.pinDrawer()).toBeVisible();
});

test('deletes a post', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const timeline = new TimelinePage(authenticatedPage);

    await blog.open(3);

    await expect(timeline.posts()).toHaveCount(BLOG_ONE_POST_COUNT);

    await timeline.deletePost(0);

    await authenticatedPage.reload();
    await expect(timeline.posts()).toHaveCount(BLOG_ONE_POST_COUNT - 1);
});

test('loads more posts on scroll', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const timeline = new TimelinePage(authenticatedPage);

    await blog.open(1);
    await timeline.posts().first().waitFor();

    const initialCount = await timeline.posts().count();

    await timeline.posts().last().scrollIntoViewIfNeeded();
    await authenticatedPage.waitForFunction(
        (count) => document.querySelectorAll('.column--timeline .timeline-posts-list:not(.pinned) lb-post').length > count,
        initialCount,
        { timeout: 10000 }
    );

    const newCount = await timeline.posts().count();
    expect(newCount).toBeGreaterThan(initialCount);
    expect(newCount).toBeLessThanOrEqual(BLOG_THREE_POST_COUNT);
});
