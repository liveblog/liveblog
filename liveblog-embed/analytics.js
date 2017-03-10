(function() {
    var apiHost = window.hasOwnProperty('LB') ? window.LB.api_host : '';
    var contextUrl = document.referrer;
    var blogId = window.hasOwnProperty('LB') ? window.LB.blog._id : '';

    apiHost += 'api/analytics/hit';

    var createCookie = function(name,value,days) {
        var expires = "", date = new Date();

        if (days) {
            date.setTime(date.getTime() + (days*24*60*60*1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + value + expires + "; path=/";
    };

    var readCookie = function(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null;
    };

    var hit = function() {
        var xmlhttp = new XMLHttpRequest();
        var jsonData = JSON.stringify({
            context_url: contextUrl,
            blog_id: blogId
        });

        xmlhttp.open("POST", apiHost);
        xmlhttp.setRequestHeader("Content-Type", "application/json");

        xmlhttp.onload = function() {
            if (xmlhttp.status == 200)
                createCookie('hit', jsonData, 2);
        };

        xmlhttp.send(jsonData);
    };

    if (!readCookie('hit'))
        hit();
})();
