const InputStream = require('antlr4').InputStream;
const CommonTokenStream = require('antlr4').CommonTokenStream;
const YAMLLexer = require('../../dist/yaml/YAMLLexer').YAMLLexer;
const YAMLParser = require('../../dist/yaml/YAMLParser').YAMLParser;
const yml = `
key: value
key2: value2
`;

const stream = new InputStream(yml);
const lexer = new YAMLLexer(stream);
const tokenStream = new CommonTokenStream(lexer);
const parser = new YAMLParser(tokenStream);
const root = parser.yaml();

console.log(root);
