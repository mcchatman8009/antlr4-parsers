#!/usr/bin/env bash
 set -e
rm -rf node_modules
npm install
npm run clean
npm run lint
npm run build-grammars
npm run test
./dist.sh
npm publish ./dist/
