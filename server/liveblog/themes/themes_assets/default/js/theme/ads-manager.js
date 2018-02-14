require('./templates');
const nunjucks = require('nunjucks/browser/nunjucks-slim');
const helpers = require('./helpers');
const events = require('./events');

const config = window.LB;
const apiHost = config.api_host.replace(/\/$/, '');
const blogId = config.blog._id;
const outputId = config.output._id;
const endpoint =  `${apiHost}/api/advertisements/${blogId}/${outputId}/`;

// NOTE: temporal place to store advertisements, perhaps put them in localstorage
var advertisements = [];

const nunjucksEnv = new nunjucks.Environment();
nunjucksEnv.addFilter('date', helpers.convertTimestamp);
nunjucks.env = nunjucksEnv;

// TODO: Convert the adsManager into a completely theme agnostic module
// the idea is to receive the configuration from outside and handle ads according
// to theme configuration. Currently the config below is tight only to `Liveblog 3 SEO Theme`
const adsSettings = {
    postSelector: "section.lb-posts.normal > article.lb-post",
    adsSelector: "article.lb-post.advertisement",
    frequency: config.output.settings.frequency,
};

function resetAds() {
    let ads = document.querySelectorAll(adsSettings.adsSelector);
    ads.forEach(e => e.parentNode.removeChild(e));
}

function renderAds() {
    const articles = document.querySelectorAll(adsSettings.postSelector);
    const postCount = articles.length;
    const adsCount = advertisements.length;
    const frequency = adsSettings.frequency;

    const looper = helpers.range(0, postCount, frequency);
    looper.forEach(i => {
        let index = Math.ceil(i / frequency) % adsCount;
        let refNode = articles[i];
        let parentNode = refNode.parentNode;

        const rendered = nunjucks.env.render('template-ad-entry.html', {
          item: advertisements[index],
          settings: config.settings,
          assets_root: window.LB.assets_root
        });

        let fragment = helpers.fragmentFromString(rendered.trim());
        parentNode.insertBefore(fragment.childNodes[0], refNode);
    });
}


module.exports = {
    init: () => {
        helpers.getJSON(endpoint).then((data) => {
            advertisements = data;
        });

        // adding ability to refresh ads from anywhere via event handling
        const evtName = events.updateAds.type;
        document.addEventListener(evtName, function (e) {
            refreshAds();
        }, false);

        // render first loop of ads
        setTimeout(() => {
            renderAds();
        }, 1000);
    },

    refreshAds: () => {
        // console.log('refreshing ads...');

        // @TODO: perhaps pull new ads?
        resetAds();
        renderAds();
    }
};
