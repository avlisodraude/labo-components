import UserSpaceAPI from './api/UserSpaceAPI';
import IDUtil from './util/IDUtil';

class UserSpaceRecipe extends React.Component {

	constructor(props) {
		super(props);
		this.state = {

		}
	}

	componentDidMount() {
		UserSpaceAPI.list(this.props.user.id, {}, this.onLoadProjectList.bind(this))
	}

	onLoadProjectList(projects) {
		this.setState({
			projects : projects
		})
	}

	render() {
		let projectList = null;
		if(this.state.projects) {
			const projectOptions = this.state.projects.map((p) => {
				return <li>{p.name}</li>
			});

			projectList = (
				<div>
					<h4>Your projects</h4>
					<ul>
						{projectOptions}
					</ul>
				</div>
			)
		}

		return (
			<div className={IDUtil.cssClassName('user-space-recipe')}>
				<h3>Your user space: {this.props.user.name}</h3>
				{projectList}
			</div>
		)
	}

}

export default UserSpaceRecipe;