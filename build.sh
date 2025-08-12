#!/bin/bash
rm -rf build/constants
mkdir build/constants
node build/scripts/generate-constants.js
cp build/constants/constants.d.ts src/ts/_constants.d.ts

if [ $1 ] && [ $1=="debug" ]
then
    rm -rf build/debug
	mkdir build/debug
	cp src/www/index.html build/debug/index.html
	node build/scripts/debug-app.mjs
else
    rm -rf build/release
	mkdir build/release
	node_modules/.bin/html-minifier-terser --collapse-whitespace --remove-comments --remove-attribute-quotes --output build/release/index.html src/www/index.html
	node build/scripts/version-bump.mjs
	node build/scripts/release-app.mjs | node_modules/.bin/uglifyjs --config-file build/scripts/minify.config.json -o build/release/main.js
	node_modules/.bin/roadroller build/release/main.js -O1 -o build/release/main.js
	rm -rf dist
	mkdir -p dist/src
	node_modules/.bin/html-inline -i build/release/index.html -o dist/src/index.html
	./tools/7z/7za a -tzip dist/game.zip dist/src/*
	./tools/ect -9 -zip dist/game.zip
	# clear
	./tools/cloc-1.86 src/ts
	node build/scripts/file-size.js
fi