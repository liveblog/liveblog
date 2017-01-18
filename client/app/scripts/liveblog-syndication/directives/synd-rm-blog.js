syndRmBlog.$inject = ['api', '$routeParams'];

export default function syndRmBlog(api, $routeParams) {
    return {
        link: function(scope, elem, attrs) {
            var params = {
                where: {
                    blog_id: $routeParams._id
                }
            };

            api.syndicationOut.query(params).then(function(syndOuts) {
                if (syndOuts._items.length > 0)
                    attrs.$set('disabled', 'disabled');
                else
                    elem.removeAttr('disabled');
            });
        }
    };
};
