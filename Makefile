
SOURCEDIR = src
SOURCES = $(shell find $(SOURCEDIR) -name '*.js')

all: static/raytracer.js Makefile

clean: 
	rm static/raytracer.js

build: static/raytracer.js
	@make static/raytracer.js

static/raytracer.js:  $(SOURCES)
	rollup --globals jquery:jQuery -i src/index.js -o static/raytracer.js -f iife --name Raytracer

watch: build
	watchman-make -p 'src/**/*.js' -t build
