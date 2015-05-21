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
'use strict';
goog.provide('framework.common.tcuMatrix');
goog.require('framework.delibs.debase.deMath');

goog.scope(function() {

    var tcuMatrix = framework.common.tcuMatrix;
    var deMath = framework.delibs.debase.deMath;

    var DE_ASSERT = function(x) {
        if (!x)
            throw new Error('Assert failed');
    };

    /**
     * @constructor
     * @param {number} rows
     * @param {number} cols
     * Initialize to identity.
     */
    tcuMatrix.Matrix = function(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.matrix = [];
        for (var i = 0; i < rows; i++)
            this.matrix[i] = [];
        for (var row = 0; row < rows; row++)
            for (var col = 0; col < cols; col++)
                this.set(row, col, (row == col) ? 1 : 0);
    };

    /**
     * @param {number} rows
     * @param {number} cols
     * @param {Array<number>} vector
     * @return {tcuMatrix.Matrix}
     */
    tcuMatrix.matrixFromVector = function(rows, cols, vector) {
        var matrix = new tcuMatrix.Matrix(rows, cols);
        for (var row = 0; row < vector.length; row++)
            for (var col = 0; col < vector.length; col++)
                matrix.matrix[row][col] = row == col ? vector[row] : 0;
        return matrix;
    };

    tcuMatrix.Matrix.prototype.set = function(x, y, value) {
        this.isRangeValid(x, y);
        this.matrix[y][x] = value;
    };

    tcuMatrix.Matrix.prototype.get = function(x, y) {
        this.isRangeValid(x, y);
        return this.matrix[y][x];
    };

    tcuMatrix.Matrix.prototype.isRangeValid = function(x, y) {
        if (!deMath.deInBounds32(x, 0, this.cols))
            throw new Error('Columns out of range');
        if (!deMath.deInBounds32(y, 0, this.rows))
            throw new Error('Rows out of range');
    };

    /**
     * @return {Array<number>}
     */
    tcuMatrix.Matrix.prototype.getColumnMajorData = function() {
        /** @type {Array<number>} */ var a = [];
        for (var col = 0; col < this.cols; col++)
            for (var row = 0; row < this.rows; row++)
                a.push(this.get(row, col));
        return a;
    };

    /**
     * @param {tcuMatrix.Matrix} matrixA
     * @param {tcuMatrix.Matrix} matrixB
     * @return {tcuMatrix.Matrix}
     * Multiplication of two matrices.
     */
    tcuMatrix.multiply = function(matrixA, matrixB) {
        if (matrixA.cols != matrixB.rows)
            throw new Error('Wrong matrices sizes');
        var res = new tcuMatrix.Matrix(matrixA.rows, matrixB.cols);
        for (var row = 0; row < matrixA.rows; row++)
            for (var col = 0; col < matrixB.cols; col++) {
                var v = 0;
                for (var ndx = 0; ndx < matrixA.cols; ndx++)
                    v += matrixA.get(row, ndx) * matrixB.get(ndx, col);
                res.set(row, col, v);
            }
        return res;
    };

    /**
     * @param {tcuMatrix.Matrix} mtx
     * @param {Array<number>} vec
     * @return {Array<number>}
     */
    tcuMatrix.multiplyMatVec = function(mtx, vec) {
        /** @type {Array<number>} */ var res = [];
        /** @type {number} */ var value;
        for (var row = 0; row < mtx.rows; row++) {
            value = 0;
            for (var col = 0; col < mtx.cols; col++)
                value += mtx.get(row, col) * vec[col];
            res[row] = value;
        }

        return res;
    };

    /**
     * @param {Array<number>} vec
     * @param {tcuMatrix.Matrix} mtx
     * @return {Array<number>}
     */
    tcuMatrix.multiplyVecMat = function(vec, mtx) {
        /** @type {Array<number>} */ var res = [];
        /** @type {number} */ var value;
        for (var col = 0; col < mtx.cols; col++) {
            value = 0;
            for (var row = 0; row < mtx.rows; row++)
                value += mtx.get(row, col) * vec[row];
            res[col] = value;
        }

        return res;
    };

    /**
     * @constructor
     * @extends {tcuMatrix.Matrix}
     */
    tcuMatrix.Mat3 = function() {
        tcuMatrix.Matrix.call(this, 3, 3);
    };

    tcuMatrix.Mat3.prototype = Object.create(tcuMatrix.Matrix.prototype);
    tcuMatrix.Mat3.prototype.constructor = tcuMatrix.Mat3;

});
