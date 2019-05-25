import axios from 'axios'

let baseUrl = 'http://localhost:8012/api'

export default {
	async getComics () {
		let response = await axios.get(baseUrl + '/comics')
		// err.response
		for (var comic of response.data) {
			comic.created = new Date(comic.created)
			comic.updated = new Date(comic.updated)
		}
		return response.data
	},

	async getComic (comicName) {
		let response = await axios.get(baseUrl + '/comics/' + comicName)
		if (!response.data.error) { return {success: true, result: response.data} }
		else { return {message: 'No comic with that name'} }
	},

	async getPendingComics () {
		let response = await axios.get(baseUrl + '/pendingcomics')
		if (!response.data.error) { return response.data }
		else { return [] }
	},

	async getPendingComic (comicName) {//todo create. Wait, same as above
		let response = await axios.get(baseUrl + '/pendingComics/' + comicName)
		if (!response.data.error) { return {success: true, result: response.data} }
		else { return {success: false, message: response.data.error} }
	},

	async getSuggestedComicList () {
		let response = await axios.get(baseUrl + '/comicsuggestions')
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
		for (var file of newPagesList) { formData.append('newPages', file)	}

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

	async processComicSuggestion (suggestion) {
		let response = await axios.post(baseUrl + '/comicsuggestions/process', suggestion)
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
		if (response.data.error) { return {success: false, message: response.data.error} }
		if (!response.data.error) { return {success: true} }
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

	async getComicPageChangeDate (comicId) {
		let response = await axios.get(baseUrl + '/comicpagechanges', {params: {comicId: comicId}})
		if (response.data.error) { return {success: false, message: response.data.error} }
		if (!response.data.error) { return {success: true, result: response.data} }
	},

	async replaceThumbnailImage (comicId, imageFile) {
		return new Promise( async resolve => {
			setTimeout(() => {resolve({'success': true, 'message': 'asd'})}, 1000)
		})
	}
}