import classNames from 'classnames';
import IDUtil from './util/IDUtil';

import PersonalCollectionAPI from './api/PersonalCollectionAPI';
import CollectionOverview from './components/collections/CollectionsOverview';
import CollectionCreate from './components/collections/CollectionCreate';
import CollectionDetails from './components/collections/CollectionDetails';
import CollectionEdit from './components/collections/CollectionEdit';
import DataEntryEdit from './components/collections/DataEntryEdit';

//Import others

import PropTypes from 'prop-types';
import React, { Component } from 'react';

import {
  Switch,
  BrowserRouter as Router,
  Route,
  Link,
  Redirect
} from 'react-router-dom'

class WorkspaceCollections extends Component {
  constructor(props){
    super(props);

    this.state={}
  }

  getPropsRenderer(RenderComponent, props, extraProps={}){
    return (routeProps) => (
       <RenderComponent {...routeProps} {...props} {...extraProps} />
     )
  }

  render() {
    return(
      <Router>
        <Switch>
          <Route exact path="/workspace/collections" render={this.getPropsRenderer(CollectionOverview, this.props, {api: PersonalCollectionAPI} )} />
          <Route exact path="/workspace/collections/create" render={this.getPropsRenderer(CollectionCreate, this.props, {api: PersonalCollectionAPI} )} />

          <Route path="/workspace/collections/:id/edit" render={this.getPropsRenderer(CollectionEdit, this.props, {api: PersonalCollectionAPI})} />
          <Route path="/workspace/collections/:cid/entry/:did" render={this.getPropsRenderer(DataEntryEdit, this.props, {api: PersonalCollectionAPI})} />
          <Route path="/workspace/collections/:id" render={this.getPropsRenderer(CollectionEdit, this.props, {api: PersonalCollectionAPI})} />

        </Switch>
      </Router>
    );
  }
}

WorkspaceCollections.propTypes = {

  // collection api
  api: PropTypes.shape({
    list: PropTypes.func.isRequired
  }),

  // current user object used for defining access roles per project
  user: PropTypes.shape({
    id: PropTypes.number.isRequired
  }).isRequired,
}

export default WorkspaceCollections;