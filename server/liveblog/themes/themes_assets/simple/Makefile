THEME_ARCHIVE = "liveblog-simple-theme.zip"

make:
	make clean
	gulp
	zip -r $(THEME_ARCHIVE) * \
		-x ".git/*" \
		-x "Makefile" \
		-x "less/*" \
		-x "js/*" \
		-x "node_modules/*" \
		-x "index.html" \
		-x "gulpfile.js" \
		-x "npm-shrinkwrap.json" \
		-x "embedcode.html"

clean:
	rm -f $(THEME_ARCHIVE)
