<template>
  <div class="comic-card">
    <router-link v-if="!comic.isPaidImage"
                 :comic="comic"
                 :to="{ name: 'comic', params: { comicName: `${comic.name }` } }">
      <!-- NEW AND WIP TRIANGLES -->
      <div class="triangle-wrapper triangle-wrapper-left" v-if="isNewComic">
        <div class="triangle-inner">
          <label class="triangle-label" title="Added within 7 days">NEW</label>
        </div>
      </div>
      <div class="triangle-wrapper triangle-wrapper-right" v-if="comic.state === 'wip'">
        <div class="triangle-inner">
          <label class="triangle-label" title="Comic not finished">WIP</label>
        </div>
      </div>
      <div class="triangle-wrapper triangle-wrapper-right" v-if="comic.state === 'cancelled'">
        <div class="triangle-inner">
          <label class="triangle-label triangle-label-cancelled" title="Cancelled">DEAD</label>
        </div>
      </div>

      <!-- PIC -->
      <div class="imgContainer">
        <picture @click="storeClickedComicData()" style="overflow: hidden;">
          <source media="(min-width: 901px)"
                  type="image/webp"
                  :srcset="`${config.comicsBucketName}/${comicNameUrlParsed}/thumbnail.webp`"
                  @load="onLoadFinished">

          <source media="(max-width: 900px)"
                  type="image/webp"
                  :srcset="`${config.comicsBucketName}/${comicNameUrlParsed}/thumbnail.webp`"
                  @load="onLoadFinished">

          <img :src="`${config.comicsBucketName}/${comicNameUrlParsed}/thumbnail.jpg`"
               :alt="`${comic.name}, thumbnail`"
               @load="onLoadFinished">
        </picture>
      </div>
    </router-link>

    <!-- AD -->
    <a v-else :href="comic.link" @click="savePaidImageClick()" target="_blank">
      <div class="triangle-wrapper triangle-wrapper-right" v-if="comic.isPaidImage">
        <div class="triangle-inner">
          <label class="triangle-label">AD</label>
        </div>
      </div>
      <div class="imgContainer">
        <picture>
          <source media="(min-width: 901px)" :srcset="`${config.paidImagesBucketName}/${comic.id}-big.${comic.filetype}`">
          <source media="(max-width: 900px)" :srcset="`${config.paidImagesBucketName}/${comic.id}-small.${comic.filetype}`">
          <img :src="`${config.paidImagesBucketName}/${comic.id}-big.${comic.filetype}`">
        </picture>
      </div>
    </a>

    <div v-if="!comic.isPaidImage" class="comic-card-inner-container">
      <div style="margin: 4px 0">
        <!-- NAME -->
        <router-link :comic="comic" :to="{ name: 'comic', params: { comicName: `${comic.name }` } }" class="comic-card-link">
          <!-- <p class="comic-card-comic-title">Navnet</p> -->
          <p class="comic-card-comic-title">{{comic.name}}</p>
        </router-link>

        <!-- ARTIST -->
        <router-link :comic="comic"
                     :to="{ name: 'artist', params: { artistName: comic.artist } }"
                     class="comic-card-link underline-link comicCardArtist">
          {{comic.artist}}
        </router-link>
      </div>

      <!-- PAGES AND RATINGS -->
      <div class="horiz-card-row icons-and-numbers-row" v-if="detailLevel !== 'minimum'">
        <p title="Number of pages">
          <PagesIcon title="Number of pages"/>{{comic.numberOfPages}}
        </p>

        <p title="User rating">
          <StarIcon title="User rating"/>{{formatRating(comic.userRating)}}
        </p>
      </div>

      <!-- ALL KEYWORDS -->
      <div class="keywordContainer" v-if="shouldShowKeywords">
        <div class="emphasized-keyword">{{convertTagName(comic.cat)}}</div>
        <div class="emphasized-keyword">{{comic.tag}}</div>
        <div 
          :class="{'keyword': clickableKeyword, 
                   'keywordStatic': !clickableKeyword}"
          v-for="keyword in keywords"
          :key="keyword.id"
          @click="addSelectedKeyword(keyword)"
        >
          {{keyword.name}}
        </div>
      </div>
      <div class="keyword" v-if="isShowingKeywords && shouldShowCatTagLoad" @click="() => isShowingKeywords = false">
        <HideTags/> Hide tags
      </div>

      
      <div class="keyword" v-if="isLoadingKeywords">
        Loading...
      </div>

      <!-- KEYWORDS, CAT, TAG -->
      <div class="keywordContainer" v-if="!shouldShowKeywords && shouldShowCatTagLoad && !isLoadingKeywords">
        <div class="emphasized-keyword">{{convertTagName(comic.cat)}}</div>
        <div class="emphasized-keyword">{{comic.tag}}</div>
        <div class="keyword" v-if="!isShowingKeywords" @click="showKeywords()">
          <Tags title=""/> Load tags
        </div>
      </div>

      <!-- RATE -->
      <VotingButton style="margin-bottom: 0.15rem;"
                    class="mt-16"
                    :comic="comic"
                    v-if="$store.getters.isAuthenticated"/>

      <p v-if="detailLevel === 'high'" class="margin-top-4" style="font-size: 12px;">
        <label title="Updated" style="font-size: 0.8rem;">
          <RefreshIcon title="Updated"/> {{prettyDate(comic.updated)}}
        </label>
        <br/>
        <label title="Created" style="font-size: 0.8rem;">
          <PlusIcon title="Created"/> {{prettyDate(comic.created)}}
        </label>
      </p>
    </div>

    <ComicCardPaidImage v-else :paidImage="comic" class="comic-card-inner-container"/>
  </div>
</template>

<script>
import paidImageApi from '../api/advertisingApi'

import VotingButton from '@/components/VotingButton.vue'
import PagesIcon from 'vue-material-design-icons/FileOutline.vue'
import StarIcon from 'vue-material-design-icons/StarOutline.vue'
import PlusIcon from 'vue-material-design-icons/Plus.vue'
import RefreshIcon from 'vue-material-design-icons/Refresh.vue'
import Tags from 'vue-material-design-icons/TagMultiple.vue'
import HideTags from 'vue-material-design-icons/TagRemove.vue'
import ComicCardPaidImage from './ComicCardPaidImage.vue'
import { mapGetters } from 'vuex'
import config from '@/config.json'

export default {
  name: 'comic-card',
  
  components: {
    VotingButton,
    PagesIcon,
    StarIcon,
    PlusIcon,
    RefreshIcon,
    Tags,
    HideTags,
    ComicCardPaidImage,
  },

  props: {
    comic: Object,
    clickableKeyword: {
      type: Boolean,
      default: true
    }
  },

  data: function () {
    return {
      isNewComic: new Date() - new Date(this.comic.created) < 2*604800000,  // todo 1 week = 604800000
      recentlyFinished: this.comic.finished && (new Date() - new Date(this.comic.updated) < 200*604800000),
      isShowingKeywords: false,
      isLoadingKeywords: false,
      config,
    }
  },

  computed: {
    ...mapGetters([
      'comicKeywords',
      'detailLevel',
    ]),

    shouldShowCatTagLoad () {
      return this.detailLevel !== 'minimum'
    },

    shouldShowKeywords () {
      return this.detailLevel === 'high' || (this.isShowingKeywords && this.detailLevel !== 'minimum')
    },

    comicNameUrlParsed () {
      return this.comic.name.replace(/ /g, '%20')
    },

    keywords () {
      if (this.comic.keywords) {
        return this.comic.keywords
      }
      if (this.comic.id in this.comicKeywords) {
        return this.comicKeywords[this.comic.id]
      }
      return []
    },
  },

  methods: {
    async showKeywords () {
      if (this.comic.id in this.comicKeywords) {
        this.isShowingKeywords = true
      }
      else {
        this.isLoadingKeywords = true
        await this.$store.dispatch('getComicKeywords', this.comic.id)
        this.isShowingKeywords = true
        this.isLoadingKeywords = false
      }
    },

    onLoadFinished () {
      this.$emit('image-load')
    },

    formatRating: function (number) {
      if (number == 0 || !number) { return '-' }
      if (number > 8.5) { return Math.round(number * 100) / 100 }
      else { return Math.round(number * 10) / 10 }
    },

    prettyDate: inputDateString => (new Date(inputDateString)).toDateString().substring(4),

    storeClickedComicData: function () {
      this.$store.dispatch('storeClickedComic', this.comic)
    },

    savePaidImageClick () {
      if (this.comic.isPaidImage) {
        paidImageApi.logAdClick(this.comic.id)
      }
    },

    addSelectedKeyword (keyword) {
      if (this.clickableKeyword) {
        this.$store.commit('setWasKwSelectedFromList', false)
        this.$store.dispatch('addSelectedKeyword', keyword)
      }
    },

    convertTagName (tagName) {
      return tagName=='Pokemon' ? 'Pkmn' : tagName
    }
  },
}
</script>

<style lang="scss">
@import "../scss/colors.scss";
.triangle-wrapper {
  position: absolute; top: 0;
  z-index: 2;
}
.triangle-wrapper-left {
  left: 0;
  .triangle-inner {
    border-width: 60px 60px 0 0;
    border-color: $themeGray0 transparent transparent transparent;
    .triangle-label {
      color: $themeGreen1Darker;
      position: absolute;
      top: 10px;
      transform: rotate(-45deg);
      left: 2px;
      font-weight: 400;
    }
  }
}
.triangle-wrapper-right {
  right: 0;
  .triangle-inner {
    border-width: 0 60px 60px 0;
    border-color: transparent $themeGray0 transparent transparent;
    .triangle-label {
      position: absolute;
      color: $themeDark1;
      top: 10px;
      right: 5px;
      font-weight: 400;
      transform: rotate(45deg);
    }
    .triangle-label-cancelled {
      right: 3px;
      top: 11px;
      font-size: 15px;
    }
  }
}
.triangle-inner {
  width: 0;
  height: 0;
  border-style: solid;
  .triangle-label {
    cursor: pointer;
    font-size: 0.9rem;
  }
}

.emphasized-keyword {
  font-size: 12px;
  border: 0.5px solid #a6a6a6;
  margin: 1px 3px;
  padding: 0.5px 6px 1px 6px;
  border-radius: 10px;
  background: $themeGray5;
  color: white !important;
  font-weight: bold !important;
  &:hover {
    cursor: default;
  }
}

@media (max-width: 900px) {
  .triangle-wrapper-left {
    .triangle-inner {
      border-width: 40px 40px 0 0;
      .triangle-label {
        font-size: 11px;
        top: 5px;
        left: 1px;
      }
    }
  }

  .triangle-wrapper-right {
    .triangle-inner {
      border-width: 0 40px 40px 0;
      .triangle-label {
        font-size: 11px;
        top: 5px;
        right: 2px;
      }
      .triangle-label-cancelled {
        right: 0px;
      }
    }
  }
}

.comic-card-link {
  width: 100%;
  p {
    word-wrap: break-word;
  }
}

.comicCardArtist {
  display: block;
  width: fit-content;
  margin: 4px auto 0 auto;
  font-weight: 400;
}

.comic-card {
  position: relative;
  width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 2px;
  margin: 10px;
  padding-bottom: 8px;
  background: rgba(255,255,255,0.45);
  border-radius: 4px;
  box-shadow: 0 0px 10px rgba(0,0,0,0.15);
  &:after {
    box-shadow: 0 0px 14px rgba(0,0,0,0.15);
    opacity: 0;
    transition: opacity 0.15s ease-out;
    content: ' ';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
  }
  &:hover::after {
    opacity: 1;
  }
  img {
    height: 282px;
    width: 200px;
  }
  .imgContainer {
    width: 100%;
    overflow: hidden;
  }
  a {
    text-decoration: none;
  }
  p, div {
    color: $cardTextColorLight;
  }
  .comic-card-inner-container {
    display: flex; flex-direction: column;
    align-items: center;
    height: 100%;
    width: 100%;
    justify-content: space-between;
  }
  .horiz-card-row {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    width: 90%;
    p:hover {
      cursor: default;
    }
  }
  .comic-card-comic-title {
    font-weight: 400;
    margin: 0px 10px;
    text-align: center;
    color: $cardTextColorLight;
  }
  .VotingButton {
    margin-top: 4px;
  }


  @media (max-width: 900px) {
    width: 100px;
    margin: 6px;
    font-size: 14px;
    a, p {
      font-size: 15px;
    }
    .comic-card-comic-title {
      font-size: 15px;
      margin: 0px 2px;
    }
    img {
      height: 141px;
      width: 100px;
    }
    .VotingButton {
      width: 76%;
    }
  }
}

.dark {
  .emphasized-keyword {
    background: $themeGray6;
    border-color: $themeGray6;
  }

  .triangle-wrapper-right {
    .triangle-inner {
      border-color: transparent $themeDark2 transparent transparent;
      .triangle-label {
        color: inherit;
      }
    }
  }
  .triangle-wrapper-left {
    .triangle-inner {
      border-color: $themeDark2 transparent transparent transparent;
    }
  }

  .comic-card {
    background-color: $themeDark2;
    box-shadow: 0px 0px 10px rgba(0,0,0,0.4);
    &:after {
      box-shadow: 0 0 10px 2px rgba(0,0,0,0.5);
      opacity: 0;
      transition: opacity 0.15s ease-out;
      content: ' ';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
    }
    &:hover::after {
      opacity: 1;
    }
  }
}

.keywordContainer {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: row;
  flex-flow: row wrap;
  justify-content: center;
}
</style>
