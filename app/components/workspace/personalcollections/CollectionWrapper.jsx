import PersonalCollectionAPI from '../../../api/PersonalCollectionAPI';

import IDUtil from '../../../util/IDUtil';

import { setBreadCrumbsFromMatch } from '../helpers/BreadCrumbs';

import CollectionForm from './CollectionForm';

import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';


/**
* Wrapper for pages within a single collection.
* It also provides the collection data to the subviews.
*/
class CollectionWrapper extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            collection: null,
            bookmarkCount: 0
        };
    }

    componentDidMount() {
        this.loadCollection();
    }

    loadCollection() {
        const collectionId = this.props.match.params.id;

        // load collection data, and set state
        PersonalCollectionAPI.get(this.props.user.id, collectionId, collection => {
            // inject collection name to breadcrumbs
            const titles = {};
            titles[collection.id] = collection.name;
            // update breadcrumbs
            setBreadCrumbsFromMatch(this.props.match, titles);

            // set to state
            this.setState({
                loading: false,
                collection
            });
        });
    }

    render() {
        const RenderComponent = this.props.renderComponent;
        const collection = this.state.collection;

        //render the contents or show a message
        let contentsOrMessage = null;
        if(this.state.loading) {
            contentsOrMessage = <h3 className="loading">Loading...</h3>
        } else {
            if(project) {
                contentsOrMessage = (
                    <div>
                        <div className="collection-header">
                            <div className="info-bar">
                                <h2>{collection.name || 'Unnamed collection'}</h2>
                                <p>{collection.description}</p>
                            </div>

                            <div className="submenu">
                                <NavLink activeClassName="active"
                                    to={
                                        '/workspace/collections/' +
                                        encodeURIComponent(collection.id) +
                                        '/details'
                                    }>
                                    Details
                                </NavLink>
                            </div>
                        </div>

                        <div class="component">
                            <RenderComponent {...this.props} collection={this.state.collection} />
                        </div>
                    </div>
                )
            } else {
                contentsOrMessage = <h3 className="error">Collection could not be found</h3>
            }
        }

        return (
            <div className={IDUtil.cssClassName('collection-wrapper')}>
                {contentsOrMessage}
            </div>
        )
    }
}

export default CollectionWrapper;
