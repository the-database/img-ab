<script setup>
  import { ref, reactive, computed, onMounted, watch } from 'vue';
  import { cloneDeep } from 'lodash-es';
  import panzoom from './panzoom';
  //import ImageCompare from "image-compare-viewer";
  import ImageCompare from "./image-compare-viewer";
  import './image-compare-viewer/image-compare-viewer.min.css';

  const state = reactive({
    allImages: [],
    selectedImageIndex: 0,
    selectedImageOverlayIndex: 1,
    nearestNeighborSampling: false,
    showInfo: true,
    showHelp: false,
    modeFitToHeight: false,
    modeFitToWidth: false,
    modeSldier: false,
  });

  const image = ref(null);
  const imageCompare = ref(null);
  const imageOverlay = ref(null);
  const hiddenImages = ref(null);
  const imageContainer = ref(null);

  const imageRendering = computed(() => state.nearestNeighborSampling ? 'pixelated' : 'optimizeQuality');

  let panzoomInstance = null;

  const maximumImageHeight = ref(0);
  const maximumImageHeightPx = computed(() => `${maximumImageHeight.value}px`);

  watch(imageCompare, (newValue, oldValue) => {
      if (imageCompare.value) {

        imageCompare.value.ondragstart = function() { return false; }; // TODO ???

        panzoomInstance = panzoom(imageCompare.value, {
          bounds: true,
          boundsPadding: .1,
          // boundsDisabledForZoom: true,
          zoomDoubleClickSpeed: 1,
          maxZoom: 50,
          minZoom: .1,
          beforeWheel: function(e) {
            // return true;
          }
        });

        const viewer = new ImageCompare(imageCompare.value, {
          hoverStart: true,
        }).mount();
      }
  }, {
    immediate: true
  });

  watch(hiddenImages, ( newValue, oldValue ) => {

    if (hiddenImages.value) {

      hiddenImages.value.forEach(img => {
        img.onload = () => {
          console.log('onload!!!', img)
          if (img.naturalHeight > maximumImageHeight.value) {
            maximumImageHeight.value = img.naturalHeight;
          }
        }
      });
    }
  }, {
    immediate: true,
  });

  function handleSelectImage(index) {
    if (index <= state.allImages.length && index > 0) {
      state.selectedImageIndex = index - 1;
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
        handleSelectImage(numberPressed);
      }

      let transform;

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
        case "s":
          window.ipcRenderer?.handleStartScreenCapture();
          break;
      }
    });
  });

  window.ipcRenderer?.handleArgsReplace((event, value) => {
    console.log('handleArgsReplace', value);
    state.allImages = value.filter(f => (/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i).test(f));
  });

  window.ipcRenderer?.handleArgsAppend((event, value) => {
    console.log('handleArgsAppend', [...state.allImages, ...value]);
    state.allImages = [...state.allImages, ...value.filter(f => (/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i).test(f))];
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
          }, 100);
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
      case 'nearest-neighbor-sampling':
        handleNearestNeighborSampling();
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
        {{ state.selectedImageOverlayIndex+1 }}/{{ state.allImages.length }}: {{  state.allImages[state.selectedImageIndex] }}
      </span>
      <table class="help" v-show="state.showHelp">
        <tbody>
          <tr>
            <td>h</td>
            <td>Show/Hide Help</td>
          </tr>
          <tr>
            <td>1-{{ Math.min(state.allImages.length, 9) }}</td>
            <td>Select Image</td>
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
        </tbody>
      </table>
      

      <div ref="imageCompare">
        <img src="https://i.slow.pics/xYGUwqTk.png" alt="" />
        <img src="https://i.slow.pics/5SSGI45l.png" alt="" />
      </div>

      <img v-if="state.allImages.length > 0" id="image" ref="image"  :src="state.allImages[state.selectedImageIndex]" :class="{ 'fit-to-height': state.modeFitToHeight, 'fit-to-width': state.modeFitToWidth, 'scale': !state.modeFitToHeight && !state.modeFitToWidth }" />
      <p class="none-message" v-else>No images loaded.</p>

      <div style="display:none">
        <img v-for="(image, i) in state.allImages" ref="hiddenImages" :src="image" v-show="state.selectedImageIndex === i" :class="{ 'fit-to-height': state.modeFitToHeight, 'fit-to-width': state.modeFitToWidth, 'scale': !state.modeFitToHeight && !state.modeFitToWidth }"/>
      </div>
    </div>
  </main>
</template>


<style scoped>
  .image-container .info {
    position: fixed;
    top: 1rem;
    left: 1rem;
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
  }

  img.fit-to-height {
    height: 100vh;
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

  .none-message {
    padding: 1rem;
  }

  .image-container {
    width: 100vw;
    height: 100vh;
    cursor: grab;
    overflow: hidden;
  }
</style>
