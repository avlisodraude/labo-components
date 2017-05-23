import IDUtil from '../util/IDUtil';

//TODO the header sucks a bit, make it better
class FlexBox extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			visible: true
		}
		this.CLASS_PREFIX = 'fb';
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
					<div className={
							this.state.visible ?
								IDUtil.cssClassName('open', this.CLASS_PREFIX) :
								IDUtil.cssClassName('closed', this.CLASS_PREFIX)
						}>
						{this.props.title}&nbsp;
					</div>
				</div>
			</div>
		)

		//the component's css class names
		let classNames = [IDUtil.cssClassName('flex-box')]
		if(!this.state.visible) {
			classNames.push('closed')
		}
		return (
			<div className={classNames.join(' ')}>
				{header}
				<div style={{display : this.state.visible ? 'block' : 'none'}}>
					{this.props.children}
				</div>
			</div>
		)
	}
}

export default FlexBox;