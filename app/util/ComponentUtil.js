//Generic functions for UI components

const ComponentUtil = {

	//shows the only FlexModal attached to a component
	showModal(component, stateVariable) {
		let stateObj = {}
		stateObj[stateVariable] = true
		component.setState(stateObj);
	},

	//hides a FlexModal (used in ComparativeSearch, FlexAggregationBox, ItemDetailsRecipe, FlexHits)
	hideModal(component, stateVariable, elementId, manualCloseRequired) {
		let stateObj = {}
		stateObj[stateVariable] = false
		if(elementId && manualCloseRequired) {
			$('#' + elementId).modal('hide');
		}
		component.setState(stateObj);
	}

}

export default ComponentUtil;