
//TODO implement a (Flux) queryStore that holds all the queries globally
class QueryList extends React.Component {

	constructor(props) {
		super(props);
	}

	didComponentMount() {
		//TODO register to the queryStore
		//TODO load all of the user's saved queries
	}

	render() {
		return (
			<div>
				SAVED QUERIES
			</div>
		)
	}
}

export default QueryList;