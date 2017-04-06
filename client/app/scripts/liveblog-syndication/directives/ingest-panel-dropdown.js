import ingestPanelDropdownTpl from 'scripts/liveblog-syndication/views/ingest-panel-dropdown.html';

ingestPanelDropdown.$inject = ['IngestPanelActions', 'datetimeHelper'];

export default function ingestPanelDropdown(IngestPanelActions, datetimeHelper) {
    return {
        templateUrl: ingestPanelDropdownTpl,
        scope: {
            consumerBlogId: '=',
            blog: '='
        },
        link: function(scope) {
            scope.toggleDropdown = function($event, blog) {
                if (!blog.hasOwnProperty('isOpen')) {
                    blog.isOpen = false;
                }

                $event.preventDefault();
                $event.stopPropagation();

                blog.isOpen = !blog.isOpen;
            };

            scope.blog.start_date = datetimeHelper.splitDateTime(scope.blog.start_date).date;

            scope.updateSyndication = function() {
                IngestPanelActions.updateSyndication(
                    scope.blog._id,
                    {
                        auto_publish: scope.blog.auto_publish,
                        auto_retrieve: scope.blog.auto_retrieve,
                        start_date: scope.blog.start_date
                    },
                    scope.blog._etag
                );
            };

            scope.destroy = function($event) {
                $event.preventDefault();
                $event.stopPropagation();

                IngestPanelActions.syndicate({
                    producerId: scope.blog.producer_id,
                    producerBlogId: scope.blog.producer_blog_id,
                    consumerBlogId: scope.consumerBlogId,
                    autoPublish: scope.blog.auto_publish,
                    startDate: scope.startDate,
                    autoRetrieve: scope.blog.auto_retrieve,
                    method: 'DELETE'
                });
            };

            scope.open = false;

            scope.$watch('blog.start_date', (newVal, oldVal) => {
                if (newVal !== oldVal) {
                    scope.updateSyndication();
                }
            });
        }
    };
}
