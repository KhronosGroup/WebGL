'''
Created on 23 Dec 2014

@author:    Alberto Lopez
            Mobica LTD
'''
'''

Python Script TO COMPILE JAVASCRIPTS WITH closure.jar locally in the selected directory

STEPS:
- paste a copy of the compiler.jar found on https://developers.google.com/closure/compiler/docs/gettingstarted_app
- execute/paste this script in the folder where the JavaScripts are contained

FEATURES:
1) By Default, this script compiles each JavaScript contained in the current folder with the 3 different Closure Compiler levels available
WHITESPACE_ONLY, SIMPLE_OPTIMIZATIONS and ADVANCED_OPTIMIZATIONS

These compilations levels are represented in the main program as:
- whitespace= True (True when this compilation level is undertaken)
- simple= True (True when this compilation level is undertaken)
- advanced= True (True when this compilation level is undertaken)

2) Each JavaScript compiled generates a .txt file with the corresponding output from the Closure Compiler.

3) By using this script and the Closure Compiler Application(closure.jar), the Warning and Error report Output is always more restrictive than
the output obtained from the Closure Compiler Service UI (http://closure-compiler.appspot.com/home).

4) If there are no errors in the compiled JavaScript, a copy of the compressed JavaScript is returned in its corresponding field within
the .txt file generated.

5) By executing this Python script, NONE .js output files are generated, to avoid compilation of generated js in the local directory while running this script

'''
#!python3
import re
import os
import subprocess
import threading 
from sys import stdout, stderr

#simpleCompilationCmdInput= "java -jar compiler.jar --compilation_level SIMPLE --js glu-draw.js --js_output_file gluDrawCompiled.js --externs js-test-pre.js --warning_level VERBOSE"

def getShadersJavaScript(whitespaceCompilation, simpleCompilation, advancedCompilation):
    
    directory=os.getcwd()
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".js"):
                compileJavaScript(file, whitespaceCompilation, simpleCompilation, advancedCompilation)
                

def compileJavaScript(file, whitespaceCompilation, simpleCompilation, advancedCompilation):
    print("RUNNING CLOSURE COMPILER OUTPUT for " +file+" ...")

    outputCompilerFile= file.strip()[0:-3]
    outputCompilerFile= outputCompilerFile +".txt"
    
    with open(outputCompilerFile, "w") as out_file:
            out_file.write("CLOSURE COMPILER OUTPUT " + "\n")
            out_file.write("JavaScript shader file: " + file + "\n")
            out_file.write("Output file from CLOSURE COMPILER: " + outputCompilerFile + "\n")
            out_file.flush()
    
    if whitespaceCompilation==True:
        cmdInput= "java -jar compiler.jar --compilation_level WHITESPACE_ONLY --js "+file+" --warning_level VERBOSE"
        with open(outputCompilerFile, "a") as out_file:
            out_file.write("\n"+ "------------------------------------------" + "\n")
            out_file.write("COMPILATION LEVEL: WHITESPACE_ONLY " + "\n")
            out_file.flush()
        writeOutputAmendFile(outputCompilerFile, cmdInput)
    
    if simpleCompilation==True:
        cmdInput= "java -jar compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --js "+file+" --warning_level VERBOSE"
        with open(outputCompilerFile, "a") as out_file:
            out_file.write("\n"+"\n"+ "------------------------------------------" + "\n")
            out_file.write("COMPILATION LEVEL: SIMPLE_OPTIMIZATIONS" + "\n")
            out_file.flush()
        writeOutputAmendFile(outputCompilerFile, cmdInput)
        
    if advancedCompilation==True:
        cmdInput= "java -jar compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --js "+file+" --warning_level VERBOSE"
        with open(outputCompilerFile, "a") as out_file:
            out_file.write("\n"+"\n"+ "------------------------------------------" + "\n")
            out_file.write("COMPILATION LEVEL: ADVANCED_OPTIMIZATIONS" + "\n")
            out_file.flush()
        writeOutputAmendFile(outputCompilerFile, cmdInput)
    
    print("JavaScript " +file + " SUCCESSFULLY COMPILED!")
    print("Output saved in " +outputCompilerFile + " in current working directory " + os.getcwd() + "\n")


def writeOutputAmendFile(outputCompilerFile, cmdInput):
    with open(outputCompilerFile, "ab") as out_file:
            
            proc = subprocess.Popen(cmdInput, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
            
            while proc.poll() is None:
                line = proc.stdout.readline()
                out_file.write(line)
            
            out_file.flush()
            proc.wait()
            #proc = subprocess.Popen(simpleCompilationCmdInput, shell=True)


#main program
whitespace= True
simple= True
advanced= True
getShadersJavaScript(whitespace, simple, advanced)
print("------ END EXECUTION Python script: compiler-shaders-local.py ------" + "\n")
