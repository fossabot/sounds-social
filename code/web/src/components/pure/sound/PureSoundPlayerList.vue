<template>
  <div ref="soundList" class="bg-white b--black-20 br bl bb overflow-y-auto" style="max-height: 70vh">
    <div v-for="(sound, soundIndex) in sounds" :key="sound.id" class="pa2">
      <div class="cf">
        <div class="fl w-20">
          <div class="cover pointer"
               @click="$emit('openSound', sound.id)"
               :style="`width: 50px; height: 50px; background-image: url('${sound.cover}')`"></div>
        </div>
        <div class="fl w-50" style="margin-top: 8px">
          <div :class="['f5  pointer', { 'b': isCurrentSound(sound) }]"
               @click="$emit('openSound', sound.id)"
               v-text="sound.title"></div>
          <div class="f6 gray mt1" @click="$emit('openProfile', sound.byId)">
            <span class="pointer" v-text="$t('by')"></span> <span class="pointer" v-text="sound.by"></span>
          </div>
        </div>
        <div class="fl w-30" style="padding-top: 16px">
          <div :class="['dib mr1', { 'pointer gray hover-black': canMoveDown(soundIndex), 'light-gray': !canMoveDown(soundIndex)  }]"
               @click="canMoveDown(soundIndex) && $emit('moveSound', sound.id, -1)"
               style="bottom: 1px">
            <pure-icon icon="angle-up"></pure-icon>
          </div>

          <div :class="['dib mr2', { 'pointer gray hover-black': canMoveUp(soundIndex), 'light-gray': !canMoveUp(soundIndex) }]"
               @click="canMoveUp(soundIndex) && $emit('moveSound', sound.id, 1)">
            <pure-icon icon="angle-down"></pure-icon>
          </div>

          <div :class="['dib mr2', { 'pointer gray hover-black': !isCurrentSound(sound), 'light-gray': isCurrentSound(sound)  }]"
               @click="!isCurrentSound(sound) && $emit('removeSound', sound.id)">
            <pure-icon icon="remove"></pure-icon>
          </div>
          <div
               class="dib hover-black gray pointer"
               @click="playOrPauseSound(sound)">
            <pure-icon :icon="isCurrentSound(sound) && isPlaying ? 'pause' : 'play'"></pure-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
  let hasEmittedLoadingMoreSounds = false

  export default {
    props: {
      sounds: {
        type: Array,
      },
      currentSound: {
        type: Object,
      },
      isPlaying: {
        type: Boolean,
      },
      hasMoreSounds: {
        type: Boolean,
      },
      inRandomMode: {
        type: Boolean,
      },
    },
    mounted () {
      const scrollBreakpoint = 700
      const { soundList } = this.$refs

      soundList.addEventListener('scroll', (e) => {
        if (!this.hasMoreSounds) return null

        const difference = e.target.scrollHeight - e.target.scrollTop

        if (difference < scrollBreakpoint && !hasEmittedLoadingMoreSounds) {
          this.$emit('loadMoreSounds')
          hasEmittedLoadingMoreSounds = true
        }

        if (difference > scrollBreakpoint && hasEmittedLoadingMoreSounds) {
          hasEmittedLoadingMoreSounds = false
        }
      })
    },
    methods: {
      isCurrentSound (sound) {
        return this.currentSound.id === sound.id
      },
      playOrPauseSound (sound) {
        this.isCurrentSound(sound) && this.isPlaying ? this.$emit('pause') : this.playCurrentOrNewSound(sound)
      },
      playCurrentOrNewSound (sound) {
        this.$emit((this.isCurrentSound(sound) ? 'play' : 'playSound'), sound.id)
      },
      canMoveDown (soundIndex) {
        return !this.inRandomMode && soundIndex !== 0
      },
      canMoveUp (soundIndex) {
        return !this.inRandomMode && soundIndex !== (this.sounds.length - 1)
      },
    },
  }
</script>
