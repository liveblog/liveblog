import { test, expect } from '../../fixtures/index';
import { FreetypesPage } from '../../pages/freetypes.page';

const NAME_1 = 'Test Freetype';
const TEMPLATE_1 = '<p text="$content"></p>';
const NAME_2 = ' Updated';
const TEMPLATE_2 = '<span text="$extra"></span>';

test.describe('Freetypes Manager', () => {
    test('can do CRUD operations on freetypes', async ({ authenticatedPage }) => {
        const page = new FreetypesPage(authenticatedPage);
        await page.open();

        await expect(page.freetypeItems).toHaveCount(0);

        await page.createFreetype(NAME_1, TEMPLATE_1);
        await expect(page.freetypeItems).toHaveCount(1);

        await page.openFirstFreetypeEdit();
        expect(await page.getDialogName()).toBe(NAME_1);
        expect(await page.getDialogTemplate()).toBe(TEMPLATE_1);

        await page.fillDialogName(NAME_1 + NAME_2);
        await page.fillDialogTemplate(TEMPLATE_1 + TEMPLATE_2);
        await page.saveDialog();

        await page.openFirstFreetypeEdit();
        expect(await page.getDialogName()).toBe(NAME_1 + NAME_2);
        expect(await page.getDialogTemplate()).toBe(TEMPLATE_1 + TEMPLATE_2);
        await page.cancelDialog();

        await page.deleteFirstFreetype();
        await expect(page.freetypeItems).toHaveCount(0);
    });
});
