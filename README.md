# Antlr4 Parsers

## Overview
A collection of ready to go Antlr4 built parsers

## Getting Started
```bash
npm install -S antlr4-parsers
```


## YAML Parser Example
```javascript

const InputStream = require('antlr4').InputStream;
const CommonTokenStream = require('antlr4').CommonTokenStream;
const YAMLLexer = require('antlr4-parsers/yaml/YAMLLexer').YAMLLexer;
const YAMLParser = require('antlr4-parsers/yaml/YAMLParser').YAMLParser;

const yml = `
key: value
key2: value2
`;

const stream = new InputStream(yml);
const lexer = new YAMLLexer(stream);
const tokenStream = new CommonTokenStream(lexer);
const parser = new YAMLParser(tokenStream);

const root = parser.yaml();

console.log(root); // Output the root
```
