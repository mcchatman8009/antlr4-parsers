import {InputStream} from 'antlr4';
import {EOF} from './token-constants';

export class TokenAnalyzer {
    constructor(private input: InputStream) {
    }

    countSpaces(offset = 0): number {
        let count = 0;
        let lookAhead = offset + 1;

        while (this.LA(lookAhead) === ' ') {
            count++;
            lookAhead++;
        }

        return count;
    }

    countNonSpaces(offset: number): number {
        let count = 0;
        let lookAhead = offset + 1;

        while ((!this.isComment(lookAhead) && !this.isNL(lookAhead) && !this.isColon(lookAhead) && !this.isEOF(lookAhead))) {
            count++;
            lookAhead++;
        }

        return count;
    }

    isEOF(offset = 1): boolean {
        return this.LA(offset) === EOF;
    }

    isNL(offset = 1): boolean {
        return this.LA(offset) === '\n';
    }

    isEndDocument(offset = 1, column?: number): boolean {
        if (column === 0) {
            for (let i = 0; i < 3; i++) {
                const ch = this.LA(offset++);

                if (ch !== '.') {
                    return false;
                }
            }
            return true;
        }

        return false;
    }

    isStartDocument(offset = 1, column?: number): boolean {
        if (column === 0) {
            for (let i = 0; i < 3; i++) {
                const ch = this.LA(offset++);

                if (ch !== '-') {
                    return false;
                }
            }

            return true;
        }

        return false;
    }

    isElement(offset = 1): boolean {
        return this.LA(offset) === '-' &&
            (this.LA(offset + 1) === ' ');
    }

    isComment(offset = 1): boolean {
        return this.LA(offset) === '#';
    }

    isColon(offset = 1): boolean {
        return this.LA(offset) === ':' &&
            (this.LA(offset + 1) === '\n' || this.LA(offset + 1) === ' ');
    }

    doesColonFollowWithNewline(offset = 1) {
        let ch = ' ';

        let colonFlag = false;

        while (ch === ' ') {
            ch = this.LA(offset++) as string;

            if (ch === ':') {
                colonFlag = true;
            } else if (ch === '\n') {
                return colonFlag;
            }
        }

        return false;
    }

    doesColonFollow(offset = 1) {
        let ch = ' ';

        while (ch === ' ') {
            ch = this.LA(offset++) as string;

            if (ch === ':') {
                return true;

            }
        }

        return false;
    }


    private LA(offset = 1): (string | number) {
        const code = Number(this.input.LA(offset));

        if (code === EOF) {
            return code;
        }

        return String.fromCharCode(Number(code));
    }
}
