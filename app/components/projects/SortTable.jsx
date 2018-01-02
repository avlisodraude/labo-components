import BulkActions from '../helpers/BulkActions';
import classNames from 'classnames';
import IDUtil from '../../util/IDUtil';
import Pagination from '../helpers/Pagination';
import PropTypes from 'prop-types';

/**
 * A Table component with headers and rows that handles row selection and pagination.
 * Its contents are provided bythe props
 */

class SortTable extends React.PureComponent {
  /**
   * Construct this component
   */
  constructor(props) {
    super(props);

    this.state = {
      currentPage: this.props.currentPage,
      bulkAction: null,
      items: props.items,
      selection: [],
      sort: this.props.defaultSort
    };
  }

  /**
   * Sort projects based on the given field
   *
   * @param {string} field Unique sort field
   */
  sort(field) {
    const sort = {
      field: field,
      order:
        this.state.sort.field === field && this.state.sort.order === 'asc'
          ? 'desc'
          : 'asc'
    };

    this.setState({
      sort,
      items: this.props.onSort(this.props.items, sort)
    });
  }

  /**
   * Get a header <th> element
   *
   * @param  {number} index For unique key
   * @param  {string} field Unique field name for sorting
   * @param  {Symbol}
   * @param  {[type]}
   * @return {[type]}
   */
  getHeader(index, field, content, sortable) {
    const active = sortable && this.state.sort.field === field;
    const sortFunc = sortable ? { onClick: this.sort.bind(this, field) } : {};
    return (
      <th
        key={index}
        className={classNames({
          sortable,
          active,
          desc: active && this.state.sort.order === 'desc'
        })}
        {...sortFunc}
      >
        {content}
      </th>
    );
  }

  /**
   * New props, update the state
   *
   * @param  {object} nextProps
   */
  componentWillReceiveProps(nextProps) {
    if (nextProps.items !== this.state.items) {
      this.setState({
        items: this.props.onSort(nextProps.items, this.state.sort),
        selection: []
      });
    }
  }

  /**
   * Select all items
   *
   * @param  {SyntheticEvent} e Event
   */
  selectAll(e) {
    this.setState({
      selection: e.target.checked ? this.state.items.slice() : []
    });
  }

  /**
   * Select an item
   *
   * @param  {object} item Item
   * @param  {SyntheticEvent} e    Event
   */
  selectItem(item, e) {
    this.setState({
      selection: e.target.checked
        ? // add if not in the array yet
          this.state.selection.includes(item)
          ? this.state.selection
          : [...this.state.selection, item]
        : // remove
          this.state.selection.filter(selected => selected !== item)
    });
  }

  /**
   * Select an item
   *
   * @param  {int} currentPage
   */
  setPage(currentPage) {
    this.setState({ currentPage });
  }

  /**
   * React render function
   *
   * @return {Element}
   */
  render() {
    // pagination
    const pageCount = Math.ceil(this.state.items.length / this.props.perPage);
    const currentPage = Math.min(this.state.currentPage, pageCount - 1);
    const currentIndex = currentPage * this.props.perPage;
    const itemsOnPage = this.state.items.slice(
      currentIndex,
      currentIndex + this.props.perPage
    );
    return (
      <div className={IDUtil.cssClassName('sort-table')}>
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  title="Select all"
                  checked={
                    this.state.items.length > 0 &&
                    this.state.selection.length === this.state.items.length
                  }
                  onChange={this.selectAll.bind(this)}
                />
              </th>
              {this.props.head.map((head, index) =>
                this.getHeader(index, head.field, head.content, head.sortable)
              )}
            </tr>
          </thead>
          <tbody className={this.props.loading ? 'loading' : ''}>
            {itemsOnPage.map((item, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="checkbox"
                    checked={this.state.selection.includes(item)}
                    onChange={this.selectItem.bind(this, item)}
                  />
                </td>
                {this.props.row(item).map((td, index) => (
                  <td key={index} {...td.props}>
                    {td.content}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {this.state.items.length == 0 ? (
          this.state.loading ? (
            <h3 className="error">Loading...</h3>
          ) : (
            <h3 className="error">No results</h3>
          )
        ) : (
          ''
        )}

        <Pagination
          currentPage={currentPage}
          perPage={this.props.perPage}
          pageCount={pageCount}
          onClick={this.setPage.bind(this)}
        />

        <BulkActions
          bulkActions={this.props.bulkActions}
          selection={this.state.selection}
        />
      </div>
    );
  }
}

SortTable.propTypes = {
  items: PropTypes.array.isRequired,
  bulkActions: PropTypes.array.isRequired,
  head: PropTypes.array.isRequired,
  row: PropTypes.func.isRequired,
  onSort: PropTypes.func.isRequired,
  perPage: PropTypes.number,
  currentPage: PropTypes.number,
  defaultSort: PropTypes.object.isRequired,
};

SortTable.defaultProps = {
  perPage: 20,
  currentPage: 0,
  defaultSort: { field: null, order: 'asc' },
};

export default SortTable;
