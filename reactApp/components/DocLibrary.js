import React from 'react';
import ReactDOM from 'react-dom';
import DocEditor from './Editor.js';
import Modal from 'react-modal';
import axios from 'axios';
import { Link, Route, Redirect } from 'react-router-dom';

class DocLibrary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      owned: [],
      collab: [],
      modalIsOpen: false,
      modalTwoIsOpen: false,
      title: '',
      password: '',
      redirect: false,
      docId: '',
      sharedDocID: '',
      sharedDocPassword: '',
      socket: io('http://localhost:3000'),
      trigger: false
    }
    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.openModalTwo = this.openModalTwo.bind(this);
    this.afterOpenModalTwo = this.afterOpenModalTwo.bind(this);
    this.closeModalTwo = this.closeModalTwo.bind(this);
    this.createDocument = this.createDocument.bind(this);
    this.inputChangeTitle = this.inputChangeTitle.bind(this);
    this.inputChangePassword = this.inputChangePassword.bind(this);
  }

  componentWillMount() {
    this.state.socket.on('connect', () => {
      console.log('Connect Library');
    });
    this.state.socket.emit('room', 'library')
  }

  refresh() {
    axios({
      method: 'get',
      url: 'http://localhost:3000/getdocs'
    })
    .then(response => {
      var owned = [];
      var collab = [];

      response.data.docs.forEach(doc => {
        if (doc.owner === response.data.id) {
          owned = owned.concat(doc)
        } else if (doc.collaborators.includes(response.data.id)) {
          collab = collab.concat(doc)
        }
      })
      this.setState({owned: owned, collab: collab})
    })
    .catch(err => {
      console.log("Error fetching docs", err)
    })
  }

  componentDidMount() {
    this.state.socket.on('joinMessage', data => {
      console.log(data.content)
    })
    this.state.socket.on('reload', () => {
      this.refresh();
    })

    setTimeout(() => {
      axios({
        method: 'get',
        url: 'http://localhost:3000/getdocs'
      })
      .then(response => {
        var owned = [];
        var collab = [];

        response.data.docs.forEach(doc => {
          if (doc.owner === response.data.id) {
            owned = owned.concat(doc)
          } else if (doc.collaborators.includes(response.data.id)) {
            collab = collab.concat(doc)
          }
        })
        this.setState({owned: owned, collab: collab})
      })
      .catch(err => {
        console.log("Error fetching docs", err)
      })
    }, 1000)

  }

  openModal() {
    this.setState({modalIsOpen: true});
  }

  afterOpenModal() {
    this.subtitle.style.color = 'black';
  }

  closeModal() {
    this.setState({modalIsOpen: false});
  }

  openModalTwo() {
    this.setState({modalTwoIsOpen: true});
  }

  afterOpenModalTwo() {
    this.subtitle.style.color = 'black';
  }

  closeModalTwo() {
    this.setState({modalTwoIsOpen: false});
  }

  inputChangeTitle(e) {
    this.setState({title: e.target.value})
  }

  inputChangePassword(e) {
    this.setState({password: e.target.value})
  }

  inputChangeSharedDocID(e) {
    this.setState({sharedDocID: e.target.value})
  }

  inputChangeSharedDocPassword(e) {
    this.setState({sharedDocPassword: e.target.value})
  }

  createDocument(e) {
    e.preventDefault()
    axios({
      method: 'post',
      url: 'http://localhost:3000/newdoc',
      data: {
        title: this.state.title,
        password: this.state.password
      }
    })
    .then(response => {
      this.setState({modalIsOpen: false, redirect: true, docId: response.data.newDoc._id})
    })
  }

  addDocument(e) {
    e.preventDefault()
    axios({
      method: 'post',
      url: 'http://localhost:3000/docauth2',
      data: {
        docId: this.state.sharedDocID,
        password: this.state.sharedDocPassword
      }
    })
    .then(response => {
      this.setState({modalIsOpen: false, redirect: true, docId: this.state.sharedDocID});
    })
  }

  render() {
    if (this.state.redirect) {
      var url = "/editor/" + this.state.docId;
      return <Redirect to={url}/>
    }

    return (
      <div style={{ margin: "20px" }} className="body">
        <p className="docHeader">Your Document Library</p>
        <form className="form-group" onSubmit={(e) => this.props.handleSubmit(e)}>
          <button
            type="button"
            className="saveButton"
            onClick={this.openModal}>
            Create New Document
          </button>
        </form>
        <ul className="docList">
          <p className="libraryHeader">Docs you own</p>
          {this.state.owned.map(doc => {
            if (doc.currWorkers.length < 4) {
              return (
                <div key={doc._id}>
                  <Link to={"/editor/"+doc._id}>
                    <li className="doc">
                      {doc.title}
                    </li>
                  </Link>
                </div>
              )
            } else {
              return (
                <div key={doc._id}>
                  <li className="doc full">
                    {doc.title}
                  </li>
                </div>
              )
            }
          })}
        </ul>
        <ul className="docList">
          <p className="libraryHeader">Docs you collaborate on</p>
          {this.state.collab.map(doc => {
            if (doc.currWorkers.length < 4) {
              return (
                <div key={doc._id}>
                  <Link to={"/editor/"+doc._id}>
                    <li className="doc">
                      {doc.title}
                    </li>
                  </Link>
                </div>
              )
            } else {
              return (
                <div key={doc._id}>
                  <li className="doc full">
                    {doc.title}
                  </li>
                </div>
              )
            }
          })}
        </ul>
        <form className="form-group" onSubmit={(e) => this.props.handleSubmit(e)}>
          <button
            type="button"
            className="saveButton"
            onClick={this.openModalTwo}>
            Add Shared Document
          </button>
        </form>
        <Modal
          isOpen={this.state.modalIsOpen}
          onAfterOpen={this.afterOpenModal}
          onRequestClose={this.closeModal}
          contentLabel="Example Modal"
          className={{
            afterOpen: 'modalBody',
          }}
          >
            <h2 className="docHeader" ref={subtitle => this.subtitle = subtitle}>Create a new Document</h2>
            <form onSubmit={(e) => this.createDocument(e)}>
              <h2 className="modalText ">Give it a name:</h2><input type="text" onChange={(e) => this.inputChangeTitle(e)} className="form-control registerInput" placeholder="Document Title"></input><br></br>
              <h2 className="modalText">Password:</h2><input type="password" onChange={(e) => this.inputChangePassword(e)} className="form-control registerInput" placeholder="Password"></input><br></br>
              <input className="saveButton" type="submit" value="Create Document" />
              <button className="saveButton" onClick={this.closeModal}>Cancel</button>
            </form>
          </Modal>
          <Modal
            isOpen={this.state.modalTwoIsOpen}
            onAfterOpen={this.afterOpenModalTwo}
            onRequestClose={this.closeModalTwo}
            contentLabel="Example Modal"
            className={{
              afterOpen: 'modalBody',
            }}
            >
              <h2 className="docHeader" ref={subtitle => this.subtitle = subtitle}>Add Shared Document</h2>
              <form onSubmit={(e) => this.addDocument(e)}>
                <h2 className="modalText ">Document ID:</h2><input type="text" onChange={(e) => this.inputChangeSharedDocID(e)} className="form-control registerInput" placeholder="Document ID"></input><br></br>
                <h2 className="modalText">Password:</h2><input type="password" onChange={(e) => this.inputChangeSharedDocPassword(e)} className="form-control registerInput" placeholder="Password"></input><br></br>
                <input className="saveButton" type="submit" value="Add Document" />
                <button className="saveButton" onClick={this.closeModalTwo}>Cancel</button>
              </form>
            </Modal>
        </div>
      )
    }
  }

  export default DocLibrary;
