import { test, expect } from '../../fixtures';
import { BlogsListPage } from '../../pages/blogs-list.page';
import { BlogSettingsPage } from '../../pages/blog-settings.page';

const ACTIVE_COUNT = 4;
const ARCHIVED_COUNT = 1;

test('modifies blog title', async ({ authenticatedPage }) => {
    const list = new BlogsListPage(authenticatedPage);
    const settings = new BlogSettingsPage(authenticatedPage);

    await list.open();
    await list.openBlogSettings(0);
    await settings.updateTitle('updated title');
    await settings.saveAndClose();

    await authenticatedPage.goto('/#/liveblog');
    await expect(list.blogTitles().first()).toHaveText('updated title');
});

test('shows original creator name and username', async ({ authenticatedPage }) => {
    const list = new BlogsListPage(authenticatedPage);
    const settings = new BlogSettingsPage(authenticatedPage);

    await list.open();
    await list.openBlogSettings(0);
    await settings.openTeamTab();

    await expect(settings.ownerDisplayName()).toHaveText('Victor the Editor');
    await expect(settings.ownerUsername()).toHaveText('editor');
});

test('archives a blog', async ({ authenticatedPage }) => {
    const list = new BlogsListPage(authenticatedPage);
    const settings = new BlogSettingsPage(authenticatedPage);

    await list.open();
    await list.openBlogSettings(0);
    await settings.toggleStatus();
    await settings.saveAndClose();

    await authenticatedPage.goto('/#/liveblog');
    await list.selectState('archived');
    await expect(list.blogItems).toHaveCount(ARCHIVED_COUNT + 1);
});

test('activates an archived blog', async ({ authenticatedPage }) => {
    const list = new BlogsListPage(authenticatedPage);
    const settings = new BlogSettingsPage(authenticatedPage);

    await list.open();
    await list.selectState('archived');
    await list.openBlogSettings(0);
    await settings.toggleStatus();
    await settings.saveAndClose();

    await authenticatedPage.goto('/#/liveblog');
    await list.selectState('active');
    await expect(list.blogItems).toHaveCount(ACTIVE_COUNT + 1);
});

test('removes a blog', async ({ authenticatedPage }) => {
    const list = new BlogsListPage(authenticatedPage);
    const settings = new BlogSettingsPage(authenticatedPage);

    await list.open();
    await expect(list.blogItems).toHaveCount(ACTIVE_COUNT);

    await list.openBlogSettings(0);
    await settings.removeBlog();

    await authenticatedPage.goto('/#/liveblog');
    await expect(list.blogItems).toHaveCount(ACTIVE_COUNT - 1);
});

test('can do CRUD operations on output channels', async ({ authenticatedPage }) => {
    const list = new BlogsListPage(authenticatedPage);
    const settings = new BlogSettingsPage(authenticatedPage);

    await list.open();
    await list.openBlogSettings(0);
    await settings.openOutputsTab();

    await expect(settings.outputItems).toHaveCount(0);

    await settings.createOutput('Test Output');
    await expect(settings.outputItems).toHaveCount(1);

    await settings.deleteFirstOutput();
    await expect(settings.outputItems).toHaveCount(0);
});
