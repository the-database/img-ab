# img-ab
Bare-bones desktop image A/B comparison tool.
## Usage

### Command Line
Supply images or folders as command line arguments:
```
img-ab.exe image1.png image2.png ...
```

### Drag and Drop
Or select several images or folders and drag and drop onto `img-ab.exe`, or open `img-ab` and then drag and drop images or folders onto the application. 

### Windows File Exporer Integration
Or integrate with Send To in Windows File Explorer, set up as follows:
1. Type shell:sendto in Run (Windows+R)
2. Create a shortcut to img-ab.exe and move it to the Send To folder that was opened in the previous step. 

And then use it:
1. Select one or more files or folders, right click, choose Send To > img-ab.exe
2. Optionally drag and drop more images or folders to add more to compare. 

### Keybindings
Press `h` to view keybindings. 

## Build from Source
With NodeJS LTS installed, check out the source code and run the following from the root directory of the project:
```
npm install
npm run build
npm run make
```
