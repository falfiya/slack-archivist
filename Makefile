PATH += ;.\node_modules\.bin

run: bin/main.js
	node $<

debug: bin/main.js
	node --inspect-brk $<

bin/main.js: $(wildcard src/*.ts)
	-tsc
