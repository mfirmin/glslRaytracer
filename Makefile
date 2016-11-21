
SOURCEDIR = src
SOURCES = $(shell find $(SOURCEDIR) -name '*.js')

.PHONY: all clean build run watch

all: build Makefile

clean: 
	rm static/raytracer.js

build: $(SOURCES)
	cd bin; node build.js
	mv build/raytracer.js static/raytracer.js

run: build
	bundle exec jekyll serve

watch: build
	watchman-make -p 'src/**/*.js' -t build
