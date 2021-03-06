import axios from 'axios'
import config from '@/config.json'
let baseUrl = config.apiBaseUrl

export default {
  async getComicsPaginated ({categories, tags, keywordIds, search, order, page, shouldGetKeywords}) {
    let params = {
      page: page || 1,
      order,
    }
    if (categories) { params.categories = categories }
    if (tags) { params.tags = tags }
    if (keywordIds && keywordIds.length>0) { params.keywordIds = keywordIds }
    if (search) { params.search = search }
    if (shouldGetKeywords) { params.getKeywords = true }

    let response = await axios.get(baseUrl + '/comicsPaginated', { params })
    for (var comic of response.data.comics) {
      comic.created = new Date(comic.created)
      comic.updated = new Date(comic.updated)
    }

    return response.data
  },

  async getAllComics () {
    let response = await axios.get(`${baseUrl}/all-comics`)
    return response.data
  },

  async getComic (comicName) {
    let response = await axios.get(baseUrl + '/comics/' + comicName)
    return response.data
  },

  async getPendingComics () {
    let response = await axios.get(baseUrl + '/pendingcomics')
    if (!response.data.error) { return response.data }
    else { return [] }
  },

  async getPendingComic (comicName) {
    let response = await axios.get(baseUrl + '/pendingComics/' + comicName)
    if (!response.data.error) { return {success: true, result: response.data} }
    else { return {success: false, message: response.data.error} }
  },

  async getSuggestedComicList () {
    let response = await axios.get(baseUrl + '/comicsuggestions')
    if (!response.data.error) { return response.data }
    else { return [] }
  },

  async getRejectedComics () {
    let response = await axios.get(baseUrl + '/comicsuggestions/rejected')
    if (!response.data.error) { return response.data }
    else { return [] }
  },

  async updateComic (updatedComicData) {
    let response = await axios.post(`${baseUrl}/comics/${updatedComicData.id}/updatedetails`, updatedComicData)
    if (!response.data.error) { return {success: true} }
    else { return {success: false, message: response.data.error} }
  },

  async addNewComic (comicData, {pageFiles, thumbnailFile}, progressFunction) {
    let formData = new FormData()
    for (var key in comicData) {
      if (key === 'keywords') { formData.append('keywordIds', comicData['keywords'].map(kw => kw.id)) }
      formData.append(key, comicData[key])
    }
    for (var pageFile of pageFiles) { formData.append('pageFile', pageFile) }
    if (thumbnailFile) { formData.append('thumbnailFile', thumbnailFile) }

    let response = await axios.post(baseUrl + '/comics',
      formData, {
        headers: {'Content-Type': 'multipart/form-data'},
        onUploadProgress: progressEvent => progressFunction(progressEvent)
      }
    )
    if (!response.data.error) { return {success: true} }
    else { return {success: false, message: response.data.error} }
  },

  async addThumbnailToPendingComic (comicData, thumbnailImage) {
    let formData = new FormData()
    formData.append('thumbnailFile', thumbnailImage)
    formData.append('comicName', comicData.name)

    let response = await axios.post(`${baseUrl}/pendingcomics/${comicData.id}/addthumbnail`,
      formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      }
    )
    if (!response.data.error) { return {success: true} }
    else { return {success: false, message: response.data.error} }
  },

  async addPagesToComic (comicData, newPagesList, progressFunction) {
    let formData = new FormData()
    formData.append('comicName', comicData.name)
    for (var file of newPagesList) { formData.append('newPages', file)  }

    let response = await axios.post(
      `${baseUrl}/comics/${comicData.id}/addpages`,
      formData,
      {
        headers: {'Content-Type': 'multipart/form-data'},
        onUploadProgress: progressEvent => progressFunction(progressEvent)
      }
    )
    if (!response.data.error) { return {success: true} }
    else { return {success: false, message: response.data.error} }
  },

  async addPagesToPendingComic (comicData, newPagesList, progressFunction) {
    let formData = new FormData()
    formData.append('comicName', comicData.name)
    for (var newPageFile of newPagesList) { formData.append('newPages', newPageFile) }

    let response = await axios.post(`${baseUrl}/pendingcomics/${comicData.id}/addpages`,
      formData, {
        headers: {'Content-Type': 'multipart/form-data'},
        onUploadProgress: progressEvent => progressFunction(progressEvent)
      }
    )
    if (!response.data.error) { return {success: true} }
    else { return {success: false, message: response.data.error} }
  },

  async processComicSuggestion (suggestionId, suggestionData) {
    let response = await axios.post(`${baseUrl}/comicsuggestions/${suggestionId}/process`, suggestionData)
    if (!response.data.error) { return {success: true} }
    else { return {success: false, message: response.data.error} }
  },

  async processPendingComic (comicId, isApproved) {
    let response = await axios.post(baseUrl + '/pendingcomics/' + comicId, {isApproved: isApproved})
    if (response.data.error) { return {success: false, message: response.data.error} }
    if (!response.data.error) { return {success: true} }
  },

  async rateComic (comicId, newRating) {
    let response = await axios.post(`${baseUrl}/comics/${comicId}/rate`, {rating: newRating})
    if (response.data.error) { return {success: false, message: response.data.error} }
    if (!response.data.error) { return {success: true} }
  },

  async addComicSuggestion (comicName, artist, linksComments) {
    let response = await axios.post(baseUrl + '/comicsuggestions', 
      {comicName: comicName, artist: artist, comment: linksComments})
    return response.data
  },

  async swapComicPages (comicName, comicId, pageNumber1, pageNumber2) {
    let response = await axios.post(baseUrl + '/swapcomicpages',
      {comicName: comicName, comicId: comicId, pageNumber1: pageNumber1, pageNumber2: pageNumber2})
    if (response.data.error) { return {success: false, message: response.data.error} }
    if (!response.data.error) { return {success: true} }
  },

  async insertComicPage (comicName, comicId, imageFile, insertAfterPageNumber, progressFunction) {
    let formData = new FormData()
    formData.append('comicName', comicName)
    formData.append('comicId', comicId)
    formData.append('insertAfterPageNumber', insertAfterPageNumber)
    formData.append('newPageFile', imageFile)

    let response = await axios.post(baseUrl + '/insertcomicpage',
      formData, {
        headers: {'Content-Type': 'multipart/form-data'},
        onUploadProgress: progressEvent => progressFunction(progressEvent)
      }
    )

    if (response.data.error) { return {success: false, message: response.data.error} }
    if (!response.data.error) { return {success: true} }
  },

  async deleteComicPage (comicName, comicId, pageNumber) { //todo MOVE OUT OF HERE, TO MISC
    let response = await axios.post(baseUrl + '/deletecomicpage',
      {comicName: comicName, comicId: comicId, pageNumber: pageNumber})
    if (response.data.error) { return {success: false, message: response.data.error} }
    if (!response.data.error) { return {success: true} }
  },

  async replaceThumbnailImage (comicName, comicId, thumbnailFile) {
    let formData = new FormData()
    formData.append('comicName', comicName)
    formData.append('comicId', comicId)
    formData.append('thumbnailFile', thumbnailFile)

    let response = await axios.post(`${baseUrl}/comics/${comicId}/addthumbnail`, 
      formData, { headers: {'Content-Type': 'multipart/form-data'} })
    if (response.data.error) { return {success: false, message: response.data.error} }
    if (!response.data.error) { return {success: true} }
  }
}
