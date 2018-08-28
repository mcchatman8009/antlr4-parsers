#!/usr/bin/env bash
 set -e
npm run clean
npm install
npm run lint
npm run build-grammars
./dist.sh
npm publish ./dist/
