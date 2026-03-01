#!/bin/bash

# Function to generate SVG base64
gen_svg() {
  local church_name=$1
  local type=$2
  local grad1=$3
  local grad2=$4
  local type_label=$(echo $type | tr '[:lower:]' '[:upper:]')
  
  local svg="<svg width=\"400\" height=\"300\" xmlns=\"http://www.w3.org/2000/svg\"><defs><linearGradient id=\"g\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\"><stop offset=\"0%\" style=\"stop-color:${grad1};stop-opacity:1\" /><stop offset=\"100%\" style=\"stop-color:${grad2};stop-opacity:1\" /></linearGradient></defs><rect width=\"400\" height=\"300\" fill=\"url(#g)\"/><text x=\"200\" y=\"140\" font-size=\"18\" fill=\"#999\" text-anchor=\"middle\" dy=\".3em\">${church_name}</text><text x=\"200\" y=\"165\" font-size=\"14\" fill=\"#666\" text-anchor=\"middle\">${type_label} View</text><text x=\"200\" y=\"200\" font-size=\"12\" fill=\"#555\" text-anchor=\"middle\">Wikimedia Commons</text></svg>"
  
  echo "$svg" | base64 -w0
}

# St. Catherine's - already done via replace_all

# St. John's
echo "Updating St. John's..."
ext_svg=$(gen_svg "St. John's Church" "exterior" "#333366" "#666699")
int_svg=$(gen_svg "St. John's Church" "interior" "#444466" "#333355")
sed -i "/id:'stjohn'/,/sources:\[/{s|url:'https://upload.wikimedia.org/[^']*'|url:'data:image/svg+xml;base64,'${ext_svg}'|;t;}" src/data/churches.js

echo "Done - Manual updates required"
