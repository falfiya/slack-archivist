PATH += ;.\node_modules\.bin

run: bin/main.js
	node $<

bin/main.js: $(wildcard src/*.ts)
	-tsc
