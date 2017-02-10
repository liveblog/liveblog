var protagonist = require('protagonist'),
    path = require('path'),
    fs = require('fs'),
    aglio = require('aglio');

fs.readFile(path.join(__dirname, '/apiary.apib'), function(error, buffer) {
    if (error) {
        console.error(error);
        process.exit(1);
    }

    var data = '' + buffer;
    protagonist.parse(data, function(error, result) {
        if (error) {
            console.error(error);
            console.log('in', data.substr(error.location[0].index, 50));
            process.exit(1);
        }
        console.log('protagonist parsed output:');
        console.log(result);
    });
    aglio.render(data, {}, function(err, html, warnings) {
        if (err) {
            console.log(err);
            process.exit(1);
        }
        if (warnings)
            console.log(warnings);

        console.log('aglio html output:');
        console.log(html);
    });
});
