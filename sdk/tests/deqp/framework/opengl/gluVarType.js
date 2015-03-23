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

define(['framework/opengl/gluShaderUtil'], function(deqpUtils) {
    'use strict';

    var DE_ASSERT = function(x) {
        if (!x)
            throw new Error('Assert failed');
    };

    /**
    * VarType types enum
    * @enum {number}
    */
    var Type = {
       TYPE_BASIC: 0,
       TYPE_ARRAY: 1,
       TYPE_STRUCT: 2
    };

    /**
    * TypeArray struct
    * @param {VarType} elementType
    * @param {number} arraySize
    */
    var TypeArray = function(elementType, arraySize) {
       /** @type {VarType} */ this.elementType = elementType;
       /** @type {number} */ this.size = arraySize;
    };

    /**
    * VarType class
    */
    var VarType = function() {
       /** @type {Type} */ this.m_type = undefined;
       /** @type {deMath.deUint32} */ this.m_flags = 0;

       /*
        * m_data used to be a 'Data' union in C++. Using a var is enough here.
        * it will contain any necessary value.
        */
       /** @type {(deqpUtils.DataType|TypeArray|StructType)} */
       this.m_data = undefined;
    };

    VarType.UNSIZED_ARRAY = -1;

    /**
    * Creates a basic type VarType. Use this after the constructor call.
    * @param {deqpUtils.DataType} basicType
    * @param {deMath.deUint32} flags
    * @return {VarType} The currently modified object
    */
    VarType.prototype.VarTypeBasic = function(basicType, flags) {
       this.m_type = Type.TYPE_BASIC;
       this.m_flags = flags;
       this.m_data = basicType;

       return this;
    };

    /**
    * Creates an array type VarType. Use this after the constructor call.
    * @param {VarType} elementType
    * @param {number} arraySize
    * @return {VarType} The currently modified object
    */
    VarType.prototype.VarTypeArray = function(elementType, arraySize) {
       this.m_type = Type.TYPE_ARRAY;
       this.m_flags = 0;
       this.m_data = new TypeArray(elementType, arraySize);

       return this;
    };

    /**
    * Creates a struct type VarType. Use this after the constructor call.
    * @param {StructType} structPtr
    * @return {VarType} The currently modified object
    */
    VarType.prototype.VarTypeStruct = function(structPtr) {
       this.m_type = Type.TYPE_STRUCT;
       this.m_flags = 0;
       this.m_data = structPtr;

       return this;
    };

    /** isBasicType
    * @return {boolean} true if the VarType represents a basic type.
    */
    VarType.prototype.isBasicType = function() {
       return this.m_type == Type.TYPE_BASIC;
    };

    /** isArrayType
    * @return {boolean} true if the VarType represents an array.
    */
    VarType.prototype.isArrayType = function() {
       return this.m_type == Type.TYPE_ARRAY;
    };

    /** isStructType
    * @return {boolean} true if the VarType represents a struct.
    */
    VarType.prototype.isStructType = function() {
       return this.m_type == Type.TYPE_STRUCT;
    };

    /** getFlags
    * @return {deUint32} returns the flags of the VarType.
    */
    VarType.prototype.getFlags = function() {
       return this.m_flags;
    };

    /** getBasicType
    * @return {deqpUtils.DataType} returns the basic data type of the VarType.
    */
    VarType.prototype.getBasicType = function() {
       return this.m_data;
    };

    /** getElementType
    * @return {VarType} returns the VarType of the element in case of an Array.
    */
    VarType.prototype.getElementType = function() {
       return this.m_data.elementType;
    };

    /** getArraySize
    * (not to be confused with a javascript array)
    * @return {number} returns the size of the array in case it is an array.
    */
    VarType.prototype.getArraySize = function() {
       return this.m_data.size;
    };

    /** getStruct
    * @return {StructType} returns the structure when it is a StructType.
    */
    VarType.prototype.getStruct = function() {
       return this.m_data;
    };

    /** getPrecision
    * @return {StructType} returns the precision flag name.
    */
    VarType.prototype.getPrecision = function() {
        return this.m_flags;
     };

    /**
    * getScalarSize
    * @return {number} size of the scalar
    */
    VarType.prototype.getScalarSize = function() {
        switch (this.m_type)
        {
            case Type.TYPE_BASIC:
            {
                return deqpUtils.getDataTypeScalarSize(this.getBasicType());
            }

            // TODO: check implementation below: return m_data.array.elementType->getScalarSize()*m_data.array.size;
            case Type.TYPE_ARRAY:
            {
                /** @type {TypeArray} */ var m_data = this.m_data;
                return m_data.elementType.getScalarSize() * m_data.size;
            }

            case Type.TYPE_STRUCT:
            {
                var size = 0;

                /** @type {StructType} */ var struct = this.m_data;

                // TODO: check loop conditions below
                // for (StructType::ConstIterator iter = m_data.structPtr->begin(); iter != m_data.structPtr->end(); iter++)
                for (var iter = 0; struct.m_members[iter] < struct.getSize; iter++)
                    size += struct.getMember(iter).m_type.getScalarSize();
                return size;
            }

            default:
                // DE_ASSERT(false);
                return 0;
        }
    };

    /**
    * is
    * @return {bool} returns true if the current object is equivalent to other.
    */
    VarType.prototype.is = function(other) {
        if (this.m_type != other.m_type)
            return false;

        switch (this.m_type)
        {
            case Type.TYPE_BASIC:
                return this.m_data.type == other.m_data.type &&
                       this.m_data.precision == other.m_data.precision;

            case Type.TYPE_ARRAY:
                return this.m_data.elementType == other.m_data.elementType &&
                       this.m_data.size == other.m_data.size;

            case Type.TYPE_STRUCT:
                return this.m_data === other.m_data;

            default:
            //    DE_ASSERT(false);
                return false;
        }
    };

    /**
    * isnt
    * @return {bool} returns true if the current object is not equivalent to other.
    */
    VarType.prototype.isnt = function(other) {
        return !(this.is(other));
    };

    /**
     * Creates a basic type VarType.
     * @param {deqpUtils.DataType} basicType
     * @param {deMath.deUint32} flags
     * @return {VarType}
     */
    var newTypeBasic = function(basicType, flags) {
       return new VarType().VarTypeBasic(basicType, flags);
    };

    /**
    * Creates an array type VarType.
    * @param {VarType} elementType
    * @param {number} arraySize
    * @return {VarType}
    */
    var newTypeArray = function(elementType, arraySize) {
       return new VarType().VarTypeArray(elementType, arraySize);
    };

    /**
    * Creates a struct type VarType.
    * @param {StructType} structPtr
    * @return {VarType}
    */
    var newTypeStruct = function(structPtr) {
        return new VarType().VarTypeStruct(structPtr);
    };

    /**
     * StructMember class
     */
     var StructMember = function() {
        /** @type {string} */ this.m_name;
        /** @type {VarType} */ this.m_type;
        /** @type {deMath.deUint32} */ // this.m_flags = 0; // only in glsUniformBlockCase
     };

     /**
      * Creates a StructMember. Use this after the constructor call.
      * @param {string} name
      * @param {VarType} type
      * @return {StructMember} The currently modified object
      */
      StructMember.prototype.Constructor = function(name, type) {
         this.m_type = type;
         this.m_name = name;
         // this.m_flags = flags; // only in glsUniformBlockCase

         return this;
      };

      /** getName
       * @return {string} name of the StructMember object.
       */
      StructMember.prototype.getName = function() {
          return this.m_name;
       };

      /** getType
       * @return {string} type of the StructMember object.
       */
      StructMember.prototype.getType = function() {
           return this.m_type;
        };

      /**  only in glsUniformBlockCase! getFlags
      * @return {deMath.deUint32} the flags in the member
      */
      StructMember.prototype.getFlags = function() { return this.m_flags; };

      /**
       * Creates a StructMember.
       * @param {string} name
       * @param {VarType} type
       * @return {StructMember}
       */
       var newStructMember = function(name, type) {
           return new StructMember().Constructor(name, type);
       };

     /**
      * StructType class
      */
      var StructType = function() {
         /** @type {string} */ this.m_typeName = undefined;
         /** @type {Array.<StructMember>} */ this.m_members = [];
      };

    /**
     * Creates a StructType. Use this after the constructor call.
     * @param {string} name
     * @return {StructType} The currently modified object
     */
      StructType.prototype.Constructor = function(name) {
          /** @type {string}*/ this.m_typeName = this.setTypeName(name);
          return this;
     };

     /** hasTypeName
      * Checks if the StructType m_typeName is defined
      * @return {boolean}
      **/
      StructType.prototype.hasTypeName = function() {
         return (this.m_typeName !== 'undefined');
     };

     /** setTypeName
      * @param {string} name
      * @return {string} returns StructType.m_typeName
      **/
      StructType.prototype.setTypeName = function(name) {
         return this.m_typeName = name;
     };

     /** getTypeName
     * @return {string}
     **/
     StructType.prototype.getTypeName = function() {
         return this.m_typeName;
     };

     /** getMember
     * @param {number} memberNdx The index of the member to retrieve.
     * @return {StructMember}
     **/
     StructType.prototype.getMember = function(memberNdx) {
         if (memberNdx >= 0 && memberNdx < this.m_members.length)
             return this.m_members[memberNdx];
         else {
             bufferedLogToConsole('Error: Invalid member index for StructTypes members');
             return undefined;
         }
     };

     /** getSize
     * @return {number} The size of the m_members array.
     **/
     StructType.prototype.getSize = function() {
         return this.m_members.length;
     };

     /** addMember
     * @param {string} name
     * @param {VarType} type
     **/
     StructType.prototype.addMember = function(name, type) {
        var member = newStructMember(name, type);
         this.m_members.push(member);
     };

     /**
      * Creates a StructType.
      * @param {string} name
      * @return {StructType}
      */
      var newStructType = function(name) {
          return new StructType().Constructor(name);
      };

      /**
       * @param {number} level
       * @return {string}
       */
    var indent = function(level) {
        /** @type {string} */ var str = '';
        for (var i = 0; i < level; i++)
            str += '\t';
        return str;
    };

    /**
     * @param {VarType} varType
     * @param {string} name
     * @param {number} level
     * @return {string}
     */
    var declareVariable = function(varType, name, level) {
        /** @type {string} */ var str = '';
        /** @type {VarType} */ var type = varType;
        /** @type {VarType} */ var curType = type;
        /** @type {Array.<number>} */ var arraySizes = [];

        // Handle arrays.
        while (curType.isArrayType())
        {
            arraySizes.push(curType.getArraySize());
            curType = curType.getElementType();
        }

        if (curType.isBasicType())
        {
            if (curType.getPrecision() !== undefined)
                str += deqpUtils.getPrecisionName(curType.getPrecision()) + ' ';
            str += deqpUtils.getDataTypeName(curType.getBasicType());
        }
        else if (curType.isStructType())
        {
            /** @type {StructType} */ var structPtr = curType.getStruct();

            if (structPtr.hasTypeName())
                str += structPtr.getTypeName();
            else
                str += declareStructType(structPtr, level); // Generate inline declaration.
        }
        else
            DE_ASSERT(false);

        str += ' ' + name;

        // Print array sizes.
        for (var size = 0; size < arraySizes.length; size++)//std::vector<int>::const_iterator sizeIter = arraySizes.begin(); sizeIter != arraySizes.end(); sizeIter++)
        {
            /** @type {number} */ var arrSize = arraySizes[size];
            if (arrSize == VarType.UNSIZED_ARRAY)
                str += '[]';
            else
                str += '[' + arrSize + ']';
        }

        return str;
    };

    /**
     * @param {StructType} structType
     * @param {number} level
     * @return {string}
     */
    var declareStructType = function(structType, level_) {
        /** @type {string} */ var str = 'struct';
        var level = level_ || 0;

        // Type name is optional.
        if (structType.hasTypeName())
            str += ' ' + structType.getTypeName();

        str += '\n' + indent(level) + '{\n';

        for (var memberNdx = 0; memberNdx < structType.getSize(); memberNdx++)//StructType::ConstIterator memberIter = decl.structPtr->begin(); memberIter != decl.structPtr->end(); memberIter++)
        {
            /** @type {StructMember} */ var memberIter = structType.getMember(memberNdx);
            str += indent(level + 1);
            str += declareVariable(memberIter.getType(), memberIter.getName(), level + 1) + ';\n';
        }

        str += indent(level) + '}';

        return str;
    };

    return {
        Type: Type,
        VarType: VarType,
        StructMember: StructMember,
        StructType: StructType,
        newTypeBasic: newTypeBasic,
        newTypeArray: newTypeArray,
        newTypeStruct: newTypeStruct,
        newStructMember: newStructMember,
        newStructType: newStructType,
        declareVariable: declareVariable,
        declareStructType: declareStructType,
        UNSIZED_ARRAY: VarType.UNSIZED_ARRAY //!< Array length for unsized arrays.
    };
});
