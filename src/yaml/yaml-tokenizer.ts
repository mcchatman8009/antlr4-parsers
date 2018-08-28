import {CommonToken, InputStream, Lexer, Token} from 'antlr4';
import * as _ from 'lodash';
import {
    BLOCK_END, COLON, COMMENT, ELEMENT, END_DOCUMENT, EOF, LIST_START, MAP_START, SCALAR,
    START_DOCUMENT
} from './token-constants';
import {TokenAnalyzer} from './token-analyzer';

export class YamlTokenizer {
    private lineContinuation: boolean;
    private currentChar: (string | number);
    private inputIndex: number;
    private tokens: Array<Token>;
    private indents: Array<number>;

    private analyzer: TokenAnalyzer;
    private currentMapKeyToken: Token;
    public tokensEmitted: number;
    public doneConsuming: boolean;
    public column: number;
    public line: number;

    constructor(private input: InputStream, private lexer: Lexer, private lineIndents = 2) {
        this.tokens = [];
        this.indents = [];
        this.tokensEmitted = 0;
        this.doneConsuming = false;

        this.lineContinuation = false;
        this.column = 0;
        this.line = 0;
        this.currentChar = '';
        this.inputIndex = -1;
        this.analyzer = new TokenAnalyzer(input);
        this.currentMapKeyToken = null;
    }

    load() {
        this.reset();
    }

    reset() {
        while (!this.doneConsuming) {
            this.loadTokens();
        }
    }

    enqueueToken(): Token {
        return this.tokens.shift();
    }

    hasTokens(): boolean {
        return this.tokens.length > 0;
    }


    loadTokens() {
        this.scanToNextToken();

        let blockEnd = this.addBlockEnd(this.column);

        while (blockEnd) {
            blockEnd = this.addBlockEnd(this.column);
        }

        if (this.analyzer.isEOF()) {
            this.addBlockEnd(this.column, true);

            this.tokens.push(this.createToken(EOF, this.input.index, this.input.index + 1, 'EOF'));
            this.consume();
            this.doneConsuming = true;
        } else if (this.analyzer.isStartDocument(1, this.column)) {
            this.nextDocumentStart();
        } else if (this.analyzer.isEndDocument(1, this.column)) {
            this.nextDocumentEnd();
        } else if (this.analyzer.isColon()) {
            this.nextColon();
        } else if (this.analyzer.isElement()) {
            this.nextElement();
        } else if (this.analyzer.isComment()) {
            this.nextComment();
        } else if (this.LA() === '\'') {
            this.nextQuotedScalar();
        } else if (this.LA() === '"') {
            this.nextDoubleQuotedScalar();
        } else {
            this.nextScalar();
        }
    }


    nextLine() {
        const sb = [];
        while (true) {
            const ch = this.LA();

            if (ch === '\n') {
                this.consume();
                break;
            } else {
                this.consume();
                sb.push(ch);
            }
        }

        return sb.join('');
    }

    validateBlock() {
        if (this.indents.length > 0) {
            const spaces = _.times(_.last(this.indents)).map(() => ' ').join('');

            if (spaces) {
                return;

            }
        }
        return;
    }

    scanToNextToken() {
        while (true) {
            const ch = this.LA(1);
            if (ch === ' ') {
                this.consume();
            } else if (ch === '\n') {
                this.consume();
            } else {
                break;
            }
        }
    }

    nextColon() {
        this.tokens.push(this.createToken(COLON, this.input.index, this.input.index + 1, 'COLON'));
        this.consume();
        let multiLineContinuation = false;
        let multiSingleLineContinuation = false;

        while (true) {
            const ch = this.LA();

            if (ch === ' ') {
                this.consume();
            } else if (ch === '^') {
                this.consume();
                multiSingleLineContinuation = true;
            } else if (ch === '|') {
                this.consume();
                multiLineContinuation = true;
            } else if (this.analyzer.isNL()) {
                // consume the newline
                this.consume();
                break;
            } else {
                break;
            }
        }


        if (this.analyzer.isNL()) {
            // consume the newline
            this.consume();
        }

        if (this.currentMapKeyToken && this.addIndention(this.currentMapKeyToken.column)) {
            const token = this.createToken(MAP_START, this.currentMapKeyToken.start, this.currentMapKeyToken.start, 'MAP_START');

            token.column = this.currentMapKeyToken.column;
            const index = this.tokens.indexOf(this.currentMapKeyToken);

            this.tokens.splice(index, 0, token);
        }

        if (multiLineContinuation || multiSingleLineContinuation) {
            const start = this.input.index;
            const data = [];

            if (this.indents.length > 0) {
                const spaces = _.last(this.indents) + this.lineIndents;
                let done = false;

                while (!done) {
                    for (let i = 0; i < spaces; i++) {
                        const ch = this.LA();

                        if (ch === ' ') {
                            this.consume();
                        } else {
                            // throw new SyntaxError(`missing space at column: ${this.column}, line: ${this.line}`);
                            done = true;
                            break;
                        }
                    }
                    if (!done) {
                        const line = this.nextLine();

                        if (line.length > 0) {
                            data.push(line);
                        }
                    }
                }
            }

            const joinStr = (multiLineContinuation) ? '\n' : ' ';

            const token = this.createToken(SCALAR, start, this.input.index - 1, data.join(joinStr));
            this.tokens.push(token);
        }
    }

    nextComment() {
        const start = this.input.index;

        while (this.LA(1) !== '\n') {
            this.consume();
        }

        const token = this.createToken(COMMENT, start, this.input.index - 1, 'COMMENT');
        this.tokens.push(token);
    }

    nextDocumentStart() {
        const index = this.input.index;
        const token = this.createToken(START_DOCUMENT, index, index + 2, 'START_DOCUMENT');
        this.consume(3);

        if (this.analyzer.isNL()) {
            // consume the newline
            this.consume();
        }

        this.tokens.push(token);
    }

    nextDocumentEnd() {
        const index = this.input.index;
        const token = this.createToken(END_DOCUMENT, index, index + 2, 'END_DOCUMENT');
        this.consume(3);

        if (this.analyzer.isNL()) {
            // consume the newline
            this.consume();
        }
        this.tokens.push(token);
    }

    nextElement() {
        if (this.addIndention(this.column)) {
            this.tokens.push(this.createToken(LIST_START, this.input.index, this.column, 'LIST_START'));
        }

        this.tokens.push(this.createToken(ELEMENT, this.input.index, this.input.index + 1, 'ELEMENT'));

        this.consume();
    }

    nextScalar() {
        const start = this.input.index;
        const column = this.column;

        let spacesLength = 0;
        let nonSpacesLength = 0;

        while (true) {
            nonSpacesLength = this.analyzer.countNonSpaces(spacesLength);

            if (nonSpacesLength === 0) {
                break;
            }

            this.consume(spacesLength + nonSpacesLength);
            spacesLength = this.analyzer.countSpaces();
        }

        const token = this.createToken(SCALAR, start, this.input.index - 1, 'SCALAR');
        token.column = column;

        if (this.analyzer.doesColonFollow()) {
            this.currentMapKeyToken = token;
        } else {
            this.currentMapKeyToken = undefined;
        }

        this.tokens.push(token);
    }

    nextDoubleQuotedScalar() {
        const start = this.input.index;
        const column = this.column;

        this.consume();
        let ch = this.LA();
        const sb = [];

        while (ch !== '"') {
            sb.push(ch);

            this.consume();
            ch = this.LA();
        }

        this.consume();

        const token = this.createToken(SCALAR, start, this.input.index - 1);
        token.column = column;
        // (token as any).text = sb.join('');


        if (this.analyzer.doesColonFollow()) {
            this.currentMapKeyToken = token;
        } else {
            this.currentMapKeyToken = undefined;
        }

        this.tokens.push(token);
    }

    nextQuotedScalar() {
        const start = this.input.index;
        const column = this.column;

        this.consume();
        const sb = [];

        let ch = this.LA();

        while (ch !== '\'') {
            sb.push(ch);

            this.consume();
            ch = this.LA();
        }

        this.consume();

        const token = this.createToken(SCALAR, start, this.input.index - 1);
        // (token as any).text = sb.join('');

        token.column = column;


        if (this.analyzer.doesColonFollow()) {
            this.currentMapKeyToken = token;
        } else {
            this.currentMapKeyToken = undefined;
        }

        this.tokens.push(token);
    }

    addIndention(column: number): boolean {
        if (this.indents.length > 0) {
            const lastIndent = _.last(this.indents);

            if (column > lastIndent) {
                this.indents.push(column);
                return true;
            }
        } else {
            this.indents.push(column);
            return true;
        }
        return false;
    }


    addBlockEnd(column: number, hitEOF = false): boolean {
        if (this.indents.length > 0) {
            const lastIndent = _.last(this.indents);

            if (hitEOF) {
                _.times(this.indents.length)
                    .forEach(() => {
                        const index = this.input.index;

                        const token = this.createToken(BLOCK_END, index, index, 'BLOCK_END');
                        this.tokens.push(token);

                        this.indents.pop();
                    });
            } else if (column < lastIndent) {
                const index = this.input.index;

                const token = this.createToken(BLOCK_END, index, index, 'BLOCK_END');
                this.tokens.push(token);

                this.indents.pop();

                return true;
            }
        }

        return false;
    }

    private consume(length = 1): void {
        _.times(length, () => {
            const ch = this.LA();
            if (ch === EOF) {
                return;
            }

            this.column++;

            if (this.LA(1) === '\n') {
                this.column = 0;
                this.line++;
            }

            this.input.consume();
        });
    }

    private LA(offset = 1): (string | number) {
        const code = Number(this.input.LA(offset));

        if (code === EOF) {
            return code;
        }

        return String.fromCharCode(Number(code));
    }

    private createToken(type: number, start: number, stop: number, text = ''): Token {
        const lexer: any = this.lexer;
        const token = new CommonToken(lexer._tokenFactorySourcePair, type, Lexer.DEFAULT_TOKEN_CHANNEL, start, stop);

        if (text.length > 0) {
            (token as any).text = text;
        } else {
            (token as any).text = this.input.getText(start, stop);
        }

        return token;
    }
}
