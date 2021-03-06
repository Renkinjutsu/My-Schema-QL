import React, { Component } from 'react';
import './App.css';
import './css/mystyles.css';
import './styles.css'
import MyCanvas from './Canvas.jsx';
import Tutorial from './tutorial.jsx';
import Query from './query.jsx';
import NewTable from './new-table.jsx'
import io from 'socket.io-client';
import LinkButton from './linkButton.jsx'

const socketURL = 'http://172.46.3.39:8080';

class App extends Component {
  constructor(props) {
    super(props) 
    this.state = {
      queryArray: [],
      socket: null,
      joinMatch: false,
      colMatch: false,
      rowMatch: false,
      currentTable: null,
      user: "1",
      clientColor: "",
      query: {
        select: "",
        from: "",
        join: "",
        where: "",
        on: "",
      },
      svg: {
      },
      tables: {
        stores: {
          columns: ['ID', 'name', 'location'],
          values: [
            ["1", "Stark's Winter Accessories", "Winterfell"],
            ["2", "Bolton's Kennel", "Dreadfort"],
            ["3", "Tyrell's Flowershop", "Highgarden"],
            ["4", "Baratheon Blacksmithing", "Storm's End"],
            ["5", "Targaryen Reptiles", "Dragonstone"],
            ["6", "Greyjoy Marina", "Pyke"],
            ["7", "Tully's Fish Market", "Riverrun"],
            ["8", "Bank of Lannisport", "Casterly Rock"],
            ["9", "Tyrion's Winery", "King's Landing"],
            ["10", "Frey's Weddings", "The Twin's"],
            ["11", "Drogo's Ranch", "Essos"],
          ],
          createdAt: new Date('January 1, 2019 00:01:00'),
          foreignKey: null,
          xY: null,
          selected: {
            columnIndexes: null,
            rowIndexes: null
          }
        },
          
        employees: {
          columns: ['ID', 'name', 'store_id'],
          values: [
            ["1", "Sansa Stark", "1"],
            ["2", "Arya Stark", "1"],
            ["3", "Jon Snow", "1"],
            ["4", "Eddard Stark", "1"],
            ["5", "Ramsay Bolton", "2"],
            ["6", "Loras Tyrell", "3"],
            ["7", "Margaery Tyrell", "3"],
            ["8", "Robert Baratheon", "4"],
            ["9", "Gendry Baratheon", "4"],
            ["10", "Daenerys Targaryen", "5"],
            ["11", "Yara Greyjoy", "6"],
            ["12", "Catelyn Stark", "7"],
            ["13", "Cersei Lannister", "8"],
            ["14", "Jaime Lannister", "8"],
            ["15", "Tyrion Lannister", "9"],
            ["16", "Walder Frey", "10"],
            ["17", "Khal Drogo", "11"]
          ],
          createdAt: new Date('January 1, 2019 00:02:00'),
          foreignKey: null,
          xY: null,
          selected: {
            columnIndexes: null,
            rowIndexes: null
          }
        }

    }
  }
    this.onChange = this.onChange.bind(this)
    this.select = this.select.bind(this)
    this.checkMatch = this.checkMatch.bind(this)
    this.join = this.join.bind(this)
    this.createTable = this.createTable.bind(this)
    this.changeTableTitle = this.changeTableTitle.bind(this)
    this.where = this.where.bind(this)
    this.checkTableMatches = this.checkTableMatches.bind(this)
    this.findRows = this.findRows.bind(this)
    this.handleCurrentTable = this.handleCurrentTable.bind(this)
  }

    createSVG = (e, tableName)=> {
    e.stopPropagation()
    let newClass = `${tableName}${e.target.value}`
    if(e.altKey) {
      let classNames = e.target.className.split(' ')
      if(classNames.includes(newClass)) {
        e.target.className = classNames.filter(n => {
          if (n !== newClass && n != "svg") {
            return n
          }
        }).join(' ')
      } else {
        e.target.className += ` ${tableName}${e.target.value} svg`
      }
      let svg = this.state.svg
      let match = false
      if(svg[newClass] === null) {
        delete svg[newClass]
        this.setState({svg: svg})
        match = true
      } else {
        Object.keys(svg).map(keys => {
          if(svg[keys] === null) {
            svg[keys] = newClass 
            this.setState({svg: svg})
            match = true
          } else if (svg[keys] === newClass) {
            svg[keys] = null
            this.setState({svg: svg})
            match = true
            }
        })
      } 
      if (!match) {
        svg[newClass] = null
        this.setState({svg: svg})
      }
    }
  }

  componentDidMount() {
    const socket = io(socketURL)
    this.setState({socket})

    socket.on('state-update', (contents) => {
      this.setState(contents)
    })

    socket.on('new-table', (contents) => {
      this.setState({
      tables: contents
      })
    })

    socket.on('table-update', (contents) => {
      this.setState({
      tables: contents
      })
    })

    socket.on('row-delete', (contents) => {
      this.setState({
      tables: contents
      })
    })

    socket.on('header-change', (contents) => {
      this.setState({
      tables: contents
      })
    })

    socket.on('title-change', (contents) => {
      this.setState({
      tables: contents
      })
    })

    socket.on('set-query-string', (contents) => {
      console.log("hi", contents)
      this.setState({
      queryArray: contents
      })
    })
  }

  checkTableMatches = () => {
    const query = this.state.query
    let currentTables = []
    let theTable
    // look at from
    if ('from' in query && typeof query.from === 'string') {
      let fromTables = query.from.split(/[ ,]+/)
      fromTables.forEach((table) => {
        if (Object.keys(this.state.tables).includes(table)) {
          currentTables.push(table)
        }
      })
    }
    // look at join
    if ('join' in query && typeof query.join === 'string') {
      let joinTables = query.join.split(/[ ,]+/)
      joinTables.forEach((table) => {
      if(Object.keys(this.state.tables).includes(table)) {
          currentTables.push(table)
        } 
      })
    }
    let join = false
    let onStatement
    if (currentTables.length > 1 && 'on' in query) {
      onStatement = this.state.query.on.split(/[ =]+/).filter((e) => {if(e != "=") {return e}})
      if (onStatement.length == 2) {
        for (let i=0; i< currentTables.length; i++) {
          if (this.state.tables[currentTables[i]].columns.includes(onStatement[i])) {
            join = true
          } else {
            join = false
          }
        }
      }
    } else {
      join = false
    }
    if (join === true) {
      this.setState({joinOn: onStatement})
    } else {
    this.setState({joinOn: false})
    }
    this.setState({currentTable: currentTables})
    // should set the list of tables joined in currentTables
    return currentTables
  }

  handleCurrentTable = () => {
    if (this.state.currentTable.length > 1 && this.state.joinOn.length > 1) {
      let currentTable = this.state.currentTable[0]
      for (let i =1; i < this.state.currentTable.length; i++) {
        this.join([currentTable, this.state.currentTable[i]], this.state.joinOn)
        currentTable = this.join([currentTable, this.state.currentTable[i]], this.state.joinOn)
      }
      // let currentTables = this.state.currentTable
      // let innerTable = this.state.currentTable[0]
      // let innerOnStatement = this.state.query.on
      // innerOnStatement = innerOnStatement.split(/[=]+/).filter((e) => {if(e != "=") {return e}})
      // for (let i=1; i < currentTables.length; i++) {
      //   this.join([innerTable, currentTables[i]], innerOnStatement)
      //   innerTable = this.join([innerTable, currentTables[i]], innerOnStatement)
      // }
    } 
  }

  findRows = (table) => {
    if (table != null) {
      let query = this.state.query
      if ("where" in query && typeof query.where === 'string') {
        let selectedIndexes = this.where(table, query.where)
        if (selectedIndexes) {
          this.setState(prevState => ({
            ...prevState, tables: {
              ...prevState.tables, [table]: { 
                ...prevState.tables[table], selected: {
                  ...prevState.tables[table].selected, rowIndexes: selectedIndexes
                }
              }
            }
          }))
          this.setState({rowMatch: true})
        } else {
          this.setState({rowMatch: false})
        }  
      }
    }
  }

  createTable = (tableName, colArray, dataArray) => {
    this.setState({
      tables: {
        ...this.state.tables,
        [tableName]: {
          columns: colArray, 
          values: dataArray, 
          createdAt: new Date(),
          foreignKey: null, 
          xY: null, 
          selected: {
            columnIndexes: null,
            rowIndexes: null
          }
        }
      }
    })
  }

  join = (tables, keys) => {
    if (Object.keys(this.state.tables).includes(tables[0]) && Object.keys(this.state.tables).includes(tables[1])) {
      let stateTbl = this.state.tables
      let joinColumns = []
      let joinValues = []
      if (stateTbl[tables[0]].columns.includes(keys[0]) && stateTbl[tables[1]].columns.includes(keys[1]))   {
        let forKey = stateTbl[tables[0]].columns.indexOf(keys[0])
        let primeKey = stateTbl[tables[1]].columns.indexOf(keys[1])
        joinColumns = stateTbl[tables[0]].columns.concat(stateTbl[tables[1]].columns)
        for (let i=0; i < stateTbl[tables[0]].values.length; i++) {
          for (let e=0; e< stateTbl[tables[1]].values.length; e++) {
            if(stateTbl[tables[0]].values[i][forKey] === stateTbl[tables[1]].values[e][primeKey] ) {
              joinValues[i] = stateTbl[tables[0]].values[i].concat(stateTbl[tables[1]].values[e])
            }
          }
        }
        this.createTable(`${tables[0]}_${tables[1]}`, joinColumns, joinValues)
        this.setState({joinTable: `${tables[0]}_${tables[1]}` })
        this.setState({joinMatch: true})
        return `${tables[0]}_${tables[1]}`
      }
    } else {
      this.setState({joinMatch: false })
    }
  }

  checkMatch = () => {
    let currentTable
    if (this.state.currentTable && this.state.joinOn && this.state.joinTable) {
      currentTable = this.state.joinTable
    } else if (this.state.currentTable) {
      currentTable = this.state.currentTable[0]
    }
    if (currentTable) {
      Object.keys(this.state.tables).forEach((table) => {
        if (table != currentTable) {
          let tables = this.state.tables
          tables[table].selected = {columnIndexes: null, rowIndexes: null}
          this.setState({tables: tables})
        }
      })
    }

    if (this.state.colMatch === false) {
      Object.keys(this.state.tables).forEach((table) => {
        this.setState(prevState => ({
          ...prevState, tables: {
            ...prevState.tables, [table]: { 
              ...prevState.tables[table], selected: {
                ...prevState.tables[table].selected, columnIndexes: null
              }
            }
          }
        }))
      })
    } 
    if (this.state.rowMatch === false) {
      Object.keys(this.state.tables).forEach((table) => {
        this.setState(prevState => ({
          ...prevState, tables: {
            ...prevState.tables, [table]: { 
              ...prevState.tables[table], selected: {
                ...prevState.tables[table].selected, rowIndexes: null
              }
            }
          }
        }))
      })
    } 
    if (!this.state.joinOn) {
      if (this.state.joinTable) {
        let tables = this.state.tables
        if (this.state.tables[this.state.joinTable]) {
          delete tables[this.state.joinTable]
          this.setState({tables: tables})
          }    
        }
        this.setState({joinTable: null})
      }
    
  }

  where = (tableName, input) => {
    // based on selected columns
    // query = "id > 3"
    let query = input.split(/[ ,]+/).filter(el => el != "")
    // expected output = ["id", ">", "3"]
    
    const operate = {
      '<': (a, b) => {return a < parseInt(b)},
      '>': (a, b) => {return a > parseInt(b)},
      '=': (a, b) => {return a == b}
    }
    // determine the column index
    if (query.length >= 3) {
      let colIndex = this.state.tables[tableName].columns.indexOf(query[0])
      let input = query[2]
      if (query.length > 3) {
        for (let i=3; i < query.length; i++) {
          input += ` ${query[i]}`
        }
      }
      // loop through row values at column index
      if (colIndex >= 0) {
        return this.state.tables[tableName].values.map((row, index) => {
          if (Object.keys(operate).includes(query[1]) && operate[query[1]] (row[colIndex], input)) {
            return index
          }
        }).filter(el => el != null)
        // expected output = [..row index, row index]
      }
    }
  }

  select = (currentTable) => {
  
    let query = this.state.query
    let columns = null
    let table = currentTable
    const search = {}
    // check for values in query, set new data structure
    if ('select' in query && typeof query.select === 'string') {
      columns = query.select.split(/[ ,]+/)
    }
    // check for column
    let columnIndexes = null
    // look for indexes based on
    if (columns && Object.keys(this.state.tables).includes(table)) {
      if (columns[0] === '*') {
        this.setState({colMatch: true})
        columnIndexes = Object.keys(this.state.tables[table].columns).toString()
      } else {
        columnIndexes = columns.map(column => {
          if (this.state.tables[table].columns.indexOf(column) >= 0) {
            this.setState({colMatch: true})
            return this.state.tables[table].columns.indexOf(column)
        } else {
          return null
        }
      })
    }
    } else {
      this.setState({colMatch: false})
    }
    if (columnIndexes && Object.keys(this.state.tables).includes(table)) {
      this.setState(prevState => ({
        ...prevState, tables: {
          ...prevState.tables, [table]: { 
            ...prevState.tables[table], selected: {
              ...prevState.tables[table].selected, columnIndexes: columnIndexes
            }
          }
        }
      }))
    } 
  }

  
  
  onChange = (event, args) => {
    const state = () => {
      return new Promise ((resolve, reject) => {
        this.setState({ query: {...this.state.query, [args]: event.target.value}}, resolve)
        // }
      })
    }
      state()
      .then(() => {
        this.checkTableMatches()
      })
      .then(() => {
        if (this.state.currentTable.length > 1) {
          this.handleCurrentTable()
        }
      })
      .then(() => {
        if (this.state.joinTable && Object.keys(this.state.tables).includes(this.state.joinTable)) {
          this.select(this.state.joinTable)
          this.findRows(this.state.joinTable)
        } else {
          this.select(this.state.currentTable[0])
          this.findRows(this.state.currentTable[0])
        }
      })
      .then(() => {
        this.checkMatch()
      })
      .then(() => {
        const data = Object.assign({}, this.state)
        console.log("queryArray", this.state.queryString)
        delete data['socket']
        this.state.socket.emit('input-update', data)
      })
    }
  
  renderTableChange = (tableName, val, row, col) => {
    const tabName = tableName;
    const value = val;
    const colNum = col;
    const rowNum = row;
    const tempTables = this.state.tables;
    let tempRow = tempTables[tabName].values[rowNum];
    tempRow[colNum] = value
    tempTables[tabName].values[rowNum] = tempRow
    this.setState({
      tables: tempTables
    })
    setTimeout(() => {
      let data = this.state.tables;
      this.state.socket.emit('table-change', data);
    }, 30);
  }

  deleteRow = (col, tableName) => {
    const tabName = tableName;
    const rowDelete = this.state.tables[tabName].values.filter((value, index) => {
      if (index !== col) {
        return value
      }
    })
    const tempTables = this.state.tables
    tempTables[tabName].values = rowDelete
    this.setState({
      tables: tempTables
    })
    setTimeout(() => {
      let data = this.state.tables;
      this.state.socket.emit('delete-row', data);
    }, 30);
  }

  changeTableHeader = (tableName, val, col) => {
    const tabName = tableName;
    const value = val;
    const colNum = col;
    const tempTables = this.state.tables;
    tempTables[tabName].columns[colNum] = value;
    this.setState({
      tables: tempTables
    })
    setTimeout(() => {
      let data = this.state.tables;
      this.state.socket.emit('change-header', data);
    }, 30);
  }

  changeTableTitle = (tableName, val, tableID) => {
    const oldTableName = tableName;
    const newTableName = val;
    const tabID = tableID;
    const tables = this.state.tables;
    tables[newTableName] = tables[oldTableName];
    delete tables[oldTableName];
    this.setState({
      tables: tables
    })
    delete tables[oldTableName];
    setTimeout(() => {
      let data = this.state.tables;
      this.state.socket.emit('change-title', data);
    }, 30);
  }

  renderNewTable = (tableObj) => {
    const tableName = tableObj.tableName;
    const cols = tableObj.cols;
    const rows = tableObj.rows;
    
    const colArray = () => {
      let colArray = [];
      for (let i = 0; i < cols; i ++) {
        colArray.push("")
      }

      return colArray;
    }

    const dataArray = () => {
      let rowArray = [];
      for (let j = 0; j < rows; j ++) {
        let dataArray = []
        for (let i = 0; i < cols; i ++) {
          dataArray.push(null)
        }
        rowArray.push(dataArray)
      }

      return rowArray;
    }
    this.setState({
      tables: {
        ...this.state.tables,
        [tableName]: {
          columns: colArray(), 
          values: dataArray(),
          createdAt: new Date(),
          foreignKey: null, 
          xY: null, 
          selected: {
            columnIndexes: null,
            rowIndexes: null
          }
        }
      }
    })
    setTimeout(() => {
      let data = this.state.tables;
      this.state.socket.emit('create-table', data);
    }, 30);
  }


  renderLink = (e) => {
    e.preventDefault()
    return socketURL
  }

  onButtonSubmit = (evt, lastKeyword, cb) => {
    evt.preventDefault()
    evt.persist()
    let queryArr = [];
    queryArr.push(lastKeyword)
    queryArr.push(this.state.query[lastKeyword.toLowerCase()]);
    let target = evt
    this.setState({queryArray: [...this.state.queryArray, queryArr]}, () => cb(target))
     setTimeout(() => {
       let data = this.state.queryArray
       this.state.socket.emit('query-string', data)
    }, 200);
  }

  deleteQueryArray = (evt) => {
    evt.preventDefault();
    const prom = () => {
      return new Promise ((resolve, reject) => {
        this.setState({
          joinOn: false,
          joinMatch: false,
          colMatch: false,
          rowMatch: false,
          currentTable: null,
          queryArray: [],
          query: {
            select: "",
            from: "",
            join: "",
            where: "",
            on: ""
          }
        }, resolve)
      })
    }
    prom()
    .then(() => {
      this.checkMatch()
    })
  }
  
  printQueryArray = () => {
    let arr = this.state.queryArray;
    let string = "";
    arr.map((el) => {
      el.map((e, index) => {
        if(index === 0) {
          string += ` ${el[0].toString().replace(",", " ").toUpperCase()} `
        } else {
          string += ` ${el[1].toString().replace(",", " ")} `
        }
      })
    })
    return string;
  }

  render() {
    return (
      <div className="hero is-fullheight">
        <section className="navbar">
          <div className="navbar-brand">
            <h1 className="title is-1">SCHEMA</h1>
          </div>
          {/* <div className="navbar-end">
              <LinkButton socketURL={socketURL}/>
          </div> */}
        </section>


       <section id="query-section" className="section">
          <Query onButtonSubmit={this.onButtonSubmit} onChange={this.onChange} clientColor={this.state.clientColor} query={this.state.query} socket={this.state.socket} deleteQueryArray={this.deleteQueryArray} selectInput={this.state.query.select}/>
        <div className="box">{this.printQueryArray()}</div>
        </section>

        {/* <div className="container">
          <NewTable renderNewTable={this.renderNewTable} />
        </div> */}

        <section className="section">
          <MyCanvas tables={this.state.tables} renderTableChange={this.renderTableChange} changeTableHeader={this.changeTableHeader} changeTableTitle={this.changeTableTitle} deleteRow={this.deleteRow} createSVG={this.createSVG} svg={this.state.svg} renderNewTable={this.renderNewTable}/>
        </section>

        <section className="section">
        </section>
      </div>
    );
  }
}
export default App;
