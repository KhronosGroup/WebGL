/*
** Copyright (c) 2014 The Khronos Group Inc.
**
** Permission is hereby granted, free of charge, to any person obtaining a
** copy of this software and/or associated documentation files (the
** "Materials"), to deal in the Materials without restriction, including
** without limitation the rights to use, copy, modify, merge, publish,
** distribute, sublicense, and/or sell copies of the Materials, and to
** permit persons to whom the Materials are furnished to do so, subject to
** the following conditions:
**
** The above copyright notice and this permission notice shall be included
** in all copies or substantial portions of the Materials.
**
** THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
** MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
** IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
** CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
** MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
*/


var GLSLConstructorTestsGenerator = (function() {
  
// Constants
var MAX_COMP_COUNT   =                  4;
var MAX_ARG_COUNT    = MAX_COMP_COUNT + 1;
var UNUSED_EXP_COUNT =                  1;
     
var EXP_VALID                    = 0;
var EXP_INVALID_NO_ARGS          = 1;
var EXP_INVALID_NOT_ENOUGH_COMPS = 2;
var EXP_INVALID_TOO_MANY_ARGS    = 3; 
   
var wtu = WebGLTestUtils;

// Shader code templates 
var vectorConstructorVertexTemplate = [
  "precision mediump int;",
  "precision mediump float;",
  "varying vec4 v_color;",
  
  "void main() {",
  "  $(argList)",
    
  "  $(vecType) v = $(vecType)($(arg0)$(arg1)$(arg2)$(arg3)$(arg4)); ",
  "  gl_Position = vec4(v$(filler));",
  
  "}"
].join("\n");

var vectorConstructorFragmentTemplate = [
  "precision mediump int;",
  "precision mediump float;",

  "void main() {",
  "  $(argList)",
  
  "  $(vecType) v = $(vecType)($(arg0)$(arg1)$(arg2)$(arg3)$(arg4)); ",
  
  "  gl_FragColor = vec4(v$(filler));",
  "}"
].join("\n");


// Returns correct string representation of scalar value 
function getScalarTypeValStr(val, scalarType) {
  switch (scalarType) {
    case "float":
      return val.toFixed(1);

    case "int":
      return val;
            
    case "bool":
      return (val === 0) ? "true" : "false";
       
    default:
      debugger;
  }
}

 
// Returns a string which is the constructor expression in which every component is set to a scalar value
function getArgumentValue(compCount, vecName, argCompValue, scalarType) {
  if (compCount === 1) {
    // Scalar
    return getScalarTypeValStr(argCompValue, scalarType);
  } 
  else {
    // Vector
    
    // Create substitution object  
    var subst = {
      vecType: vecName, 
    };
    
    for (var aa = 0; aa < MAX_COMP_COUNT; ++aa) {
      var argName = "arg" + aa; 
      if (aa < compCount) 
        subst[argName] = getScalarTypeValStr(argCompValue + aa, scalarType) + ((aa < compCount - 1) ? ", " : "");
      else
        subst[argName] = "";
    }
  
    return wtu.replaceParams(
      "$(vecType)($(arg0)$(arg1)$(arg2)$(arg3))", 
      subst
    );
  }
}


// Returns comma separated sequence of numbers so constructor expression has always 4 components
function getVec4Filler(compCount) {
  var filler = "";
  for (var ff = compCount; ff < MAX_COMP_COUNT; ++ff) 
    filler += ", 0.0";
  
  return filler;
}


// Returns substitution object to turn the shader template into testable shader code 
function getSubstitutions(vecBaseType, compCount, scalarType, argCompCounts) {
  var args = "";
  var argList = "";
  var argCompValue = 0;
  var subst = {
    vecType: vecBaseType + compCount, 
    filler:  getVec4Filler(compCount) 
  };
  
  var argList = "";
  for (var aa = 0; aa < MAX_ARG_COUNT; ++aa) {
    var arg    = "";
    var argCompCount = argCompCounts[aa];
    if (argCompCount !== undefined) {
      var argName = "a" + aa; 
      var argVecType = vecBaseType + argCompCount;
      var argExp = wtu.replaceParams("$(argType) $(argName) = $(argVal);", {
        argType: ((argCompCount === 1) ? scalarType : argVecType),
        argName: argName,
        argVal:  getArgumentValue(argCompCount, argVecType, argCompValue, scalarType)
      });
      argList += ((aa > 0) ? "  " : "") + argExp + "\n";
      
      // Name of argument with separating comma (if not last argument)
      arg = argName + ((aa === argCompCounts.length - 1) ? "" : ", ");
      
      // Increment argument component value so all argument component arguments have a unique value
      argCompValue += argCompCount;   
    }
 
    subst["arg" + aa] = arg;
    subst["argList"]  = argList;
  }
  
  return subst; 
}


// Returns if vector construction expression is valid or invalid
// The reason why the expression is invalid is encoded in the enumeration
function getVectorConstructorValidityType(argCompCounts, compCount) {
  var totalCompCount = 0;
  for (var aa = 0; aa < argCompCounts.length; ++aa) 
    totalCompCount += argCompCounts[aa]; 

  if (totalCompCount === 0) {
    // A constructor needs at least one value
    return EXP_INVALID_NO_ARGS;
  }
  else if (totalCompCount === 1) {
    // Constructors with one value set all components to the same value
    return EXP_VALID;
  }
  else if (totalCompCount < compCount) {
    // More than one value but not enough to set all components  
    return EXP_INVALID_NOT_ENOUGH_COMPS;
  }
  else {
    // totalCompCount >= compCount
    // All components set
    var lastArgFirstCompIx = totalCompCount - argCompCounts[argCompCounts.length - 1];
    
    if (lastArgFirstCompIx < compCount) {
      // All components set, all arguments used
      return EXP_VALID;
    }
    else { 
      // All components set, not all arguments used
      return EXP_INVALID_TOO_MANY_ARGS;
    }
  }
}


// Return message for test (will be displayed)
function getTestMessage(compCount, vecType, scalarType, argCompCounts, expValidity) {
  switch (expValidity) {
    case EXP_VALID:
      var msg = "Valid constructor expression";
      if (argCompCounts.length === 1 && argCompCounts[0] === 1)
        msg += ", all components set to the same value";
         
      return msg;
      
    case EXP_INVALID_NO_ARGS:
      return "Invalid empty constructor expression";
      
    case EXP_INVALID_NOT_ENOUGH_COMPS:
      return "Not all components are set";
      
    case EXP_INVALID_TOO_MANY_ARGS:
      return "Unused argument in expression is invalid";
    
    default:
      return "Unknown validity constant";
  }
}
  

// Returns a testcase
function getVectorTestCase(compCount, vecBaseType, scalarType, argCompCounts, expValidity) {
  var substitutions = getSubstitutions(vecBaseType, compCount, scalarType, argCompCounts);  
  var valid_exp     = (expValidity === EXP_VALID);
  
  return [
    {
      // Test constructor argument list in fragment shader
      vShaderSource:  wtu.replaceParams(vectorConstructorVertexTemplate, substitutions),
      vShaderSuccess: valid_exp,
      fShaderSource:  wtu.replaceParams(vectorConstructorFragmentTemplate, substitutions),
      fShaderSuccess: valid_exp,
      linkSuccess:    valid_exp,
      passMsg:        getTestMessage(compCount, vecBaseType + compCount, scalarType, argCompCounts, expValidity),
      render:         false
    }
  ];  
}


// Increment the argument component counts
function incArgumentCounts(argCompCounts, compCount) {
  // Valid test expressions are constructor expressions with maximum 1 not used argument with a component count of 1

  // wtu.log("incArgumentCounts() enter : " + argCompCounts + ", comp count : " + compCount); 

  // Determine if there is an argument which will turn into a not used argument if the component count of the leading
  // arguments is increased by one.  
  // The sum of argument components up till the current argument gives the component index of the first component
  // of the current argument into the target type.
  // Example : target vec3, arguments vec2, vec2
  // Target         t[0]     t[1]     t[2]
  // Arguments      a0[0]    a0[1]    a1[0]    a1[1]
  // a1[0] is at index 2 of the target type, this is the sum of components of the arguments before a1      
  var notUsedIx = -1;              
  var oneCompUsedIx = -1;
  var compSum = 0;
  for (var aa = 0; aa < argCompCounts.length; ++aa) {
    if (compSum === compCount - 1) 
      oneCompUsedIx = aa;
    else if (compSum > compCount - 1)
      notUsedIx = aa;   
      
    compSum += argCompCounts[aa];           
  }
  
  // If there is an argument with only one component used it is not allowed to turn into a not used argument if it has more than one 
  // component or it is not the last argument (there is already a not used argument). 
  var noExpandIx = -1;
  if (oneCompUsedIx != -1 && (argCompCounts[oneCompUsedIx] > 1 || oneCompUsedIx < argCompCounts.length - 1)) 
    noExpandIx = oneCompUsedIx;
  
  // wtu.log("incArgumentCounts() no exp : " + noExpandIx); 
             
  // Find argument to increase
  var aa = 0;   
  var compSumDelta = 0;
  while (aa < argCompCounts.length && (argCompCounts[aa] === MAX_COMP_COUNT || (aa < noExpandIx && compSumDelta + 1 > 0))) {
    // Current argument component count has maximum value or increasing the component count will generate an invalid test case

    // Accumulate change in component count if component count for current argument is reset
    compSumDelta += (-argCompCounts[aa] + 1);

    // Reset to start with one component
    argCompCounts[aa] = 1;
    
    // Move to next argument
    ++aa;
  }

  if (aa === argCompCounts.length) {
    // Extend argument list with argument of one component (scalar)
    argCompCounts.push(1);
  }
  else {
    if (aa * 1 > compCount - 1) {
      // Not used argument, increasing the argument count of the not used argument
      // End of test cases reached
      argCompCounts.length = 0;
    } 
    else {
      ++argCompCounts[aa];
    }
  }
  
  // wtu.log("incArgumentCounts() exit  : " + argCompCounts); 
}


// Test code

// Returns the count of testcases for a datatype with a specified component count
function getTestCaseCount(compCount) {
  if (compCount === 1) {
    // Test case  count for a data type with only one component 
    // Empty case : 1
    // The sequence of arguments with component count in the range { 1, ..., MAX_COMP_COUNT }
    // multiplied with the count of tests of not used arguments plus one for no unused argument.
    return 1 + MAX_COMP_COUNT * (1 + UNUSED_EXP_COUNT);
  }
  else {
    // One for the no arguments case
    var sum = 1;
    for (var cc = 1; cc <= MAX_COMP_COUNT; ++cc) {
      if (cc < compCount) {
        // For all arguments which are shorter compared to the target datatype
        // Add the count of testcases for a data type with length one less 
        sum += getTestCaseCount(compCount - cc);
      }
      else {
        // For all arguments which have a length equal or greater compared to the 
        // component count of the target type :
        // Add the count of unused argument test cases plus one for no unused argument.
        sum += (1 + UNUSED_EXP_COUNT);
      }     
    }
 
    return sum;
  }
}


/**
 * Returns list of test cases for vector types
 * All combinations of arguments up to one unused argument of one component are tested
 * @param {prefixCompTypeName} Name of prefix (scalar) component type 
 * @param {compCount}          Count of components in vector type
 * @param {scalarType}         Name of (scalar) component type
 */
function getVectorConstructorTests(prefixCompTypeName, compCount, scalarType) {
  // List of tests to return
  var testInfos = [];

  // Complete name of vector type
  var vecBaseType = prefixCompTypeName + "vec"; 
  var vecType     = vecBaseType + compCount;
   
  // List of component count per argument  
  var argCompCounts = [];  
  var testCaseCount = 0;
  
  do {
    var expValidity = getVectorConstructorValidityType(argCompCounts, compCount);
        
    testInfos = testInfos.concat(getVectorTestCase(compCount, vecBaseType, scalarType, argCompCounts, expValidity));
    ++testCaseCount;
     
    // Move to next argument expression
    incArgumentCounts(argCompCounts, compCount);
  }
  while (argCompCounts.length !== 0);

  // Verify the pattern of generated testcases by comparing the count of 
  // testcases against a direct computation of the test case count    
  if (testCaseCount !== getTestCaseCount(compCount)) {
    wtu.error("GLSLConstructorTestsGenerator.getVectorConstructorTests(), mismatch in count of testcases generated and computed testcase count");
    debugger;
  }
      
  return testInfos;
}
  

// Return publics
return {
  getVectorConstructorTests: getVectorConstructorTests 
};

}());






