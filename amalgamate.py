import os

# List of file extensions to include
include_extensions = ['.js', '.html', '.css', '.md', '.txt']

# List of directories to exclude
exclude_dirs = ['.git', '.claude']

# List of files to exclude
exclude_files = ['gemini.md', 'amalgamation.txt', 'amalgamation.bat.txt']

output_filename = 'amalgamation.txt'

def amalgamate_files():
    """
    Finds all specified files in the current directory and subdirectories,
    and combines them into a single text file.
    """
    with open(output_filename, 'w', encoding='utf-8') as outfile:
        # Walk through the directory tree
        for root, dirs, files in os.walk('.'):
            # --- Directory Exclusion ---
            # Modify dirs in-place to prevent os.walk from traversing them
            dirs[:] = [d for d in dirs if d not in exclude_dirs]

            for filename in files:
                if filename in exclude_files:
                    continue
                # Check if the file has one of the desired extensions
                if any(filename.endswith(ext) for ext in include_extensions):
                    filepath = os.path.join(root, filename)
                    
                    # --- File Header ---
                    # Normalize path separators for consistency
                    header = f"--- {os.path.normpath(filepath)} ---\n\n"
                    outfile.write(header)
                    
                    # --- File Content ---
                    try:
                        with open(filepath, 'r', encoding='utf-8', errors='ignore') as infile:
                            outfile.write(infile.read())
                        outfile.write('\n\n') # Add spacing between files
                    except Exception as e:
                        outfile.write(f"!!! Error reading file: {e} !!!\n\n")

    print(f"Successfully created '{output_filename}'")

if __name__ == '__main__':
    amalgamate_files()
