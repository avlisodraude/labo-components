import IDUtil from '../../util/IDUtil';

class CollectionStats extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		let stats = {};
		if(this.props.data) {
			if(this.props.data.collection_statistics) {

				if(this.props.data.collection_statistics.document_types) {
					let docTypeTabs = [];
					let docTypeInfos = [];
					let fieldTypeInfo = null;
					stats.totalDocs = 0;

					this.props.data.collection_statistics.document_types.forEach(function(dt, i) {
						stats.totalDocs += dt.doc_count;

						//generate the tabs
						docTypeTabs.push(
							<li key={i + '__dt_tab'}
								className={i == 0 ? 'active' : ''}>
								<a data-toggle="tab" href={'#' + dt.doc_type}>
									{dt.doc_type}
								</a>
							</li>
						);

						//generate the tab contents
						if(dt.fields) {
							let fieldTypes = Object.keys(dt.fields).map((fieldType, j) => {
								let fieldNames = dt.fields[fieldType].map((fieldName, k) => {
									return(<li key={'fn__' + k}>{fieldName}</li>);
								});
								return (
									<li className="component-category" key={'ft__' + j}>
				                        <a href="#" data-toggle="collapse" data-target={'#' + fieldType + '__' + i}
				                        	data-parent="#collection_stats" className="category-header">
				                            <header className="components-header">
												Fields of type:&nbsp;{fieldType}
											</header>
				                        </a>
				                        <div className="collapse" id={fieldType + '__' + i}>
				                            <ul className="component-list">
				                                {fieldNames}
				                            </ul>
				                        </div>
				                    </li>
								);
							});
							fieldTypeInfo = (
								<ul  key={'fn__' + i} className="nav navbar-nav" id="collection_stats">
									{fieldTypes}
								</ul>
							)
						}

						//finally return this per docType
						docTypeInfos.push(
							<div key={i + '__dt_tab_content'} id={dt.doc_type} className={i == 0 ? 'tab-pane active' : 'tab-pane'}>
								<h4>&nbsp;Documents of this type: {dt.doc_count}</h4>
								{fieldTypeInfo}
							</div>
						)

					}, this);

					stats.docTypes = (
						<div>
							<ul className="nav nav-tabs">
								{docTypeTabs}
							</ul>
							<div className="tab-content" style={{overflow : 'auto'}}>
								{docTypeInfos}
							</div>
						</div>
					)
				}
			}

		}
		return (
			<div className={IDUtil.cssClassName('collection-stats')}>
				<h4>Documents in collection: {stats.totalDocs}</h4>
				<p>
				In the tabs below it is possible to inspect the (types of) metadata fields that are available per document type in the collection index.
				Inspecting these fields helps to gain insight into how elaborate each collection can be queried later on.
				</p>
				{stats.docTypes}
			</div>
		);
	}
}

export default CollectionStats;