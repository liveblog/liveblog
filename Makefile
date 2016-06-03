THEME_ARCHIVE = "liveblog-theme-dpa.zip"

make:	
	gulp && rm $(THEME_ARCHIVE)
	zip -r $(THEME_ARCHIVE) * \
		-x ".git/*" \
		-x "Makefile" \
		-x "less/*" \
		-x "js/*" \
		-x "node_modules/*" \
		-x "index.html" \
		-x "gulpfile.js" \
		-x "embedcode.html"