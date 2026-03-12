import { test, expect } from '../../fixtures';
import { BlogPage } from '../../pages/blog.page';
import { EditorPage } from '../../pages/editor.page';

// Blog index 0 = 'title: end to end image' — 0 published posts, clean slate
//
// Freetype iterator numbering: freetypeService.transform() uses a module-level
// counter that increments per <li> block processed. On a fresh page load the
// counter starts at 0, so the scorecard template's home.scorers <li> always
// becomes iterator__1 and away.scorers becomes iterator__2.

test('publishes a scorecard, edits it, adds a scorer, then resets', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const editor = new EditorPage(authenticatedPage);

    await blog.open(0);
    await blog.openEditorPanel();
    await editor.openScorecardFreetype();

    await editor.scorecardInput('home.name').fill('Home United');
    await editor.scorecardInput('home.score').fill('2');
    await editor.scorecardInput('away.name').fill('Away City');
    await editor.scorecardInput('away.score').fill('1');

    // First home scorer
    await editor.scorecardScorerInputs(1, 'name').nth(0).fill('Player One');
    await editor.scorecardScorerInputs(1, 'time').nth(0).fill('30');

    // Add second home scorer before publishing
    await editor.addHomeScorerRow();
    await editor.scorecardScorerInputs(1, 'name').nth(1).fill('Player Two');
    await editor.scorecardScorerInputs(1, 'time').nth(1).fill('55');

    await editor.publish();

    await expect(blog.timelinePosts()).toHaveCount(1);

    // Reload so we start from a clean editor state
    await authenticatedPage.reload();
    await authenticatedPage.locator('.column--timeline').waitFor();

    await blog.editTimelinePost(0);
    await blog.openEditorPanelForFreetype();

    // Verify all fields are preserved
    await expect(editor.scorecardInput('home.name')).toHaveValue('Home United');
    await expect(editor.scorecardInput('home.score')).toHaveValue('2');
    await expect(editor.scorecardInput('away.name')).toHaveValue('Away City');
    await expect(editor.scorecardInput('away.score')).toHaveValue('1');
    await expect(editor.scorecardScorerInputs(1, 'name').nth(0)).toHaveValue('Player One');
    await expect(editor.scorecardScorerInputs(1, 'time').nth(0)).toHaveValue('30');
    await expect(editor.scorecardScorerInputs(1, 'name').nth(1)).toHaveValue('Player Two');
    await expect(editor.scorecardScorerInputs(1, 'time').nth(1)).toHaveValue('55');

    // Add a third scorer and publish the update
    await editor.addHomeScorerRow();
    await editor.scorecardScorerInputs(1, 'name').nth(2).fill('Player Three');
    await editor.scorecardScorerInputs(1, 'time').nth(2).fill('75');

    await editor.publish();

    await expect(blog.timelinePosts()).toHaveCount(1);

    // Reload and verify second scorer still persists alongside the new third
    await authenticatedPage.reload();
    await authenticatedPage.locator('.column--timeline').waitFor();

    await blog.editTimelinePost(0);
    await blog.openEditorPanelForFreetype();

    await expect(editor.scorecardScorerInputs(1, 'name').nth(1)).toHaveValue('Player Two');
    await expect(editor.scorecardScorerInputs(1, 'time').nth(1)).toHaveValue('55');

    // Reset the editor and verify all fields are cleared
    await editor.resetEditor();

    await expect(editor.scorecardInput('home.name')).toHaveValue('');
    await expect(editor.scorecardInput('home.score')).toHaveValue('');
    await expect(editor.scorecardInput('away.name')).toHaveValue('');
    await expect(editor.scorecardInput('away.score')).toHaveValue('');
});
