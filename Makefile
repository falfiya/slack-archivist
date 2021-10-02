PATH := .\node_modules\.bin;$(PATH)

run: bin/main.js
	node $<

debug: bin/main.js
	node --inspect-brk $<

bin/main.js: $(wildcard src/*.ts)
	-tsc
