<script setup>
  import { ref, computed, onMounted, defineExpose } from 'vue';
  import panzoom from 'panzoom';
  
  const allImages = ref([
    // 'https://external-preview.redd.it/5gMPrBEm3ienyaYZR9ZEer76aaPtJ-lHo7hKHILg0Zo.png?auto=webp&s=1d0dd98e594f4996b20da3b2a278b8519ad3e69a',
    // 'https://i.slow.pics/bmnXcYVG.png',
    // 'https://i.slow.pics/hcGpSScN.png',
    // 'https://i.slow.pics/ZeuCLk82.png',

    // 'https://i.slow.pics/wsXgXlcT.png',
    // 'https://i.slow.pics/j6H9Q1Ls.png',
  ]);

  const allImageNames = computed(() => allImages.value.map(path => path.split('\\').pop().split('/').pop()));

  const image = ref(null);
  const imageContainer = ref(null);

  const selectedImageIndex = ref(0);

  const nearestNeighborSampling = ref(false);
  const imageRendering = computed(() => nearestNeighborSampling.value ? 'pixelated' : 'optimizeQuality');

  const showInfo = ref(false);
  const showHelp = ref(false);

  const scrollXBy = ref(0);
  const scrollYBy = ref(0);

  const innerHeight = ref(0);
  const innerWidth = ref(0);

  const modeFitToWidth = ref(false);
  const modeFitToHeight = ref(true); // revert

  let panzoomInstance = null;

  const useScalingFactor = computed(() => modeFitToHeight.value === false && modeFitToWidth.value === false);

  onMounted(() => {
    console.log('panzoom?', image)
    panzoomInstance = panzoom(image.value, {
      bounds: true,
      boundsPadding: 0.5,
      zoomDoubleClickSpeed: 1,
      maxZoom: 50,
      minZoom: 0.5
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
          panzoomInstance.zoomTo(transform.x, transform.y, 2/3);
          break;
        case "e":
          modeFitToHeight.value = false;
          modeFitToWidth.value = false;
          
          transform = panzoomInstance.getTransform();
          panzoomInstance.zoomTo(transform.x, transform.y, 1.5);
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

  window.electronAPI?.handleArgs((event, value) => {
    allImages.value = value; // TODO revert
  })

</script>

<template>
  <main>
    <div ref="imageContainer" class="image-container">
      <span class="info" v-show="showInfo">
        {{ selectedImageIndex+1 }}/{{ allImages.length }}: {{  allImageNames[selectedImageIndex] }}
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
            <td>y</td>
            <td>Image Sampling: Toggle smooth or nearest neighbor sampling</td>
          </tr>
        </tbody>
      </table>
      <img v-if="allImages.length > 0" id="image" ref="image" 
        :src="allImages[selectedImageIndex]" :class="{ 'fit-to-height': modeFitToHeight, 'fit-to-width': modeFitToWidth }" />
      <p class="none-message" v-else>No images loaded.</p>
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
    width: 50%;
    font-family: inherit;
    font-size:1.5rem;
  }

  .image-container .debug {
    position: fixed;
    top: 4rem;
    left: 1rem;
    -webkit-text-stroke: 1px #333;
    z-index: 99;
    font-weight: bold;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 50%;
    font-family: inherit;
    font-size:1.5rem;
  }

  img.fit-to-height {
    height: 100vh !important;
  }

  img.fit-to-width {
    width: 100vw !important;
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
    /* width: 300px; */
    /* height: 300px; */
  }
</style>
