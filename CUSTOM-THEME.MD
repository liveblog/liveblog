Custom themes,

We have two theme developed to work with liveblog:

* (Angular Liveblog Toolkit) Angular an abstract theme 
     it contains angular services that can help theme makers.

* (Classic Theme) Classic the main rendering
    by extending the classic theme you ensure that also changes in the classic theme are propagate on version change.
    if major changes in scripts or styles this one should be cloned, but all the version changes need to be manual added.

* (Demo Theme) Demo default extension of the classic theme.
    if only addition of styles and scripts is needed of your theme we recommend that his repo should be cloned.


Abstract themes can't be rendered in the embed ( they are disabled in the theme selection)

a theme must have:

* theme.json file
    theme definitions and properties:

        * `label`: visual is how the theme is identified in the UI

        * `name`: how other theme relate to your theme, extending a theme is made with this field.
              ex: classic "extends": "angular"

        * `version`: not only for visual also used by s3 service to publish versioned themes files.
                    we recommend to use major.minor.revision format and increase accordingly the version.
                    we have an automation version revision increase on classic theme gulp when building.
        * `author`: visual

        * `repository`: object with type and link for the repo
                    we recommend to have git type url, we want to develop an UI update process in the near future.

        * `styles` and `scripts`: main ones used in production enviroment
                    all ower servers are on production enviroment even `lb-dev` ones, so a build is needed. 

        * `devStyles` and `devScripts`: used when on development ( LIVEBLOG_DEBUG enviroment to True )

        * `options`: list of objects with the theme options.
                    ex: {
                            "name": "showTitle",
                            "label": "Show the blog title",
                            "type": "checkbox",
                            "default": true
                        }
                `name`: is avalible in the code
                `label`: visual
                `type`: checkbox, number, select, datetimeFormat
                `default`: the initial value
                `help`: visual to be clear what it does in the UI.
                `options`: a list of objects with `value` and `label` properties for `select type` 

* README.md a md text with information regarding the theme.

a theme may have `screenshot.png` file for a theme preview in the UI.

we recommend that a used of the gulp file from the classic or angular theme is used.
https://github.com/liveblog/lb-theme-classic/blob/master/gulpfile.js

tasks are as follow
main task:

* `gulp build`
    * add gulp task to `translations` and `templates` 
    * minifies `devStyles` and `devScripts` only the local ones, the external ones are left as they are.
    * concatenates them in `styles.min.css` and `scripts.min.js` under `dist` folder.
    * adds the new generation files with the external ones in `scripts` and `styles` in the `theme.json`
    * revision version increase 

* `gulp pot` to extract the pot theme file under po folder po/<theme>.pot
    this is the definition of gettext messages if changes are made to this file, we recommend 
         to update manual also the po files
    ex: https://github.com/liveblog/lb-theme-classic/blob/master/po/classic.pot

* `gulp translations` to extract the po file in a angular module under `dist` folder.
    ex: https://github.com/liveblog/lb-theme-classic/blob/master/dist/translations.js

* `gulp templates` cache the html files under `views` folder in one file under `dist` folder
    ex: https://github.com/liveblog/lb-theme-classic/blob/master/dist/templates.js

* `gulp zip` zips all the needed files ( except `node_modules`,`.git` and file system ones)
    out side of the theme folder under the name `lb-theme-<theme>-<version>.zip`
    --zipdest option can be added with the path of the zip destination
    this task is used for a better interaction with the UI which accepts zip files.

* `gulp make`
    * add gulp task `build` and then `zip`.