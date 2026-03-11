import { test, expect } from '../../fixtures';
import { BlogPage } from '../../pages/blog.page';
import { EditorPage } from '../../pages/editor.page';

// Blog index 0 = 'title: end to end image' — 0 published posts, clean slate
//
// Freetype iterator numbering: freetypeService.transform() uses a module-level
// counter that increments per <li> block processed. On a fresh page load the
// counter starts at 0, so the scorecard template's home.scorers <li> always
// becomes iterator__1 and away.scorers becomes iterator__2.

test('publishes a scorecard and verifies data after editing', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const editor = new EditorPage(authenticatedPage);

    await blog.open(0);
    await blog.openEditorPanel();
    await editor.openScorecardFreetype();

    await editor.scorecardInput('home.name').fill('Home United');
    await editor.scorecardInput('home.score').fill('2');
    await editor.scorecardInput('away.name').fill('Away City');
    await editor.scorecardInput('away.score').fill('1');

    // Fill first home scorer slot
    await editor.scorecardScorerInputs(1, 'name').nth(0).fill('First Scorer');
    await editor.scorecardScorerInputs(1, 'time').nth(0).fill('30');

    await editor.publish();

    await expect(blog.timelinePosts()).toHaveCount(1);

    // Reload to clear editor state before editing the published post
    await authenticatedPage.reload();
    await authenticatedPage.locator('.column--timeline').waitFor();

    await blog.editTimelinePost(0);
    await blog.openEditorPanelForFreetype();

    await expect(editor.scorecardInput('home.name')).toHaveValue('Home United');
    await expect(editor.scorecardInput('home.score')).toHaveValue('2');
    await expect(editor.scorecardInput('away.name')).toHaveValue('Away City');
    await expect(editor.scorecardInput('away.score')).toHaveValue('1');
    await expect(editor.scorecardScorerInputs(1, 'name').nth(0)).toHaveValue('First Scorer');

    // Add a second home scorer row and fill it
    await editor.addHomeScorerRow();
    await editor.scorecardScorerInputs(1, 'name').nth(1).fill('Second Scorer');
    await editor.scorecardScorerInputs(1, 'time').nth(1).fill('75');

    await editor.publish();

    await expect(blog.timelinePosts()).toHaveCount(1);

    // Reload again and verify the second scorer persists
    await authenticatedPage.reload();
    await authenticatedPage.locator('.column--timeline').waitFor();

    await blog.editTimelinePost(0);
    await blog.openEditorPanelForFreetype();

    await expect(editor.scorecardScorerInputs(1, 'name').nth(0)).toHaveValue('First Scorer');
    await expect(editor.scorecardScorerInputs(1, 'name').nth(1)).toHaveValue('Second Scorer');
    await expect(editor.scorecardScorerInputs(1, 'time').nth(1)).toHaveValue('75');
});
