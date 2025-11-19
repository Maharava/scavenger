@echo off
REM Batch script to amalgamate project files into one.

SETLOCAL ENABLEDELAYEDEXPANSION

REM Output file name
SET "OUT_FILE=amalgamation.bat.txt"

REM List of extensions to include (space-separated)
SET "EXTENSIONS=.js .html .css .md .txt"

REM Directories to exclude
SET "EXCLUDE_DIRS=.git .claude"

REM Clear the output file if it exists
IF EXIST "%OUT_FILE%" (
    del "%OUT_FILE%"
)

echo Creating %OUT_FILE%...

REM Use for /r to recursively find all files
for /r %%F in (*) do (
    SET "FILE_PATH=%%F"
    SET "FILE_EXT=%%~xF"
    
    REM Check if the file extension is in our list
    SET "INCLUDE=false"
    for %%E in (%EXTENSIONS%) do (
        if /I "%%E" == "!FILE_EXT!" (
            SET "INCLUDE=true"
        )
    )

    REM Check if the file is in an excluded directory
    SET "EXCLUDE=false"
    for %%D in (%EXCLUDE_DIRS%) do (
        echo "!FILE_PATH!" | findstr /I /B /C:"%%D" >nul 2>&1
        echo "!FILE_PATH!" | findstr /I /C:"\%%D\" >nul 2>&1
        if !errorlevel! == 0 (
            SET "EXCLUDE=true"
        )
    )

    REM If not excluded and extension matches, append to file
    if "!INCLUDE!" == "true" if "!EXCLUDE!" == "false" (
        echo --- %%F --- >> "%OUT_FILE%"
        echo. >> "%OUT_FILE%"
        type "%%F" >> "%OUT_FILE%"
        echo. >> "%OUT_FILE%"
        echo. >> "%OUT_FILE%"
    )
)

echo Amalgamation complete.
ENDLOCAL
