import { test, expect } from '../../fixtures/index';
import { ThemesPage } from '../../pages/themes.page';

const THEME_COUNT = 3;

test.describe('Themes Manager', () => {
    test('lists all themes', async ({ authenticatedPage }) => {
        const page = new ThemesPage(authenticatedPage);
        await page.open();

        await expect(page.themeCards).toHaveCount(THEME_COUNT);
    });

    test('can set a theme as default', async ({ authenticatedPage }) => {
        const page = new ThemesPage(authenticatedPage);
        await page.open();

        expect(await page.isDefault(2)).toBe(true);
        expect(await page.isDefault(0)).toBe(false);

        await page.setAsDefault(0);

        expect(await page.isDefault(0)).toBe(true);
        expect(await page.isDefault(2)).toBe(false);
    });

    test('can change theme settings', async ({ authenticatedPage }) => {
        const page = new ThemesPage(authenticatedPage);
        await page.open();

        await page.openSettings(1);
        await page.fillPostsPerPage('111');
        await page.saveAndCloseSettings();

        await page.openSettings(1);
        expect(await page.getPostsPerPage()).toBe('111');
        await page.saveAndCloseSettings();
    });
});
