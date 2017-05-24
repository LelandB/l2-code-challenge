import React, { Component } from 'react';
import './App.css';
import $ from "jquery";
import './react-bootstrap-table.css';
import {BootstrapTable, TableHeaderColumn, ButtonGroup} from 'react-bootstrap-table';
import {Grid, Row, Col, Button, ButtonToolbar} from 'react-bootstrap';

class App extends Component {
	constructor(props) {
	    super(props);
	    this.state = {
	    	querytext: '',
	    	items: [],
	    	selected: [],
	    	localData: [],
	    	searchView: true,
	    };

	    // initializes localStorage item
	    localStorage.setItem('saved-data', JSON.stringify([]));

	    // binds App to 'this' for callbacks
	    this.handleSubmit = this.handleSubmit.bind(this);
	    this.handleChange = this.handleChange.bind(this);
	    this.linkFormatter = this.linkFormatter.bind(this);
	    this.ratingFormatter = this.ratingFormatter.bind(this);
	    this.onRowSelect = this.onRowSelect.bind(this);
	    this.createCustomButtonGroup = this.createCustomButtonGroup.bind(this);
	    this.searchView = this.searchView.bind(this);
	    this.saveToLocal = this.saveToLocal.bind(this);
	    this.loadFromLocal = this.loadFromLocal.bind(this);
	    this.onAfterDeleteRow = this.onAfterDeleteRow.bind(this);
	    this.onAfterSaveCell = this.onAfterSaveCell.bind(this);
  	}

  	// set current view to query stage
  	searchView (event) {
  		this.setState({
  			searchView: true
  		});
  	}

  	// search view: Stores item info to localStorage using JSON.stringify
  	saveToLocal (event) {
  		//checks for duplicates in localStorage 'saved-data' array
  		var savedData = JSON.parse(localStorage.getItem('saved-data'));
  		var checkArray = this.state.selected.slice();
  		var arrayPushLocal = [];
  		for (var i = 0; i < checkArray.length; i++) {
  			var tempItem = checkArray[i];
  			var result = $.grep(savedData, function(e){ return e.itemId === tempItem.itemId; });
  			if (result.length === 1) {
  				// item is already in local storage, splice it out
  				for (var j = 0; j < savedData.length; j++) {
  					if(savedData[i].itemId === tempItem.itemId) {
  						savedData.splice(i, 1);
  					}
  				}
  			}
  			arrayPushLocal.push(tempItem);
  		}
  		// combine new items with previous local data
  		var arrayToSet = savedData.concat(arrayPushLocal);
  		localStorage.setItem('saved-data', JSON.stringify(arrayToSet));
  		// clear state.selected for new inputs
  		this.setState({
  			selected: []
  		});
  	}

  	// local view: Fetches information from localStorage using JSON.parse
  	loadFromLocal (event) {
  		var localData = JSON.parse(localStorage.getItem('saved-data'));
  		this.setState({
  			localData: localData,
  			searchView: false
  		});
  	}

  	// search view, prepares state.querytext for submission
  	handleChange (event) {
  		this.setState({querytext: event.target.value});
  	}

  	// search view: Fetches json using the Walmart Search API and supplies objects to state
	handleSubmit (event) {
		event.preventDefault();
		var initValue = this.state.querytext.split(' ');
		var requestURI = 'http://api.walmartlabs.com/v1/search?query=' + initValue.join('+') + 
		'&format=json&numItems=25&apiKey=zpjnzpbj3ed8wz8dzvch8bwb';
		var self = this;

		// jsonp request
		$.ajax({
			url: requestURI,
			jsonp: "callback",
			dataType: "jsonp",
			data: {
				format: "json"
			},
			success: function( response ) {
				console.log(response.items);
				self.setState({ items: response.items });
			}
		});
	}

	// Adds $ to price cells
	priceFormatter(cell, row) {
		return `$${cell}`;
	}

	// Adds link icon next to name
	linkFormatter(cell, row, enumObject, index) {
		var products;
		if (this.state.searchView) {
			products = this.state.items;
		} else {
			products = this.state.localData;
		}
		var itemLink = products[index].productUrl;
		var itemImage = products[index].thumbnailImage;
		return `<img src=${itemImage} height="42" width="42"> ${cell} <a href=${itemLink}><i class='glyphicon glyphicon-link'></i></a>`;
	}

	// Returns 5 star image and number of reviews
	ratingFormatter(cell, row, enumObject, index) {
		var products;
		if (this.state.searchView) {
			products = this.state.items;
		} else {
			products = this.state.localData;
		}
		var ratingImage = products[index].customerRatingImage;
		var numReviews = products[index].numReviews;
		return `<img src=${ratingImage}> (${numReviews})`;
	}

	// search view: Row selection functionality
	onRowSelect(row, isSelected, e) {
		var rowObj = {};
		var tempSelected = this.state.selected.slice();
		for (const prop in row) {
			rowObj[prop] = row[prop];
		}
		console.log(rowObj.itemId);
		if (isSelected) {
			// adds selected row to state.selected
			console.log(rowObj);
			tempSelected.push(rowObj);
			this.setState({ selected: tempSelected});
		} else {
			// finds object in state.selected and selects against it
			var removedRow = $.grep(tempSelected, function(e){ return e.itemId !== rowObj.itemId; });
			this.setState({ selected: removedRow});
		}
	}

	// search view: allows for selection of all items. this functionality was not a priority
	onSelectAll(isSelected, rows) {
	  for (let i = 0; i < rows.length; i++) {
	    console.log(rows[i]);
	  }
	}

	// search view: adds data table manipulation buttons
	createCustomButtonGroup(props) {
		return (
			<ButtonGroup className='custom-buttons' sizeClass='btn-group-md'>
				{ props.showSelectedOnlyBtn }
				<button type='button' onClick={this.saveToLocal}
					className={`btn btn-primary`}>
					Add Selected to Database
				</button>
			</ButtonGroup>
		);
	}

	// local view: rowKeys is passed the itemID from the data table
	// only can delete one at a time, hence radio button
	onAfterDeleteRow(rowKeys) {
		// pulls localStorage json, find object in array, splices it, rewrites to localStorage
		var tempLocalData = this.state.localData.slice();
		var removedRow = $.grep(tempLocalData, function(e){ return e.itemId != rowKeys; });
		localStorage.setItem('saved-data', JSON.stringify(removedRow));
		this.setState({
  			localData: removedRow
  		});
	}

	// local view: updates local storage and state with new object modified by cell edit
	onAfterSaveCell(row, cellName, cellValue) {
		var tempLocalData = this.state.localData.slice();
		var rowObj = {};
		for (const prop in row) {
			rowObj[prop] = row[prop];
		}
		console.log(rowObj);
		var removedRow = $.grep(tempLocalData, function(e){ return e.itemId != rowObj.itemId; });
		var pushToLocal = removedRow.concat(rowObj);
		localStorage.setItem('saved-data', JSON.stringify(pushToLocal));
		this.setState({
			localData: pushToLocal
		});
	}

  	render() {
  		// Search view controls
  		const searchOptions = {
			btnGroup: this.createCustomButtonGroup,
			noDataText: 'Please enter a query'
		};

  		// React Bootstrap table options for select rows functionality
		const selectRowProp = {
		  mode: 'checkbox',
		  clickToSelect: true,
		  onSelect: this.onRowSelect,
		  onSelectAll: this.onSelectAll,
		  showOnlySelected: true
		};

		// local view controls
		const localOptions = {
			noDataText: 'No information found',
			afterDeleteRow: this.onAfterDeleteRow // A hook for after droping rows
		};

		// react bootstrap options for cell editing
		const cellEditProp = {
			mode: 'click',
			blurToSave: true,
			afterSaveCell: this.onAfterSaveCell
		}

		var dataTable;
		if (this.state.searchView) {
			dataTable = (
				<Row>
			        <BootstrapTable data={this.state.items}
			        				selectRow={selectRowProp}
			        				height='500'
			        				scrollTop={ 'Top' }
			        				options={searchOptions}
			        				ShowSelectedOnlyButton hover>
			        	<TableHeaderColumn isKey hidden dataField='itemId'>Product ID</TableHeaderColumn>
			        	<TableHeaderColumn dataField='name'
			        	                   dataSort={ true }
			        	                   width='450'
			        	                   tdStyle={ { whiteSpace: 'normal' } }
			        	                   dataFormat={this.linkFormatter}>Product Name</TableHeaderColumn>
			        	<TableHeaderColumn dataField='categoryPath'>Category</TableHeaderColumn>
			        	<TableHeaderColumn dataField='salePrice'
			        					   dataSort={ true }
			        					   dataFormat={this.priceFormatter}>Price</TableHeaderColumn>
			        	<TableHeaderColumn dataField='msrp'>MSRP</TableHeaderColumn>
			        	<TableHeaderColumn dataField='customerRatingImage'
			        					   dataFormat={this.ratingFormatter}>Reviews</TableHeaderColumn>
			        </BootstrapTable>
	      		</Row>
			);
		} else {
			dataTable = (
				<Row>
			        <BootstrapTable data={this.state.localData}
			        				selectRow={{mode:'radio'}}
			        				deleteRow={true}
			        				height='500'
			        				scrollTop={ 'Top' }
			        				cellEdit={cellEditProp}
			        				options={localOptions}
			        				ShowSelectedOnlyButton DeleteButton hover>
			        	<TableHeaderColumn isKey hidden dataField='itemId'>Product ID</TableHeaderColumn>
			        	<TableHeaderColumn dataField='name'
			        	                   dataSort={true}
			        	                   width='400'
			        	                   tdStyle={ { whiteSpace: 'normal' } }
			        	                   editable={false}
			        	                   dataFormat={this.linkFormatter}>Product Name</TableHeaderColumn>
			        	<TableHeaderColumn dataField='brandName'
			        					   dataSort={true}
			        					   width='250'>Brand Name</TableHeaderColumn>
			        	<TableHeaderColumn dataField='categoryPath'
			        					   width='200'
			        					   tdStyle={ { whiteSpace: 'normal' } }
			        					   editable={false}>Category</TableHeaderColumn>
			        	<TableHeaderColumn dataField='salePrice'
			        					   width='75'
			        					   dataSort={ true }
			        					   editable={false}
			        					   dataFormat={this.priceFormatter}>Price</TableHeaderColumn>
			        	<TableHeaderColumn dataField='msrp'
			        					   width='75'
			        					   editable={false}>MSRP</TableHeaderColumn>
			        	<TableHeaderColumn dataField='customerRatingImage'
			        					   editable={false}
			        					   dataFormat={this.ratingFormatter}>Reviews</TableHeaderColumn>
			        </BootstrapTable>
	      		</Row>
			);
		}
	    return (
	      <div className="App">
	      	<Grid>
	      		<Row id='topRow'>
	      			<Col md={2}>
		      			<form onSubmit={this.handleSubmit}>
		      				<input id='queryInput' type="text" placeholder="Query" onChange={this.handleChange} />
		      			</form>
	      			</Col>
	      			<Col md={4}>
	      				<ButtonToolbar>
							<Button id='searchButton' bsStyle="primary" onClick={this.searchView}>Search View</Button>
							<Button id='localButton' bsStyle="info" onClick={this.loadFromLocal}>Local Database</Button>
						</ButtonToolbar>
					</Col>
	      		</Row>
	      		<Row>
	      			<hr></hr>
	      		</Row>
	      		{dataTable}
	      	</Grid>
	      </div>
	    );
  	}
}

export default App;
