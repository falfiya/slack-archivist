npx := .\node_modules\.bin

run: bin
	node bin/main

bin: $(wildcard src/*.ts)
	-$(npx)\tsc
