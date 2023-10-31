all: install build

install: FORCE
	./script/install-dependencies.sh

build: FORCE
	./script/build.sh

FORCE: