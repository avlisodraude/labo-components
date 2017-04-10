//Check the collection config getResultSnippetData() function to inspect this.props.data

class SearchSnippet extends React.Component {

	constructor(props) {
		super(props);
		this.MAX_WORDS = 35;
	}

	//this highlights the searchTerm in the snippet (TODO this should be replace by using ES highlighting)
	highlightSearchTermInDescription(words) {
		if(words) {
			var tmp = ('' + words).split(' ');
			let i = 0;
			let found = false;
			for(let w of tmp) {
				if(w.indexOf(this.props.searchTerm) != -1 || w.indexOf(this.props.searchTerm.toLowerCase()) != -1) {
					words = tmp.slice(
						i-6 >= 0 ? i-6 : 0,
						i + this.MAX_WORDS < tmp.length ? i + this.MAX_WORDS : tmp.length
					)
					words.splice(0, 0, '(...)');
					if(i != tmp.length -1) {
						words.splice(words.length, 0, '(...)');
					}
					words = words.join(' ');
					found = true;
					break;
				}
				i++;
			}
			if(!found && tmp.length > this.MAX_WORDS) {
				words = tmp.slice(0, this.MAX_WORDS);
				words.splice(words.length, 0, '(...)');
				words = words.join(' ');
			}
			return words;
		}
		return null;
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
				<img className="media-object" src={this.props.data.posterURL}
					style={{height:'100px'}}
					alt="Could not find image"/>
			)
		}

		//see if there are any tags added to this search result
		if(this.props.data.tags) {
			tags = this.props.data.tags.map((t, index) => {
				return (<span key={'tag__' + index} className="label label-primary tag">{t}</span>);
			})
		}

		//show the user what content can be expected
		if(this.props.data.mediaTypes) {
			mediaTypes = this.props.data.mediaTypes.map((mt) => {
				if(mt == 'video') {
					return (<span className="fa fa-film fa-border text-muted" title="Video content"></span>);
				} else if(mt == 'audio') {
					return (<span className="fa fa-headphones fa-border text-muted" title="Audio content"></span>);
				} else if(mt == 'image') {
					return (<span className="fa fa-photo fa-border text-muted" title="Image content"></span>);
				}
				return (<span className="fa fa-question fa-border text-muted" title="Unknown content"></span>);
			});
		}

		//if this hit represents a media fragment, show an extra icon (TODO make sure this is not ugly later on)
		if(this.props.data.type == 'media_fragment') {
			fragmentIcon = (
				<span className="fa fa-puzzle-piece fa-border text-muted" title="Media fragment"></span>
			);
		}

		return (
			<div className="media">
				<div className="media-left">
					<a href="#">
						{poster}
					</a>
					</div>
					<div className="media-body">
					<h4 className="media-heading" title={this.props.data.id}>
						{this.props.data.title ? this.props.data.title + ' ' : ''}
						{this.props.data.date ? '(' + this.props.data.date + ')' : ''}
						&nbsp;{mediaTypes}&nbsp;{fragmentIcon}
					</h4>
					{this.highlightSearchTermInDescription(this.props.data.description)}
					{tags}
				</div>
			</div>
		)
	}
}

export default SearchSnippet;