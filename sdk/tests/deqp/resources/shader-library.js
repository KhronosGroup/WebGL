/*-------------------------------------------------------------------------
 * drawElements Quality Program OpenGL ES Utilities
 * ------------------------------------------------
 *
 * Copyright 2014 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

var shaderLibrary = (function() {
    'use strict';


    var generateTestCases = function() {
        var parser = new Parser();
        try {
            var state = deqpTests.runner.getState();
            var tree = parser.parse(state.testFile);
            state.testCases = deqpTests.newTest(state.testName, 'Top level', tree);
        }
        catch (err) {
            _logToConsole(err);
            return false;
        }
        return true;
    };

    var processTestFile = function() {
        if (generateTestCases()) {
            deqpTests.runner.runCallback(shaderLibraryCase.runTestCases);
        } else {
            deqpTests.runner.terminate();
        }
    };

    var isWhitespace = function(value) {
        return /^[ \t\r\n]+$/.test(value);
    };
    var isEOL = function(value) {
        return /^[\r\n]+$/.test(value);
    };
    var isAlpha = function(value) {
        return /^[a-zA-Z]$/.test(value);
    };
    var isNumeric = function(value) {
        return /^[0-9]$/.test(value);
    };
    var isCaseNameChar = function(value) {
        return /^[a-zA-Z0-9_\-\.]$/.test(value);
    };

    // removes however many indents there are on the first line from all lines.
    var removeExtraIndentation = function(str) {
        return removeExtraIndentationArray(
            str.split(/\r\n|\r|\n/)
        ).join('\n');
    };

    var removeExtraIndentationArray = function(arr) {
        var output = [];

        if (arr.length) {

            var numIndentChars = 0;
            for (var i = 0; i < arr[0].length && isWhitespace(arr[0].charAt(i)); ++i) {
                numIndentChars += arr[0].charAt(i) === '\t' ? 4 : 1;
            }

            for (var i = 0; i < arr.length; ++i) {
                var removed = 0;
                var j;
                for (j = 0; removed < numIndentChars && j < arr[i].length; ++j) {
                    removed += (arr[i].charAt(j) === '\t' ? 4 : 1);
                }

                output.push(arr[i].substr(j, arr[i].length - j));
            }

        }

        return output;
    };


    var de_assert = function(condition) {
        if (!condition) {
            throw Error();
        }
    };


    /**
     * @private
     */
    var parseStringLiteralHelper = function(str, endstr) {

        // isolate the string
        var index_end = 0;
        do {
            index_end = str.indexOf(endstr, index_end + 1);
        } while (index_end >= 0 && str.charAt(index_end - 1) === '\\');

        if (index_end <= 0) {
            index_end = str.length;
        }

        // strip quotes, replace \n and \t with nl and tabs respectively
        return str
            .substr(endstr.length, index_end - endstr.length)
            .replace('\\n', '\n')
            .replace('\\t', '\t')
            .replace(/\\/g, '');

    };

    /**
     * Parser class
     * @constructor
     */
    var Parser = function() {




    /* data members */

        /**
         * The Token constants
         * @enum {number}
         */
        var Token = {
            TOKEN_INVALID: 0,
            TOKEN_EOF: 1,
            TOKEN_STRING: 2,
            TOKEN_SHADER_SOURCE: 3,

            TOKEN_INT_LITERAL: 4,
            TOKEN_FLOAT_LITERAL: 5,

            // identifiers
            TOKEN_IDENTIFIER: 6,
            TOKEN_TRUE: 7,
            TOKEN_FALSE: 8,
            TOKEN_DESC: 9,
            TOKEN_EXPECT: 10,
            TOKEN_GROUP: 11,
            TOKEN_CASE: 12,
            TOKEN_END: 13,
            TOKEN_VALUES: 14,
            TOKEN_BOTH: 15,
            TOKEN_VERTEX: 26,
            TOKEN_FRAGMENT: 17,
            TOKEN_UNIFORM: 18,
            TOKEN_INPUT: 19,
            TOKEN_OUTPUT: 20,
            TOKEN_FLOAT: 21,
            TOKEN_FLOAT_VEC2: 22,
            TOKEN_FLOAT_VEC3: 23,
            TOKEN_FLOAT_VEC4: 24,
            TOKEN_FLOAT_MAT2: 25,
            TOKEN_FLOAT_MAT2X3: 26,
            TOKEN_FLOAT_MAT2X4: 27,
            TOKEN_FLOAT_MAT3X2: 28,
            TOKEN_FLOAT_MAT3: 29,
            TOKEN_FLOAT_MAT3X4: 30,
            TOKEN_FLOAT_MAT4X2: 31,
            TOKEN_FLOAT_MAT4X3: 32,
            TOKEN_FLOAT_MAT4: 33,
            TOKEN_INT: 34,
            TOKEN_INT_VEC2: 35,
            TOKEN_INT_VEC3: 36,
            TOKEN_INT_VEC4: 37,
            TOKEN_UINT: 38,
            TOKEN_UINT_VEC2: 39,
            TOKEN_UINT_VEC3: 40,
            TOKEN_UINT_VEC4: 41,
            TOKEN_BOOL: 42,
            TOKEN_BOOL_VEC2: 43,
            TOKEN_BOOL_VEC3: 44,
            TOKEN_BOOL_VEC4: 45,
            TOKEN_VERSION: 46,

            // symbols
            TOKEN_ASSIGN: 47,
            TOKEN_PLUS: 48,
            TOKEN_MINUS: 49,
            TOKEN_COMMA: 50,
            TOKEN_VERTICAL_BAR: 51,
            TOKEN_SEMI_COLON: 52,
            TOKEN_LEFT_PAREN: 53,
            TOKEN_RIGHT_PAREN: 54,
            TOKEN_LEFT_BRACKET: 55,
            TOKEN_RIGHT_BRACKET: 56,
            TOKEN_LEFT_BRACE: 57,
            TOKEN_RIGHT_BRACE: 58,

            TOKEN_LAST: 59
        };

        var m_input = '';
        var m_curPtr = 0;
        var m_curToken;// = Token.TOKEN_INVALID;
        var m_curTokenStr = '';


        /* function members */
        this.parse = function(input) {

            // initialise parser
            m_input = input;
            m_curPtr = 0;
            m_curToken = Token.TOKEN_INVALID;
            m_curTokenStr = '';
            advanceToken();

            var nodeList = [];

            for (;;) {

                if (m_curToken === Token.TOKEN_CASE) {
                    parseShaderCase(nodeList);
                } else if (m_curToken === Token.TOKEN_GROUP) {
                    parseShaderGroup(nodeList);
                } else if (m_curToken === Token.TOKEN_EOF) {
                    break;
                } else {
                //    throw Error("invalid token encountered at main level: '" + m_curTokenStr + "'");
                    testFailed("invalid token encountered at main level: '" + m_curTokenStr + "'");
                    deqpTests.runner.terminate();
                }

            }

            return nodeList;

        };

        var resolveTokenName = function(id) {
            for (var name in Token) {
                if (Token[name] === id) return name;
            }
            return 'TOKEN_UNKNOWN';
        };

        var parseError = function(errorStr) {
            // abort
            throw 'Parser error: ' + errorStr + ' near ' + m_curPtr.substr(0, 80);
        };
        var parseFloatLiteral = function(str) {
            return parseFloat(str);
        };
        var parseIntLiteral = function(str) {
            return parseInt(str);
        };
        var parseStringLiteral = function(str) {
            // find delimitor
            var endchar = str.substr(0, 1);
            return parseStringLiteralHelper(str, endchar);
        };
        var parseShaderSource = function(str) {
            // similar to parse literal, delimitors are two double quotes ("")
            return removeExtraIndentation(
                parseStringLiteralHelper(str, '""')
            );
        };


        var advanceTokenWorker = function() {

            // Skip old token
            m_curPtr += m_curTokenStr.length;

            // Reset token (for safety).
            m_curToken = Token.TOKEN_INVALID;
            m_curTokenStr = '';

            // Eat whitespace & comments while they last.
            for (;;) {

                while (isWhitespace(m_input.charAt(m_curPtr))) ++m_curPtr;

                // check for EOL comment
                if (m_input.charAt(m_curPtr) === '#') {
                    // if m_input is to be an array of lines then this probably wont work very well
                    while (
                        m_curPtr < m_input.length &&
                        !isEOL(m_input.charAt(m_curPtr))
                    ) ++m_curPtr;
                } else {
                    break;
                }

            }

            if (m_curPtr >= m_input.length) {

                m_curToken = Token.TOKEN_EOF;
                m_curTokenStr = '<EOF>';

            } else if (isAlpha(m_input.charAt(m_curPtr))) {

                var end = m_curPtr + 1;
                while (isCaseNameChar(m_input.charAt(end))) ++end;

                m_curTokenStr = m_input.substr(m_curPtr, end - m_curPtr);

                m_curToken = (function() {
                    // consider reimplementing with a binary search
                    switch (m_curTokenStr) {
                        case 'true': return Token.TOKEN_TRUE;
                        case 'false': return Token.TOKEN_FALSE;
                        case 'desc': return Token.TOKEN_DESC;
                        case 'expect': return Token.TOKEN_EXPECT;
                        case 'group': return Token.TOKEN_GROUP;
                        case 'case': return Token.TOKEN_CASE;
                        case 'end': return Token.TOKEN_END;
                        case 'values': return Token.TOKEN_VALUES;
                        case 'both': return Token.TOKEN_BOTH;
                        case 'vertex': return Token.TOKEN_VERTEX;
                        case 'fragment': return Token.TOKEN_FRAGMENT;
                        case 'uniform': return Token.TOKEN_UNIFORM;
                        case 'input': return Token.TOKEN_INPUT;
                        case 'output': return Token.TOKEN_OUTPUT;
                        case 'float': return Token.TOKEN_FLOAT;
                        case 'vec2': return Token.TOKEN_FLOAT_VEC2;
                        case 'vec3': return Token.TOKEN_FLOAT_VEC3;
                        case 'vec4': return Token.TOKEN_FLOAT_VEC4;
                        case 'mat2': return Token.TOKEN_FLOAT_MAT2;
                        case 'mat2x3': return Token.TOKEN_FLOAT_MAT2X3;
                        case 'mat2x4': return Token.TOKEN_FLOAT_MAT2X4;
                        case 'mat3x2': return Token.TOKEN_FLOAT_MAT3X2;
                        case 'mat3': return Token.TOKEN_FLOAT_MAT3;
                        case 'mat3x4': return Token.TOKEN_FLOAT_MAT3X4;
                        case 'mat4x2': return Token.TOKEN_FLOAT_MAT4X2;
                        case 'mat4x3': return Token.TOKEN_FLOAT_MAT4X3;
                        case 'mat4': return Token.TOKEN_FLOAT_MAT4;
                        case 'int': return Token.TOKEN_INT;
                        case 'ivec2': return Token.TOKEN_INT_VEC2;
                        case 'ivec3': return Token.TOKEN_INT_VEC3;
                        case 'ivec4': return Token.TOKEN_INT_VEC4;
                        case 'uint': return Token.TOKEN_UINT;
                        case 'uvec2': return Token.TOKEN_UINT_VEC2;
                        case 'uvec3': return Token.TOKEN_UINT_VEC3;
                        case 'uvec4': return Token.TOKEN_UINT_VEC4;
                        case 'bool': return Token.TOKEN_BOOL;
                        case 'bvec2': return Token.TOKEN_BOOL_VEC2;
                        case 'bvec3': return Token.TOKEN_BOOL_VEC3;
                        case 'bvec4': return Token.TOKEN_BOOL_VEC4;
                        case 'version': return Token.TOKEN_VERSION;
                        default: return Token.TOKEN_IDENTIFIER;
                    }
                }());

            } else if (isNumeric(m_input.charAt(m_curPtr))) {

                var p = m_curPtr;
                while (isNumeric(m_input.charAt(p))) ++p;

                if (m_input.charAt(p) === '.') { // float

                    ++p;
                    while (isNumeric(m_input.charAt(p))) ++p;

                    if (m_input.charAt(p) === 'e' || m_input.charAt(p) === 'E') {

                        ++p;
                        if (m_input.charAt(p) === '+' || m_input.charAt(p) === '-') ++p;

                        de_assert(p < m_input.length && isNumeric(m_input.charAt(p)));
                        while (isNumeric(m_input.charAt(p))) ++p;

                    }

                    m_curToken = Token.TOKEN_FLOAT_LITERAL;
                    m_curTokenStr = m_input.substr(m_curPtr, p - m_curPtr);

                } else {

                    m_curToken = Token.TOKEN_INT_LITERAL;
                    m_curTokenStr = m_input.substr(m_curPtr, p - m_curPtr);

                }

            } else if (m_input.charAt(m_curPtr) === '"' && m_input.charAt(m_curPtr + 1) === '"') { // shader source

                var p = m_curPtr + 2;

                while (m_input.charAt(p) != '"' || m_input.charAt(p + 1) != '"') {
                    de_assert(p < m_input.length);
                    if (m_input.charAt(p) === '\\') {
                        de_assert(p + 1 < m_input.length);
                        p += 2;
                    } else {
                        ++p;
                    }
                }
                p += 2;

                m_curToken = Token.TOKEN_SHADER_SOURCE;
                m_curTokenStr = m_input.substr(m_curPtr, p - m_curPtr);

            } else if (m_input.charAt(m_curPtr) === '"' || m_input.charAt(m_curPtr) === "'") {

                var delimitor = m_input.charAt(m_curPtr);
                var p = m_curPtr + 1;

                while (m_input.charAt(p) != delimitor) {

                    de_assert(p < m_input.length);
                    if (m_input.charAt(p) === '\\') {
                        de_assert(p + 1 < m_input.length);
                        p += 2;
                    } else {
                        ++p;
                    }

                }
                ++p;

                m_curToken = Token.TOKEN_STRING;
                m_curTokenStr = m_input.substr(m_curPtr, p - m_curPtr);

            } else {

                m_curTokenStr = m_input.charAt(m_curPtr);
                m_curToken = (function() {
                    // consider reimplementing with a binary search
                    switch (m_curTokenStr) {
                        case '=': return Token.TOKEN_ASSIGN;
                        case '+': return Token.TOKEN_PLUS;
                        case '-': return Token.TOKEN_MINUS;
                        case ',': return Token.TOKEN_COMMA;
                        case '|': return Token.TOKEN_VERTICAL_BAR;
                        case ';': return Token.TOKEN_SEMI_COLON;
                        case '(': return Token.TOKEN_LEFT_PAREN;
                        case ')': return Token.TOKEN_RIGHT_PAREN;
                        case '[': return Token.TOKEN_LEFT_BRACKET;
                        case ']': return Token.TOKEN_RIGHT_BRACKET;
                        case '{': return Token.TOKEN_LEFT_BRACE;
                        case '}': return Token.TOKEN_RIGHT_BRACE;

                        default: return Token.TOKEN_INVALID;
                    }
                }());

            }

        };

        var advanceTokenTester = function(input, current_index) {
            m_input = input;
            m_curPtr = current_index;
            m_curTokenStr = '';
            advanceTokenWorker();
            return {
                idType: m_curToken,
                name: resolveTokenName(m_curToken),
                value: m_curTokenStr
            };
        };

        var advanceToken = function(tokenAssumed) {
            if (typeof(tokenAssumed) !== 'undefined') {
                assumeToken(tokenAssumed);
            }
            advanceTokenWorker();
        };
        var assumeToken = function(token) {

            if (m_curToken != token) {
                // parse error
                var msg = "unexpected token '" + m_curTokenStr + "', expecting '" + getTokenName(token) + "'";
                throw Error('Parse Error. ' + msg + ' near ' + m_curPtr + ' ...');
            }
        };
        var mapDataTypeToken = function(token) {
            switch (token) {
                case Token.TOKEN_FLOAT: return deqpUtils.DataType.FLOAT;
                case Token.TOKEN_FLOAT_VEC2: return deqpUtils.DataType.FLOAT_VEC2;
                case Token.TOKEN_FLOAT_VEC3: return deqpUtils.DataType.FLOAT_VEC3;
                case Token.TOKEN_FLOAT_VEC4: return deqpUtils.DataType.FLOAT_VEC4;
                case Token.TOKEN_FLOAT_MAT2: return deqpUtils.DataType.FLOAT_MAT2;
                case Token.TOKEN_FLOAT_MAT2X3: return deqpUtils.DataType.FLOAT_MAT2X3;
                case Token.TOKEN_FLOAT_MAT2X4: return deqpUtils.DataType.FLOAT_MAT2X4;
                case Token.TOKEN_FLOAT_MAT3X2: return deqpUtils.DataType.FLOAT_MAT3X2;
                case Token.TOKEN_FLOAT_MAT3: return deqpUtils.DataType.FLOAT_MAT3;
                case Token.TOKEN_FLOAT_MAT3X4: return deqpUtils.DataType.FLOAT_MAT3X4;
                case Token.TOKEN_FLOAT_MAT4X2: return deqpUtils.DataType.FLOAT_MAT4X2;
                case Token.TOKEN_FLOAT_MAT4X3: return deqpUtils.DataType.FLOAT_MAT4X3;
                case Token.TOKEN_FLOAT_MAT4: return deqpUtils.DataType.FLOAT_MAT4;
                case Token.TOKEN_INT: return deqpUtils.DataType.INT;
                case Token.TOKEN_INT_VEC2: return deqpUtils.DataType.INT_VEC2;
                case Token.TOKEN_INT_VEC3: return deqpUtils.DataType.INT_VEC3;
                case Token.TOKEN_INT_VEC4: return deqpUtils.DataType.INT_VEC4;
                case Token.TOKEN_UINT: return deqpUtils.DataType.UINT;
                case Token.TOKEN_UINT_VEC2: return deqpUtils.DataType.UINT_VEC2;
                case Token.TOKEN_UINT_VEC3: return deqpUtils.DataType.UINT_VEC3;
                case Token.TOKEN_UINT_VEC4: return deqpUtils.DataType.UINT_VEC4;
                case Token.TOKEN_BOOL: return deqpUtils.DataType.BOOL;
                case Token.TOKEN_BOOL_VEC2: return deqpUtils.DataType.BOOL_VEC2;
                case Token.TOKEN_BOOL_VEC3: return deqpUtils.DataType.BOOL_VEC3;
                case Token.TOKEN_BOOL_VEC4: return deqpUtils.DataType.BOOL_VEC4;
                default: return deqpUtils.DataType.INVALID;
            }
        };
        var getTokenName = function(token) {
            switch (token) {
                case Token.TOKEN_INVALID: return '<invalid>';
                case Token.TOKEN_EOF: return '<eof>';
                case Token.TOKEN_STRING: return '<string>';
                case Token.TOKEN_SHADER_SOURCE: return 'source';

                case Token.TOKEN_INT_LITERAL: return '<int>';
                case Token.TOKEN_FLOAT_LITERAL: return '<float>';

                // identifiers
                case Token.TOKEN_IDENTIFIER: return '<identifier>';
                case Token.TOKEN_TRUE: return 'true';
                case Token.TOKEN_FALSE: return 'false';
                case Token.TOKEN_DESC: return 'desc';
                case Token.TOKEN_EXPECT: return 'expect';
                case Token.TOKEN_GROUP: return 'group';
                case Token.TOKEN_CASE: return 'case';
                case Token.TOKEN_END: return 'end';
                case Token.TOKEN_VALUES: return 'values';
                case Token.TOKEN_BOTH: return 'both';
                case Token.TOKEN_VERTEX: return 'vertex';
                case Token.TOKEN_FRAGMENT: return 'fragment';
                case Token.TOKEN_UNIFORM: return 'uniform';
                case Token.TOKEN_INPUT: return 'input';
                case Token.TOKEN_OUTPUT: return 'output';
                case Token.TOKEN_FLOAT: return 'float';
                case Token.TOKEN_FLOAT_VEC2: return 'vec2';
                case Token.TOKEN_FLOAT_VEC3: return 'vec3';
                case Token.TOKEN_FLOAT_VEC4: return 'vec4';
                case Token.TOKEN_FLOAT_MAT2: return 'mat2';
                case Token.TOKEN_FLOAT_MAT2X3: return 'mat2x3';
                case Token.TOKEN_FLOAT_MAT2X4: return 'mat2x4';
                case Token.TOKEN_FLOAT_MAT3X2: return 'mat3x2';
                case Token.TOKEN_FLOAT_MAT3: return 'mat3';
                case Token.TOKEN_FLOAT_MAT3X4: return 'mat3x4';
                case Token.TOKEN_FLOAT_MAT4X2: return 'mat4x2';
                case Token.TOKEN_FLOAT_MAT4X3: return 'mat4x3';
                case Token.TOKEN_FLOAT_MAT4: return 'mat4';
                case Token.TOKEN_INT: return 'int';
                case Token.TOKEN_INT_VEC2: return 'ivec2';
                case Token.TOKEN_INT_VEC3: return 'ivec3';
                case Token.TOKEN_INT_VEC4: return 'ivec4';
                case Token.TOKEN_UINT: return 'uint';
                case Token.TOKEN_UINT_VEC2: return 'uvec2';
                case Token.TOKEN_UINT_VEC3: return 'uvec3';
                case Token.TOKEN_UINT_VEC4: return 'uvec4';
                case Token.TOKEN_BOOL: return 'bool';
                case Token.TOKEN_BOOL_VEC2: return 'bvec2';
                case Token.TOKEN_BOOL_VEC3: return 'bvec3';
                case Token.TOKEN_BOOL_VEC4: return 'bvec4';

                case Token.TOKEN_ASSIGN: return '=';
                case Token.TOKEN_PLUS: return '+';
                case Token.TOKEN_MINUS: return '-';
                case Token.TOKEN_COMMA: return ',';
                case Token.TOKEN_VERTICAL_BAR: return '|';
                case Token.TOKEN_SEMI_COLON: return ';';
                case Token.TOKEN_LEFT_PAREN: return '(';
                case Token.TOKEN_RIGHT_PAREN: return ')';
                case Token.TOKEN_LEFT_BRACKET: return '[';
                case Token.TOKEN_RIGHT_BRACKET: return ']';
                case Token.TOKEN_LEFT_BRACE: return '{';
                case Token.TOKEN_RIGHT_BRACE: return '}';

                default: return '<unknown>';
            }
        };

        var parseValueElement = function(expectedDataType, result) {

            var scalarType = deqpUtils.getDataTypeScalarType(expectedDataType);
            var scalarSize = deqpUtils.getDataTypeScalarSize(expectedDataType);

            var elems = [];

            if (scalarSize > 1) {
                de_assert(mapDataTypeToken(m_curToken) === expectedDataType);
                advanceToken(); // data type(float, vec2, etc.)
                advanceToken(Token.TOKEN_LEFT_PAREN);
            }

            for (var i = 0; i < scalarSize; ++i) {
                if (scalarType === 'float') {

                    var signMult = 1.0;
                    if (m_curToken === Token.TOKEN_MINUS) {
                        signMult = -1.0;
                        advanceToken();
                    }

                    assumeToken(Token.TOKEN_FLOAT_LITERAL);
                    elems.push(signMult * parseFloatLiteral(m_curTokenStr));
                    advanceToken(Token.TOKEN_FLOAT_LITERAL);

                } else if (scalarType === 'int' || scalarType === 'uint') {

                    var signMult = 1;
                    if (m_curToken === Token.TOKEN_MINUS) {
                        signMult = -1;
                        advanceToken();
                    }

                    assumeToken(Token.TOKEN_INT_LITERAL);
                    elems.push(signMult * parseIntLiteral(m_curTokenStr));
                    advanceToken(Token.TOKEN_INT_LITERAL);

                } else {

                    de_assert(scalarType === 'bool');
                    elems.push(m_curToken === Token.TOKEN_TRUE);
                    if (m_curToken != Token.TOKEN_TRUE && m_curToken != Token.TOKEN_FALSE) {
                        throw Error('unexpected token, expecting bool: ' + m_curTokenStr);
                    }
                    advanceToken(); // true/false

                }

                if (i != (scalarSize - 1)) {
                    advanceToken(Token.TOKEN_COMMA);
                }
            }

            if (scalarSize > 1) {
                advanceToken(Token.TOKEN_RIGHT_PAREN);
            }

            for (var i = 0; i < elems.length; i++)
                result.elements.push(elems[i]);

        };

        var parseValue = function(valueBlock) {

            var result = {
                dataType: null,
                storageType: null,
                valueName: null,
                elements: []
            };

            // parse storage
            switch (m_curToken) {
             case Token.TOKEN_UNIFORM:
                result.storageType = shaderLibraryCase.shaderCase.value.STORAGE_UNIFORM;
                break;
             case Token.TOKEN_INPUT:
                result.storageType = shaderLibraryCase.shaderCase.value.STORAGE_INPUT;
                break;
             case Token.TOKEN_OUTPUT:
                result.storageType = shaderLibraryCase.shaderCase.value.STORAGE_OUTPUT;
                break;
             default:
                throw Error('unexpected token encountered when parsing value classifier');
                break;
            }
            advanceToken();

            // parse data type
            result.dataType = mapDataTypeToken(m_curToken);
            if (result.dataType === deqpUtils.DataType.INVALID) {
                throw Error('unexpected token when parsing value data type: ' + m_curTokenStr);
            }
            advanceToken();

            // parse value name
            if (m_curToken === Token.TOKEN_IDENTIFIER) {
                result.valueName = m_curTokenStr;
            } else if (m_curToken === Token.TOKEN_STRING) {
                result.valueName = parseStringLiteral(m_curTokenStr);
            } else {
                throw Error('unexpected token when parsing value name: ' + m_curTokenStr);
            }
            advanceToken();

            // parse assignment operator.
            advanceToken(Token.TOKEN_ASSIGN);

            // parse actual value
            if (m_curToken === Token.TOKEN_LEFT_BRACKET) { // value list
                advanceToken(Token.TOKEN_LEFT_BRACKET);
                result.arrayLength = 0;

                for (;;) {
                    parseValueElement(result.dataType, result);
                    result.arrayLength += 1;

                    if (m_curToken === Token.TOKEN_RIGHT_BRACKET) {
                        break;
                    } else if (m_curToken === Token.TOKEN_VERTICAL_BAR) { // pipe?
                        advanceToken();
                        continue;
                    } else {
                        throw Error('unexpected token in value element array: ' + m_curTokenStr);
                    }
                }

                advanceToken(Token.TOKEN_RIGHT_BRACKET);

            } else { // arrays, single elements
                parseValueElement(result.dataType, result);
                result.arrayLength = 1;
            }

            advanceToken(Token.TOKEN_SEMI_COLON);

            valueBlock.values.push(result);

        };

        var parseValueBlock = function(valueBlock) {

            advanceToken(Token.TOKEN_VALUES);
            advanceToken(Token.TOKEN_LEFT_BRACE);

            for (;;) {
                if (
                    m_curToken === Token.TOKEN_UNIFORM ||
                    m_curToken === Token.TOKEN_INPUT ||
                    m_curToken === Token.TOKEN_OUTPUT
                ) {
                    parseValue(valueBlock);
                } else if (m_curToken === Token.TOKEN_RIGHT_BRACE) {
                    break;
                } else {
                    throw Error('unexpected( token when parsing a value block: ' + m_curTokenStr);
                }
            }

            advanceToken(Token.TOKEN_RIGHT_BRACE);

            // compute combined array length of value block.
            var arrayLength = 1;
            for (var i = 0; i < valueBlock.values.length; ++i) {
                if (valueBlock.values[i].arrayLength > 1) {
                    de_assert(arrayLength === 1 || arrayLength === valueBlock.values[i].arrayLength);
                    arrayLength = valueBlock.values[i].arrayLength;
                }
            }

            valueBlock.arrayLength = arrayLength;

        };

        var parseShaderCase = function(shaderNodeList) {

            // parse case
            advanceToken(Token.TOKEN_CASE);

            // parse case name
            var caseName = m_curTokenStr;
            advanceToken(); // \note [pyry] All token types are allowed here.

            // setup case
            var valueBlockList = [];

            /** TODO: Should the default version be defined elsewhere? */
            var version = '100';
            var expectResult = shaderLibraryCase.expectResult.EXPECT_PASS;
            var description;
            var bothSource = '';
            var vertexSource = '';
            var fragmentSource = '';

            for (;;) {

                if (m_curToken === Token.TOKEN_END) {

                    break;

                } else if (m_curToken === Token.TOKEN_DESC) {

                    advanceToken();
                    assumeToken(Token.TOKEN_STRING);

                    description = parseStringLiteral(m_curTokenStr);
                    advanceToken();

                } else if (m_curToken === Token.TOKEN_EXPECT) {

                    advanceToken();
                    assumeToken(Token.TOKEN_IDENTIFIER);

                    expectResult = (function(token) {
                        switch (token) {
                            case 'pass': return shaderLibraryCase.expectResult.EXPECT_PASS;
                            case 'compile_fail': return shaderLibraryCase.expectResult.EXPECT_COMPILE_FAIL;
                            case 'link_fail': return shaderLibraryCase.expectResult.EXPECT_LINK_FAIL;
                            case 'compile_or_link_fail': return shaderLibraryCase.expectResult.EXPECT_COMPILE_OR_LINK_FAIL;
                            default:
                                throw Error('invalid expected result value: ' + m_curTokenStr);
                        }
                    }(m_curTokenStr));

                    advanceToken();

                } else if (m_curToken === Token.TOKEN_VALUES) {

                    var block = shaderLibraryCase.genValueBlock();
                    parseValueBlock(block);
                    valueBlockList.push(block);

                } else if (
                    m_curToken === Token.TOKEN_BOTH ||
                    m_curToken === Token.TOKEN_VERTEX ||
                    m_curToken === Token.TOKEN_FRAGMENT
                ) {

                    var token = m_curToken;
                    advanceToken();
                    assumeToken(Token.TOKEN_SHADER_SOURCE);
                    var source = parseShaderSource(m_curTokenStr);

                //    console.log("old: " + m_curTokenStr);
                //    console.log("new: " + source);

                    advanceToken();
                    switch (token) {
                        case Token.TOKEN_BOTH: bothSource = source; break;
                        case Token.TOKEN_VERTEX: vertexSource = source; break;
                        case Token.TOKEN_FRAGMENT: fragmentSource = source; break;
                        default: de_assert(false); break;
                    }

                } else if (m_curToken === Token.TOKEN_VERSION) {

                    advanceToken();

                    var versionNum = 0;
                    var postfix = '';

                    assumeToken(Token.TOKEN_INT_LITERAL);
                    versionNum = parseIntLiteral(m_curTokenStr);
                    advanceToken();

                    if (m_curToken === Token.TOKEN_IDENTIFIER) {
                        postfix = m_curTokenStr;
                        advanceToken();
                    }

                    // TODO: need to fix these constants, we dont have glu
                    if (versionNum === 100 && postfix === 'es') version = '100';
                    else if (versionNum === 300 && postfix === 'es') version = '300 es';
                    else if (versionNum === 310 && postfix === 'es') version = '310 es';
                    else if (versionNum === 130) version = '130';
                    else if (versionNum === 140) version = '140';
                    else if (versionNum === 150) version = '150';
                    else if (versionNum === 330) version = '330';
                    else if (versionNum === 400) version = '400';
                    else if (versionNum === 410) version = '410';
                    else if (versionNum === 420) version = '420';
                    else if (versionNum === 430) version = '430';
                    else if (versionNum === 440) version = '440';
                    else if (versionNum === 450) version = '450';
                    else {
                        throw Error('Unknown GLSL version');
                    }

                } else {
                    throw Error('unexpected token while parsing shader case: ' + m_curTokenStr);
                }

            }

            advanceToken(Token.TOKEN_END); // case end
            // no ShaderCase yet?
            var getShaderSpec = function(vert, frag, type) {
                return {
                    expectResult: expectResult,
                    caseType: type,
                    valueBlockList: valueBlockList,
                    targetVersion: version,
                    vertexSource: vert,
                    fragmentSource: frag
                };
            };
            getShaderSpec.bind(this);

            if (bothSource.length) {

                de_assert(!vertexSource);
                de_assert(!fragmentSource);


                shaderNodeList.push(deqpTests.newTest(caseName + '_vertex', description, getShaderSpec(bothSource, null,
                    shaderLibraryCase.caseType.CASETYPE_VERTEX_ONLY)));
                shaderNodeList.push(deqpTests.newTest(caseName + '_fragment', description, getShaderSpec(null, bothSource,
                    shaderLibraryCase.caseType.CASETYPE_FRAGMENT_ONLY)));

            } else {
                de_assert(vertexSource);
                de_assert(fragmentSource);

                shaderNodeList.push(deqpTests.newTest(caseName, description, getShaderSpec(vertexSource, fragmentSource,
                    shaderLibraryCase.caseType.CASETYPE_COMPLETE)));
                }
        };

        var parseShaderGroup = function(shaderNodeList) {

            // parse 'case'
            advanceToken(Token.TOKEN_GROUP);

            // parse case name
            var name = m_curTokenStr;
            advanceToken(); // \note [pyry] We don't want to check token type here (for instance to allow "uniform") group.

            // Parse description.
            assumeToken(Token.TOKEN_STRING);
            var description = parseStringLiteral(m_curTokenStr);
            advanceToken(Token.TOKEN_STRING);

            var children = [];

            for (;;) {

                if (m_curToken === Token.TOKEN_END) {
                    break;
                } else if (m_curToken === Token.TOKEN_GROUP) {
                    parseShaderGroup(children);
                } else if (m_curToken === Token.TOKEN_CASE) {
                    parseShaderCase(children);
                } else {
                    testFailed('unexpected token while parsing shader group: ' + m_curTokenStr);
                    deqpTests.runner.terminate();
                }

            }

            advanceToken(Token.TOKEN_END); // group end

            // Create group node.
            var groupNode = deqpTests.newTest(name, description, children);
            shaderNodeList.push(groupNode);

        };

        // uncomment to expose private functions
        (function(obj) {
            obj.priv = {
                m_curPtr: m_curPtr,

                parseError: parseError,
                parseFloatLiteral: parseFloatLiteral,
                parseIntLiteral: parseIntLiteral,
                parseStringLiteral: parseStringLiteral,
                parseShaderSource: parseShaderSource,
                advanceTokenTester: advanceTokenTester,
                assumeToken: assumeToken,
                mapDataTypeToken: mapDataTypeToken,
                getTokenName: getTokenName,

                Token: Token,

                parseValueElement: parseValueElement,
                parseValue: parseValue,
                parseValueBlock: parseValueBlock,
                parseShaderCase: parseShaderCase,
                parseShaderGroup: parseShaderGroup,

                none: false
            };
        }(this));
        //*/
    };


/**
 * Parse the test file and execute the test cases
 * @param {string} testName Name of the test file (without extension)
 * @param {string} filter Optional filter
 */
var run = function(testName, filter) {
    WebGLTestUtils.loadTextFileAsync(testName + '.test', function(success, content) {
        if (success) {
            deqpTests.runner.getState().testFile = content;
            deqpTests.runner.getState().testName = testName;
            deqpTests.runner.getState().filter = filter;
            deqpTests.runner.runCallback(processTestFile);
        } else {
            testFailed('Failed to load test file: ' + testName);
            deqpTests.runner.terminate();
        }
    });
};

return {
    run: run
};

}());
