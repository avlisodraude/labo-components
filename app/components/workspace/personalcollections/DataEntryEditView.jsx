import PersonalCollectionAPI from '../../../api/PersonalCollectionAPI';

import IDUtil from '../../../util/IDUtil';

import { setBreadCrumbsFromMatch } from '../helpers/BreadCrumbs';

import DataEntryForm from './DataEntryForm';

import PropTypes from 'prop-types';

/**
* Edit the data entry as specified by the router, using the DataEntryForm component
*/
class DataEntryEditView extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            dataEntry: null,
        };
    }

    componentDidMount() {
        console.debug('mounting the entry editor')
        // get collection & entry id from url
        const collectionId = this.props.match.params.cid;
        const entryId = this.props.match.params.did;

        // load entry data, and set state
        PersonalCollectionAPI.getEntry(this.props.user.id, collectionId, entryId, dataEntry => {
            // inject project name to breadcrumbs
            const titles = {};
            titles[dataEntry.id] = dataEntry.title;
            // update breadcrumbs
            setBreadCrumbsFromMatch(this.props.match, titles);

            this.setState({
                loading: false,
                dataEntry: dataEntry
            });
        });
    }

    render() {
        let formOrMessage = null;
        if(this.state.loading) {
            formOrMessage = <h3 className="loading">Loading...</h3>
        } else {
            if(this.state.dataEntry) {
                formOrMessage = (
                    <DataEntryForm
                        submitButton="Save Entry"
                        cancelLink={
                            '/workspace/collections/'+this.props.match.params.cid+'/edit'
                        }
                        dataEntry={this.state.dataEntry}
                        dataEntryDidSave={collectionId => {
                            // navigate to new collection page
                            this.props.history.push(
                                '/workspace/collections/'+collectionId+'/edit'
                                );
                            }
                        }
                        collectionId = {this.props.match.params.cid}
                        user={this.props.user}
                        api={this.props.api}/>
                )
            } else {
                formOrMessage = <h3 className="error">Data Entry could not be found</h3>
            }
        }

        return (
            <div className={IDUtil.cssClassName('project-edit')}>
                <div className="info-bar">
                    <h2>Edit Data Entry</h2>
                    <p>A data entry contains metadata and possibly a link to an external data source</p>
                </div>
                {formOrMessage}
            </div>
        )
    }

}

DataEntryEditView.propTypes = {
    api: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired
};

export default DataEntryEditView;
