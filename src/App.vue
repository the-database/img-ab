<script setup>
  import { ref, computed, onMounted, defineExpose } from 'vue';
  import dragscroll from 'dragscroll';
  const DEBUG = true;
  const allImages = ref([
    // 'https://external-preview.redd.it/5gMPrBEm3ienyaYZR9ZEer76aaPtJ-lHo7hKHILg0Zo.png?auto=webp&s=1d0dd98e594f4996b20da3b2a278b8519ad3e69a',
    'https://i.slow.pics/bmnXcYVG.png',
    'https://i.slow.pics/hcGpSScN.png',
    'https://i.slow.pics/ZeuCLk82.png',

    // 'https://i.slow.pics/wsXgXlcT.png',
    // 'https://i.slow.pics/j6H9Q1Ls.png',
  ]);

  const allImageNames = computed(() => allImages.value.map(path => path.split('\\').pop().split('/').pop()));

  const image = ref(null);

  const selectedImageIndex = ref(0);

  const nearestNeighborSampling = ref(false);
  const imageRendering = computed(() => nearestNeighborSampling.value ? 'pixelated' : 'optimizeQuality');

  const showInfo = ref(false);
  const showHelp = ref(false);

  const modeFitToWidth = ref(false);
  const modeFitToHeight = ref(false);
  const scalingFactor = ref(1.0);

  const useScalingFactor = computed(() => modeFitToHeight.value === false && modeFitToWidth.value === false);

  const setZoom = function(scaleBy) {
    const previousScalingFactor = scalingFactor.value;
    scalingFactor.value *= scaleBy;
    modeFitToHeight.value = false;
    modeFitToWidth.value = false;

    // const widthOffset = (image.value?.naturalWidth * scalingFactor.value - image.value?.naturalWidth * previousScalingFactor) / 2.0;
    // const heightOffset = (image.value?.naturalHeight * scalingFactor.value - image.value?.naturalHeight * previousScalingFactor) / 2.0;
    // /4.0 = correct scale for 4k
    // /2.0 = correct scale for 1440p???? 
    const widthScale = (image.value?.naturalWidth * previousScalingFactor) * (scaleBy - 1) / (image.value?.naturalWidth / window.innerWidth * 2.0);
    const heightScale = (image.value?.naturalHeight * previousScalingFactor) * (scaleBy - 1) / (image.value?.naturalHeight / window.innerHeight * 2.0);

    // const widthScale = (window.innerWidth) * (scaleBy - 1);
    // const heightScale = (window.innerHeight) * (scaleBy - 1);

    console.log('ws', widthScale, heightScale)

    const widthOffset = widthScale;
    //const heightOffset = heightScale;//

    const xOffset = (image.value?.naturalWidth * scalingFactor.value - window.innerWidth) / 2.0; 
    const yOffset = (image.value?.naturalHeight * scalingFactor.value - window.innerHeight) / 2.0;

    console.log('offsets', xOffset, yOffset)

    // anchors to top left of viewport
    const scrollXTarget = window.scrollX + ((window.scrollX) * (scaleBy - 1)) + window.innerWidth / 4  //+ xOffset //+ widthScale //+ widthOffset //+ window.innerWidth / 8.0 // ;
    const scrollYTarget = window.scrollY + ((window.scrollY) * (scaleBy - 1)) + window.innerHeight / 4 //+ yOffset //+ heightScale  //+ heightOffset //+ window.innerHeight / 8.0 //;

    // zooms to center but only if not scrolled at start?
    // const scrollXTarget = window.scrollX + widthScale //+ widthOffset //+ window.innerWidth / 8.0 // ;
    // const scrollYTarget = window.scrollY + heightScale  //+ heightOffset //+ window.innerHeight / 8.0 //;
    // const scrollXTarget = window.scrollX + xOffset //+ widthOffset //+ window.innerWidth / 8.0 // ;
    // const scrollYTarget = window.scrollY + yOffset  //+ heightOffset //+ window.innerHeight / 8.0 //;

    // attempt to combine both - overshoots
    // const scrollXTarget = window.scrollX + (window.scrollX * (scaleBy - 1)) + widthScale;
    // const scrollYTarget = window.scrollY + (window.scrollY * (scaleBy - 1)) + heightScale;

    // console.log(scaleBy - 1, widthOffset, heightOffset)
    // window.scrollBy(, ); // ???

    window.scroll(scrollXTarget, scrollYTarget);
    
    setTimeout(() => {
      window.scroll(scrollXTarget, scrollYTarget);
    }, 0);
    
    
  }

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
          // const previousScrollX = window.scrollX;
          // const previousScrollY = window.scrollY;
          // scalingFactor.value *= 2/3.0;
          // modeFitToHeight.value = false;
          // modeFitToWidth.value = false;
          // window.scrollBy(window.scrollX * -2/3.0, window.scrollY * -2/3.0);
          setZoom(2/3.0);
          break;
        case "e":
          // scalingFactor.value *= 1.5;
          // modeFitToHeight.value = false;
          // modeFitToWidth.value = false;
          // window.scrollBy(window.scrollX / 1.5, window.scrollY / 1.5);
          setZoom(1.5);
          break;
        case "r":
          modeFitToWidth.value = true;
          modeFitToHeight.value = false;
          break;
        case "t":
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
    if (!DEBUG) {
      allImages.value = value;
    }
    
  })

</script>

<template>
  <main>
    <div class="image-container">
      <span class="info" v-show="showInfo">
        {{ selectedImageIndex+1 }}/{{ allImages.length }}: {{  allImageNames[selectedImageIndex] }}
        <span v-show="useScalingFactor">Zoom={{ Math.floor(scalingFactor * 100) }}%</span>
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
      <img v-if="allImages.length > 0" id="image" ref="image" 
        :style="{height: useScalingFactor ? `${this?.$refs.image?.naturalHeight * scalingFactor}px` : 'auto', width: useScalingFactor ? `${this?.$refs.image?.naturalWidth * scalingFactor}px` : 'auto'}" 
        :src="allImages[selectedImageIndex]" :class="{ 'fit-to-height': modeFitToHeight, 'fit-to-width': modeFitToWidth, 'scale': useScalingFactor }" />
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

  img.fit-to-height {
    height: 100vh !important;
  }

  img.fit-to-width {
    width: 100vw !important;
  }

  img.scale {
    /* transform: scale(v-bind(scalingFactor));
    transform-origin: top left; */
    
  }

  table, tbody, tr, td {
    font-size: inherit;
    font-family: inherit;
  }

  .image-container img {
    image-rendering: v-bind(imageRendering);
    display: block;
    margin: 0 auto;
  }

  .none-message {
    padding: 1rem;
  }
</style>
