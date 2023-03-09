<script setup>
  import { ref, computed, onMounted, defineExpose } from 'vue';
  import dragscroll from 'dragscroll';

  const allImages = ref([
    // 'https://i.slow.pics/bmnXcYVG.png',
    // 'https://i.slow.pics/hcGpSScN.png',
    // 'https://i.slow.pics/ZeuCLk82.png',
  ]);

  const image = ref(null);

  const selectedImageIndex = ref(0);

  const showInfo = ref(false);
  const showHelp = ref(false);

  const modeFitToWidth = ref(false);
  const modeFitToHeight = ref(false);
  const scalingFactor = ref(1.0);

  const scaledWidth = computed(() => image.value?.naturalWidth);
  const scaledHeight = computed(() => image.value?.naturalHeight);

  onMounted(() => {
    window.addEventListener('keydown', (e) => {
      console.log("keydown", e.key);
      if (isFinite(e.key)) {
        const numberPressed = parseInt(e.key);
        if (numberPressed <= allImages.value.length && numberPressed > 0) {
          selectedImageIndex.value = numberPressed - 1;
        }
      }

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
          scalingFactor.value = 1.0;
          modeFitToHeight.value = false;
          modeFitToWidth.value = false;
          break;
        case "w":
          scalingFactor.value *= 2/3.0;
          modeFitToHeight.value = false;
          modeFitToWidth.value = false;
          break;
        case "e":
          scalingFactor.value *= 1.5;
          modeFitToHeight.value = false;
          modeFitToWidth.value = false;
          break;
        case "r":
          modeFitToWidth.value = true;
          modeFitToHeight.value = false;
          break;
        case "t":
          modeFitToHeight.value = true;
          modeFitToWidth.value = false;
          break;
      }
    });
  });

  window.electronAPI?.handleArgs((event, value) => {
    allImages.value = value;
  })

</script>

<template>
  <main>
    <div class="image-container">
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
        </tbody>
      </table>
      <img v-if="allImages.length > 0" id="image" ref="image" :style="{height: `${this?.$refs.image?.naturalHeight * scalingFactor}px`}" :src="allImages[selectedImageIndex]" :class="{ 'fit-to-height': modeFitToHeight, 'fit-to-width': modeFitToWidth, 'scale': !modeFitToHeight && !modeFitToWidth }" />
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
    transform: scale(v-bind(scalingFactor));
    transform-origin: top left;
    
  }

  table, tbody, tr, td {
    font-size: inherit;
    font-family: inherit;
  }

  .image-container img {
    image-rendering: optimizeQuality;
    display: block;
    cursor: grab;
  }

  .none-message {
    padding: 1rem;
  }
</style>
