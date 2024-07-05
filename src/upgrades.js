export default [
	function (context, props) {
		return {
			updatedConfig: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}
	},
	function (context, props) {
		const result = {
			updatedConfig: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}

		if (props.config) {
			if (props.config.polling == undefined || '' == props.config.polling) {
				props.config.polling = true
				result.updatedConfig = props.config
			}
		}
		return result
	},
]
