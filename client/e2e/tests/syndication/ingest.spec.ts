import { test, expect } from '../../fixtures';
import { BlogPage } from '../../pages/blog.page';

// Blog index 3 = 'title: end to end One' — has 1 pre-seeded syndication_in entry

test('lists available syndications in the ingest panel', async ({ authenticatedPage }) => {
    const blog = new BlogPage(authenticatedPage);

    await blog.open(3);
    await blog.openIngestPanel();

    await expect(blog.syndicatedBlogItems()).toHaveCount(1);
});
