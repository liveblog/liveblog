import path from 'path';
import { test, expect } from '../../fixtures';
import { BlogsListPage } from '../../pages/blogs-list.page';
import { BlogSettingsPage } from '../../pages/blog-settings.page';

const TEST_IMAGE = path.resolve(__dirname, '../../../../server/features/steps/fixtures/bike.jpg');

const ACTIVE_COUNT = 4;
const ARCHIVED_COUNT = 1;

test('displays the active blogs list', async ({ authenticatedPage }) => {
    const blogs = new BlogsListPage(authenticatedPage);
    await blogs.open();

    await expect(blogs.blogItems).toHaveCount(ACTIVE_COUNT);
});

test('switches to list view', async ({ authenticatedPage }) => {
    const blogs = new BlogsListPage(authenticatedPage);
    await blogs.open();

    await expect(blogs.page.locator('table.row-list')).not.toBeVisible();
    await blogs.switchToListView();
    await expect(blogs.page.locator('table.row-list')).toBeVisible();
    await expect(blogs.listViewRows()).toHaveCount(ACTIVE_COUNT);
});

test('searches blogs - matches all', async ({ authenticatedPage }) => {
    const blogs = new BlogsListPage(authenticatedPage);
    await blogs.open();
    await blogs.search('title');

    await expect(blogs.blogItems).toHaveCount(4);
});

test('searches blogs - matches one', async ({ authenticatedPage }) => {
    const blogs = new BlogsListPage(authenticatedPage);
    await blogs.open();
    await blogs.search('thre');

    await expect(blogs.blogItems).toHaveCount(1);
});

test('searches blogs - case insensitive', async ({ authenticatedPage }) => {
    const blogs = new BlogsListPage(authenticatedPage);
    await blogs.open();
    await blogs.search('to');

    await expect(blogs.blogItems).toHaveCount(4);
});

test('lists archived blogs', async ({ authenticatedPage }) => {
    const blogs = new BlogsListPage(authenticatedPage);
    await blogs.open();
    await blogs.selectState('archived');

    await expect(blogs.blogItems).toHaveCount(ARCHIVED_COUNT);
});

test('creates a new blog', async ({ authenticatedPage }) => {
    const blogs = new BlogsListPage(authenticatedPage);
    await blogs.open();
    await blogs.createBlog('new blog title');

    await expect(blogs.blogItems).toHaveCount(ACTIVE_COUNT + 1);
    await expect(blogs.blogTitles().first()).toHaveText('new blog title');
});

test('creates a new blog with an image', async ({ authenticatedPage }) => {
    const blogs = new BlogsListPage(authenticatedPage);
    const settings = new BlogSettingsPage(authenticatedPage);

    await blogs.open();
    await blogs.createBlogWithImage('blog with image', TEST_IMAGE);

    await expect(blogs.blogItems).toHaveCount(ACTIVE_COUNT + 1);
    await blogs.openBlogSettings(0);
    await expect(settings.blogImage()).toBeVisible();
});

test('creates a new blog with a member', async ({ authenticatedPage }) => {
    const blogs = new BlogsListPage(authenticatedPage);
    const settings = new BlogSettingsPage(authenticatedPage);

    await blogs.open();
    await blogs.createBlogWithMember('blog with member', 'g');

    await blogs.openBlogSettings(0);
    await settings.openTeamTab();
    await expect(settings.teamMembers()).toHaveCount(1);
});

test('contributor requests access to a blog; admin accepts', async ({ authenticatedPage, contributorPage }) => {
    const contribList = new BlogsListPage(contributorPage);
    const adminList = new BlogsListPage(authenticatedPage);
    const adminSettings = new BlogSettingsPage(authenticatedPage);

    // Blog index 1 = 'title: end To end three' — contributor is not a member
    await contribList.open();
    await contribList.requestBlogAccess(1);

    await adminList.open();
    await adminList.openBlogSettings(1);
    await adminSettings.openTeamTab();
    await adminSettings.acceptPendingMember();
    await adminSettings.saveAndClose();

    await adminSettings.reopenSettings();
    await adminSettings.openTeamTab();
    await expect(adminSettings.teamMembers()).toHaveCount(1);
});
