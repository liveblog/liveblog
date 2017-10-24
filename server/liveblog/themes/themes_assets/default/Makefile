THEME_ARCHIVE = "liveblog-default-theme.zip"

make:
	make clean
	gulp --NODE_ENV production
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
