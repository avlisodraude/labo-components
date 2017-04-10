//TODO the header sucks a bit, make it better
class FlexBox extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			visible: true
		}
	}

	toggle() {
		this.setState({
			visible: !this.state.visible
		});
	}

	render() {
		let header = (
			<div className="row fb-header" onClick={this.toggle.bind(this)}>
				<div className="col-md-12">
					<div className={this.state.visible ? 'fb-open' : 'fb-closed'}>
						{this.props.title}&nbsp;
					</div>
				</div>
			</div>
		)

		return (
			<div className={this.state.visible ? 'flex-box' : 'flex-box closed'}>
				{header}
				<div style={{display : this.state.visible ? 'block' : 'none'}}>
					{this.props.children}
				</div>
			</div>
		)
	}
}

export default FlexBox;