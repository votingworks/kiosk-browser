all: install build

install:
	./script/install-dependencies.sh

build:
	./script/build.sh
