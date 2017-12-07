//Generic functions for UI components

const ComponentUtil = {

	//shows the only FlexModal attached to a component
	showModal(component, stateVariable) {
		const stateObj = {}
		stateObj[stateVariable] = true
		component.setState(stateObj);
	},

	//hides a FlexModal (used in AggregationBox, ItemDetailsRecipe, SearchHit)
	hideModal(component, stateVariable, elementId, manualCloseRequired) {
		const stateObj = {}
		stateObj[stateVariable] = false
		if(elementId && manualCloseRequired) {
			$('#' + elementId).modal('hide');
		}
		component.setState(stateObj);
	},

	supportsHTML5Storage() {
		try {
			return 'localStorage' in window && window['localStorage'] !== null
		} catch (e) {
			return false
		}
	},

	getJSONFromLocalStorage(key) {
		if(!ComponentUtil.supportsHTML5Storage()) {
			return false
		}
		try {
			return JSON.parse(localStorage[key])
		} catch (e) {
			return null
		}
	}

}

export default ComponentUtil;