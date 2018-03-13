import PersonalCollectionAPI from '../../../api/PersonalCollectionAPI';

import IDUtil from '../../../util/IDUtil';

import { setBreadCrumbsFromMatch } from '../helpers/BreadCrumbs';

import CollectionForm from './CollectionForm';

import PropTypes from 'prop-types';

class CollectionEdit extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            collection: null,
            dataList: []
        };
        this.handleAddEntry = this.handleAddEntry.bind(this);
        this.handleDeleteEntry = this.handleDeleteEntry.bind(this);
    }

    /* TODO: Properly design this and the table in the render() in react terms */
    handleAddEntry() {
        var title = document.getElementById('entryTitle').value;
        var descr = document.getElementById('entryDescription').value;
        var created = document.getElementById('entryDateCreated').value;
        var creator = document.getElementById('entryCreator').value;
        var fileUrl = document.getElementById('entryFileUrl').value;
        var dataEntry = {title: title, descr: descr, dateCreated: created, creator: creator, fileUrl: fileUrl};

        //Save this with the api.
        this.props.api.saveEntry(this.props.user.id, this.props.match.params.id, dataEntry, msg => {
            if (msg && msg.success) {
                this.setState({
                    dataList: this.state.dataList.concat([msg['data']])
                });
            } else {
                alert('An error occured while adding this entry');
            }
        });

        //clear the form
        document.getElementById('entryTitle').value = '';
        document.getElementById('entryDescription').value = '';
        document.getElementById('entryDateCreated').value = '';
        document.getElementById('entryCreator').value = '';
        document.getElementById('entryFileUrl').value = '';

    }

    handleDeleteEntry(id) {
        var deId = this.state.dataList[id].id;

        this.props.api.deleteEntry(this.props.user.id, this.props.match.params.id, deId, msg => {
            if (msg && msg.success) {
                this.setState({
                    templ: this.state.dataList.splice(id,1),
                    dataList: this.state.dataList
                });
            } else {
                alert('An error occured while adding this entry');
            }
        });
    }

    componentDidMount() {
        // get collection id from url
        const collectionId = this.props.match.params.id;

        // load collection data, and set state
        PersonalCollectionAPI.get(this.props.user.id, collectionId, collection => {
            // inject collection name to breadcrumbs
            const titles = {};
            titles[collection.id] = collection.name;
            // update breadcrumbs
            setBreadCrumbsFromMatch(this.props.match, titles);

            this.setState({
                loading: false,
                collection,
                dataList: collection['dataentries']
            });
        });
    }

    render() {
        //draw the collection form or show a loading/status message
        let formOrMessage = null;
        if(this.state.loading) {
            formOrMessage = <h3 className="loading">Loading...</h3>
        } else {
            if(this.state.collection) {
                formOrMessage = (
                    <CollectionForm
                        submitButton="save"
                        cancelLink={
                            '/workspace/collections/'
                        }
                        collection={this.state.collection}
                        collectionDidSave={collectionId => {
                            // navigate to new collection page
                            this.props.history.push(
                                '/workspace/collections/'
                                );
                            }
                        }
                        user={this.props.user}
                        api={this.props.api}/>
                )
            } else {
                formOrMessage = <h3 className="error">Collection could not be found</h3>
            }
        }

        //draw the sort table
        const sortTable = (
            <div className={IDUtil.cssClassName('sort-table')}>
                <h2>Data</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Date created</th>
                            <th>Creator</th>
                            <th>File URL</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    {this.state.dataList.map((data, i) => {
                        return (
                            <tr key={i}>
                                <td>
                                    <a href={"/workspace/collections/" + this.props.match.params.id + '/entry/' + data.id}>
                                        {data.title}
                                    </a>
                                </td>
                                <td>{data.descr}</td>
                                <td>{data.dateCreated}</td>
                                <td>{data.creator}</td>
                                <td>{data.fileUrl}</td>
                                <td>
                                    <button onClick={this.handleDeleteEntry.bind(this,i)}>Delete</button>
                                </td>
                            </tr>
                        )
                    })}
                    <tfoot>
                        <tr>
                            <th><input type="text" id="entryTitle"/></th>
                            <th><input type="text" id="entryDescription"/></th>
                            <th><input type="date" id="entryDateCreated"/></th>
                            <th><input type="text" id="entryCreator"/></th>
                            <th><input type="text" id="entryFileUrl"/></th>
                            <th>
                                <button
                                    type="button"
                                    onClick={this.handleAddEntry}
                                    className="primary button add">
                                    Add Entry
                                </button>
                            </th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        )


        return (
            <div className={IDUtil.cssClassName('project-edit')}>
                <div className="info-bar">
                    <h2>Edit User Collection</h2>
                    <p>A user collection contains personal metadata and possibly links to private collection data</p>
                </div>
                {formOrMessage}
                {sortTable}
            </div>
        )
    }
}

CollectionEdit.propTypes = {
    api: PropTypes.shape({
        saveEntry: PropTypes.func.isRequired,
        deleteEntry: PropTypes.func.isRequired
    }),
    user: PropTypes.object.isRequired
};

export default CollectionEdit;
