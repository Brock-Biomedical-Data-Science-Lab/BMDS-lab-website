#!/bin/bash
DATE=$(date +"%B %d, %Y")
echo "// Auto-generated on $DATE" > js/build-date.js
echo "window.siteUpdateDate = '$DATE';" >> js/build-date.js