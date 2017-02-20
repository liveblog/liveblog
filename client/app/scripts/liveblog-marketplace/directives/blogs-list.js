export default function lbBlogsList() {
    return {
        templateUrl: 'scripts/liveblog-marketplace/views/blogs-list.html',
        scope: {
            title: '@',
            blogs: '='
        }
    }
}
