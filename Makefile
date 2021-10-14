ifeq ($(OS),Windows_NT)
	PATH := .\node_modules\.bin;$(PATH)
else
	PATH := ./node_modules/.bin:$(PATH)
endif

run: bin/main.js
	node $<

debug: bin/main.js
	node --inspect-brk $<

bin/main.js: node_modules $(wildcard src/*.ts)
	tsc

node_modules/:
	npm i
