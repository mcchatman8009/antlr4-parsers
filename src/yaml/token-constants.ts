import {Token} from 'antlr4';

export const EOF = Token.EOF;
export const COMMENT = 1;
export const SCALAR = 2;
export const ELEMENT = 3;
export const MAP_START = 4;
export const LIST_START = 5;
export const BLOCK_END = 6;
export const COLON = 7;
export const START_DOCUMENT = 8;
export const END_DOCUMENT = 9;

