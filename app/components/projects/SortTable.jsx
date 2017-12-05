import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import IDUtil from '../../util/IDUtil';
import Pagination from '../helpers/Pagination'

class SortTable extends React.PureComponent {
  constructor(props){
    super(props);

    this.state={
      currentPage: this.props.currentPage,
      bulkAction: null,
      items: props.items,
      selection: [],
      sort:{
        field: null,
        order: 'asc'
      }
    }
  }


  /**
   * Sort projects based on the given field
   * @oaram {string} field Unique sort field
   */
  sort(field){
    let sort = {
        field: field,
        order: this.state.sort.field === field && this.state.sort.order === 'asc' ? 'desc' : 'asc'
      };

    this.setState({
      sort,
      items: this.props.sort(this.props.items, sort),
    });

  }

  /**
   * Get a header <th> element
   * @param  {number} index For unique key
   * @param  {string} field Unique field name for sorting
   * @param  {Symbol} 
   * @param  {[type]}
   * @return {[type]}
   */
  getHeader(index, field, content, sortable){
    let active = sortable && this.state.sort.field === field;
    let sortFunc = sortable ? {onClick: this.sort.bind(this, field)} : {};
    return (
      <th key={index} 
          className={classNames({sortable, active, 'desc': active && this.state.sort.order === 'desc' })}
          {...sortFunc}>
          {content}</th>
    );
  }

  /**
   * New props, update the state
   * @param  {object} nextProps 
   */
  componentWillReceiveProps(nextProps){
    if (nextProps.items !== this.state.items){
      this.setState({
        items: nextProps.sort(nextProps.items, this.state.sort),
        selection: []
      });
    }
  }

  /**
   * Select all items
   * @param  {SyntheticEvent} e Event
   */
  selectAll(e){
    this.setState({
      selection: e.target.checked ? this.state.items.slice() : []
    });
  }

 /**
  * Select an item
  * @param  {object} item Item
  * @param  {SyntheticEvent} e    Event
  */
  selectItem(item, e){
    this.setState({
       selection: e.target.checked ? 
          // add if not in the array yet
          this.state.selection.includes(item) ? this.state.selection : [...this.state.selection, item]
          :
          // remove
          this.state.selection.filter((selected) => (selected !== item))
    });
  }

  /**
  * Select an item
  * @param  {int} currentPage
  */
  setPage(currentPage){
    this.setState({currentPage});
  }

  /**
  * Set bulk action
  * @param  {SyntheticEvent} e    Event
  */
  setBulkAction(e){
    this.setState({bulkAction: this.bulkActionSelect.value });
  }


  /**
  * Apply bulk action
  * @param  {SyntheticEvent} e    Event
  */
  applyCurrentBulkAction(e){
    this.state.bulkAction;
    this.props.bulkActions.every((action)=>{
      if (action.title == this.state.bulkAction){        
        action.onApply(this.state.selection);
        // stop
        return false;
      }
      // continue
      return true;
    }); 
  }

  render() {
    // pagination
    let pageCount = Math.ceil(this.state.items.length / this.props.perPage);
    let currentPage = Math.min(this.state.currentPage, pageCount-1);
    let currentIndex = currentPage * this.props.perPage;
    let itemsOnPage = this.state.items.slice(currentIndex, currentIndex+this.props.perPage);
    return (
      <div className={IDUtil.cssClassName('sort-table')}>

        <table>
          <thead>
            <tr>
              <th><input type="checkbox" title="Select all" checked={this.state.selection.length === this.state.items.length} onChange={this.selectAll.bind(this)} /></th>
              {this.props.head.map((head, index) => (this.getHeader(index, head.field, head.content, head.sortable)))}
            </tr>
          </thead>
          <tbody className={this.props.loading ? 'loading': ''}>

            {itemsOnPage.map((item, index) =>(
              <tr key={index}>
                <td><input type="checkbox" checked={this.state.selection.includes(item)} onChange={this.selectItem.bind(this, item)} /></td>                    
                { this.props.row(item).map((td, index) =>(<td key={index} {...td.props}>{td.content}</td>)) }
              </tr>
              ))}           
          </tbody>
        </table>
        { 
          this.state.items.length == 0 ?
          (
            this.state.loading ?
            <h3 className="error">Loading...</h3>
            :
            <h3 className="error">No results</h3>
          )
          :''
        }

        <Pagination currentPage={currentPage} 
                    perPage={this.props.perPage} 
                    pageCount={pageCount} 
                    onClick={this.setPage.bind(this)} 
                    />

        {this.props.bulkActions ? 
        
          <div className="bulk-actions">
            <span>With {this.state.selection.length} selected:</span>

            <select value={this.state.bulkAction} 
                    onChange={this.setBulkAction.bind(this)}
                    ref={(c)=>{this.bulkActionSelect = c;}}                    
                    >
              <option key="empty" value=""></option>
              {this.props.bulkActions.map((action, index)=>(<option key={index} value={action.title}>{action.title}</option>))}
            </select>

            {this.state.bulkAction && this.state.selection.length ? <div onClick={this.applyCurrentBulkAction.bind(this)} className="btn primary">Apply</div> : null }
          </div>

        : null }
      </div>
    );
  }
}

SortTable.propTypes = {
  items: PropTypes.array.isRequired,
  head: PropTypes.array.isRequired,
  row: PropTypes.func.isRequired,
  sort: PropTypes.func.isRequired,
  perPage: PropTypes.number,
  currentPage: PropTypes.number,
  bulkActions: PropTypes.array
}

SortTable.defaultProps = {
  perPage: 20,
  currentPage: 0
}

export default SortTable;
