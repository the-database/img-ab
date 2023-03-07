<script setup>
  import { ref, computed, watch, onMounted, defineExpose } from 'vue';
  import panzoom from 'panzoom';
  
  const allImages = ref([
    // 'https://external-preview.redd.it/5gMPrBEm3ienyaYZR9ZEer76aaPtJ-lHo7hKHILg0Zo.png?auto=webp&s=1d0dd98e594f4996b20da3b2a278b8519ad3e69a',
    // 'https://i.slow.pics/bmnXcYVG.png',
    // 'https://i.slow.pics/hcGpSScN.png',
    // 'https://i.slow.pics/ZeuCLk82.png',
'data:image/png;base64,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'
    // 'https://i.slow.pics/wsXgXlcT.png',
    // 'https://i.slow.pics/j6H9Q1Ls.png',
    // 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/1920px-Image_created_with_a_mobile_phone.png'
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

  watch(image, ( newValue, oldValue ) => {
    console.log('watch image?', image.value)
    if (image.value) {
      panzoomInstance = panzoom(image.value, {
        bounds: true,
        boundsPadding: 1,
        zoomDoubleClickSpeed: 1,
        maxZoom: 50,
        minZoom: 0.1,
        beforeWheel: function(e) {
          return true;
        }
      });
    }
  }, {
    immediate: true,
  });

  onMounted(() => {

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
    max-width: 100vw;
    max-height: 100vh;
    width: 300px;
    height: 300px;
    overflow:hidden;
    margin:0 auto;
  }
</style>
