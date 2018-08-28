import {InputStream, Lexer, Token} from 'antlr4';
import {YamlTokenizer} from './yaml-tokenizer';


export class YAMLLexer extends Lexer {
    private tokenizer: YamlTokenizer;

    constructor(public input: InputStream, private lineIndents = 2) {
        super();
        Lexer.apply(this, arguments);

        this.tokenizer = new YamlTokenizer(input, this, lineIndents);

        const self = this as any;
        self._interp = this.tokenizer as any;

        // Lexer.prototype.reset.call(this);
        // this.reset();
        this.tokenizer.load();
    }

    nextToken(): Token {
        const token = this.tokenizer.enqueueToken();

        if (token) {
            return token;
        }

        return undefined;
    }
}
