import { test, expect } from '../../fixtures';
import { BlogPage } from '../../pages/blog.page';
import { EditorPage } from '../../pages/editor.page';

// Blog index 0 = 'title: end to end image' — 0 published posts, clean slate

test('can add option in poll block', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const editor = new EditorPage(authenticatedPage);

    await blog.open(0);
    await blog.openEditorPanel();
    await editor.addPollBlock();
    await editor.pollAddOption();

    await expect(editor.pollAnswerInputs()).toHaveCount(3);
});

test('can remove option in poll block', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const editor = new EditorPage(authenticatedPage);

    await blog.open(0);
    await blog.openEditorPanel();
    await editor.addPollBlock();
    await editor.pollRemoveOption(0);

    await expect(editor.pollAnswerInputs()).toHaveCount(1);
});

test('can set days, hours, and minutes in poll block', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const editor = new EditorPage(authenticatedPage);

    await blog.open(0);
    await blog.openEditorPanel();
    await editor.addPollBlock();

    await editor.pollDaysInput().fill('2');
    await editor.pollHoursInput().fill('3');
    await editor.pollMinutesInput().fill('30');

    await expect(editor.pollDaysInput()).toHaveValue('2');
    await expect(editor.pollHoursInput()).toHaveValue('3');
    await expect(editor.pollMinutesInput()).toHaveValue('30');
});

test('clamps hours to 24 and minutes to 60 in poll block', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const editor = new EditorPage(authenticatedPage);

    await blog.open(0);
    await blog.openEditorPanel();
    await editor.addPollBlock();

    await editor.pollHoursInput().fill('50');
    await editor.pollMinutesInput().fill('100');

    await expect(editor.pollHoursInput()).toHaveValue('24');
    await expect(editor.pollMinutesInput()).toHaveValue('60');
});

test('can reset the poll block', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);
    const editor = new EditorPage(authenticatedPage);

    await blog.open(0);
    await blog.openEditorPanel();
    await editor.addPollBlock();

    await editor.pollDaysInput().fill('2');
    await editor.pollHoursInput().fill('3');
    await editor.pollMinutesInput().fill('30');
    await editor.pollAddOption();
    await expect(editor.pollAnswerInputs()).toHaveCount(3);

    await editor.pollReset();

    await expect(editor.pollDaysInput()).toHaveValue('0');
    await expect(editor.pollHoursInput()).toHaveValue('0');
    await expect(editor.pollMinutesInput()).toHaveValue('0');
    await expect(editor.pollAnswerInputs()).toHaveCount(2);
});
