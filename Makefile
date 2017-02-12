
SOURCEDIR = src
SOURCES = $(shell find $(SOURCEDIR) -name '*.js')

.PHONY: all clean test \
	build build-test \
	run watch 

all: build Makefile

clean: 
	rm build/*
	rm static/raytracer.js

test: build/test.js
	@mocha

build/test.js: $(SOURCES) bin/build-test.js
	cd bin; node build-test.js

build-test: build/test.js

build: $(SOURCES)
	cd bin; node build.js
	mv build/raytracer.js static/raytracer.js

run: build
	bundle exec jekyll serve
