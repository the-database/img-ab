<script setup>
  import { ref, reactive, computed, onMounted, watch } from 'vue';
  import { cloneDeep } from 'lodash-es';
  import panzoom from './panzoom';
  import ImageCompare from "./image-compare-viewer";
  import './image-compare-viewer/image-compare-viewer.min.css';

  const state = reactive({
    allImages: [],
    selectedImageIndex: 0,
    selectedOverlayImageIndex: 1,
    nearestNeighborSampling: false,
    showInfo: true,
    showHelp: false,
    modeFitToHeight: false,
    modeFitToWidth: false,
    modeSlider: true,
  });

  const image = ref(null);
  const imageCompare = ref(null);
  const imagePanZoom = ref(null);
  const hiddenImages = ref(null);
  const imageContainer = ref(null);

  const imageRendering = computed(() => state.nearestNeighborSampling ? 'pixelated' : 'optimizeQuality');

  let panzoomInstance = null;
  let imageCompareViewerInstance = null;

  const maximumImageHeight = ref(0);
  const maximumImageHeightPx = computed(() => `${maximumImageHeight.value}px`);

  watch([imagePanZoom, imageCompare], ([newImagePanZoom, newImageCompare], [prevImagePanZoom, prevImageCompare]) => {
    if (newImageCompare && newImagePanZoom) {
      
      imageCompareViewerInstance = new ImageCompare(newImageCompare, {
          hoverStart: true,
          smoothing: false,
        });
        
      imageCompareViewerInstance.mount();
      handleModeSlider();
    }

    if (newImagePanZoom) {
      newImagePanZoom.ondragstart = function() { return false; }; // TODO ???

      panzoomInstance = panzoom(newImagePanZoom, {
        bounds: true,
        boundsPadding: 0.1,
        zoomDoubleClickSpeed: 1,
        maxZoom: 50,
        minZoom: .1,
        beforeWheel: function(e) {
          // return true;
        }
      });
    }
  });

  watch(hiddenImages, ( newValue, oldValue ) => {
    updateMaximumImageHeight();

  }, {
    immediate: true,
  });

  watch(() => state.allImages, (newVal, oldVal) => {
    updateMaximumImageHeight();
  }, {
    immediate: true
  });

  function updateMaximumImageHeight() {
    setTimeout(() => {
      if (hiddenImages.value) {
        maximumImageHeight.value = 0;
        for (const img of hiddenImages.value) {
          if (img.complete) {
            checkSingleImageHeight(img);
          }
          else {
            img.onload = () => {
              checkSingleImageHeight(img);
            }
          }
        }
      }
    }, 100);
  }

  function checkSingleImageHeight(img) {
    if (img.naturalHeight > maximumImageHeight.value) {
      maximumImageHeight.value = img.naturalHeight;

      setTimeout(() => {
        handleModeFitToHeight();
      }, 0);

      setTimeout(() => {
        handleMode100Zoom();
      }, 0);
    }
  }

  function handleSelectImage(index) {
    if (index <= state.allImages.length && index > 0) {
      state.selectedImageIndex = index - 1;
    }
  }

  function handleSelectOverlayImage(index) {
    if (index <= state.allImages.length && index > 0) {
      state.selectedOverlayImageIndex = index - 1;
    }
  }

  function handleShowInfo() {
    state.showInfo = !state.showInfo;
  }

  function handleShowHelp() {
    state.showHelp = !state.showHelp;
  }

  function handleZoomIn() {
    state.modeFitToHeight = false;
    state.modeFitToWidth = false;
    panzoomInstance.resume();
    panzoomInstance.zoomTo(window.innerWidth/2, window.innerHeight/2, 1.5);
  }

  function handleZoomOut() {
    state.modeFitToHeight = false;
    state.modeFitToWidth = false;
    panzoomInstance.resume();
    panzoomInstance.zoomTo(window.innerWidth/2, window.innerHeight/2, 2/3);
  }

  function handleMode100Zoom() {
    state.modeFitToHeight = false;
    state.modeFitToWidth = false;
    panzoomInstance.pause();
    panzoomInstance.resume();
    panzoomInstance.moveTo(0, 0);
    panzoomInstance.zoomAbs(0, 0, 1);
  }

  function handleModeFitToWidth() {
    panzoomInstance.moveTo(0, 0);
    panzoomInstance.zoomAbs(0, 0, 1);
    panzoomInstance.pause();
    state.modeFitToWidth = true;
    state.modeFitToHeight = false;
  }

  function handleModeFitToHeight() {
    panzoomInstance.moveTo(0, 0);
    panzoomInstance.zoomAbs(0, 0, 1);
    panzoomInstance.pause();
    state.modeFitToHeight = true;
    state.modeFitToWidth = false;
  }

  function handleNearestNeighborSampling() {
    state.nearestNeighborSampling = !state.nearestNeighborSampling;
  }

  function handleModeSlider() {
    state.modeSlider = !state.modeSlider;
    imageCompareViewerInstance.toggleSlider();
  }

  onMounted(() => {

    
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      window.ipcRenderer?.handleContextMenu(cloneDeep(state));
    });

    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();

      let pathArr = [];
      for (const f of event.dataTransfer.files) {
          // Using the path attribute to get absolute file path
          console.log('File Path of dragged files: ', f.path)
          pathArr.push(f.path); // assemble array for main.js
      }
      console.log(pathArr);
      const ret = window.ipcRenderer?.handleDragAndDrop(pathArr);
      console.log(ret);
    });

    window.addEventListener('keydown', (e) => {
      console.log("keydown", e.key);
      if (isFinite(e.key)) {
        const numberPressed = parseInt(e.key);
        if (e.ctrlKey) {
          handleSelectOverlayImage(numberPressed);
        } else {
          handleSelectImage(numberPressed);
        }
      }

      switch (e.key) {
        case "ArrowLeft":
            if (state.selectedImageIndex > 0) {
              state.selectedImageIndex--;
            }
            break;
        case "ArrowRight":
            if (state.selectedImageIndex < state.allImages.length - 1) {
              state.selectedImageIndex++;
            }
            break;
        case "ArrowUp":
            // Up pressed
            break;
        case "ArrowDown":
            // Down pressed
            break;
        case "i":
          handleShowInfo();
          break;
        case "h":
          handleShowHelp();
          break;
        case "q":
          handleMode100Zoom();
          break;
        case "w":
          handleZoomOut();
          break;
        case "e":
          handleZoomIn();
          break;
        case "r":
          handleModeFitToWidth();
          break;
        case "t":
          handleModeFitToHeight();
          break;
        case "y":
          handleNearestNeighborSampling();
          break;
        case "a":
          handleModeSlider();
          break;
        case "s":
          window.ipcRenderer?.handleStartScreenCapture();
          break;
      }
    });
  });

  function initImageIndex() {

    state.selectedImageIndex = 0;

    if (state.allImages.length < 2) {
      state.selectedOverlayImageIndex = 0;
    }
    else {
      if (state.selectedOverlayImageIndex === 0) {
        state.selectedOverlayImageIndex = 1;
      }
    }
  }

  window.ipcRenderer?.handleArgsReplace((event, value) => {
    console.log('handleArgsReplace', value);
    state.allImages = value.filter(f => (/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i).test(f));
    initImageIndex();
  });

  window.ipcRenderer?.handleArgsAppend((event, value) => {
    console.log('handleArgsAppend', [...state.allImages, ...value]);
    state.allImages = [...state.allImages, ...value.filter(f => (/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i).test(f))];
    initImageIndex();
  });

  window.ipcRenderer?.handleContextMenuCommand((event, command, args) => {
    console.log('handleContextMenuCommand', event, command, args);
    switch (command) {
      case 'select-image':
        console.log('select-image', args.index+1);
        handleSelectImage(args.index+1);
        if (args.forScreenshot) {
          setTimeout(() => {
            window.ipcRenderer?.handleSelectedImageForScreenshot(cloneDeep(state));
          }, 1000);
        }
        break;
      case 'show-info':
        handleShowInfo();
        break;
      case 'show-help':
        handleShowHelp();
        break;
      case 'zoom-in':
        handleZoomIn();
        break;
      case 'zoom-out':
        handleZoomOut();
        break;
      case 'mode-100-zoom':
        handleMode100Zoom();
      case 'mode-fit-to-width':
        handleModeFitToWidth();
        break;
      case 'mode-fit-to-height':
        handleModeFitToHeight();
        break;
      case 'mode-slider':
        handleModeSlider();
        break;
      case 'nearest-neighbor-sampling':
        handleNearestNeighborSampling();
        break;
      case 'request-screen-capture':
        if (state.modeSlider) {
          console.log("REQUEST SCREEN CAPTURE: SLIDER MODE");
          window.ipcRenderer?.handleSelectedImageForScreenshotSlider(cloneDeep(state));
        }
        else {
          console.log("REQUEST SCREEN CAPTURE: OVERLAY MODE");
          handleSelectImage(1);
          setTimeout(() => {
            window.ipcRenderer?.handleSelectedImageForScreenshot(cloneDeep(state));
          }, 100);
        }
        break;
    }
  });

  if (typeof window.ipcRenderer === 'undefined') {
    state.allImages = [
      'https://i.slow.pics/xYGUwqTk.png',
      'https://i.slow.pics/5SSGI45l.png',
      'https://wallpaperaccess.com/full/2637581.jpg'
    ];
  }

</script>

<template>
  <main>
    <div class="image-container" ref="imageContainer">
      <span class="info" v-show="state.showInfo">
        {{ state.selectedImageIndex+1 }}/{{ state.allImages.length }}: {{  state.allImages[state.selectedImageIndex] }}
      </span>
      
      <span class="info-right" v-show="state.showInfo && state.modeSlider">
        {{ state.selectedOverlayImageIndex+1 }}/{{ state.allImages.length }}: {{  state.allImages[state.selectedOverlayImageIndex] }}
      </span>
      <table class="help" v-show="state.showHelp">
        <tbody>
          <tr>
            <td>h</td>
            <td>Show/Hide Help</td>
          </tr>
          <tr>
            <td>1-9</td>
            <td>Select Image (Overlay Mode) / Select Left Image (Slider Mode)</td>
          </tr>
          <tr>
            <td>Ctrl+1-9</td>
            <td>Select Right Image (Slider Mode Only)</td>
          </tr>
          <tr>
            <td>Left/Right Arrow</td>
            <td>Prev/Next Image in Comparison</td>
          </tr>
          <tr>
            <td>Up/Down Arrow or PageUp/PageDown</td>
            <td>Prev/Next Comparison</td>
          </tr>
          <tr>
            <td>Home/End</td>
            <td>First/Last Comparison</td>
          </tr>
          <tr>
            <td>i</td>
            <td>Show/Hide Image Info</td>
          </tr>
          <tr>
            <td>a</td>
            <td>Toggle Overlay/Slider Mode</td>
          </tr>
          <tr>
            <td>q</td>
            <td>Image Zoom: 100% Image Size</td>
          </tr>
          <tr>
            <td>w</td>
            <td>Image Zoom: Zoom Out</td>
          </tr>
          <tr>
            <td>e</td>
            <td>Image Zoom: Zoom In</td>
          </tr>
          <tr>
            <td>r</td>
            <td>Image Zoom: Fit to Width</td>
          </tr>
          <tr>
            <td>t</td>
            <td>Image Zoom: Fit to Height</td>
          </tr>
          <tr>
            <td>Scroll Wheel Up/Down</td>
            <td>Zoom In/Out at Current Cursor Position</td>
          </tr>
          <tr>
            <td>y</td>
            <td>Toggle Nearest Neighbor / Smooth Sampling</td>
          </tr>
          <tr>
            <td>s</td>
            <td>Take Screen Capture of All Images</td>
          </tr>
          <tr>
            <td>c</td>
              <td>Clear Comparison</td>
            </tr>
            <tr>
              <td>Esc</td>
              <td>Exit</td>
            </tr>
        </tbody>
      </table>
      

      <div ref="imagePanZoom" class="image-panzoom" :class="{'center': state.modeFitToHeight}" v-if="state.allImages.length > 0">
        <div ref="imageCompare" class="image-compare">
          <img :src="state.allImages[state.selectedImageIndex]" alt="" :class="{ 'fit-to-height': state.modeFitToHeight, 'fit-to-width': state.modeFitToWidth, 'scale': !state.modeFitToHeight && !state.modeFitToWidth }" />
          <img :src="state.allImages[state.selectedOverlayImageIndex]" alt=""  />
        </div>
      </div>
      <div class="welcome-message" v-else>
        <h1 class="welcome-title">img-ab</h1>
        <p>drag and drop one or more images or folders to get started</p>

        <table class="welcome-help" >
          <tbody>
            <tr>
              <td>h</td>
              <td>Show/Hide Help</td>
            </tr>
            <tr>
              <td>1-9</td>
              <td>Select Image (Overlay Mode) / Select Left Image (Slider Mode)</td>
            </tr>
            <tr>
              <td>Ctrl+1-9</td>
              <td>Select Right Image (Slider Mode Only)</td>
            </tr>
            <tr>
              <td>Left/Right Arrow</td>
              <td>Prev/Next Image in Comparison</td>
            </tr>
            <tr>
              <td>Up/Down Arrow or PageUp/PageDown</td>
              <td>Prev/Next Comparison</td>
            </tr>
            <tr>
              <td>Home/End</td>
              <td>First/Last Comparison</td>
            </tr>
            <tr>
              <td>i</td>
              <td>Show/Hide Image Info</td>
            </tr>
            <tr>
              <td>a</td>
              <td>Toggle Overlay/Slider Mode</td>
            </tr>
            <tr>
              <td>q</td>
              <td>Image Zoom: 100% Image Size</td>
            </tr>
            <tr>
              <td>w</td>
              <td>Image Zoom: Zoom Out</td>
            </tr>
            <tr>
              <td>e</td>
              <td>Image Zoom: Zoom In</td>
            </tr>
            <tr>
              <td>r</td>
              <td>Image Zoom: Fit to Width</td>
            </tr>
            <tr>
              <td>t</td>
              <td>Image Zoom: Fit to Height</td>
            </tr>
            <tr>
              <td>Scroll Wheel Up/Down</td>
              <td>Zoom In/Out at Current Cursor Position</td>
            </tr>
            <tr>
              <td>y</td>
              <td>Toggle Nearest Neighbor / Smooth Sampling</td>
            </tr>
            <tr>
              <td>s</td>
              <td>Take Screen Capture of All Images</td>
            </tr>
            <tr>
              <td>c</td>
              <td>Clear Comparison</td>
            </tr>
            <tr>
              <td>Esc</td>
              <td>Exit</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="display:none">
        <img v-for="(image, i) in state.allImages" ref="hiddenImages" :src="image" v-show="state.selectedImageIndex === i" :class="{ 'fit-to-height': state.modeFitToHeight, 'fit-to-width': state.modeFitToWidth, 'scale': !state.modeFitToHeight && !state.modeFitToWidth }"/>
      </div>
    </div>
  </main>
</template>


<style scoped>
  .image-container .info {
    position: fixed;
    top: 0rem;
    left: 1rem;
    -webkit-text-stroke: 1px #333;
    z-index: 99;
    font-weight: bold;
    font-size:1.5rem;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .image-container .info-right {
    position: fixed;
    top: 2rem;
    right: 1rem;
    -webkit-text-stroke: 1px #333;
    z-index: 99;
    font-weight: bold;
    font-size:1.5rem;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .image-container table.help {
    position: fixed;
    top: 4rem;
    left: 1rem;
    -webkit-text-stroke: 1px #333;
    z-index: 99;
    font-weight: bold;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    
    font-family: inherit;
    font-size:1.5rem;
    text-align: left;
  }

  img.fit-to-height {
    height: 100vh;
    left: 50%;
    transform: translateX(-50%);
  }

  img.fit-to-width {
    width: 100vw;
  }

  img.scale {
    height: v-bind(maximumImageHeightPx);
  }

  table, tbody, tr, td {
    font-size: inherit;
    font-family: inherit;
  }

  .image-container img {
    image-rendering: v-bind(imageRendering);
    display: block;
  }

  .welcome-message {
    margin-left:auto;
    margin-right:auto;
    text-align:center;
    padding: 1rem;
  }

  .welcome-title {
    font-size: 8rem;
    opacity: 0.25;
  }

  .welcome-help {
    text-align:left;
    font-size: 0.8rem;
    line-height: 2;
    margin-left: auto;
    margin-right: auto;
    margin-top: 4rem;
  }

  .image-container {
    width: 100vw;
    height: 100vh;
    cursor: grab;
    overflow: hidden;
  }

  .image-panzoom {
    display: inline-block;
  }

  .image-panzoom.center {
    left: 50%; 
    transform: translateX(-50%) !important;
  }
</style>
