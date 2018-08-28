/*
    Grammar based on http://yaml.org/spec/1.2/spec.html

    Ported to Antlr4 by Marlon Chatman <mcchatman8009@gmail.com>
*/
grammar YAML;

tokens {
    COMMENT,
    SCALAR,
    ELEMENT,
    MAP_START,
    LIST_START,
    BLOCK_END,
    COLON,
    START_DOCUMENT,
    END_DOCUMENT
}

yaml: documents EOF;

documents: document+;

document: START_DOCUMENT?  comment* childElement comment* END_DOCUMENT?;

childElement: comment* (value | map | list) comment*;

map: MAP_START keyValuePair+ BLOCK_END;

keyValuePair: key COLON  comment* childElement?;

key: scalar;

list: LIST_START listElement+ BLOCK_END;

listElement: ELEMENT childElement;

value: scalar;

scalar: SCALAR;

comment: COMMENT;



