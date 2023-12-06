# img-ab
Bare-bones desktop image A/B comparison tool.
## Usage

### Command Line
Supply images or folders as command line arguments:
```
img-ab.exe image1.png image2.png ...
```

### Drag and Drop
Select several images or folders and drag and drop onto `img-ab.exe`, or open `img-ab` and then drag and drop images or folders onto the application. 

### Windows File Exporer Integration
Integrate with Send To in Windows File Explorer, set up as follows:
1. Type shell:sendto in Run (Windows+R)
2. Create a shortcut to img-ab.exe and move it to the Send To folder that was opened in the previous step. 

And then use it:
1. Select one or more files or folders, right click, choose Send To > img-ab.exe
2. Optionally drag and drop more images or folders to add more to compare. 

### Keybindings
Press `h` to view keybindings. 

|||
| --- | --- |
| h | Show/Hide Help |
| 1-9 | Select Image |
| Left/Right Arrow | Prev/Next Image in Comparison |
| Up/Down Arrow or PageUp/PageDown | Prev/Next Comparison |
| Home/End | First/Last Comparison |
| i | Show/Hide Image Info |
| q | Image Zoom: 100% Image Size |
| w | Image Zoom: Zoom Out |
| e | Image Zoom: Zoom In |
| r | Image Zoom: Fit to Width |
| t | Image Zoom: Fit to Height |
| Scroll Wheel Up/Down | Zoom In/Out at Current Cursor Position |
| y | Toggle Nearest Neighbor / Smooth Sampling |


## Build from Source
With NodeJS LTS installed, check out the source code and run the following from the root directory of the project:
```
npm install
npm run build
npm run make
```

## Acknowledgements 
- Testing and feedback:
   - [422415](https://github.com/422415)
   - [Kim2091](https://github.com/Kim2091)
