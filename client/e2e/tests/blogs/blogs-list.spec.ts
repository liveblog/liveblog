import { test, expect } from '../../fixtures';
import { BlogsListPage } from '../../pages/blogs-list.page';

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
