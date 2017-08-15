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
	}

}

export default ComponentUtil;