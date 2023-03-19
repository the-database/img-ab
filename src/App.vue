<script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import panzoom from 'panzoom';

  const allImages = ref([]);

  const image = ref(null);
  const hiddenImages = ref(null);
  const imageContainer = ref(null);

  const selectedImageIndex = ref(0);

  const nearestNeighborSampling = ref(false);
  const imageRendering = computed(() => nearestNeighborSampling.value ? 'pixelated' : 'optimizeQuality');

  const showInfo = ref(false);
  const showHelp = ref(false);

  const modeFitToWidth = ref(false);
  const modeFitToHeight = ref(false);
  const scalingFactor = ref(1.0);

  let panzoomInstance = null;

  const maximumImageHeight = ref(0);
  const maximumImageHeightPx = computed(() => `${maximumImageHeight.value}px`);

  watch(image, ( newValue, oldValue ) => {

    if (image.value) {

      image.value.ondragstart = function() { return false; }; // TODO ???

      panzoomInstance = panzoom(image.value, {
        bounds: true,
        boundsPadding: 1,
        zoomDoubleClickSpeed: 1,
        maxZoom: 50,
        minZoom: 1,
        beforeWheel: function(e) {
          // return true;
        }
      });
    }
  }, {
    immediate: true,
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

  onMounted(() => {

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
        if (numberPressed <= allImages.value.length && numberPressed > 0) {
          selectedImageIndex.value = numberPressed - 1;
        }
      }

      let transform;

      switch (e.key) {
        case "ArrowLeft":
            // Left pressed
            break;
        case "ArrowRight":
            // Right pressed
            break;
        case "ArrowUp":
            // Up pressed
            break;
        case "ArrowDown":
            // Down pressed
            break;
        case "i":
          showInfo.value = !showInfo.value;
          break;
        case "h":
          showHelp.value = !showHelp.value;
          break;
          case "q":
          modeFitToHeight.value = false;
          modeFitToWidth.value = false;
          panzoomInstance.pause();
          panzoomInstance.resume();
          transform = panzoomInstance.getTransform();
          panzoomInstance.moveTo(0, 0);
          panzoomInstance.zoomAbs(0, 0, 1);
          break;
        case "w":
          modeFitToHeight.value = false;
          modeFitToWidth.value = false;
          panzoomInstance.resume();
          transform = panzoomInstance.getTransform();
          panzoomInstance.zoomTo(window.innerWidth/2, window.innerHeight/2, 2/3);
          break;
        case "e":
          modeFitToHeight.value = false;
          modeFitToWidth.value = false;
          panzoomInstance.resume();
          transform = panzoomInstance.getTransform();
          panzoomInstance.zoomTo(window.innerWidth/2, window.innerHeight/2, 1.5);
          break;
        case "r":
          panzoomInstance.moveTo(0, 0);
          panzoomInstance.zoomAbs(0, 0, 1);
          panzoomInstance.pause();
          modeFitToWidth.value = true;
          modeFitToHeight.value = false;
          break;
        case "t":
          panzoomInstance.moveTo(0, 0);
          panzoomInstance.zoomAbs(0, 0, 1);
          panzoomInstance.pause();
          modeFitToHeight.value = true;
          modeFitToWidth.value = false;
          break;
        case "y":
          nearestNeighborSampling.value = !nearestNeighborSampling.value;
          break;
      }
    });
  });

  window.ipcRenderer?.handleArgsReplace((event, value) => {
    console.log('handleArgsReplace', value);
    allImages.value = value.filter(f => (/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i).test(f));
  });

  window.ipcRenderer?.handleArgsAppend((event, value) => {
    console.log('handleArgsAppend', [...allImages.value, ...value]);
    allImages.value = [...allImages.value, ...value.filter(f => (/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i).test(f))];
  });

  if (typeof window.ipcRenderer === 'undefined') {
    allImages.value = [
      'https://i.slow.pics/bmnXcYVG.png',
      'https://i.slow.pics/hcGpSScN.png',
      'https://i.slow.pics/ZeuCLk82.png',
      'https://wallpaperaccess.com/full/2637581.jpg'
    ];
  }

</script>

<template>
  <main>
    <div class="image-container" ref="imageContainer">
      <span class="info" v-show="showInfo">
        {{ selectedImageIndex+1 }}/{{ allImages.length }}: {{  allImages[selectedImageIndex] }}
        <span v-show="!modeFitToHeight && !modeFitToWidth">Zoom={{ Math.floor(scalingFactor * 100) }}%</span>
      </span>
      <table class="help" v-show="showHelp">
        <tbody>
          <tr>
            <td>h</td>
            <td>Show/Hide Help</td>
          </tr>
          <tr>
            <td>1-{{ allImages.length }}</td>
            <td>Select Image</td>
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
            <td>Debug Info</td>
            <td>{{ maximumImageHeightPx }}</td>
          </tr>
        </tbody>
      </table>
      
      <img v-if="allImages.length > 0" id="image" ref="image"  :src="allImages[selectedImageIndex]" :class="{ 'fit-to-height': modeFitToHeight, 'fit-to-width': modeFitToWidth, 'scale': !modeFitToHeight && !modeFitToWidth }" />
      <p class="none-message" v-else>No images loaded.</p>

      <div style="display:none">
        <img v-for="(image, i) in allImages" ref="hiddenImages" :src="image" v-show="selectedImageIndex === i" :class="{ 'fit-to-height': modeFitToHeight, 'fit-to-width': modeFitToWidth, 'scale': !modeFitToHeight && !modeFitToWidth }"/>
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
