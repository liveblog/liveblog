import { test, expect } from '../../fixtures';
import { BlogPage } from '../../pages/blog.page';
import { EditorPage } from '../../pages/editor.page';

// Blog index 0 = 'title: end to end image' — 0 published posts, clean slate
// Blog index 3 = 'title: end to end One' — 2 pre-seeded contributions

test('opens contributions panel from url', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);

    await blog.open(0);
    const url = authenticatedPage.url().split('?')[0];

    await authenticatedPage.goto('/#/liveblog');
    await authenticatedPage.locator('ul.card-list').waitFor();
    await authenticatedPage.goto(url + '?panel=contributions');
    await authenticatedPage.locator('.panel--contribution').waitFor();

    await expect(authenticatedPage.locator('.panel--contribution')).toBeVisible();
});

test('creates a contribution and finds it in the contributions panel', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const editor = new EditorPage(authenticatedPage);

    await blog.open(0);
    await blog.openEditorPanel();
    await editor.typeText('contribution post text');
    await editor.saveAsContribution();

    await blog.openContributionsPanel();
    await expect(blog.contributionPosts()).toHaveCount(1);
    await expect(blog.contributionPosts().first().locator('[lb-bind-html]').first()).toContainText('contribution post text');
});

test('creates two contributions and shows them newest first', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const editor = new EditorPage(authenticatedPage);

    await blog.open(0);
    await blog.openEditorPanel();
    await editor.typeText('first contribution');
    await editor.saveAsContribution();

    // After saveAsContribution the editor resets. typeText has waitFor built in.
    await editor.typeText('second contribution');
    await editor.saveAsContribution();

    await blog.openContributionsPanel();
    await expect(blog.contributionPosts()).toHaveCount(2);
    await expect(blog.contributionPosts().nth(0).locator('[lb-bind-html]').first()).toContainText('second contribution');
    await expect(blog.contributionPosts().nth(1).locator('[lb-bind-html]').first()).toContainText('first contribution');
});

test('publishes a contribution directly from the contributions panel', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const editor = new EditorPage(authenticatedPage);

    await blog.open(0);
    await blog.openEditorPanel();
    await editor.typeText('contribution to publish');
    await editor.saveAsContribution();

    await blog.openContributionsPanel();
    await blog.publishContributionPost(0);

    const timeline = authenticatedPage.locator('.column--timeline .timeline-posts-list:not(.pinned) lb-post');
    await expect(timeline).toHaveCount(1);
    await expect(timeline.first().locator('[lb-bind-html]').first()).toContainText('contribution to publish');

    await blog.openContributionsPanel();
    await expect(blog.contributionPosts()).toHaveCount(0);
});

test('opens a contribution in the editor and publishes it', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const editor = new EditorPage(authenticatedPage);

    await blog.open(0);
    await blog.openEditorPanel();
    await editor.typeText('contribution to edit and publish');
    await editor.saveAsContribution();

    await blog.openContributionsPanel();
    await blog.editContributionPost(0);

    await blog.openEditorPanel();
    await editor.publish();

    const timeline = authenticatedPage.locator('.column--timeline .timeline-posts-list:not(.pinned) lb-post');
    await expect(timeline).toHaveCount(1);
    await expect(timeline.first().locator('[lb-bind-html]').first()).toContainText('contribution to edit and publish');

    await blog.openContributionsPanel();
    await expect(blog.contributionPosts()).toHaveCount(0);
});

test('updates a contribution from the editor', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const editor = new EditorPage(authenticatedPage);

    await blog.open(0);
    await blog.openEditorPanel();
    await editor.typeText('original text');
    await editor.saveAsContribution();

    await blog.openContributionsPanel();
    await blog.editContributionPost(0);

    await blog.openEditorPanel();
    // Wait for the original content to be loaded into the text block before selecting.
    await authenticatedPage.locator('.st-text-block').filter({ hasText: 'original text' }).waitFor();
    await editor.textBlock().click();
    await authenticatedPage.keyboard.press('Control+a');
    await authenticatedPage.keyboard.type('updated text');
    await editor.saveAsContribution();

    await blog.openContributionsPanel();
    await expect(blog.contributionPosts()).toHaveCount(1);
    await expect(blog.contributionPosts().first().locator('[lb-bind-html]').first()).toContainText('updated text');
});

test('contributor cannot edit other users contributions', async ({ contributorPage }) => {
    const blog = new BlogPage(contributorPage);

    // Blog 3 has a pre-seeded contribution from admin. A contributor should not
    // see the edit button on posts they did not author.
    await blog.open(3);
    await blog.openContributionsPanel();

    await blog.contributionPosts().first().hover();
    await expect(blog.hasEditButtonOnContribution(0)).not.toBeVisible();
});

test('filter contributions by member', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);

    // Blog 3 has pre-seeded contributions from both admin and editor users.
    // Sorted updated_first: admin's contribution at index 0, editor's at index 1.
    await blog.open(3);
    await blog.openContributionsPanel();

    await expect(blog.contributionPosts()).toHaveCount(2);
    await expect(blog.contributionPosts().nth(0).locator('[lb-bind-html]').first()).toContainText("admin's contribution");
    await expect(blog.contributionPosts().nth(1).locator('[lb-bind-html]').first()).toContainText("editor's contribution");

    await blog.filterContributionsByMember('editor');

    await expect(blog.contributionPosts()).toHaveCount(1);
    await expect(blog.contributionPosts().first().locator('[lb-bind-html]').first()).toContainText("editor's contribution");
});
