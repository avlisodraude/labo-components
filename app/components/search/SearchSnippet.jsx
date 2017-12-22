//Check the collection config getResultSnippetData() function to inspect this.props.data

import IconUtil from '../../util/IconUtil';
import IDUtil from '../../util/IDUtil';
import CollectionUtil from '../../util/CollectionUtil';
import Classification from '../annotation/Classification';

class SearchSnippet extends React.Component {

	constructor(props) {
		super(props);
	}

	//possible default fields: posterURL, title, description, tags
	render() {
		let poster = null;
		let mediaTypes = null;
		let tags = [];
		let fragmentIcon = null;

		//get the poster of the media object
		if(this.props.data.posterURL) {
			poster = (
				<div style={{width : '200px'}}>
					<a href="#">
						<img className="media-object" src={this.props.data.posterURL}
							style={{width:'100%'}}
							alt="Could not find image"/>
					</a>
				</div>
			)
		}

		//see if there are any tags added to this search result
		if(this.props.data.tags) {
			tags = this.props.data.tags.map((t, index) => {
				return (<Classification classification={{label : t}}/>);
			})
		}

		//show the user what content can be expected
		if(this.props.data.mediaTypes) {
			mediaTypes = this.props.data.mediaTypes.map((mt) => {
				if(mt == 'video') {
					return (<span className={IconUtil.getMimeTypeIcon('video', true, true)} title="Video content"></span>);
				} else if(mt == 'audio') {
					return (<span className={IconUtil.getMimeTypeIcon('audio', true, true)} title="Audio content"></span>);
				} else if(mt == 'image') {
					return (<span className={IconUtil.getMimeTypeIcon('image', true, true)} title="Image content"></span>);
				}
				return (<span className={IconUtil.getMimeTypeIcon(null, true, true)} title="Unknown content"></span>);
			});
		}

		//if this hit represents a media fragment, show an extra icon (TODO make sure this is not ugly later on)
		if(this.props.data.type == 'media_fragment') {
			fragmentIcon = (
				<span className={IconUtil.getMimeTypeIcon('fragment', true, true)} title="Media fragment"></span>
			);
		}

		//generate main classes
		const classNames = ['media', IDUtil.cssClassName('search-snippet')]

		return (
			<div className={classNames.join(' ')}>
				<div className="media-left">
					{poster}
				</div>
				<div className="media-body">
					<h4 className="media-heading custom-pointer" title={this.props.data.id}>
						{this.props.data.title ? this.props.data.title + ' ' : ''}
						{this.props.data.date ? '(' + this.props.data.date + ')' : ''}
						&nbsp;{mediaTypes}&nbsp;{fragmentIcon}
					</h4>
					{CollectionUtil.highlightSearchTermInDescription(
						this.props.data.description,
						this.props.searchTerm,
						35
					)}
					{tags}
				</div>
			</div>
		)
	}
}

export default SearchSnippet;