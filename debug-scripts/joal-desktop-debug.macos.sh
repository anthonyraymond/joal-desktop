#!/bin/bash

# Find JoalDesktop absolute path
cd ~
joalRootPath="$(pwd)/Library/Application Support/JoalDesktop"
# Be nice and rewind our position to the place where the user launched the terminal
cd - 1> /dev/null

# Run joal
"$joalRootPath/jre/jdk/Contents/Home/jre/bin/java" -jar "$joalRootPath"/joal-core/jack-of-all-trades-*.jar \
	--joal-conf="$joalRootPath/joal-core" \
	--spring.main.web-environment=true \
	--server.port=5081 \
	--joal.ui.path.prefix="aaaaa" \
	--joal.ui.secret-token="aaaaa"

#destUrl='http://127.0.0.1:5081/aaaaa/ui/'
